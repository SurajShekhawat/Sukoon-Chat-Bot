import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getActiveAIProvider, getActiveAIModel } from "@/lib/ai/provider";
import { getGeminiClient, GeminiConfigurationError } from "@/lib/ai/gemini";
import { getOpenAIClient, AIConfigurationError } from "@/lib/ai/openai";

describe("AI Provider Layer — Dual Support (Gemini & OpenAI)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("resolves Gemini as active provider when AI_PROVIDER is explicitly 'gemini'", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "test-key-gemini";
    expect(getActiveAIProvider()).toBe("gemini");
    expect(getActiveAIModel()).toBe("gemini-3.5-flash-lite");
  });

  it("resolves custom GEMINI_MODEL when configured", () => {
    process.env.AI_PROVIDER = "gemini";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    expect(getActiveAIModel()).toBe("gemini-3.8-flash");
  });

  it("resolves OpenAI when AI_PROVIDER is explicitly 'openai'", () => {
    process.env.AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test-key";
    expect(getActiveAIProvider()).toBe("openai");
    expect(getActiveAIModel()).toBe("gpt-4o-mini");
  });

  it("throws GeminiConfigurationError when GEMINI_API_KEY is missing or placeholder", () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    expect(() => getGeminiClient()).toThrow(GeminiConfigurationError);

    process.env.GEMINI_API_KEY = "placeholder";
    expect(() => getGeminiClient()).toThrow(GeminiConfigurationError);
  });

  it("throws AIConfigurationError when OPENAI_API_KEY is missing or placeholder", () => {
    delete process.env.OPENAI_API_KEY;
    expect(() => getOpenAIClient()).toThrow(AIConfigurationError);

    process.env.OPENAI_API_KEY = "your-openai-api-key";
    expect(() => getOpenAIClient()).toThrow(AIConfigurationError);
  });
});

