import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock react-native and expo-secure-store
vi.mock("react-native", () => ({
  Platform: {
    OS: "android",
    select: (obj: any) => obj.android || obj.default,
  },
  Linking: {
    openURL: vi.fn(),
  },
  StyleSheet: {
    create: (styles: any) => styles,
  },
}));

const mockSecureStorage: Record<string, string> = {};

vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn(async (key: string) => mockSecureStorage[key] || null),
  setItemAsync: vi.fn(async (key: string, val: string) => {
    mockSecureStorage[key] = val;
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    delete mockSecureStorage[key];
  }),
  AFTER_FIRST_UNLOCK: "AFTER_FIRST_UNLOCK",
}));

let mockUserSession: { access_token: string } | null = {
  access_token: "mock-mobile-jwt-token-12345",
};

vi.mock("@/../mobile/src/services/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: mockUserSession },
        error: null,
      })),
      signInWithPassword: vi.fn(async ({ email, password }) => {
        if (password === "wrong") {
          return { data: { user: null, session: null }, error: new Error("Invalid credentials") };
        }
        return {
          data: {
            user: { id: "user-1", email },
            session: { access_token: "mock-mobile-jwt-token-12345" },
          },
          error: null,
        };
      }),
      signUp: vi.fn(async ({ email }) => ({
        data: {
          user: { id: "user-1", email },
          session: { access_token: "mock-mobile-jwt-token-12345" },
        },
        error: null,
      })),
      signOut: vi.fn(async () => {
        mockUserSession = null;
      }),
    },
  },
}));

// Mock global fetch for API testing
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Import mobile API client
import { api } from "../../mobile/src/services/api";
import { env } from "../../mobile/src/config/env";

describe("Phase 9: React Native & Expo Mobile Client Test Suite", () => {
  beforeEach(() => {
    mockUserSession = { access_token: "mock-mobile-jwt-token-12345" };
    fetchMock.mockReset();
  });

  describe("1. Environment & Safe Secrets Boundaries", () => {
    it("ensures mobile env exposes NO provider secrets or service role keys", () => {
      // Must only contain safe client URLs and public config
      expect((env as any).OPENAI_API_KEY).toBeUndefined();
      expect((env as any).GEMINI_API_KEY).toBeUndefined();
      expect((env as any).SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
      expect(env.HELPLINES).toBeDefined();
      expect(env.HELPLINES[0].number).toBe("14416");
    });
  });

  describe("2. Authenticated REST API Client", () => {
    it("attaches Bearer token header to GET /api/conversations", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversations: [{ id: "c1", title: "Reflection 1", is_archived: false }],
        }),
      });

      const list = await api.getConversations();
      expect(list.length).toBe(1);
      expect(list[0].title).toBe("Reflection 1");

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/conversations"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-mobile-jwt-token-12345",
          }),
        })
      );
    });

    it("creates a new conversation with language and title", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversation: { id: "new-c", title: "Night Walk", is_archived: false },
        }),
      });

      const conv = await api.createConversation("Night Walk", "hinglish");
      expect(conv.id).toBe("new-c");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/conversations"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "Night Walk", language: "hinglish" }),
        })
      );
    });

    it("parses streaming SSE chat chunks correctly on mobile", async () => {
      const sseBody = [
        'data: {"chunk": "Main "}\n\n',
        'data: {"chunk": "samajh "}\n\n',
        'data: {"chunk": "sakta hoon."}\n\n',
        'data: {"done": true, "assistantMessageId": "asst-101"}\n\n',
      ].join("");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        text: async () => sseBody,
      });

      const receivedChunks: string[] = [];
      let isDone = false;
      let errorReceived: string | null = null;

      await api.sendStreamingMessage({
        conversationId: "00000000-0000-0000-0000-000000000001",
        message: "Bahut stress ho raha hai",
        language: "hinglish",
        onChunk: (chunk) => receivedChunks.push(chunk),
        onDone: () => {
          isDone = true;
        },
        onError: (err) => {
          errorReceived = err;
        },
      });

      expect(errorReceived).toBeNull();
      expect(isDone).toBe(true);
      expect(receivedChunks.join("")).toBe("Main samajh sakta hoon.");
    });

    it("handles chat streaming error gracefully without crashing", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: "Rate limit reached. Please pause." }),
      });

      let errorMsg = "";
      await api.sendStreamingMessage({
        conversationId: "00000000-0000-0000-0000-000000000001",
        message: "Hello",
        onChunk: () => {},
        onDone: () => {},
        onError: (err) => {
          errorMsg = err;
        },
      });

      expect(errorMsg).toContain("Rate limit reached");
    });
  });

  describe("3. Mobile Consent & Memory Vault", () => {
    it("fetches memories and consent status", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          memories: [{ id: "m1", content: "Loves chai", is_active: true }],
          consentGranted: true,
        }),
      });

      const { memories, consentGranted } = await api.getMemories();
      expect(memories.length).toBe(1);
      expect(consentGranted).toBe(true);
    });

    it("updates master memory recall consent", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await api.setMemoryConsent(false);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/memories/consent"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ consent: false }),
        })
      );
    });

    it("toggles active state and deletes memory items", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      await api.toggleMemoryActive("m1", false);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/memories/m1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ isActive: false }),
        })
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      await api.deleteMemory("m1");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/memories/m1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("4. Mobile Mood Journal & Safety Controls", () => {
    it("logs a new mood check-in with score and notes", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entry: { id: "mood-1", score: 4, mood_label: "Calm", notes: "Meditation helped" },
        }),
      });

      const entry = await api.createMoodEntry({
        score: 4,
        moodLabel: "Calm",
        notes: "Meditation helped",
      });

      expect(entry.score).toBe(4);
      expect(entry.mood_label).toBe("Calm");
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/mood"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            score: 4,
            moodLabel: "Calm",
            notes: "Meditation helped",
          }),
        })
      );
    });

    it("calls data export and account purge endpoints with DPDP compliance", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user_id: "user-1", conversations: [] }),
      });
      const exportData = await api.exportData();
      expect(exportData.user_id).toBe("user-1");

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });
      await api.deleteAccount();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/api/user/account"),
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
        })
      );
    });
  });
});

