import { z } from "zod";

export const memoryCategoryEnum = z.enum([
  "personal",
  "career",
  "relationship",
  "goal",
  "preference",
  "general",
]);

export const createMemorySchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Memory content must be at least 3 characters")
    .max(500, "Memory content cannot exceed 500 characters"),
  category: memoryCategoryEnum.default("general"),
});

export const updateMemorySchema = z.object({
  content: z
    .string()
    .trim()
    .min(3, "Memory content must be at least 3 characters")
    .max(500, "Memory content cannot exceed 500 characters")
    .optional(),
  category: memoryCategoryEnum.optional(),
  isActive: z.boolean().optional(),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;

