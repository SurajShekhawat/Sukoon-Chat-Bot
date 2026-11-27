"use client";

import React, { useState } from "react";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatWindow } from "./chat-window";
import { ConversationWithLastMessage } from "@/lib/services/conversation";
import { ChatMessage } from "@/types/chat";
import { LanguageCode } from "@/types/database";

interface ChatLayoutProps {
  conversationId: string;
  conversations: ConversationWithLastMessage[];
  initialMessages: ChatMessage[];
  conversationTitle: string;
  preferredLanguage: LanguageCode;
}

export function ChatLayout({
  conversationId,
  conversations,
  initialMessages,
  conversationTitle,
  preferredLanguage,
}: ChatLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-[calc(100vh-65px)] md:h-screen w-full overflow-hidden">
      {/* Desktop Sidebar (Permanent on lg+) */}
      <div className="hidden lg:block w-72 border-r border-warm-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shrink-0">
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={conversationId}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sheet */}
      <div
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-slate-950 z-50 shadow-2xl lg:hidden transform transition-transform duration-300 ease-in-out ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={conversationId}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      {/* Main Interactive Chat Window */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <ChatWindow
          conversationId={conversationId}
          initialMessages={initialMessages}
          conversationTitle={conversationTitle}
          preferredLanguage={preferredLanguage}
          onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />
      </div>
    </div>
  );
}

