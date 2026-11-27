import crypto from "crypto";
import { describe, it, expect, vi, beforeEach } from "vitest";

let mockUser: { id: string; email: string } | null = null;
let mockConsent = false;
let mockVoiceQuota = 5;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        if (!mockUser) return { data: { user: null }, error: new Error("Unauthorized") };
        return { data: { user: mockUser }, error: null };
      }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      single: vi.fn(async () => {
        if (table === "profiles") {
          return {
            data: {
              id: mockUser?.id,
              voice_consent: mockConsent,
              preferred_language: "hinglish",
            },
            error: null,
          };
        }
        if (table === "user_entitlements") {
          return {
            data: {
              user_id: mockUser?.id,
              tier: "free",
              voice_minutes_total: 5,
              voice_minutes_used: 5 - mockVoiceQuota,
              quota_reset_at: new Date(Date.now() + 1000000).toISOString(),
            },
            error: null,
          };
        }
        return { data: null, error: null };
      }),
    })),
  })),
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: null, error: null })),
    })),
  })),
}));

import { POST as voiceSessionPost, PATCH as voiceSessionPatch } from "@/app/api/voice/session/route";
import { POST as razorpayWebhookPost } from "@/app/api/webhooks/razorpay/route";
import { POST as stripeWebhookPost } from "@/app/api/webhooks/stripe/route";
import { GET as subscriptionGet } from "@/app/api/user/subscription/route";

describe("Phase 10: Voice & Subscription API Integration Test Suite", () => {
  const TEST_SECRET = "test_webhook_secret_key_123";

  beforeEach(() => {
    process.env.RAZORPAY_WEBHOOK_SECRET = TEST_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = TEST_SECRET;
    mockUser = null;
    mockConsent = false;
    mockVoiceQuota = 5;
    vi.clearAllMocks();
  });

  describe("1. Voice Session Authorization & Quota Guards", () => {
    it("returns 401 when requesting voice session without being logged in", async () => {
      mockUser = null;
      const req = new Request("http://localhost:3000/api/voice/session", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await voiceSessionPost(req);
      expect(res.status).toBe(401);
    });

    it("returns 403 when user has not granted explicit voice consent", async () => {
      mockUser = { id: "user-voice-1", email: "voice@sukoon.ai" };
      mockConsent = false;

      const req = new Request("http://localhost:3000/api/voice/session", {
        method: "POST",
        body: JSON.stringify({ explicitConsentGiven: false }),
      });
      const res = await voiceSessionPost(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.requiresConsent).toBe(true);
    });

    it("returns 403 when user voice minutes are completely exhausted", async () => {
      mockUser = { id: "user-voice-1", email: "voice@sukoon.ai" };
      mockConsent = true;
      mockVoiceQuota = 0; // 0 minutes left

      const req = new Request("http://localhost:3000/api/voice/session", {
        method: "POST",
        body: JSON.stringify({ explicitConsentGiven: true }),
      });
      const res = await voiceSessionPost(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.quotaExceeded).toBe(true);
      expect(json.notice).toContain("text");
    });

    it("generates an authorized ephemeral voice token when consent & quota are valid", async () => {
      mockUser = { id: "user-voice-1", email: "voice@sukoon.ai" };
      mockConsent = true;
      mockVoiceQuota = 5;

      const req = new Request("http://localhost:3000/api/voice/session", {
        method: "POST",
        body: JSON.stringify({ explicitConsentGiven: true }),
      });
      const res = await voiceSessionPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.session).toBeDefined();
      expect(json.session.sessionId).toBeDefined();
      expect(json.session.ephemeralToken).toBeDefined();
      expect(json.session.quotaRemainingMinutes).toBe(5);
    });
  });

  describe("2. Server-Verified Payment Webhook Security", () => {
    it("rejects Razorpay webhook without x-razorpay-signature header with 401", async () => {
      const req = new Request("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        body: JSON.stringify({ event: "payment.captured" }),
      });
      const res = await razorpayWebhookPost(req);
      expect(res.status).toBe(401);
    });

    it("rejects Razorpay webhook with forged / invalid signature with 401", async () => {
      const body = JSON.stringify({ event: "subscription.activated" });
      const req = new Request("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        body,
        headers: { "x-razorpay-signature": "forged_hacker_signature_deadbeef" },
      });
      const res = await razorpayWebhookPost(req);
      expect(res.status).toBe(401);
    });

    it("accepts and verifies authentic Razorpay webhook with valid HMAC signature", async () => {
      const body = JSON.stringify({
        event_id: `evt_auth_${Date.now()}`,
        event: "subscription.activated",
        payload: {
          subscription: {
            entity: {
              id: "sub_rzp_valid_123",
              notes: { userId: "user-paid-1", tier: "pro" },
              current_start: Math.floor(Date.now() / 1000),
              current_end: Math.floor(Date.now() / 1000) + 2592000,
            },
          },
        },
      });

      const validSignature = crypto
        .createHmac("sha256", TEST_SECRET)
        .update(body)
        .digest("hex");

      const req = new Request("http://localhost:3000/api/webhooks/razorpay", {
        method: "POST",
        body,
        headers: { "x-razorpay-signature": validSignature },
      });

      const res = await razorpayWebhookPost(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.received).toBe(true);
    });

    it("rejects Stripe webhook with forged signature with 401", async () => {
      const body = JSON.stringify({ type: "invoice.payment_succeeded" });
      const req = new Request("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body,
        headers: { "stripe-signature": "bad_sig" },
      });
      const res = await stripeWebhookPost(req);
      expect(res.status).toBe(401);
    });
  });

  describe("3. Verified User Subscription Endpoint", () => {
    it("returns 401 for unauthenticated subscription status check", async () => {
      mockUser = null;
      const res = await subscriptionGet();
      expect(res.status).toBe(401);
    });

    it("returns verified server-side entitlement details when logged in", async () => {
      mockUser = { id: "user-paid-1", email: "paid@sukoon.ai" };
      mockVoiceQuota = 5;

      const res = await subscriptionGet();
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.subscription.tier).toBe("free");
      expect(json.subscription.quota_remaining_minutes).toBe(5);
    });
  });
});

