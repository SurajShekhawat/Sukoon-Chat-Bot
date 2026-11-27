import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getVerifiedUserSubscription,
  handleSubscriptionStatusChange,
} from "@/lib/billing/entitlement-service";

export const runtime = "nodejs";

/**
 * GET /api/user/subscription
 * Retrieves verified server-side subscription and quota information.
 * Never trusts client state.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const details = await getVerifiedUserSubscription(user.id);
  return NextResponse.json({ subscription: details });
}

/**
 * POST /api/user/subscription
 * Self-serve subscription management (e.g. request cancellation at period end).
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.action === "cancel") {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("provider_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!sub) {
      return NextResponse.json(
        { error: "No active paid subscription found to cancel." },
        { status: 404 }
      );
    }

    await handleSubscriptionStatusChange(sub.provider_subscription_id, "active", true);

    return NextResponse.json({
      success: true,
      message: "Subscription scheduled for cancellation at the end of the billing period.",
    });
  }

  return NextResponse.json({ error: "Unsupported billing action" }, { status: 400 });
}

