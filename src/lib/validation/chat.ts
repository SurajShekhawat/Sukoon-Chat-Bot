import { z } from "zod";

export const chatRequestSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID format"),
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message cannot exceed 4000 characters"),
  language: z.enum(["hi", "hinglish", "en"]).default("hinglish"),
});

export const createConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  language: z.enum(["hi", "hinglish", "en"]).default("hinglish"),
});

export const updateConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  isArchived: z.boolean().optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;

