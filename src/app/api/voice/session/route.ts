import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createVoiceSession,
  endVoiceSession,
  VoiceConsentRequiredError,
  VoiceQuotaExceededError,
} from "@/lib/voice/session-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    conversationId?: string;
    explicitConsentGiven?: boolean;
    language?: string;
  } = {};

  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  try {
    const session = await createVoiceSession(user.id, {
      conversationId: body.conversationId,
      explicitConsentGiven: body.explicitConsentGiven,
      language: body.language,
    });

    return NextResponse.json({ session }, { status: 200 });
  } catch (err: any) {
    if (err instanceof VoiceConsentRequiredError) {
      return NextResponse.json(
        { error: err.message, requiresConsent: true },
        { status: 403 }
      );
    }
    if (err instanceof VoiceQuotaExceededError) {
      return NextResponse.json(
        {
          error: err.message,
          quotaExceeded: true,
          notice: "Core emotional reflection remains available in text anytime.",
        },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: err.message || "Failed to initialize voice session." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    sessionId?: string;
    durationSeconds?: number;
    status?: "completed" | "interrupted" | "crisis_halted";
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.sessionId || typeof body.durationSeconds !== "number") {
    return NextResponse.json(
      { error: "sessionId and durationSeconds are required" },
      { status: 422 }
    );
  }

  try {
    const result = await endVoiceSession(
      user.id,
      body.sessionId,
      body.durationSeconds,
      body.status || "completed"
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update voice session." },
      { status: 500 }
    );
  }
}

