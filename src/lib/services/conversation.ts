import { createClient } from "@/lib/supabase/server";
import { Database, LanguageCode } from "@/types/database";

export type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface ConversationWithLastMessage extends ConversationRow {
  lastMessage?: string;
  messageCount?: number;
}

/**
 * Creates a new conversation for the authenticated user.
 */
export async function createConversation(
  userId: string,
  title: string = "New Conversation",
  language: LanguageCode = "hinglish"
): Promise<{ conversation: ConversationRow | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title,
      language,
      is_archived: false,
    })
    .select("*")
    .single();

  if (error) {
    return { conversation: null, error: error.message };
  }

  return { conversation: data };
}

/**
 * Lists user's conversations ordered by updated_at desc.
 */
export async function getUserConversations(
  userId: string,
  includeArchived: boolean = false,
  limit: number = 50
): Promise<{ conversations: ConversationWithLastMessage[]; error?: string }> {
  const supabase = await createClient();

  let query = supabase
    .from("conversations")
    .select("*, messages(content, created_at)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!includeArchived) {
    query = query.eq("is_archived", false);
  }

  const { data, error } = await query;

  if (error) {
    return { conversations: [], error: error.message };
  }

  const formatted: ConversationWithLastMessage[] = (data || []).map((c: any) => {
    const msgs = (c.messages as Array<{ content: string; created_at: string }>) || [];
    const sorted = [...msgs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      id: c.id,
      user_id: c.user_id,
      title: c.title,
      language: c.language,
      is_archived: c.is_archived,
      created_at: c.created_at,
      updated_at: c.updated_at,
      lastMessage: sorted[0]?.content,
      messageCount: msgs.length,
    };
  });

  return { conversations: formatted };
}

/**
 * Fetches a single conversation ensuring user ownership.
 */
export async function getConversationById(
  userId: string,
  conversationId: string
): Promise<{ conversation: ConversationRow | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return { conversation: null, error: error?.message || "Conversation not found" };
  }

  return { conversation: data };
}

/**
 * Fetches all messages for a given conversation with ownership check.
 */
export async function getConversationMessages(
  userId: string,
  conversationId: string
): Promise<{ messages: MessageRow[]; error?: string }> {
  const supabase = await createClient();

  // First verify conversation ownership
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .single();

  if (convError || !conv) {
    return { messages: [], error: "Unauthorized or conversation not found" };
  }

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (msgError) {
    return { messages: [], error: msgError.message };
  }

  return { messages: messages || [] };
}

/**
 * Updates a conversation's title or archive status with ownership check.
 */
export async function updateConversation(
  userId: string,
  conversationId: string,
  updates: { title?: string; isArchived?: boolean }
): Promise<{ conversation: ConversationRow | null; error?: string }> {
  const supabase = await createClient();

  const patch: Database["public"]["Tables"]["conversations"]["Update"] = {};
  if (updates.title !== undefined) patch.title = updates.title;
  if (updates.isArchived !== undefined) patch.is_archived = updates.isArchived;

  const { data, error } = await supabase
    .from("conversations")
    .update(patch)
    .eq("id", conversationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error || !data) {
    return { conversation: null, error: error?.message || "Failed to update conversation" };
  }

  return { conversation: data };
}

/**
 * Deletes a conversation and cascades to all its messages.
 */
export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Persists a user message.
 */
export async function saveUserMessage(
  userId: string,
  conversationId: string,
  content: string
): Promise<{ message: MessageRow | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "user",
      content,
      metadata: {},
    })
    .select("*")
    .single();

  if (error || !data) {
    return { message: null, error: error?.message || "Failed to persist user message" };
  }

  return { message: data };
}

/**
 * Persists an assistant response and updates the conversation timestamp.
 */
export async function saveAssistantMessage(
  userId: string,
  conversationId: string,
  content: string,
  tokensUsed: number = 0,
  metadata: Record<string, unknown> = {}
): Promise<{ message: MessageRow | null; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "assistant",
      content,
      metadata: { ...metadata, tokens_used: tokensUsed },
    })
    .select("*")
    .single();

  if (error || !data) {
    return { message: null, error: error?.message || "Failed to persist assistant message" };
  }

  // Update conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .eq("user_id", userId);

  return { message: data };
}

/**
 * Automatically creates a readable title from the first message.
 */
export function generateAutoTitle(firstMessage: string): string {
  const clean = firstMessage.replace(/[^\w\s\u0900-\u097F]/gi, "").trim();
  if (!clean) return "New Conversation";
  const words = clean.split(/\s+/).slice(0, 5);
  if (words.length === 0 || !words[0]) return "New Conversation";
  const title = words.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}
