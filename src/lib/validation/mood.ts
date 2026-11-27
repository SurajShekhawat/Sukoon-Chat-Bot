import { z } from "zod";

export const createMoodEntrySchema = z.object({
  score: z.number().int().min(1).max(5),
  primaryEmotion: z
    .string()
    .trim()
    .min(1, "Primary emotion is required")
    .max(50, "Primary emotion cannot exceed 50 characters"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .nullable(),
});

export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Goal title cannot be empty")
    .max(150, "Goal title cannot exceed 150 characters"),
  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .nullable(),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Target date must be in YYYY-MM-DD format")
    .optional()
    .nullable(),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(["in_progress", "completed", "paused", "abandoned"]).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export type CreateMoodEntryInput = z.infer<typeof createMoodEntrySchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

