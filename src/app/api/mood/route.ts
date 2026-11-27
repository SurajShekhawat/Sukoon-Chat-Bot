import { createClient } from "@/lib/supabase/server";
import { createMoodEntry, listMoodEntries, getWeeklyMoodReflection } from "@/lib/services/mood";
import { createMoodEntrySchema } from "@/lib/validation/mood";

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
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const [{ entries, total, error: listError }, { reflection, error: refError }] =
    await Promise.all([
      listMoodEntries(user.id, { page, limit }),
      getWeeklyMoodReflection(user.id),
    ]);

  if (listError) {
    return new Response(JSON.stringify({ error: listError }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      entries,
      total,
      page,
      limit,
      reflection,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
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

  const parsed = createMoodEntrySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message || "Validation failed" }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { entry, error } = await createMoodEntry(user.id, parsed.data);
  if (error || !entry) {
    return new Response(JSON.stringify({ error: error || "Failed to record mood entry" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ entry }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

