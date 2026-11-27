import { env } from "../config/env";
import { supabase } from "./supabase";

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface MemoryItem {
  id: string;
  user_id: string;
  content: string;
  category: "preference" | "emotional_pattern" | "relationship" | "coping_strategy";
  is_active: boolean;
  created_at: string;
}

export interface MoodItem {
  id: string;
  score: number;
  mood_label: string;
  energy_level?: number;
  notes?: string;
  tags?: string[];
  created_at: string;
}

export interface GoalItem {
  id: string;
  title: string;
  category: "mindfulness" | "stress_reduction" | "sleep" | "social_connection" | "self_reflection";
  status: "active" | "completed" | "abandoned";
  target_date?: string;
  created_at: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("User session expired or unauthorized. Please sign in.");
  }
  return {
    Authorization: `Bearer ${session.access_token}`,
    "Content-Type": "application/json",
  };
}

export const api = {
  // Conversations
  async getConversations(): Promise<ConversationItem[]> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/conversations`, { headers });
    if (!res.ok) throw new Error("Failed to fetch conversations");
    const data = await res.json();
    return data.conversations || [];
  },

  async createConversation(title?: string, language = "hinglish"): Promise<ConversationItem> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/conversations`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title, language }),
    });
    if (!res.ok) throw new Error("Failed to create conversation");
    const data = await res.json();
    return data.conversation;
  },

  async getConversation(id: string): Promise<{ conversation: ConversationItem; messages: MessageItem[] }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/conversations/${id}`, { headers });
    if (!res.ok) throw new Error("Conversation not found");
    return await res.json();
  },

  async deleteConversation(id: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/conversations/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete conversation");
  },

  // Streaming Chat
  async sendStreamingMessage({
    conversationId,
    message,
    language = "hinglish",
    abortSignal,
    onChunk,
    onDone,
    onError,
  }: {
    conversationId: string;
    message: string;
    language?: string;
    abortSignal?: AbortSignal;
    onChunk: (chunk: string) => void;
    onDone: (meta?: { userMessageId?: string; assistantMessageId?: string }) => void;
    onError: (err: string) => void;
  }): Promise<void> {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${env.API_BASE_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ conversationId, message, language }),
        signal: abortSignal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        onError(errorData.error || `Server responded with ${res.status}`);
        return;
      }

      // Read response stream
      if (res.body && typeof res.body.getReader === "function") {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data: ")) {
              const dataStr = trimmed.substring(6);
              try {
                const parsed = JSON.parse(dataStr);
                const chunkText = parsed.chunk || parsed.delta;
                if (chunkText) {
                  onChunk(chunkText);
                }
                if (parsed.done) {
                  onDone({
                    userMessageId: parsed.userMessageId,
                    assistantMessageId: parsed.assistantMessageId,
                  });
                  return;
                }
                if (parsed.error) {
                  onError(parsed.error);
                  return;
                }
              } catch {
                // Ignore partial JSON chunks
              }
            }
          }
        }
        onDone();
      } else {
        // Fallback for runtimes without streaming reader
        const text = await res.text();
        const lines = text.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.substring(6));
              const chunkText = parsed.chunk || parsed.delta;
              if (chunkText) onChunk(chunkText);
              if (parsed.done) {
                onDone();
                return;
              }
            } catch {
              // Ignore
            }
          }
        }
        onDone();
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        return; // User aborted cleanly
      }
      onError(err.message || "Failed to communicate with companion");
    }
  },

  // Memories
  async getMemories(): Promise<{ memories: MemoryItem[]; consentGranted: boolean }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/memories`, { headers });
    if (!res.ok) throw new Error("Failed to load memories");
    const data = await res.json();
    return {
      memories: data.memories || [],
      consentGranted: !!data.consentGranted,
    };
  },

  async setMemoryConsent(consent: boolean): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/memories/consent`, {
      method: "POST",
      headers,
      body: JSON.stringify({ consent }),
    });
    if (!res.ok) throw new Error("Failed to update memory consent");
  },

  async toggleMemoryActive(id: string, isActive: boolean): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/memories/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ isActive }),
    });
    if (!res.ok) throw new Error("Failed to update memory status");
  },

  async deleteMemory(id: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/memories/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete memory");
  },

  // Mood Journal
  async getMoodEntries(): Promise<{ entries: MoodItem[]; summary: any }> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/mood`, { headers });
    if (!res.ok) throw new Error("Failed to fetch mood entries");
    return await res.json();
  },

  async createMoodEntry(data: {
    score: number;
    moodLabel: string;
    notes?: string;
    energyLevel?: number;
    tags?: string[];
  }): Promise<MoodItem> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/mood`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to save mood check-in");
    }
    const result = await res.json();
    return result.entry;
  },

  async deleteMoodEntry(id: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/mood/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete mood entry");
  },

  // Goals
  async getGoals(): Promise<GoalItem[]> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/goals`, { headers });
    if (!res.ok) throw new Error("Failed to fetch goals");
    const data = await res.json();
    return data.goals || [];
  },

  async createGoal(data: {
    title: string;
    category: string;
    targetDate?: string;
  }): Promise<GoalItem> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/goals`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create goal");
    const result = await res.json();
    return result.goal;
  },

  async updateGoal(id: string, updates: { status?: "active" | "completed" | "abandoned" }): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/goals/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update goal");
  },

  async deleteGoal(id: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/goals/${id}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw new Error("Failed to delete goal");
  },

  // Privacy & Account
  async exportData(): Promise<any> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/user/export`, { headers });
    if (!res.ok) throw new Error("Failed to export data");
    return await res.json();
  },

  async deleteAccount(): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`${env.API_BASE_URL}/api/user/account`, {
      method: "DELETE",
      headers,
      body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
    });
    if (!res.ok) throw new Error("Failed to delete account");
  },
};

