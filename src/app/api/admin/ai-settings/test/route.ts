/**
 * Sukoon AI — Admin AI Provider Connectivity Test API
 *
 * POST /api/admin/ai-settings/test
 * Triggers an isolated, non-destructive probe to check live provider reachability.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { providerHealthMonitor } from "@/lib/ai/provider-health";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const provider = body.provider as "gemini" | "openai" | "nvidia";
  if (!provider || !["gemini", "openai", "nvidia"].includes(provider)) {
    return NextResponse.json(
      { error: "Invalid provider specified. Must be 'gemini', 'openai', or 'nvidia'." },
      { status: 400 }
    );
  }

  try {
    const result = await providerHealthMonitor.probeProvider(provider);
    return NextResponse.json({
      success: result.status === "healthy",
      result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to probe provider connectivity.",
      },
      { status: 500 }
    );
  }
}

