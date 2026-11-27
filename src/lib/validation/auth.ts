import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name cannot exceed 50 characters")
    .default("Friend"),
  preferredLanguage: z.enum(["hi", "hinglish", "en"]).default("hinglish"),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name cannot exceed 50 characters")
    .optional(),
  preferredLanguage: z.enum(["hi", "hinglish", "en"]).optional(),
  memoryConsent: z.boolean().optional(),
  theme: z.enum(["warm-light", "warm-dark", "system"]).optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

