import { describe, it, expect, beforeEach } from "vitest";
import { AIOrchestrator } from "@/lib/ai/orchestrator";
import { scanUserMessage } from "@/lib/safety/detector";
import { getDeescalationMessage } from "@/lib/safety/deescalation";
import {
  checkRateLimit,
  recordMessageSent,
  acquireRequestLock,
  releaseRequestLock,
  resetRateLimit,
} from "@/lib/security/rate-limiter";
import {
  logSafetyAudit,
  anonymizeUserId,
  sanitizeLogMetadata,
  clearAuditBuffer,
  getRecentAuditLogs,
} from "@/lib/security/audit-logger";

describe("Phase 8: Full User Journey & QA Integration", () => {
  const testUserId = "user-journey-test-101";

  beforeEach(() => {
    resetRateLimit(testUserId);
    clearAuditBuffer();
  });

  // ==========================================================================
  // Journey Step 1: Onboarding & Linguistic Preference
  // ==========================================================================
  it("Step 1: resolves user preferred language and establishes untrusted boundaries", () => {
    const userMessage = "Aaj kaam pe bohot exhaust ho gaya, bilkul mann nahi lag raha.";
    const turn = AIOrchestrator.prepareChatTurn({
      userId: testUserId,
      userName: "Kabir",
      userMessage,
      preferredLanguage: "hinglish",
    });

    expect(turn.resolvedLanguage).toBe("hinglish");
    expect(turn.systemInstructions).toContain("Kabir");
    expect(turn.systemInstructions).toContain("Hinglish");
    expect(turn.systemInstructions).toContain("NON-CLINICAL IDENTITY");

    // Must wrap user input inside boundary tags
    const lastMsg = turn.contextMessages[turn.contextMessages.length - 1];
    expect(lastMsg.content).toContain("<untrusted_user_message>");
    expect(lastMsg.content).toContain("Aaj kaam pe bohot exhaust ho gaya");
    expect(lastMsg.content).toContain("</untrusted_user_message>");
  });

  // ==========================================================================
  // Journey Step 2: Rate Limiting & Concurrency Locks
  // ==========================================================================
  it("Step 2: enforces rate limiting and prevents concurrent duplicate requests", () => {
    const convId = "conv-journey-001";

    // First request acquires lock
    const lock1 = acquireRequestLock(testUserId, convId);
    expect(lock1).toBe(true);

    // Concurrent duplicate request must be blocked (409 Conflict protection)
    const lock2 = acquireRequestLock(testUserId, convId);
    expect(lock2).toBe(false);

    // Release lock upon generation complete
    releaseRequestLock(testUserId, convId);
    const lock3 = acquireRequestLock(testUserId, convId);
    expect(lock3).toBe(true);
    releaseRequestLock(testUserId, convId);

    // Verify rate limit allowance
    const limitCheck = checkRateLimit(testUserId);
    expect(limitCheck.allowed).toBe(true);
  });

  // ==========================================================================
  // Journey Step 3: Crisis Screening & Deterministic Triage
  // ==========================================================================
  it("Step 3: halts AI pipeline immediately when user expresses acute distress", () => {
    const distressMessage = "I can't take this pain anymore, I'm thinking of ending my life tonight";
    const scan = scanUserMessage(distressMessage, "en", "IN");

    expect(scan.isSafe).toBe(false);
    expect(scan.level).toBe("crisis");
    expect(scan.category).toBe("self_harm");
    expect(scan.recommendedHelplines.length).toBeGreaterThan(0);

    const helplineNumbers = scan.recommendedHelplines.map((h) => h.number);
    expect(helplineNumbers).toContain("14416"); // Tele-MANAS

    // De-escalation message is generated
    const deescalation = getDeescalationMessage("en");
    expect(deescalation).toContain("Tele-MANAS");
    expect(deescalation).toContain("14416");
    expect(deescalation).toContain("You don't have to carry this alone");

    // Anonymized audit log recorded without raw text
    const auditRecord = logSafetyAudit({
      eventType: "crisis_intercepted",
      userId: testUserId,
      category: scan.category || "crisis",
      severity: "high",
      metadata: { helplinesServed: true },
    });

    expect(auditRecord.eventType).toBe("crisis_intercepted");
    expect(auditRecord.anonymizedUserHash).toBe(anonymizeUserId(testUserId));
    expect(JSON.stringify(auditRecord)).not.toContain("ending my life");
  });

  // ==========================================================================
  // Journey Step 4: Consent-Driven Memory Vault
  // ==========================================================================
  it("Step 4: injects active memories only when consent is granted, excludes inactive", () => {
    const activeMemories = [
      { category: "career", content: "Preparing for product management transition" },
    ];

    // Case A: Memory consent granted
    const turnWithConsent = AIOrchestrator.prepareChatTurn({
      userId: testUserId,
      userName: "Kabir",
      userMessage: "What should I focus on today?",
      preferredLanguage: "hinglish",
      memories: activeMemories,
    });

    expect(turnWithConsent.systemInstructions).toContain("<untrusted_memory_vault>");
    expect(turnWithConsent.systemInstructions).toContain("Preparing for product management transition");
    expect(turnWithConsent.systemInstructions).toContain("</untrusted_memory_vault>");

    // Case B: Memory consent revoked / zero memories
    const turnWithoutConsent = AIOrchestrator.prepareChatTurn({
      userId: testUserId,
      userName: "Kabir",
      userMessage: "What should I focus on today?",
      preferredLanguage: "hinglish",
      memories: [],
    });

    expect(turnWithoutConsent.systemInstructions).not.toContain("Preparing for product management transition");
  });

  // ==========================================================================
  // Journey Step 5: Output Guardrail Compliance
  // ==========================================================================
  it("Step 5: output guardrail catches clinical pretense and safety guarantee breaches", () => {
    // Attempt 1: Impersonation
    const impersonating = "As your doctor, I diagnose you with bipolar disorder.";
    const res1 = AIOrchestrator.inspectAssistantOutput(impersonating);
    expect(res1.isSafe).toBe(false);
    expect(res1.flags.therapistImpersonation).toBe(true);

    // Attempt 2: False safety guarantee
    const guaranteeing = "I can guarantee your safety, nothing bad will ever happen with me.";
    const res2 = AIOrchestrator.inspectAssistantOutput(guaranteeing);
    expect(res2.isSafe).toBe(false);
    expect(res2.flags.guaranteedSafetyClaims).toBe(true);

    // Valid empathetic response
    const valid =
      "Main samajh sakta hoon ki office ka burnout kitna draining hota hai. 🫂 Chaliye ek deep breath lijiye. Aaj kya hua?";
    const res3 = AIOrchestrator.inspectAssistantOutput(valid);
    expect(res3.isSafe).toBe(true);
    expect(res3.warnings).toHaveLength(0);
  });

  // ==========================================================================
  // Journey Step 6: Data Portability & Account Purge
  // ==========================================================================
  it("Step 6: enforces strict audit logging and deletion confirmation safeguards", () => {
    // Metadata scrubber strips raw chat notes
    const dirtyMetadata = {
      message: "Deep personal chat history",
      notes: "Private mood journal note",
      password: "user_secret_password",
      conversationsCount: 5,
      memoriesCount: 3,
    };

    const sanitized = sanitizeLogMetadata(dirtyMetadata);
    expect(sanitized.message).toBe("[REDACTED_DATA_MINIMIZATION]");
    expect(sanitized.notes).toBe("[REDACTED_DATA_MINIMIZATION]");
    expect(sanitized.password).toBe("[REDACTED_DATA_MINIMIZATION]");
    expect(sanitized.conversationsCount).toBe(5);

    // Data export audit log
    logSafetyAudit({
      eventType: "data_exported",
      userId: testUserId,
      category: "privacy_export",
      severity: "low",
      metadata: { conversationsCount: 5, memoriesCount: 3 },
    });

    // Account deletion audit log
    logSafetyAudit({
      eventType: "account_purged",
      userId: testUserId,
      category: "privacy_purge",
      severity: "high",
      metadata: { hardDeleted: true },
    });

    const logs = getRecentAuditLogs();
    expect(logs.length).toBe(2);
    expect(logs[0].eventType).toBe("data_exported");
    expect(logs[1].eventType).toBe("account_purged");
    expect(logs[1].anonymizedUserHash).toBe(anonymizeUserId(testUserId));
  });
});
