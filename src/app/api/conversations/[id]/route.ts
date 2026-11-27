import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getConversationById,
  getConversationMessages,
  updateConversation,
  deleteConversation,
} from "@/lib/services/conversation";
import { updateConversationSchema } from "@/lib/validation/chat";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversation, error: convError } = await getConversationById(user.id, conversationId);
  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { messages, error: msgError } = await getConversationMessages(user.id, conversationId);
  if (msgError) {
    return NextResponse.json({ error: msgError }, { status: 500 });
  }

  return NextResponse.json({ conversation, messages });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = updateConversationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 422 });
  }

  const { conversation, error } = await updateConversation(user.id, conversationId, {
    title: parsed.data.title,
    isArchived: parsed.data.isArchived,
  });

  if (error || !conversation) {
    return NextResponse.json({ error: error || "Failed to update conversation" }, { status: 400 });
  }

  return NextResponse.json({ conversation });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { success, error } = await deleteConversation(user.id, conversationId);
  if (!success) {
    return NextResponse.json({ error: error || "Failed to delete conversation" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}

