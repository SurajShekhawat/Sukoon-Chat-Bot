import { describe, it, expect } from "vitest";
import { chatRequestSchema, createConversationSchema } from "@/lib/validation/chat";
import { signUpSchema, loginSchema } from "@/lib/validation/auth";
import { createMemorySchema } from "@/lib/validation/memory";
import { createMoodEntrySchema, createGoalSchema } from "@/lib/validation/mood";

describe("Validation Schemas (Zod)", () => {
  describe("Chat Request Validation", () => {
    it("accepts valid chat payload", () => {
      const valid = {
        conversationId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        message: "Kal mera pehla interview hai, kya karoon?",
        language: "hinglish",
      };
      const result = chatRequestSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it("rejects empty message", () => {
      const invalid = {
        conversationId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        message: "   ",
        language: "hinglish",
      };
      const result = chatRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("rejects invalid conversation UUID", () => {
      const invalid = {
        conversationId: "not-a-valid-uuid",
        message: "Hello",
        language: "en",
      };
      const result = chatRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe("Authentication Validation", () => {
    it("validates strong signup password", () => {
      const valid = {
        email: "test@sukoon.ai",
        password: "ValidPassword123",
        displayName: "Aarav",
        preferredLanguage: "hinglish",
      };
      expect(signUpSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects weak password lacking digits or uppercase", () => {
      const invalid = {
        email: "test@sukoon.ai",
        password: "weakpassword",
        displayName: "Aarav",
      };
      expect(signUpSchema.safeParse(invalid).success).toBe(false);
    });

    it("validates login payload", () => {
      expect(loginSchema.safeParse({ email: "user@test.com", password: "Password123" }).success).toBe(true);
      expect(loginSchema.safeParse({ email: "not-an-email", password: "" }).success).toBe(false);
    });
  });

  describe("Memory & Mood Validation", () => {
    it("validates memory creation schema", () => {
      const memory = {
        content: "Preparing for CAT exam in November",
        category: "career",
      };
      expect(createMemorySchema.safeParse(memory).success).toBe(true);
    });

    it("rejects mood entry with out-of-bounds score", () => {
      expect(createMoodEntrySchema.safeParse({ score: 0, primaryEmotion: "Sad" }).success).toBe(false);
      expect(createMoodEntrySchema.safeParse({ score: 6, primaryEmotion: "Happy" }).success).toBe(false);
      expect(createMoodEntrySchema.safeParse({ score: 4, primaryEmotion: "Calm" }).success).toBe(true);
    });

    it("validates goal schema", () => {
      const goal = {
        title: "Daily 15-minute evening walk",
        description: "To clear head after work",
        targetDate: "2026-11-30",
      };
      expect(createGoalSchema.safeParse(goal).success).toBe(true);
    });
  });
});

