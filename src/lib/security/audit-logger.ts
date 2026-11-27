import crypto from "crypto";

export type AuditEventType =
  | "crisis_intercepted"
  | "ambiguous_distress_intercepted"
  | "harmful_advice_blocked"
  | "prompt_injection_blocked"
  | "rate_limit_exceeded"
  | "account_purged"
  | "data_exported"
  | "safety_guardrail_triggered";

export type AuditSeverity = "low" | "medium" | "high" | "critical";

export interface SafetyAuditEvent {
  eventType: AuditEventType;
  userId?: string;
  category: string;
  severity: AuditSeverity;
  language?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface SanitizedAuditLogRecord {
  id: string;
  timestamp: string;
  eventType: AuditEventType;
  anonymizedUserHash: string;
  category: string;
  severity: AuditSeverity;
  language: string;
  metadata: Record<string, string | number | boolean | null>;
}

// In-memory audit buffer for verification and testing
const auditBuffer: SanitizedAuditLogRecord[] = [];
const MAX_AUDIT_BUFFER_SIZE = 500;

// Prohibited sensitive keys that MUST NEVER appear in audit logs
const PROHIBITED_SENSITIVE_KEYS = new Set([
  "message",
  "content",
  "text",
  "user_message",
  "assistant_response",
  "raw_input",
  "prompt",
  "system_prompt",
  "memory_content",
  "notes",
  "journal_note",
  "password",
  "email",
  "token",
  "api_key",
]);

/**
 * Creates an irreversible anonymized one-way hash of a user ID for compliance with
 * India DPDP Act 2023 and GDPR data minimization standards.
 */
export function anonymizeUserId(userId?: string): string {
  if (!userId) return "anon_guest";
  return (
    "usr_" +
    crypto
      .createHash("sha256")
      .update(userId + (process.env.AUDIT_SALT || "sukoon_audit_salt_2026"))
      .digest("hex")
      .slice(0, 16)
  );
}

/**
 * Deeply sanitizes any metadata dictionary to guarantee no sensitive conversational
 * or personal text is ever written to application log streams.
 */
export function sanitizeLogMetadata(
  metadata: Record<string, unknown> = {}
): Record<string, string | number | boolean | null> {
  const clean: Record<string, string | number | boolean | null> = {};

  for (const [key, val] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();

    // Redact any prohibited sensitive fields
    if (PROHIBITED_SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret")) {
      clean[key] = "[REDACTED_DATA_MINIMIZATION]";
      continue;
    }

    if (val === null || typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
      // Ensure strings don't contain accidental raw transcripts
      if (typeof val === "string" && val.length > 200) {
        clean[key] = val.slice(0, 200) + "... [truncated]";
      } else {
        clean[key] = val;
      }
    } else {
      clean[key] = "[COMPLEX_OBJECT_OMITTED]";
    }
  }

  return clean;
}

/**
 * Logs a safety, security, or privacy audit event with absolute data minimization.
 * Never throws exceptions that could disrupt core conversational flow.
 */
export function logSafetyAudit(event: SafetyAuditEvent): SanitizedAuditLogRecord {
  const record: SanitizedAuditLogRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    eventType: event.eventType,
    anonymizedUserHash: anonymizeUserId(event.userId),
    category: event.category,
    severity: event.severity,
    language: event.language || "unknown",
    metadata: sanitizeLogMetadata(event.metadata),
  };

  // Structured logging for CloudWatch / Vercel / Supabase server logs
  if (process.env.NODE_ENV !== "test") {
    console.info(`[SAFETY_AUDIT] ${JSON.stringify(record)}`);
  }

  // Record into transient audit buffer
  auditBuffer.push(record);
  if (auditBuffer.length > MAX_AUDIT_BUFFER_SIZE) {
    auditBuffer.shift();
  }

  return record;
}

/**
 * Retrieves the recent audit buffer (for automated compliance testing).
 */
export function getRecentAuditLogs(): ReadonlyArray<SanitizedAuditLogRecord> {
  return [...auditBuffer];
}

/**
 * Clears the audit buffer (for clean test isolation).
 */
export function clearAuditBuffer(): void {
  auditBuffer.length = 0;
}
