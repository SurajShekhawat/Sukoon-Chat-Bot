import { createClient } from "@/lib/supabase/server";
import { createGoal, listGoals, getGoalsSummary } from "@/lib/services/goal";
import { createGoalSchema } from "@/lib/validation/mood";
import { GoalStatus } from "@/types/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const status = (searchParams.get("status") as GoalStatus) || undefined;

  const [{ goals, error }, summary] = await Promise.all([
    listGoals(user.id, { status }),
    getGoalsSummary(user.id),
  ]);

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ goals, summary }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(request: Request) {
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

  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message || "Validation failed" }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { goal, error } = await createGoal(user.id, parsed.data);
  if (error || !goal) {
    return new Response(JSON.stringify({ error: error || "Failed to create goal" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ goal }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

