"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MessageBubble } from "./message-bubble";
import { InputBar } from "./input-bar";
import { CrisisCard } from "./crisis-card";
import { useChatStream } from "@/hooks/useChatStream";
import { ChatMessage } from "@/types/chat";
import { LanguageCode } from "@/types/database";
import {
  Sparkles,
  HeartHandshake,
  ChevronDown,
  ShieldCheck,
  PanelLeftOpen,
  Coffee,
  Brain,
  SunMedium,
  Moon,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: string;
  initialMessages: ChatMessage[];
  conversationTitle?: string;
  preferredLanguage?: LanguageCode;
  onToggleSidebar?: () => void;
}

export function ChatWindow({
  conversationId,
  initialMessages,
  conversationTitle = "Reflection",
  preferredLanguage = "hinglish",
  onToggleSidebar,
}: ChatWindowProps) {
  const {
    messages,
    isStreaming,
    activeHelplines,
    error,
    sendMessage,
    stopGeneration,
    retryLastMessage,
  } = useChatStream(conversationId, initialMessages, preferredLanguage);

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Monitor user scroll position to avoid jerking view if user is reading back
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const nearBottom = distanceFromBottom < 100;
    setIsNearBottom(nearBottom);
    shouldAutoScrollRef.current = nearBottom;
  }, []);

  // Smooth auto-scroll when near bottom
  useEffect(() => {
    if (scrollRef.current && shouldAutoScrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isStreaming]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
      shouldAutoScrollRef.current = true;
      setIsNearBottom(true);
    }
  };

  const reflectionCategories = [
    {
      icon: Coffee,
      category: {
        en: "Stress & Work",
        hinglish: "Work & Burnout",
        hi: "तनाव और काम",
      }[preferredLanguage],
      prompt: {
        en: "I've been feeling exhausted with work lately and need to vent.",
        hinglish: "Aaj office aur kaam se kaafi burnout feel ho raha hai, thoda vent karna hai.",
        hi: "आज काम की वजह से बहुत थकान और तनाव लग रहा है, क्या हम बात कर सकते हैं?",
      }[preferredLanguage],
    },
    {
      icon: Brain,
      category: {
        en: "Overthinking",
        hinglish: "Overthinking & Clarity",
        hi: "उलझन और स्पष्टता",
      }[preferredLanguage],
      prompt: {
        en: "I have a difficult situation on my mind and want to untangle my thoughts.",
        hinglish: "Mann mein kaafi baatein chal rahi hain, thoda clarity chahiye.",
        hi: "मन में बहुत से विचार चल रहे हैं, मुझे थोड़ा स्पष्ट सोचने में मदद चाहिए।",
      }[preferredLanguage],
    },
    {
      icon: SunMedium,
      category: {
        en: "Gratitude & Wins",
        hinglish: "Small Wins & Peace",
        hi: "छोटी खुशियाँ और आभार",
      }[preferredLanguage],
      prompt: {
        en: "Can you help me reflect on a small positive moment from today?",
        hinglish: "Aaj ka din tough tha par ek choti si positive cheez hui, share karni hai.",
        hi: "आज के दिन का एक छोटा सा सकारात्मक पल साझा करना चाहता हूँ।",
      }[preferredLanguage],
    },
    {
      icon: Moon,
      category: {
        en: "Late Night Calm",
        hinglish: "Night Calm & Peace",
        hi: "रात की शांति",
      }[preferredLanguage],
      prompt: {
        en: "I'm having trouble sleeping because my mind is racing.",
        hinglish: "Neend nahi aa rahi aur mann thoda restless hai, calm hone mein help karo.",
        hi: "मन में बेचैनी है और नींद नहीं आ रही, कृपया शांत महसूस करने में मदद करें।",
      }[preferredLanguage],
    },
  ];

  return (
    <div className="relative flex flex-col h-full w-full bg-gradient-to-b from-warm-50/70 via-white/50 to-warm-50/80 dark:from-slate-950 dark:via-slate-900/60 dark:to-slate-950 overflow-hidden">
      {/* Top Conversation Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-warm-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-warm-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Toggle reflection history"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">
              {conversationTitle}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              <span className="hidden sm:inline">Encrypted Safe Space • RLS Protected</span>
              <span className="sm:hidden">Encrypted • Private</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-sukoon-800 dark:text-sukoon-300 bg-sukoon-50 dark:bg-sukoon-950/60 border border-sukoon-200/60 dark:border-sukoon-900/60 px-3 py-1 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-sukoon-600 dark:text-sukoon-400" />
            <span className="capitalize">{preferredLanguage}</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[75%] max-w-lg mx-auto text-center space-y-6 my-auto py-8 px-2 animate-message-enter">
            {/* Mindful Breathing Emblem */}
            <div className="relative group cursor-default">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-sukoon-500 via-teal-600 to-sukoon-700 flex items-center justify-center text-white shadow-xl shadow-sukoon-500/25 ring-4 ring-sukoon-100 dark:ring-sukoon-950/60 animate-breathe">
                <HeartHandshake className="w-8 h-8" />
              </div>
            </div>

            <div className="space-y-1.5 max-w-md">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {preferredLanguage === "hi"
                  ? "आपका शांत और सुरक्षित कोना"
                  : preferredLanguage === "hinglish"
                  ? "Aapka shaant aur safe space"
                  : "A calm sanctuary for your thoughts"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {preferredLanguage === "hi"
                  ? "यहाँ आप बिना किसी झिझक के अपनी बात कह सकते हैं। सुकून आपको ध्यान से सुनेगा।"
                  : preferredLanguage === "hinglish"
                  ? "Yahan bina kisi judgement ke dil ki baat share karein. Take a slow deep breath."
                  : "Share whatever is weighing on your heart. Sukoon listens with empathy and confidentiality."}
              </p>
            </div>

            {/* Prompt Cards Grid */}
            <div className="w-full space-y-2 pt-2">
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>You might begin with:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
                {reflectionCategories.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => sendMessage(item.prompt)}
                      className="group flex flex-col p-3.5 rounded-2xl border border-warm-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-sukoon-400/90 hover:bg-white dark:hover:bg-slate-900 text-left transition-all duration-200 shadow-2xs hover:shadow-md hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-2 mb-1.5 text-sukoon-700 dark:text-sukoon-400">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold">{item.category}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                        &ldquo;{item.prompt}&rdquo;
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <MessageBubble
              key={msg.id || index}
              message={msg}
              isLast={index === messages.length - 1}
              isStreaming={isStreaming && index === messages.length - 1}
              onRetry={retryLastMessage}
            />
          ))
        )}

        {/* Crisis Support Card Banner if triggered */}
        {activeHelplines && activeHelplines.length > 0 && (
          <div className="max-w-3xl mx-auto w-full animate-message-enter">
            <CrisisCard helplines={activeHelplines} language={preferredLanguage} />
          </div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div className="max-w-3xl mx-auto p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between shadow-xs animate-message-enter">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={retryLastMessage}
              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium ml-3 shrink-0 transition-colors shadow-2xs"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Floating Jump to Latest Button */}
      {!isNearBottom && messages.length > 0 && (
        <div className="absolute bottom-24 right-6 z-20 animate-message-enter">
          <button
            onClick={scrollToBottom}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-warm-200 dark:border-slate-700 shadow-md text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-sukoon-600 hover:border-sukoon-300 dark:hover:border-sukoon-600 transition-all hover:scale-105 active:scale-95"
            aria-label="Scroll to bottom"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Latest</span>
          </button>
        </div>
      )}

      {/* Floating Input Dock */}
      <div className="shrink-0 bg-gradient-to-t from-warm-50/90 dark:from-slate-950/90 via-warm-50/60 dark:via-slate-950/60 to-transparent pt-2 backdrop-blur-2xs">
        <InputBar
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          isStreaming={isStreaming}
          activeLanguage={preferredLanguage}
        />
      </div>
    </div>
  );
}
