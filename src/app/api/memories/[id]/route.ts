import { createClient } from "@/lib/supabase/server";
import {
  getMemoryById,
  updateMemory,
  deleteMemory,
  MemoryServiceError,
  SensitiveDataError,
} from "@/lib/services/memory";
import { updateMemorySchema } from "@/lib/validation/memory";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/memories/[id]
 * Retrieves a single memory item for the authenticated owner.
 */
export async function GET(request: Request, context: RouteParams) {
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

  const { memory, error } = await getMemoryById(user.id, id);
  if (error || !memory) {
    return new Response(JSON.stringify({ error: error || "Memory not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ memory }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * PATCH /api/memories/[id]
 * Updates content, category, or revokes/activates (isActive: false/true).
 */
export async function PATCH(request: Request, context: RouteParams) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = updateMemorySchema.safeParse(body);
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
    const { memory, error } = await updateMemory(user.id, id, parsed.data);
    if (error || !memory) {
      return new Response(JSON.stringify({ error: error || "Failed to update memory" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ memory }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    if (err instanceof SensitiveDataError) {
      return new Response(JSON.stringify({ error: err.message, code: err.code }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (err instanceof MemoryServiceError) {
      return new Response(JSON.stringify({ error: err.message, code: err.code }), {
        status: err.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * DELETE /api/memories/[id]
 * Permanently erases a memory item for the authenticated user.
 */
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

  // Check existence & ownership first
  const { memory } = await getMemoryById(user.id, id);
  if (!memory) {
    return new Response(JSON.stringify({ error: "Memory not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { success, error } = await deleteMemory(user.id, id);
  if (!success) {
    return new Response(JSON.stringify({ error: error || "Failed to delete memory" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true, deletedId: id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

