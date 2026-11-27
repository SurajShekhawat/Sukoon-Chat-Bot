import { createClient } from "@/lib/supabase/server";
import { updateGoal, deleteGoal, getGoalById } from "@/lib/services/goal";
import { updateGoalSchema } from "@/lib/validation/mood";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message || "Validation failed" }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { goal, error } = await updateGoal(user.id, id, parsed.data);
  if (error || !goal) {
    return new Response(JSON.stringify({ error: error || "Failed to update goal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ goal }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
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

  const { goal } = await getGoalById(user.id, id);
  if (!goal) {
    return new Response(JSON.stringify({ error: "Goal not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { success, error } = await deleteGoal(user.id, id);
  if (!success) {
    return new Response(JSON.stringify({ error: error || "Failed to delete goal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, deletedId: id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

