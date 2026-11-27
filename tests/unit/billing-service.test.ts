import { describe, it, expect, vi, beforeEach } from "vitest";

const mockEntitlements: Record<string, any> = {};
const mockSubscriptions: Record<string, any> = {};
const mockPaymentEvents: Set<string> = new Set();

vi.mock("@/lib/supabase/server", () => {
  const createMockBuilder = (table: string) => {
    let filterVal = "";
    const builder: any = {
      eq: vi.fn((col: string, val: string) => {
        if (col === "user_id" || col === "id") filterVal = val;
        return builder;
      }),
      order: vi.fn(() => builder),
      limit: vi.fn(() => builder),
      single: vi.fn(async () => {
        if (table === "user_entitlements") {
          const ent = mockEntitlements[filterVal];
          return ent ? { data: ent, error: null } : { data: null, error: { code: "PGRST116" } };
        }
        return { data: null, error: null };
      }),
      maybeSingle: vi.fn(async () => {
        if (table === "subscriptions") {
          const sub = Object.values(mockSubscriptions).find((s: any) => s.user_id === filterVal);
          return { data: sub || null, error: null };
        }
        return { data: null, error: null };
      }),
    };
    return builder;
  };

  return {
    createClient: vi.fn(async () => ({
      from: vi.fn((table: string) => ({
        select: vi.fn(() => createMockBuilder(table)),
        update: vi.fn((data: any) => ({
          eq: vi.fn((_col: string, val: string) => {
            if (table === "user_entitlements") {
              mockEntitlements[val] = { ...mockEntitlements[val], ...data };
            }
            return Promise.resolve({ error: null });
          }),
        })),
      })),
    })),
    createAdminClient: vi.fn(() => ({
      from: vi.fn((table: string) => ({
        insert: vi.fn(async (row: any) => {
          if (table === "payment_events") {
            if (mockPaymentEvents.has(row.event_id)) {
              return { error: { code: "23505", message: "duplicate key error" } };
            }
            mockPaymentEvents.add(row.event_id);
            return { error: null };
          }
          if (table === "user_entitlements") {
            mockEntitlements[row.user_id] = row;
            return { data: row, error: null };
          }
          return { error: null };
        }),
        upsert: vi.fn(async (row: any) => {
          if (table === "subscriptions") {
            mockSubscriptions[row.provider_subscription_id] = row;
          } else if (table === "user_entitlements") {
            mockEntitlements[row.user_id] = { ...mockEntitlements[row.user_id], ...row };
          }
          return { error: null };
        }),
        select: vi.fn(() => ({
          eq: vi.fn((_col: string, val: string) => ({
            single: vi.fn(async () => {
              if (table === "subscriptions") {
                const sub = mockSubscriptions[val];
                return { data: sub || null, error: null };
              }
              return { data: null, error: null };
            }),
          })),
        })),
        update: vi.fn((data: any) => ({
          eq: vi.fn((_col: string, val: string) => {
            if (table === "subscriptions") {
              if (mockSubscriptions[val]) {
                mockSubscriptions[val] = { ...mockSubscriptions[val], ...data };
              }
            } else if (table === "user_entitlements") {
              if (mockEntitlements[val]) {
                mockEntitlements[val] = { ...mockEntitlements[val], ...data };
              }
            }
            return Promise.resolve({ error: null });
          }),
        })),
      })),
    })),
  };
});

import {
  getUserEntitlement,
  deductVoiceMinutes,
  recordPaymentEvent,
  upgradeUserSubscription,
  handleSubscriptionStatusChange,
  getVerifiedUserSubscription,
} from "@/lib/billing/entitlement-service";

describe("Phase 10: Subscription & Idempotent Entitlement Service Test Suite", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockEntitlements)) delete mockEntitlements[key];
    for (const key of Object.keys(mockSubscriptions)) delete mockSubscriptions[key];
    mockPaymentEvents.clear();
    vi.clearAllMocks();
  });

  describe("1. Idempotency & Replay Attack Defense", () => {
    it("accepts new payment event on first arrival", async () => {
      const result = await recordPaymentEvent({
        provider: "razorpay",
        eventId: "evt_test_101",
        eventType: "subscription.activated",
        payloadHash: "hash123",
      });
      expect(result.duplicate).toBe(false);
    });

    it("rejects duplicate payment events to prevent double-crediting", async () => {
      await recordPaymentEvent({
        provider: "razorpay",
        eventId: "evt_test_duplicate",
        eventType: "payment.captured",
        payloadHash: "hash123",
      });

      // Second attempt with same eventId
      const secondAttempt = await recordPaymentEvent({
        provider: "razorpay",
        eventId: "evt_test_duplicate",
        eventType: "payment.captured",
        payloadHash: "hash123",
      });

      expect(secondAttempt.duplicate).toBe(true);
    });
  });

  describe("2. Server-Verified Entitlement Upgrades", () => {
    it("allocates 180 voice minutes upon upgrading to Pro tier", async () => {
      await upgradeUserSubscription({
        userId: "user-alice-pro",
        tier: "pro",
        provider: "razorpay",
        providerSubscriptionId: "sub_rzp_999",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

      const entitlement = await getUserEntitlement("user-alice-pro");
      expect(entitlement.tier).toBe("pro");
      expect(entitlement.voice_minutes_total).toBe(180);
      expect(entitlement.voice_minutes_used).toBe(0);

      const details = await getVerifiedUserSubscription("user-alice-pro");
      expect(details.tier).toBe("pro");
      expect(details.status).toBe("active");
      expect(details.quota_remaining_minutes).toBe(180);
    });

    it("allocates 60 voice minutes upon upgrading to Supporter tier", async () => {
      await upgradeUserSubscription({
        userId: "user-bob-supporter",
        tier: "supporter",
        provider: "stripe",
        providerSubscriptionId: "sub_str_888",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      });

      const entitlement = await getUserEntitlement("user-bob-supporter");
      expect(entitlement.tier).toBe("supporter");
      expect(entitlement.voice_minutes_total).toBe(60);
    });
  });

  describe("3. Subscription Cancellation & Downgrade Behavior", () => {
    it("downgrades entitlements to free tier upon subscription cancellation", async () => {
      await upgradeUserSubscription({
        userId: "user-charlie",
        tier: "pro",
        provider: "razorpay",
        providerSubscriptionId: "sub_rzp_cancel_me",
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date().toISOString(),
      });

      await handleSubscriptionStatusChange("sub_rzp_cancel_me", "cancelled");

      const entitlement = await getUserEntitlement("user-charlie");
      expect(entitlement.tier).toBe("free");
      expect(entitlement.voice_minutes_total).toBe(5);
    });
  });

  describe("4. New User Auto-Provisioning", () => {
    it("provisions 5 free preview voice minutes for new unconfigured accounts", async () => {
      const entitlement = await getUserEntitlement("new-unregistered-user");
      expect(entitlement.tier).toBe("free");
      expect(entitlement.voice_minutes_total).toBe(5);
      expect(entitlement.voice_minutes_used).toBe(0);
    });
  });
});
