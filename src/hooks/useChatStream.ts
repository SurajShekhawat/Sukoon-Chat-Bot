"use client";

import { useState, useRef, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import { EmergencyHelpline } from "@/types/safety";
import { LanguageCode } from "@/types/database";

export interface StreamState {
  messages: ChatMessage[];
  isStreaming: boolean;
  activeHelplines: EmergencyHelpline[] | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  stopGeneration: () => void;
  retryLastMessage: () => Promise<void>;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useChatStream(
  conversationId: string,
  initialMessages: ChatMessage[] = [],
  preferredLanguage: LanguageCode = "hinglish"
): StreamState {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeHelplines, setActiveHelplines] = useState<EmergencyHelpline[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string | null>(null);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setActiveHelplines(null);
      lastUserMessageRef.current = trimmed;

      const userMsgId = `temp-user-${Date.now()}`;
      const assistantMsgId = `temp-assistant-${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMsgId,
        conversationId,
        userId: "current-user",
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const assistantPlaceholder: ChatMessage = {
        id: assistantMsgId,
        conversationId,
        userId: "assistant",
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            message: trimmed,
            language: preferredLanguage,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body received from server");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const block of lines) {
            const eventMatch = block.match(/^event:\s*(\w+)/m);
            const dataMatch = block.match(/^data:\s*(.+)$/m);

            if (!dataMatch) continue;
            const eventName = eventMatch ? eventMatch[1] : "message";
            let parsedData: any = {};
            try {
              parsedData = JSON.parse(dataMatch[1]);
            } catch {
              continue;
            }

            if (eventName === "token" && parsedData.delta) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + parsedData.delta }
                    : msg
                )
              );
            } else if (eventName === "safety_alert" && parsedData.helplines) {
              setActiveHelplines(parsedData.helplines);
            } else if (eventName === "done") {
              if (parsedData.assistantMessageId) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMsgId
                      ? { ...msg, id: parsedData.assistantMessageId }
                      : msg
                  )
                );
              }
            } else if (eventName === "error") {
              setError(parsedData.message || "An error occurred during generation");
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          console.log("Stream aborted by user");
        } else {
          const msg = err instanceof Error ? err.message : "Failed to communicate with companion";
          setError(msg);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [conversationId, isStreaming, preferredLanguage]
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastUserMessageRef.current || isStreaming) return;
    // Remove the last assistant response before retrying
    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].role === "assistant") {
        copy.pop();
      }
      return copy;
    });
    await sendMessage(lastUserMessageRef.current);
  }, [isStreaming, sendMessage]);

  return {
    messages,
    isStreaming,
    activeHelplines,
    error,
    sendMessage,
    stopGeneration,
    retryLastMessage,
    setMessages,
  };
}

