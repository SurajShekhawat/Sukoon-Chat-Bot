import { describe, it, expect } from "vitest";

/**
 * Tenant Isolation & Row Level Security (RLS) Policy Test Suite
 *
 * Validates the security model defined in DATABASE.md:
 * - Default Deny: All user tables enforce RLS.
 * - Tenant Isolation: auth.uid() = user_id (or id for profiles).
 * - Cross-user reads and mutations MUST be rejected.
 */

interface MockUser {
  id: string;
  email: string;
}

const USER_A: MockUser = { id: "00000000-0000-0000-0000-aaaaaaaaaaaa", email: "alice@sukoon.ai" };
const USER_B: MockUser = { id: "00000000-0000-0000-0000-bbbbbbbbbbbb", email: "bob@sukoon.ai" };

// Policy Predicate Evaluators directly modeling the Postgres RLS rules in DATABASE.md
const rlsPolicies = {
  profiles: {
    select: (authUid: string, row: { id: string }) => authUid === row.id,
    update: (authUid: string, row: { id: string }) => authUid === row.id,
    insert: (authUid: string, row: { id: string }) => authUid === row.id,
  },
  conversations: {
    select: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    insert: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    update: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    delete: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
  },
  messages: {
    select: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    insert: (authUid: string, row: { user_id: string; conversation_user_id: string; role: string }) =>
      authUid === row.user_id && authUid === row.conversation_user_id,
    delete: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
  },
  memories: {
    select: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    insert: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    update: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    delete: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
  },
  mood_entries: {
    select: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    insert: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    update: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    delete: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
  },
  goals: {
    select: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    insert: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    update: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
    delete: (authUid: string, row: { user_id: string }) => authUid === row.user_id,
  },
};

describe("Row Level Security (RLS) Tenant Isolation", () => {
  describe("Profiles Table RLS (auth.uid() = id)", () => {
    const userAProfile = {
      id: USER_A.id,
      display_name: "Alice",
      preferred_language: "hinglish" as const,
      memory_consent: true,
      theme: "warm-light" as const,
    };

    it("allows User A to select and update their own profile", () => {
      expect(rlsPolicies.profiles.select(USER_A.id, userAProfile)).toBe(true);
      expect(rlsPolicies.profiles.update(USER_A.id, userAProfile)).toBe(true);
    });

    it("strictly blocks User B from viewing User A's profile", () => {
      const allowed = rlsPolicies.profiles.select(USER_B.id, userAProfile);
      expect(allowed).toBe(false);
    });

    it("strictly blocks User B from modifying User A's profile", () => {
      const allowed = rlsPolicies.profiles.update(USER_B.id, userAProfile);
      expect(allowed).toBe(false);
    });
  });

  describe("Conversations Table RLS (auth.uid() = user_id)", () => {
    const userAConversation = {
      id: "11111111-1111-1111-1111-111111111111",
      user_id: USER_A.id,
      title: "Work Stress Discussion",
      language: "hinglish" as const,
      is_archived: false,
    };

    it("allows User A full CRUD access to their own conversation", () => {
      expect(rlsPolicies.conversations.select(USER_A.id, userAConversation)).toBe(true);
      expect(rlsPolicies.conversations.update(USER_A.id, userAConversation)).toBe(true);
      expect(rlsPolicies.conversations.delete(USER_A.id, userAConversation)).toBe(true);
    });

    it("denies User B from reading User A's conversation", () => {
      expect(rlsPolicies.conversations.select(USER_B.id, userAConversation)).toBe(false);
    });

    it("denies User B from updating or deleting User A's conversation", () => {
      expect(rlsPolicies.conversations.update(USER_B.id, userAConversation)).toBe(false);
      expect(rlsPolicies.conversations.delete(USER_B.id, userAConversation)).toBe(false);
    });
  });

  describe("Messages Table RLS (Cross-Conversation & Cross-User Security)", () => {
    const userAMessage = {
      id: "22222222-2222-2222-2222-222222222222",
      user_id: USER_A.id,
      conversation_id: "11111111-1111-1111-1111-111111111111",
      role: "user",
      content: "I feel very overwhelmed today.",
    };

    it("allows User A to select their own message", () => {
      expect(rlsPolicies.messages.select(USER_A.id, userAMessage)).toBe(true);
    });

    it("denies User B from selecting User A's message", () => {
      expect(rlsPolicies.messages.select(USER_B.id, userAMessage)).toBe(false);
    });

    it("denies User B from injecting a message into User A's conversation", () => {
      // User B attempts to insert a message with their own user_id into User A's conversation
      const fraudulentInsert = {
        user_id: USER_B.id,
        conversation_user_id: USER_A.id, // Conversation belongs to User A
        role: "user",
      };
      expect(rlsPolicies.messages.insert(USER_B.id, fraudulentInsert)).toBe(false);
    });
  });

  describe("Memories Table RLS (Consent Memory Vault Isolation)", () => {
    const userAMemory = {
      id: "33333333-3333-3333-3333-333333333333",
      user_id: USER_A.id,
      content: "Has an older sister living in Pune",
      category: "relationship",
      is_active: true,
    };

    it("allows User A to view, modify, and delete their own memories", () => {
      expect(rlsPolicies.memories.select(USER_A.id, userAMemory)).toBe(true);
      expect(rlsPolicies.memories.update(USER_A.id, userAMemory)).toBe(true);
      expect(rlsPolicies.memories.delete(USER_A.id, userAMemory)).toBe(true);
    });

    it("strictly blocks User B from viewing or tampering with User A's memories", () => {
      expect(rlsPolicies.memories.select(USER_B.id, userAMemory)).toBe(false);
      expect(rlsPolicies.memories.update(USER_B.id, userAMemory)).toBe(false);
      expect(rlsPolicies.memories.delete(USER_B.id, userAMemory)).toBe(false);
    });
  });

  describe("Mood Entries & Goals Table RLS", () => {
    const userAMood = {
      id: "44444444-4444-4444-4444-444444444444",
      user_id: USER_A.id,
      score: 4,
      primary_emotion: "Calm",
    };

    const userAGoal = {
      id: "55555555-5555-5555-5555-555555555555",
      user_id: USER_A.id,
      title: "Meditate for 10 minutes",
      status: "in_progress",
    };

    it("allows User A to access own mood and goal records", () => {
      expect(rlsPolicies.mood_entries.select(USER_A.id, userAMood)).toBe(true);
      expect(rlsPolicies.goals.select(USER_A.id, userAGoal)).toBe(true);
    });

    it("denies User B access to User A's mood entries and goals", () => {
      expect(rlsPolicies.mood_entries.select(USER_B.id, userAMood)).toBe(false);
      expect(rlsPolicies.goals.select(USER_B.id, userAGoal)).toBe(false);
    });
  });
});

