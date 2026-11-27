import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createConversation,
  getUserConversations,
  generateAutoTitle,
} from "@/lib/services/conversation";
import { createConversationSchema } from "@/lib/validation/chat";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("archived") === "true";
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

  const { conversations, error } = await getUserConversations(user.id, includeArchived, limit);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ conversations });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // Body is optional
  }

  const parsed = createConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }

  const title = parsed.data.title || "New Conversation";
  const language = parsed.data.language || "hinglish";

  const { conversation, error } = await createConversation(user.id, title, language);
  if (error || !conversation) {
    return NextResponse.json({ error: error || "Failed to create conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversation }, { status: 201 });
}

