"use client";

import React, { useState } from "react";
import { HeartHandshake, User, Copy, Check, RotateCcw, Sparkles } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
  isLast?: boolean;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export function MessageBubble({
  message,
  isLast,
  isStreaming,
  onRetry,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = React.useMemo(() => {
    if (!message.createdAt) return "";
    try {
      const date = new Date(message.createdAt);
      return new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "numeric",
      }).format(date);
    } catch {
      return "";
    }
  }, [message.createdAt]);

  return (
    <div
      className={cn(
        "flex gap-3 max-w-3xl w-full mx-auto my-3 group animate-message-enter transition-all duration-200",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar with subtle glow */}
      <div
        className={cn(
          "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs shrink-0 shadow-sm mt-1 transition-transform group-hover:scale-105",
          isUser
            ? "bg-gradient-to-br from-slate-700 to-slate-900 text-white ring-2 ring-warm-200 dark:ring-slate-700"
            : "bg-gradient-to-br from-sukoon-500 via-teal-600 to-sukoon-700 text-white ring-2 ring-sukoon-200 dark:ring-sukoon-900/50 shadow-sukoon-500/20 shadow-md"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4" />
        ) : (
          <HeartHandshake className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
        )}
      </div>

      {/* Bubble Content & Metadata */}
      <div
        className={cn(
          "flex flex-col space-y-1.5 max-w-[85%] sm:max-w-[78%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Author Label */}
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
          {!isUser ? (
            <span className="flex items-center gap-1 text-sukoon-700 dark:text-sukoon-400">
              <Sparkles className="w-3 h-3" />
              <span>Sukoon</span>
              <span className="text-[10px] text-slate-400">• सुकून</span>
            </span>
          ) : (
            <span>You</span>
          )}
          {formattedTime && <span className="text-[10px] text-slate-400">• {formattedTime}</span>}
        </div>

        {/* Message Card */}
        <div
          className={cn(
            "p-4 sm:p-4.5 rounded-2xl text-sm sm:text-[14.5px] leading-relaxed whitespace-pre-wrap break-words transition-all duration-200",
            isUser
              ? "bg-gradient-to-br from-sukoon-600 via-teal-600 to-sukoon-700 text-white rounded-tr-xs shadow-md shadow-sukoon-900/10"
              : "bg-white/95 dark:bg-slate-900/95 border border-warm-200/90 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs shadow-sm hover:shadow-md backdrop-blur-sm"
          )}
        >
          {message.content ? (
            <div className="space-y-2">{message.content}</div>
          ) : isStreaming ? (
            <div className="inline-flex items-center gap-2.5 py-1 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sukoon-500 typing-dot-1" />
                <span className="w-2 h-2 rounded-full bg-sukoon-500 typing-dot-2" />
                <span className="w-2 h-2 rounded-full bg-sukoon-500 typing-dot-3" />
              </div>
              <span className="font-normal italic">Sukoon is reflecting softly...</span>
            </div>
          ) : null}

          {/* Smooth breathing cursor while streaming tokens */}
          {isStreaming && !isUser && message.content && (
            <span className="inline-block w-1.5 h-4 ml-1.5 rounded-sm bg-sukoon-500 animate-pulse align-middle" />
          )}
        </div>

        {/* Message Actions (Assistant message only) */}
        {!isUser && message.content && !isStreaming && (
          <div className="flex items-center gap-2 pt-0.5 px-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400">
            <button
              onClick={handleCopy}
              className={cn(
                "hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-lg flex items-center gap-1.5 transition-colors border border-transparent hover:border-warm-200 dark:hover:border-slate-800 hover:bg-white/60 dark:hover:bg-slate-800/60",
                copied && "text-teal-600 dark:text-teal-400 font-medium"
              )}
              aria-label="Copy response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {isLast && onRetry && (
              <button
                onClick={onRetry}
                className="hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 rounded-lg flex items-center gap-1.5 transition-colors border border-transparent hover:border-warm-200 dark:hover:border-slate-800 hover:bg-white/60 dark:hover:bg-slate-800/60"
                aria-label="Retry response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
