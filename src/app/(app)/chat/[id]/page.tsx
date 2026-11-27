import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getConversationById,
  getConversationMessages,
  getUserConversations,
} from "@/lib/services/conversation";
import { getCurrentProfile } from "@/lib/services/profile";
import { ChatLayout } from "@/components/chat/chat-layout";
import { ChatMessage } from "@/types/chat";

export const dynamic = "force-dynamic";

interface ChatPageProps {
  params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: ChatPageProps) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch conversation with strict ownership check
  const { conversation, error: convError } = await getConversationById(user.id, conversationId);
  if (convError || !conversation) {
    redirect("/chat");
  }

  // 2. Fetch conversation messages
  const { messages: rawMessages } = await getConversationMessages(user.id, conversationId);

  // 3. Fetch user's conversation list for sidebar
  const { conversations } = await getUserConversations(user.id);
  const profile = await getCurrentProfile();

  const formattedMessages: ChatMessage[] = (rawMessages || []).map((m) => ({
    id: m.id,
    conversationId: m.conversation_id,
    userId: m.user_id,
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
    createdAt: m.created_at,
    metadata: m.metadata as Record<string, unknown>,
  }));

  return (
    <ChatLayout
      conversationId={conversationId}
      conversations={conversations}
      initialMessages={formattedMessages}
      conversationTitle={conversation.title}
      preferredLanguage={profile?.preferred_language || conversation.language}
    />
  );
}
