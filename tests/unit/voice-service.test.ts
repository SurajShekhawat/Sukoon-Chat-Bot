import { describe, it, expect, vi, beforeEach } from "vitest";

let mockProfileConsent = false;
let mockRemainingMinutes = 5;

vi.mock("@/lib/services/profile", () => ({
  getCurrentProfile: vi.fn(async () => ({
    id: "user-123",
    display_name: "Aman",
    preferred_language: "hinglish",
    voice_consent: mockProfileConsent,
    memory_consent: true,
    theme: "warm-light",
  })),
}));

vi.mock("@/lib/billing/entitlement-service", () => ({
  getUserEntitlement: vi.fn(async () => ({
    tier: "free",
    voice_minutes_total: 5,
    voice_minutes_used: 5 - mockRemainingMinutes,
    quota_reset_at: new Date(Date.now() + 1000000).toISOString(),
  })),
  deductVoiceMinutes: vi.fn(async (_userId: string, minutes: number) => {
    mockRemainingMinutes = Math.max(0, mockRemainingMinutes - minutes);
  }),
}));

const mockInsertedSession: any[] = [];
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: vi.fn((table: string) => ({
      insert: vi.fn(async (row: any) => {
        mockInsertedSession.push(row);
        return { error: null };
      }),
      update: vi.fn(() => ({
        eq: vi.fn().mockReturnThis(),
      })),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    })),
  })),
}));

import {
  createVoiceSession,
  endVoiceSession,
  interceptVoiceCrisis,
  VoiceConsentRequiredError,
  VoiceQuotaExceededError,
} from "@/lib/voice/session-service";

describe("Phase 10: Voice Companion Service Test Suite", () => {
  beforeEach(() => {
    mockProfileConsent = false;
    mockRemainingMinutes = 5;
    mockInsertedSession.length = 0;
    vi.clearAllMocks();
  });

  describe("1. Explicit Microphone & Voice Consent", () => {
    it("rejects session creation when voice consent is not granted in profile and not passed in request", async () => {
      mockProfileConsent = false;
      await expect(
        createVoiceSession("user-123", { explicitConsentGiven: false })
      ).rejects.toThrow(VoiceConsentRequiredError);
    });

    it("allows session creation when user provides explicit in-app consent", async () => {
      mockProfileConsent = false;
      const session = await createVoiceSession("user-123", {
        explicitConsentGiven: true,
      });

      expect(session).toBeDefined();
      expect(session.sessionId).toBeDefined();
      expect(session.ephemeralToken).toContain(":");
      expect(mockInsertedSession.length).toBe(1);
      expect(mockInsertedSession[0].status).toBe("active");
    });

    it("allows session creation when user has pre-approved voice consent in profile", async () => {
      mockProfileConsent = true;
      const session = await createVoiceSession("user-123");
      expect(session.sessionId).toBeDefined();
    });
  });

  describe("2. Ephemeral Token Security & Zero Provider Key Exposure", () => {
    it("generates a short-lived ephemeral token (TTL 60s) without exposing master API keys", async () => {
      const session = await createVoiceSession("user-123", {
        explicitConsentGiven: true,
      });

      expect(session.ephemeralToken).not.toContain("sk-");
      expect(session.ephemeralToken).not.toContain("AIzaSy");
      expect(new Date(session.expiresAt).getTime()).toBeGreaterThan(Date.now());
      expect(new Date(session.expiresAt).getTime() - Date.now()).toBeLessThanOrEqual(61 * 1000);
    });
  });

  describe("3. Quota Limits & Cost Controls", () => {
    it("rejects voice session when user has 0 minutes remaining", async () => {
      mockProfileConsent = true;
      mockRemainingMinutes = 0;

      await expect(createVoiceSession("user-123")).rejects.toThrow(
        VoiceQuotaExceededError
      );
    });

    it("deducts consumed minutes upon ending session", async () => {
      mockProfileConsent = true;
      const session = await createVoiceSession("user-123");

      // User talked for 130 seconds (ceil = 3 minutes)
      const result = await endVoiceSession("user-123", session.sessionId, 130, "completed");
      expect(result.success).toBe(true);
      expect(result.minutesDeducted).toBe(3);
      expect(mockRemainingMinutes).toBe(2);
    });
  });

  describe("4. In-Flight Crisis Interception & Audio De-escalation", () => {
    it("halts voice session immediately and serves Tele-MANAS (14416) crisis support", async () => {
      mockProfileConsent = true;
      const session = await createVoiceSession("user-123");

      const crisis = await interceptVoiceCrisis("user-123", session.sessionId);

      expect(crisis.helplineNumber).toBe("14416");
      expect(crisis.helpline).toContain("Tele-MANAS");
      expect(crisis.deescalationText).toContain("don't have to carry this alone");
    });
  });
});

