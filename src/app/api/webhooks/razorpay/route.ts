import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  recordPaymentEvent,
  upgradeUserSubscription,
  handleSubscriptionStatusChange,
} from "@/lib/billing/entitlement-service";

export const runtime = "nodejs";

/**
 * Server-Verified Razorpay Webhook Handler
 * Enforces:
 * 1. HMAC-SHA256 Signature verification against RAZORPAY_WEBHOOK_SECRET.
 * 2. Idempotent deduplication against replay attacks via payment_events table.
 * 3. Never trusts client-reported payment status.
 */
export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "default_test_secret";
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature header" }, { status: 401 });
  }

  const rawBody = await request.text();

  // 1. Verify Cryptographic Signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (signature !== expectedSignature) {
    return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const eventId = body.event_id || body.payload?.payment?.entity?.id || `rzp_${Date.now()}`;
  const eventType = body.event || "unknown";

  // 2. Enforce Idempotency (prevent duplicate credit or replayed webhook)
  const payloadHash = crypto.createHash("sha256").update(rawBody).digest("hex");
  const { duplicate } = await recordPaymentEvent({
    provider: "razorpay",
    eventId,
    eventType,
    payloadHash,
  });

  if (duplicate) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  // 3. Process Verified Gateway Events
  try {
    if (
      eventType === "subscription.activated" ||
      eventType === "subscription.charged" ||
      eventType === "payment.captured"
    ) {
      const subEntity = body.payload?.subscription?.entity || body.payload?.payment?.entity;
      const notes = subEntity?.notes || {};
      const userId = notes.userId || notes.user_id;
      const tier = (notes.tier as "supporter" | "pro") || "pro";

      if (userId) {
        const periodStart = subEntity?.current_start
          ? new Date(subEntity.current_start * 1000).toISOString()
          : new Date().toISOString();
        const periodEnd = subEntity?.current_end
          ? new Date(subEntity.current_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await upgradeUserSubscription({
          userId,
          tier,
          provider: "razorpay",
          providerSubscriptionId: subEntity?.id || eventId,
          providerCustomerId: subEntity?.customer_id,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        });
      }
    } else if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.halted" ||
      eventType === "subscription.paused"
    ) {
      const subId = body.payload?.subscription?.entity?.id;
      if (subId) {
        await handleSubscriptionStatusChange(subId, "cancelled");
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error("Razorpay webhook handling error:", err);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}

