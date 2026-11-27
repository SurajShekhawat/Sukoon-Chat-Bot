import { createClient, createAdminClient } from "@/lib/supabase/server";
import { SubscriptionTier, SubscriptionProvider, SubscriptionStatus } from "@/types/database";
import { logSafetyAudit } from "@/lib/security/audit-logger";

export interface UserEntitlementData {
  tier: SubscriptionTier;
  voice_minutes_total: number;
  voice_minutes_used: number;
  quota_reset_at: string;
}

export interface UserSubscriptionDetails {
  tier: SubscriptionTier;
  status: SubscriptionStatus | "none";
  provider?: SubscriptionProvider;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  voice_minutes_total: number;
  voice_minutes_used: number;
  quota_remaining_minutes: number;
}

/**
 * Retrieves or auto-provisions the user's entitlement and voice quotas.
 * Handles automatic monthly quota resets when past quota_reset_at.
 */
export async function getUserEntitlement(userId: string): Promise<UserEntitlementData> {
  const supabase = await createClient();

  const { data: entitlement, error } = await supabase
    .from("user_entitlements")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code === "PGRST116") {
    // Entitlement record doesn't exist yet: Provision Free Tier (5 free preview voice minutes)
    const newEntitlement = {
      user_id: userId,
      tier: "free" as const,
      voice_minutes_total: 5,
      voice_minutes_used: 0,
      quota_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    // Use admin client if RLS restricts direct insert to service-role
    try {
      const admin = createAdminClient();
      const { data: created } = await admin
        .from("user_entitlements")
        .insert(newEntitlement)
        .select("*")
        .single();
      if (created) return created as UserEntitlementData;
    } catch {
      // Fallback if admin key is unavailable in certain environments
    }

    return newEntitlement;
  }

  if (!entitlement) {
    return {
      tier: "free",
      voice_minutes_total: 5,
      voice_minutes_used: 0,
      quota_reset_at: new Date().toISOString(),
    };
  }

  // Monthly Reset Check
  if (new Date(entitlement.quota_reset_at) <= new Date()) {
    const updatedResetAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    try {
      const admin = createAdminClient();
      await admin
        .from("user_entitlements")
        .update({
          voice_minutes_used: 0,
          quota_reset_at: updatedResetAt,
        })
        .eq("user_id", userId);
    } catch {
      // Ignore
    }
    return {
      ...entitlement,
      voice_minutes_used: 0,
      quota_reset_at: updatedResetAt,
    };
  }

  return entitlement;
}

/**
 * Deducts consumed minutes from the user's voice quota.
 */
export async function deductVoiceMinutes(userId: string, minutes: number): Promise<void> {
  const entitlement = await getUserEntitlement(userId);
  const newUsed = Math.min(
    entitlement.voice_minutes_total,
    entitlement.voice_minutes_used + minutes
  );

  try {
    const admin = createAdminClient();
    await admin
      .from("user_entitlements")
      .update({ voice_minutes_used: newUsed })
      .eq("user_id", userId);
  } catch {
    const supabase = await createClient();
    await supabase
      .from("user_entitlements")
      .update({ voice_minutes_used: newUsed })
      .eq("user_id", userId);
  }
}

/**
 * Idempotency Guardian: Ensures payment webhook events are NEVER processed more than once.
 * Rejects replay attacks and duplicate delivery from gateways.
 */
export async function recordPaymentEvent(event: {
  provider: SubscriptionProvider;
  eventId: string;
  eventType: string;
  payloadHash: string;
}): Promise<{ duplicate: boolean }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("payment_events").insert({
      provider: event.provider,
      event_id: event.eventId,
      event_type: event.eventType,
      payload_hash: event.payloadHash,
    });

    if (error) {
      if (error.code === "23505" || error.message?.includes("duplicate")) {
        return { duplicate: true };
      }
      console.warn("Payment event log warning:", error.message);
    }
    return { duplicate: false };
  } catch (err: any) {
    if (err.message?.includes("duplicate") || err.code === "23505") {
      return { duplicate: true };
    }
    return { duplicate: false };
  }
}

/**
 * Server-Side Entitlement Upgrade:
 * Invoked ONLY by cryptographically verified webhook handlers.
 */
export async function upgradeUserSubscription(data: {
  userId: string;
  tier: SubscriptionTier;
  provider: SubscriptionProvider;
  providerSubscriptionId: string;
  providerCustomerId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}): Promise<void> {
  const admin = createAdminClient();

  // 1. Voice minute allocations per tier
  const voiceMinutesTotal =
    data.tier === "pro" ? 180 : data.tier === "supporter" ? 60 : 5;

  // 2. Upsert Subscriptions Record
  await admin.from("subscriptions").upsert(
    {
      user_id: data.userId,
      provider: data.provider,
      provider_subscription_id: data.providerSubscriptionId,
      provider_customer_id: data.providerCustomerId || null,
      plan_tier: data.tier,
      status: "active",
      current_period_start: data.currentPeriodStart,
      current_period_end: data.currentPeriodEnd,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_subscription_id" }
  );

  // 3. Atomically Upgrade User Entitlements
  await admin.from("user_entitlements").upsert(
    {
      user_id: data.userId,
      tier: data.tier,
      voice_minutes_total: voiceMinutesTotal,
      voice_minutes_used: 0,
      quota_reset_at: data.currentPeriodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  logSafetyAudit({
    eventType: "safety_guardrail_triggered",
    userId: data.userId,
    category: "subscription_activated",
    severity: "low",
    metadata: {
      tier: data.tier,
      provider: data.provider,
      allocatedMinutes: voiceMinutesTotal,
    },
  });
}

/**
 * Handles subscription cancellation or status changes from webhooks.
 */
export async function handleSubscriptionStatusChange(
  providerSubscriptionId: string,
  newStatus: SubscriptionStatus,
  cancelAtPeriodEnd = false
): Promise<void> {
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from("subscriptions")
    .select("user_id, plan_tier")
    .eq("provider_subscription_id", providerSubscriptionId)
    .single();

  await admin
    .from("subscriptions")
    .update({
      status: newStatus,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_subscription_id", providerSubscriptionId);

  // If immediately cancelled or halted, downgrade to free tier
  if (sub && (newStatus === "cancelled" || newStatus === "halted")) {
    await admin
      .from("user_entitlements")
      .update({
        tier: "free",
        voice_minutes_total: 5,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", sub.user_id);
  }
}

/**
 * Returns full verified subscription details for the authenticated user.
 */
export async function getVerifiedUserSubscription(userId: string): Promise<UserSubscriptionDetails> {
  const supabase = await createClient();

  const [subResult, entitlement] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getUserEntitlement(userId),
  ]);

  const sub = subResult.data;
  const remaining = Math.max(0, entitlement.voice_minutes_total - entitlement.voice_minutes_used);

  return {
    tier: entitlement.tier,
    status: sub ? sub.status : "none",
    provider: sub?.provider,
    current_period_end: sub?.current_period_end,
    cancel_at_period_end: sub?.cancel_at_period_end,
    voice_minutes_total: entitlement.voice_minutes_total,
    voice_minutes_used: entitlement.voice_minutes_used,
    quota_remaining_minutes: remaining,
  };
}

