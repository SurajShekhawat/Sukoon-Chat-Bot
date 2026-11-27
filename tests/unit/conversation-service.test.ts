import { describe, it, expect } from "vitest";
import { generateAutoTitle } from "@/lib/services/conversation";
import { chatRequestSchema, createConversationSchema, updateConversationSchema } from "@/lib/validation/chat";

describe("Conversation Service & Schema Contracts", () => {
  describe("generateAutoTitle helper", () => {
    it("generates concise titles from everyday venting messages", () => {
      const msg1 = "Aaj office mein boss ke sath thoda heated argument ho gaya";
      const title1 = generateAutoTitle(msg1);
      expect(title1).toBe("Aaj office mein boss ke");

      const msg2 = "Exam results are coming out tomorrow and I am terrified";
      const title2 = generateAutoTitle(msg2);
      expect(title2).toBe("Exam results are coming out");
    });

    it("handles Hindi Devanagari text cleanly", () => {
      const msg = "आज का दिन बहुत थका देने वाला था";
      const title = generateAutoTitle(msg);
      expect(title).toContain("आज");
    });

    it("falls back to New Conversation for empty strings", () => {
      expect(generateAutoTitle("")).toBe("New Conversation");
      expect(generateAutoTitle("   ")).toBe("New Conversation");
    });
  });

  describe("Chat Request Zod Validation", () => {
    it("validates well-formed chat request", () => {
      const valid = {
        conversationId: "a0000000-0000-0000-0000-000000000001",
        message: "Hello Sukoon, I need some peace of mind today.",
        language: "hinglish",
      };
      expect(chatRequestSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects messages exceeding 4000 characters", () => {
      const longMessage = "a".repeat(4001);
      const invalid = {
        conversationId: "a0000000-0000-0000-0000-000000000001",
        message: longMessage,
        language: "en",
      };
      expect(chatRequestSchema.safeParse(invalid).success).toBe(false);
    });

    it("validates conversation rename input", () => {
      expect(updateConversationSchema.safeParse({ title: "Work Stress" }).success).toBe(true);
      expect(updateConversationSchema.safeParse({ isArchived: true }).success).toBe(true);
      expect(updateConversationSchema.safeParse({ title: "a".repeat(101) }).success).toBe(false);
    });
  });
});

