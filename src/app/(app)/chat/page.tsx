import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserConversations, createConversation } from "@/lib/services/conversation";
import { getCurrentProfile } from "@/lib/services/profile";

export const dynamic = "force-dynamic";

export default async function ChatIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user has an existing conversation
  const { conversations } = await getUserConversations(user.id, false, 1);

  if (conversations && conversations.length > 0) {
    redirect(`/chat/${conversations[0].id}`);
  }

  // Otherwise create a fresh first reflection
  const profile = await getCurrentProfile();
  const { conversation } = await createConversation(
    user.id,
    "New Conversation",
    profile?.preferred_language || "hinglish"
  );

  if (conversation) {
    redirect(`/chat/${conversation.id}`);
  }

  redirect("/settings");
}
