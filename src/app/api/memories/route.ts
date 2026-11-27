import { createClient } from "@/lib/supabase/server";
import {
  listUserMemories,
  createMemory,
  ConsentRequiredError,
  SensitiveDataError,
} from "@/lib/services/memory";
import { getCurrentProfile } from "@/lib/services/profile";
import { createMemorySchema } from "@/lib/validation/memory";

export const runtime = "nodejs";

/**
 * GET /api/memories
 * Lists all memories for the authenticated user, along with current profile consent status.
 */
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
  const onlyActive = searchParams.get("onlyActive") === "true";
  const category = searchParams.get("category") || undefined;

  const [profile, { memories, error }] = await Promise.all([
    getCurrentProfile(),
    listUserMemories(user.id, {
      onlyActive,
      category: category as any,
    }),
  ]);

  if (error) {
    return new Response(JSON.stringify({ error }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      memories,
      consentEnabled: !!profile?.memory_consent,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * POST /api/memories
 * Creates a new memory item with strict consent validation and sensitive content scanning.
 */
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

  const parsed = createMemorySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message || "Validation failed" }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { memory, error } = await createMemory(user.id, parsed.data);
    if (error || !memory) {
      return new Response(JSON.stringify({ error: error || "Failed to create memory" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ memory }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    if (err instanceof ConsentRequiredError) {
      return new Response(JSON.stringify({ error: err.message, code: err.code }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (err instanceof SensitiveDataError) {
      return new Response(JSON.stringify({ error: err.message, code: err.code }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

