import { createClient } from "@/lib/supabase/server";
import { deleteMoodEntry } from "@/lib/services/mood";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteParams) {
  const { id } = await context.params;
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

  const { success, error } = await deleteMoodEntry(user.id, id);
  if (!success) {
    return new Response(JSON.stringify({ error: error || "Failed to delete mood entry" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, deletedId: id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

