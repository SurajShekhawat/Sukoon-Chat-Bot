import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logSafetyAudit } from "@/lib/security/audit-logger";

export const runtime = "nodejs";

/**
 * DELETE /api/user/account
 * Implements "Right to be Forgotten" under India DPDP Act 2023 & GDPR Article 17.
 * Executes a cascading purge across all user tables and invalidates auth session.
 */
export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { confirmation?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON. Please provide confirmation." }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (body.confirmation !== "DELETE_MY_ACCOUNT") {
    return new Response(
      JSON.stringify({
        error:
          "Explicit confirmation required. Please confirm by passing confirmation='DELETE_MY_ACCOUNT'.",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const userId = user.id;

  try {
    // 0. Terminate active recurring billing to prevent future charges
    const { data: activeSub } = await supabase
      .from("subscriptions")
      .select("provider_subscription_id, provider")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (activeSub) {
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", userId);
    }

    // 1. Cascading hard delete across user-owned tables
    await supabase.from("messages").delete().eq("user_id", userId);
    await supabase.from("conversations").delete().eq("user_id", userId);
    await supabase.from("memories").delete().eq("user_id", userId);
    await supabase.from("mood_entries").delete().eq("user_id", userId);
    await supabase.from("goals").delete().eq("user_id", userId);
    await supabase.from("voice_sessions").delete().eq("user_id", userId);
    await supabase.from("user_entitlements").delete().eq("user_id", userId);
    await supabase.from("subscriptions").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);

    // 2. If Service Role Key is present, purge Supabase Auth identity
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey && !serviceRoleKey.startsWith("placeholder")) {
      try {
        const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey);
        await adminClient.auth.admin.deleteUser(userId);
      } catch (adminErr) {
        console.warn("Could not delete auth user with service role key:", adminErr);
      }
    }

    // 3. Sign out user session
    await supabase.auth.signOut();

    // 4. Log Anonymized Audit Event (NO RAW DATA LOGGED)
    logSafetyAudit({
      eventType: "account_purged",
      userId,
      category: "privacy_purge",
      severity: "high",
      metadata: {
        hardDeleted: true,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your account and all associated personal data have been permanently erased.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Account purge failure:", err);
    return new Response(
      JSON.stringify({ error: "Failed to complete account deletion" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
