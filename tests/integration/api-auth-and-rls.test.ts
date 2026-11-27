import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase Server client
let mockUser: { id: string; email: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => {
        if (!mockUser) {
          return { data: { user: null }, error: new Error("Unauthorized") };
        }
        return { data: { user: mockUser }, error: null };
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
  createAdminClient: vi.fn(() => ({
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
    from: vi.fn(() => ({
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock services to isolate route logic and authorization guards
vi.mock("@/lib/services/profile", () => ({
  getCurrentProfile: vi.fn(async () => {
    if (!mockUser) return null;
    return {
      id: mockUser.id,
      display_name: "Test User",
      preferred_language: "hinglish",
      memory_consent: true,
      theme: "warm-light",
    };
  }),
}));

vi.mock("@/lib/services/conversation", () => ({
  getUserConversations: vi.fn(async (userId: string) => {
    return { conversations: [{ id: "conv-1", title: "Test Conv", user_id: userId }], error: null };
  }),
  createConversation: vi.fn(async (userId: string, title?: string) => {
    return { conversation: { id: "conv-created-1", title: title || "New Conversation", user_id: userId }, error: null };
  }),
  getConversationById: vi.fn(async (userId: string, convId: string) => {
    if (convId === "conv-belonging-to-other-user") {
      return { conversation: null, error: "Not found" };
    }
    return {
      conversation: { id: convId, title: "Active Conv", user_id: userId, is_archived: false },
      error: null,
    };
  }),
  getConversationMessages: vi.fn(async () => ({ messages: [], error: null })),
  updateConversation: vi.fn(async (userId: string, convId: string, updates: any) => {
    if (convId === "conv-belonging-to-other-user") {
      return { conversation: null, error: "Not found" };
    }
    return { conversation: { id: convId, user_id: userId, ...updates }, error: null };
  }),
  deleteConversation: vi.fn(async (userId: string, convId: string) => {
    if (convId === "conv-belonging-to-other-user") {
      return { success: false, error: "Not found" };
    }
    return { success: true, error: null };
  }),
  generateAutoTitle: vi.fn(() => "Auto Title"),
}));

vi.mock("@/lib/services/memory", () => ({
  listUserMemories: vi.fn(async (userId: string) => ({
    memories: [{ id: "mem-1", user_id: userId, content: "Loves tea", is_active: true }],
    error: null,
  })),
  getMemoryById: vi.fn(async (userId: string, memId: string) => {
    if (memId === "mem-other-user") return { memory: null, error: "Not found" };
    return { memory: { id: memId, user_id: userId, content: "Loves tea", is_active: true }, error: null };
  }),
  createMemory: vi.fn(async (userId: string, content: string, category: string) => ({
    memory: { id: "mem-new", user_id: userId, content, category, is_active: true },
    error: null,
  })),
  updateMemoryConsent: vi.fn(async () => ({ success: true, error: null })),
  updateMemoryStatus: vi.fn(async (userId: string, memId: string, isActive: boolean) => {
    if (memId === "mem-other-user") return { memory: null, error: "Not found" };
    return { memory: { id: memId, user_id: userId, is_active: isActive }, error: null };
  }),
  deleteMemory: vi.fn(async (userId: string, memId: string) => {
    if (memId === "mem-other-user") return { success: false, error: "Not found" };
    return { success: true, error: null };
  }),
}));

vi.mock("@/lib/services/mood", () => ({
  listMoodEntries: vi.fn(async () => ({ entries: [], error: null })),
  createMoodEntry: vi.fn(async (userId: string, data: any) => ({
    entry: { id: "mood-1", user_id: userId, ...data },
    error: null,
  })),
  deleteMoodEntry: vi.fn(async (userId: string, entryId: string) => {
    if (entryId === "mood-other-user") return { success: false, error: "Not found" };
    return { success: true, error: null };
  }),
  getMoodSummary: vi.fn(async () => ({ totalEntries: 0, averageScore: null })),
}));

vi.mock("@/lib/services/goal", () => ({
  listGoals: vi.fn(async () => ({ goals: [], error: null })),
  getGoalById: vi.fn(async (userId: string, goalId: string) => {
    if (goalId === "goal-other-user") return { goal: null, error: "Not found" };
    return { goal: { id: goalId, user_id: userId, title: "Daily Walk", status: "active" }, error: null };
  }),
  createGoal: vi.fn(async (userId: string, data: any) => ({
    goal: { id: "goal-1", user_id: userId, ...data },
    error: null,
  })),
  updateGoal: vi.fn(async (userId: string, goalId: string, updates: any) => {
    if (goalId === "goal-other-user") return { goal: null, error: "Not found" };
    return { goal: { id: goalId, user_id: userId, ...updates }, error: null };
  }),
  deleteGoal: vi.fn(async (userId: string, goalId: string) => {
    if (goalId === "goal-other-user") return { success: false, error: "Not found" };
    return { success: true, error: null };
  }),
}));

// Import route handlers
import { POST as chatPost } from "@/app/api/chat/route";
import { GET as convListGet, POST as convCreatePost } from "@/app/api/conversations/route";
import {
  GET as convDetailGet,
  PATCH as convDetailPatch,
  DELETE as convDetailDelete,
} from "@/app/api/conversations/[id]/route";
import { GET as memoriesGet, POST as memoriesPost } from "@/app/api/memories/route";
import { POST as memoryConsentPost } from "@/app/api/memories/consent/route";
import { PATCH as memoryDetailPatch, DELETE as memoryDetailDelete } from "@/app/api/memories/[id]/route";
import { GET as moodGet, POST as moodPost } from "@/app/api/mood/route";
import { DELETE as moodDetailDelete } from "@/app/api/mood/[id]/route";
import { GET as goalsGet, POST as goalsPost } from "@/app/api/goals/route";
import { PATCH as goalsPatch, DELETE as goalsDelete } from "@/app/api/goals/[id]/route";
import { GET as exportGet } from "@/app/api/user/export/route";
import { DELETE as accountDelete } from "@/app/api/user/account/route";
import { acquireRequestLock, releaseRequestLock } from "@/lib/security/rate-limiter";

describe("API Security, Authorization & RLS Enforcement Test Suite", () => {
  beforeEach(() => {
    mockUser = null;
    vi.clearAllMocks();
  });

  describe("1. Unauthenticated Requests (HTTP 401 Unauthorized)", () => {
    it("rejects POST /api/chat when not logged in", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "00000000-0000-0000-0000-000000000001",
          message: "Hello",
        }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await chatPost(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBe("Unauthorized");
    });

    it("rejects GET and POST /api/conversations when unauthenticated", async () => {
      const getReq = new Request("http://localhost:3000/api/conversations");
      const getRes = await convListGet(getReq);
      expect(getRes.status).toBe(401);

      const postReq = new Request("http://localhost:3000/api/conversations", { method: "POST" });
      const postRes = await convCreatePost(postReq);
      expect(postRes.status).toBe(401);
    });

    it("rejects conversation [id] operations when unauthenticated", async () => {
      const params = Promise.resolve({ id: "conv-1" });

      const getRes = await convDetailGet(new Request("http://localhost:3000/api/conversations/conv-1"), { params });
      expect(getRes.status).toBe(401);

      const patchRes = await convDetailPatch(
        new Request("http://localhost:3000/api/conversations/conv-1", {
          method: "PATCH",
          body: JSON.stringify({ title: "New" }),
        }),
        { params }
      );
      expect(patchRes.status).toBe(401);

      const delRes = await convDetailDelete(
        new Request("http://localhost:3000/api/conversations/conv-1", { method: "DELETE" }),
        { params }
      );
      expect(delRes.status).toBe(401);
    });

    it("rejects memory operations when unauthenticated", async () => {
      const getRes = await memoriesGet(new Request("http://localhost:3000/api/memories"));
      expect(getRes.status).toBe(401);

      const postRes = await memoriesPost(
        new Request("http://localhost:3000/api/memories", {
          method: "POST",
          body: JSON.stringify({ content: "test", category: "preference" }),
        })
      );
      expect(postRes.status).toBe(401);

      const consentRes = await memoryConsentPost(
        new Request("http://localhost:3000/api/memories/consent", {
          method: "POST",
          body: JSON.stringify({ consent: true }),
        })
      );
      expect(consentRes.status).toBe(401);

      const params = Promise.resolve({ id: "mem-1" });
      const patchRes = await memoryDetailPatch(
        new Request("http://localhost:3000/api/memories/mem-1", {
          method: "PATCH",
          body: JSON.stringify({ isActive: false }),
        }),
        { params }
      );
      expect(patchRes.status).toBe(401);

      const delRes = await memoryDetailDelete(
        new Request("http://localhost:3000/api/memories/mem-1", { method: "DELETE" }),
        { params }
      );
      expect(delRes.status).toBe(401);
    });

    it("rejects mood check-in operations when unauthenticated", async () => {
      const getRes = await moodGet(new Request("http://localhost:3000/api/mood"));
      expect(getRes.status).toBe(401);

      const postRes = await moodPost(
        new Request("http://localhost:3000/api/mood", {
          method: "POST",
          body: JSON.stringify({ score: 4, moodLabel: "Calm" }),
        })
      );
      expect(postRes.status).toBe(401);

      const delRes = await moodDetailDelete(
        new Request("http://localhost:3000/api/mood/mood-1", { method: "DELETE" }),
        { params: Promise.resolve({ id: "mood-1" }) }
      );
      expect(delRes.status).toBe(401);
    });

    it("rejects personal goal operations when unauthenticated", async () => {
      const getRes = await goalsGet(new Request("http://localhost:3000/api/goals"));
      expect(getRes.status).toBe(401);

      const postRes = await goalsPost(
        new Request("http://localhost:3000/api/goals", {
          method: "POST",
          body: JSON.stringify({ title: "Walk daily", category: "mindfulness" }),
        })
      );
      expect(postRes.status).toBe(401);

      const patchRes = await goalsPatch(
        new Request("http://localhost:3000/api/goals/goal-1", {
          method: "PATCH",
          body: JSON.stringify({ status: "completed" }),
        }),
        { params: Promise.resolve({ id: "goal-1" }) }
      );
      expect(patchRes.status).toBe(401);

      const delRes = await goalsDelete(
        new Request("http://localhost:3000/api/goals/goal-1", { method: "DELETE" }),
        { params: Promise.resolve({ id: "goal-1" }) }
      );
      expect(delRes.status).toBe(401);
    });

    it("rejects data export and account deletion when unauthenticated", async () => {
      const expRes = await exportGet();
      expect(expRes.status).toBe(401);

      const delRes = await accountDelete(
        new Request("http://localhost:3000/api/user/account", {
          method: "DELETE",
          body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
        })
      );
      expect(delRes.status).toBe(401);
    });
  });

  describe("2. Request Validation & Schema Enforcement", () => {
    beforeEach(() => {
      mockUser = { id: "user-alice-123", email: "alice@sukoon.ai" };
    });

    it("returns 422 on /api/chat when message is missing or empty", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "00000000-0000-0000-0000-000000000001",
          message: "",
        }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await chatPost(req);
      expect(res.status).toBe(422);
    });

    it("returns 422 on /api/chat when conversationId is not a valid UUID", async () => {
      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId: "invalid-uuid",
          message: "Valid message content",
        }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await chatPost(req);
      expect(res.status).toBe(422);
    });

    it("returns 422 on /api/memories for invalid category", async () => {
      const req = new Request("http://localhost:3000/api/memories", {
        method: "POST",
        body: JSON.stringify({ content: "Valid content", category: "INVALID_CAT" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await memoriesPost(req);
      expect(res.status).toBe(422);
    });

    it("returns 422 on /api/mood for out-of-range mood score", async () => {
      const req = new Request("http://localhost:3000/api/mood", {
        method: "POST",
        body: JSON.stringify({ score: 6, moodLabel: "Super Euphoric" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await moodPost(req);
      expect(res.status).toBe(422);
    });

    it("returns 400 on /api/user/account when confirmation phrase is missing or incorrect", async () => {
      const req = new Request("http://localhost:3000/api/user/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "delete please" }),
        headers: { "Content-Type": "application/json" },
      });
      const res = await accountDelete(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("DELETE_MY_ACCOUNT");
    });
  });

  describe("3. Concurrency Lock Protection on /api/chat", () => {
    beforeEach(() => {
      mockUser = { id: "user-alice-123", email: "alice@sukoon.ai" };
    });

    it("returns 409 Conflict when a conversation request is already in-flight", async () => {
      const conversationId = "00000000-0000-0000-0000-000000000001";
      // Acquire lock manually
      const acquired = acquireRequestLock("user-alice-123", conversationId);
      expect(acquired).toBe(true);

      const req = new Request("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          message: "Wait for me",
          language: "hinglish",
        }),
        headers: { "Content-Type": "application/json" },
      });

      const res = await chatPost(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error).toContain("already generating");

      // Release lock
      releaseRequestLock("user-alice-123", conversationId);
    });
  });

  describe("4. Cross-User Resource Isolation (Tenant Isolation)", () => {
    beforeEach(() => {
      mockUser = { id: "user-alice-123", email: "alice@sukoon.ai" };
    });

    it("returns 404 when Alice attempts to access Bob's conversation", async () => {
      const params = Promise.resolve({ id: "conv-belonging-to-other-user" });
      const res = await convDetailGet(
        new Request("http://localhost:3000/api/conversations/conv-belonging-to-other-user"),
        { params }
      );
      expect(res.status).toBe(404);
    });

    it("returns 400 when Alice attempts to modify Bob's conversation", async () => {
      const params = Promise.resolve({ id: "conv-belonging-to-other-user" });
      const res = await convDetailPatch(
        new Request("http://localhost:3000/api/conversations/conv-belonging-to-other-user", {
          method: "PATCH",
          body: JSON.stringify({ title: "Hacked Title" }),
        }),
        { params }
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 when Alice attempts to delete Bob's conversation", async () => {
      const params = Promise.resolve({ id: "conv-belonging-to-other-user" });
      const res = await convDetailDelete(
        new Request("http://localhost:3000/api/conversations/conv-belonging-to-other-user", {
          method: "DELETE",
        }),
        { params }
      );
      expect(res.status).toBe(400);
    });

    it("returns 404 when Alice attempts to delete Bob's memory", async () => {
      const params = Promise.resolve({ id: "mem-other-user" });
      const res = await memoryDetailDelete(
        new Request("http://localhost:3000/api/memories/mem-other-user", { method: "DELETE" }),
        { params }
      );
      expect(res.status).toBe(404);
    });

    it("returns 500 when Alice attempts to delete Bob's mood entry because tenant isolation prevents it", async () => {
      const params = Promise.resolve({ id: "mood-other-user" });
      const res = await moodDetailDelete(
        new Request("http://localhost:3000/api/mood/mood-other-user", { method: "DELETE" }),
        { params: Promise.resolve({ id: "mood-other-user" }) }
      );
      expect(res.status).toBe(500);
    });

    it("returns 404 when Alice attempts to delete Bob's personal goal", async () => {
      const params = Promise.resolve({ id: "goal-other-user" });
      const res = await goalsDelete(
        new Request("http://localhost:3000/api/goals/goal-other-user", { method: "DELETE" }),
        { params: Promise.resolve({ id: "goal-other-user" }) }
      );
      expect(res.status).toBe(404);
    });
  });
});
