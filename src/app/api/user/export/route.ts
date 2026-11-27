import { createClient } from "@/lib/supabase/server";
import { logSafetyAudit } from "@/lib/security/audit-logger";

export const runtime = "nodejs";

/**
 * GET /api/user/export
 * Implements complete Data Portability under India DPDP Act 2023 & GDPR Article 20.
 * Downloads a structured JSON archive of all personal data, memories, conversations,
 * mood logs, and growth goals owned by the authenticated user.
 */
export async function GET() {
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

  try {
    // 1. Fetch Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    // 2. Fetch Conversations
    const { data: conversations } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 3. Fetch Messages
    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    // 4. Fetch Memories
    const { data: memories } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 5. Fetch Mood Entries
    const { data: moodEntries } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 6. Fetch Goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Assemble conversations with their nested messages
    const messagesByConv = new Map<string, typeof messages>();
    for (const msg of messages || []) {
      const list = messagesByConv.get(msg.conversation_id) || [];
      list.push(msg);
      messagesByConv.set(msg.conversation_id, list);
    }

    const conversationsWithMessages = (conversations || []).map((conv) => ({
      ...conv,
      messages: messagesByConv.get(conv.id) || [],
    }));

    const exportArchive = {
      export_metadata: {
        platform: "Sukoon AI",
        description: "Personal Data & Reflection Archive",
        version: "1.0.0",
        exported_at: new Date().toISOString(),
        compliance: "India DPDP Act 2023 & GDPR Data Portability",
        user_id: user.id,
        user_email: user.email,
      },
      profile: profile || null,
      summary: {
        conversations_count: conversationsWithMessages.length,
        total_messages_count: (messages || []).length,
        memories_count: (memories || []).length,
        mood_entries_count: (moodEntries || []).length,
        goals_count: (goals || []).length,
      },
      conversations: conversationsWithMessages,
      memories: memories || [],
      mood_entries: moodEntries || [],
      goals: goals || [],
    };

    // Log Anonymized Audit Event (NO RAW DATA LOGGED)
    logSafetyAudit({
      eventType: "data_exported",
      userId: user.id,
      category: "privacy_export",
      severity: "low",
      metadata: {
        conversationsCount: conversationsWithMessages.length,
        memoriesCount: (memories || []).length,
        moodCount: (moodEntries || []).length,
        goalsCount: (goals || []).length,
      },
    });

    const filename = `sukoon-data-export-${new Date().toISOString().slice(0, 10)}.json`;

    return new Response(JSON.stringify(exportArchive, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Data export failure:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate personal data export" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
