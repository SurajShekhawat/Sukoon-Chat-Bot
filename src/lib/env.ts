import { z } from "zod";

/**
 * Client-accessible environment variables.
 * Must start with NEXT_PUBLIC_
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

/**
 * Server-only environment variables.
 * NEVER expose to the client.
 */
export const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required").optional(),
  AI_PROVIDER: z.enum(["gemini", "openai", "nvidia"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash-lite"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  // NVIDIA NIM Provider Configuration
  NVIDIA_API_KEY: z.string().optional(),
  NVIDIA_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  NVIDIA_DEFAULT_CHAT_MODEL: z.string().default("minimaxai/minimax-m3.1-flash"),
  NVIDIA_REASONING_MODEL: z.string().default("nvidia/nemotron-3.5-super-vl-120b-a12b"),
  NVIDIA_CODING_MODEL: z.string().default("minimaxai/minimax-m3.1-flash"),
  NVIDIA_TTS_MODEL: z.string().default("nvidia/magpie-tts-zeroshot"),
  NVIDIA_DEPLOYMENT_MODE: z.enum(["development", "production"]).default("development"),
  RATE_LIMIT_DAILY_MESSAGES: z.coerce.number().positive().default(50),
  RATE_LIMIT_BURST_PER_MINUTE: z.coerce.number().positive().default(15),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Validates server environment variables at runtime.
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error("❌ Invalid environment variables:", JSON.stringify(formatted, null, 2));
    throw new Error("Missing or invalid server environment variables");
  }
  return result.data;
}

/**
 * Safely retrieves client-safe environment variables.
 */
export function getClientEnv(): Partial<ClientEnv> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  };
}

