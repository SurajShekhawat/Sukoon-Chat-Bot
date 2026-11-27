import crypto from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/services/profile";
import { getUserEntitlement, deductVoiceMinutes } from "@/lib/billing/entitlement-service";
import { logSafetyAudit } from "@/lib/security/audit-logger";
import { VoiceSessionStatus } from "@/types/database";

export class VoiceConsentRequiredError extends Error {
  constructor(message = "Explicit microphone and voice reflection consent is required.") {
    super(message);
    this.name = "VoiceConsentRequiredError";
  }
}

export class VoiceQuotaExceededError extends Error {
  constructor(message = "Monthly voice quota has been exhausted. You can continue reflecting in text.") {
    super(message);
    this.name = "VoiceQuotaExceededError";
  }
}

export interface VoiceSessionConfig {
  sessionId: string;
  conversationId?: string;
  ephemeralToken: string;
  expiresAt: string;
  quotaRemainingMinutes: number;
  maxDurationSeconds: number;
  language: string;
  systemInstruction: string;
}

/**
 * Creates an authorized, short-lived voice reflection session.
 * Enforces explicit consent, verifies entitlements/quotas, and generates an ephemeral token.
 * Never exposes raw provider master keys to clients.
 */
export async function createVoiceSession(
  userId: string,
  options?: {
    conversationId?: string;
    explicitConsentGiven?: boolean;
    language?: string;
  }
): Promise<VoiceSessionConfig> {
  const profile = await getCurrentProfile();

  // 1. Consent Verification (Inviolable gate)
  const hasConsent = options?.explicitConsentGiven || profile?.voice_consent;
  if (!hasConsent) {
    throw new VoiceConsentRequiredError();
  }

  // 2. Entitlement & Quota Verification
  const entitlement = await getUserEntitlement(userId);
  const remainingMinutes = entitlement.voice_minutes_total - entitlement.voice_minutes_used;

  if (remainingMinutes <= 0) {
    throw new VoiceQuotaExceededError();
  }

  const supabase = await createClient();

  // 3. Create Voice Session record
  const sessionId = crypto.randomUUID();
  const maxDurationSeconds = Math.min(15 * 60, remainingMinutes * 60); // Max 15 minutes per session or remaining quota

  const { error: sessionError } = await supabase.from("voice_sessions").insert({
    id: sessionId,
    user_id: userId,
    conversation_id: options?.conversationId || null,
    duration_seconds: 0,
    status: "active",
  });

  if (sessionError) {
    throw new Error(`Failed to initialize voice session: ${sessionError.message}`);
  }

  // 4. Generate Single-Use Ephemeral Token (TTL: 60 seconds)
  const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
  const tokenPayload = {
    sub: userId,
    sessionId,
    expiresAt,
    allowedAudioMinutes: remainingMinutes,
    role: "voice_client",
  };
  const tokenSecret = process.env.VOICE_SESSION_SIGNING_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "default-voice-secret";
  const ephemeralToken = crypto
    .createHmac("sha256", tokenSecret)
    .update(JSON.stringify(tokenPayload))
    .digest("hex");

  // 5. Audit Logging (Zero audio/content logged)
  logSafetyAudit({
    eventType: "safety_guardrail_triggered",
    userId,
    category: "voice_session_started",
    severity: "low",
    language: options?.language || profile?.preferred_language || "hinglish",
    metadata: {
      sessionId,
      quotaRemainingMinutes: remainingMinutes,
      maxDurationSeconds,
    },
  });

  const language = options?.language || profile?.preferred_language || "hinglish";
  const systemInstruction = [
    "You are Sukoon, a gentle, empathetic companion for everyday stress and personal reflection.",
    "Speak with a warm, calm, unhurried cadence.",
    "Do NOT diagnose medical or mental health conditions, and do NOT claim to replace a human doctor or therapist.",
    "Keep responses concise (1 to 3 sentences) to maintain natural conversational turn-taking.",
    language === "hi"
      ? "Speak in pure, respectful Hindi."
      : language === "en"
      ? "Speak in calm, empathetic English."
      : "Speak in natural, conversational Hinglish (Hindi + English blend).",
  ].join(" ");

  return {
    sessionId,
    conversationId: options?.conversationId,
    ephemeralToken: `${sessionId}:${ephemeralToken}`,
    expiresAt,
    quotaRemainingMinutes: remainingMinutes,
    maxDurationSeconds,
    language,
    systemInstruction,
  };
}

/**
 * Terminates a voice session and debits consumed minutes from user quota.
 */
export async function endVoiceSession(
  userId: string,
  sessionId: string,
  durationSeconds: number,
  status: VoiceSessionStatus = "completed"
): Promise<{ success: boolean; minutesDeducted: number }> {
  const supabase = await createClient();

  const minutesDeducted = Math.max(1, Math.ceil(durationSeconds / 60));

  await supabase
    .from("voice_sessions")
    .update({
      duration_seconds: durationSeconds,
      status,
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  // Deduct quota
  await deductVoiceMinutes(userId, minutesDeducted);

  logSafetyAudit({
    eventType: "safety_guardrail_triggered",
    userId,
    category: "voice_session_ended",
    severity: "low",
    metadata: {
      sessionId,
      durationSeconds,
      minutesDeducted,
      finalStatus: status,
    },
  });

  return { success: true, minutesDeducted };
}

/**
 * Immediate in-flight crisis interception for Voice Mode.
 * Halts voice session and delivers Tele-MANAS (14416) resources.
 */
export async function interceptVoiceCrisis(
  userId: string,
  sessionId: string
): Promise<{
  deescalationText: string;
  helpline: string;
  helplineNumber: string;
}> {
  const supabase = await createClient();

  await supabase
    .from("voice_sessions")
    .update({
      status: "crisis_halted",
      ended_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .eq("user_id", userId);

  logSafetyAudit({
    eventType: "crisis_intercepted",
    userId,
    category: "voice_crisis_interception",
    severity: "critical",
    metadata: { sessionId, helplinesServed: true },
  });

  return {
    deescalationText:
      "I hear how painful things feel right now. You don't have to carry this alone. Please connect with immediate professional support at Tele-MANAS right now.",
    helpline: "Tele-MANAS (Govt. of India)",
    helplineNumber: "14416",
  };
}

