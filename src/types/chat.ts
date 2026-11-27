import { LanguageCode, MessageRole } from "./database";

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ConversationSummary {
  id: string;
  title: string;
  language: LanguageCode;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

export interface StreamTokenEvent {
  delta: string;
}

export interface StreamStartEvent {
  conversationId: string;
  userMessageId: string;
}

export interface StreamDoneEvent {
  assistantMessageId: string;
  tokensUsed?: number;
}

export interface StreamSafetyAlertEvent {
  level: "concern" | "crisis";
  helpline?: {
    name: string;
    number: string;
    available: string;
  };
}

export interface StreamMemoryCandidateEvent {
  candidateText: string;
  category: string;
}

