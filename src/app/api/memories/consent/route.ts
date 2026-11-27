import { createClient } from "@/lib/supabase/server";
import { updateMemoryConsent } from "@/lib/services/memory";
import { z } from "zod";

export const runtime = "nodejs";

const consentSchema = z.object({
  consent: z.boolean(),
});

/**
 * POST /api/memories/consent
 * Enables or pauses long-term memory vault consent in the user's profile.
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

  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message || "Validation failed" }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { success, error } = await updateMemoryConsent(user.id, parsed.data.consent);
  if (!success) {
    return new Response(JSON.stringify({ error: error || "Failed to update consent" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      memoryConsent: parsed.data.consent,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}

