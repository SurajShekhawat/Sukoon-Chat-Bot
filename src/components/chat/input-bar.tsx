"use client";

import React, { useState, useRef, useEffect } from "react";
import { SendHorizontal, Square, Sparkles, CornerDownLeft } from "lucide-react";
import { LanguageCode } from "@/types/database";
import { cn } from "@/lib/utils";

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onStopGeneration: () => void;
  isStreaming: boolean;
  disabled?: boolean;
  activeLanguage?: LanguageCode;
}

export function InputBar({
  onSendMessage,
  onStopGeneration,
  isStreaming,
  disabled,
  activeLanguage = "hinglish",
}: InputBarProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isStreaming) {
      onStopGeneration();
      return;
    }
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const languageBadge = {
    hinglish: "Hinglish • हिंदी-English",
    hi: "हिन्दी • Hindi",
    en: "English",
  }[activeLanguage];

  const quickPrompts = {
    hinglish: [
      "Aaj mann thoda bhari hai",
      "Office mein burnout ho raha hai",
      "Bas thodi der baat karni hai",
    ],
    hi: [
      "आज मन थोड़ा भारी लग रहा है",
      "मुझे थोड़ी शांति और ध्यान की ज़रूरत है",
      "आज का दिन काफी थकाऊ रहा",
    ],
    en: [
      "I'm feeling a bit overwhelmed today",
      "Need to untangle my thoughts",
      "Just want a calm space to reflect",
    ],
  }[activeLanguage];

  const handleQuickPromptClick = (prompt: string) => {
    setInput(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-4 pb-4 pt-1">
      {/* Quick Prompt Chips (visible when input is empty & not streaming) */}
      {!input && !isStreaming && (
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-2.5 mb-0.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium text-slate-400 shrink-0 mr-1 hidden sm:inline">
            Quick start:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPromptClick(prompt)}
              className="shrink-0 px-3 py-1.5 rounded-full border border-warm-200/90 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-sukoon-400/80 hover:bg-sukoon-50/50 dark:hover:bg-sukoon-950/40 text-slate-700 dark:text-slate-300 text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs backdrop-blur-xs"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Floating Glassmorphic Input Dock */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex flex-col bg-white/90 dark:bg-slate-900/90 border border-warm-200/90 dark:border-slate-800/90 rounded-2xl shadow-md shadow-sukoon-950/5 backdrop-blur-xl transition-all duration-200 p-2 sm:p-2.5",
          "focus-within:ring-2 focus-within:ring-sukoon-500/40 focus-within:border-sukoon-400 dark:focus-within:border-sukoon-500",
          disabled && "opacity-60 pointer-events-none"
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Share what is on your mind... दिल की बात बेझिझक कहें"
          disabled={disabled}
          rows={1}
          maxLength={4000}
          className="w-full resize-none bg-transparent px-3 py-2 text-sm sm:text-[14.5px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none min-h-[46px] max-h-[180px] custom-scrollbar leading-relaxed"
        />

        {/* Input Bar Footer */}
        <div className="flex items-center justify-between px-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-sukoon-700 dark:text-sukoon-400 font-medium bg-sukoon-50 dark:bg-sukoon-950/50 px-2 py-0.5 rounded-full border border-sukoon-200/60 dark:border-sukoon-900/60">
              <Sparkles className="w-3 h-3 text-sukoon-600 dark:text-sukoon-400" />
              <span>{languageBadge}</span>
            </div>

            <span className="hidden md:inline-flex items-center gap-1 text-slate-400 text-[10px]">
              <CornerDownLeft className="w-2.5 h-2.5" />
              <span>Enter to send</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {input.length > 0 && (
              <span className="text-[11px] text-slate-400 transition-opacity">
                {input.length}/4000
              </span>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-medium text-xs shadow-xs transition-all active:scale-95 animate-pulse"
                aria-label="Stop generation"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || disabled}
                className={cn(
                  "inline-flex items-center justify-center p-2.5 rounded-xl transition-all shadow-sm active:scale-95",
                  input.trim()
                    ? "bg-gradient-to-r from-sukoon-600 via-teal-600 to-sukoon-700 hover:from-sukoon-500 hover:to-teal-500 text-white shadow-sukoon-600/25 hover:shadow-md hover:scale-105"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 opacity-50 cursor-not-allowed"
                )}
                aria-label="Send message"
              >
                <SendHorizontal className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
