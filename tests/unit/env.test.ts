import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { clientEnvSchema, serverEnvSchema } from "@/lib/env";

describe("Environment Variables Validator", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("validates client environment successfully", () => {
    const validClient = {
      NEXT_PUBLIC_SUPABASE_URL: "https://xyzcompany.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sample-anon-key-12345",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };
    const res = clientEnvSchema.safeParse(validClient);
    expect(res.success).toBe(true);
  });

  it("rejects invalid Supabase URL", () => {
    const invalidClient = {
      NEXT_PUBLIC_SUPABASE_URL: "not-a-valid-url",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sample-anon-key",
    };
    const res = clientEnvSchema.safeParse(invalidClient);
    expect(res.success).toBe(false);
  });

  it("applies defaults for server environment options", () => {
    const minimalServer = {
      NEXT_PUBLIC_SUPABASE_URL: "https://xyzcompany.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "sample-anon-key",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    };
    const parsed = serverEnvSchema.parse(minimalServer);
    expect(parsed.OPENAI_MODEL).toBe("gpt-4o-mini");
    expect(parsed.RATE_LIMIT_DAILY_MESSAGES).toBe(50);
  });
});

