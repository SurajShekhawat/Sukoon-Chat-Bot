import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  NVIDIAProvider,
  NVIDIAConfigurationError,
} from "@/lib/ai/providers/nvidia.provider";
import {
  ModelCapabilityError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  AIProviderError,
} from "@/lib/ai/providers/base.provider";

// Mock the OpenAI client constructor
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation((config) => {
      return {
        baseURL: config.baseURL,
        apiKey: config.apiKey,
        chat: {
          completions: {
            create: vi.fn(),
          },
        },
      };
    }),
  };
});

describe("NVIDIA NIM Provider Adapter", () => {
  const originalEnv = { ...process.env };
  let provider: NVIDIAProvider;

  beforeEach(() => {
    process.env = { ...originalEnv };
    provider = new NVIDIAProvider();
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("checks configuration correctly", () => {
    delete process.env.NVIDIA_API_KEY;
    expect(provider.isConfigured()).toBe(false);

    process.env.NVIDIA_API_KEY = "placeholder";
    expect(provider.isConfigured()).toBe(false);

    process.env.NVIDIA_API_KEY = "nvapi-test-valid-key";
    expect(provider.isConfigured()).toBe(true);
    expect(provider.getBaseURL()).toBe("https://integrate.api.nvidia.com/v1");
  });

  it("throws NVIDIAConfigurationError when API key is missing", () => {
    delete process.env.NVIDIA_API_KEY;
    expect(() => provider.getClient()).toThrow(NVIDIAConfigurationError);

    try {
      provider.getClient();
    } catch (err: any) {
      expect(err.code).toBe("NVIDIA_CONFIG_ERROR");
      expect(err.status).toBe(401);
      expect(err.provider).toBe("nvidia");
    }
  });

  it("rejects streaming execution for models without TEXT_STREAMING capability", async () => {
    process.env.NVIDIA_API_KEY = "nvapi-test";
    const generator = provider.streamChat({
      model: "nvidia/magpie-tts-zeroshot",
      instructions: "test",
      input: [{ role: "user", content: "hello" }],
    });

    await expect(async () => {
      for await (const _ of generator) {
        // should not execute
      }
    }).rejects.toThrow(ModelCapabilityError);
  });

  it("rejects execution of disabled models", async () => {
    process.env.NVIDIA_API_KEY = "nvapi-test";
    const generator = provider.streamChat({
      model: "nvidia/cosmos-nemotron-34b",
      instructions: "test",
      input: [{ role: "user", content: "hello" }],
    });

    await expect(async () => {
      for await (const _ of generator) {
        // should not execute
      }
    }).rejects.toThrow(ModelCapabilityError);
  });

  it("enforces licensing safeguard in production mode", async () => {
    process.env.NVIDIA_API_KEY = "nvapi-test";
    process.env.NVIDIA_DEPLOYMENT_MODE = "production";

    const generator = provider.streamChat({
      model: "minimaxai/minimax-m3.1-flash",
      instructions: "test",
      input: [{ role: "user", content: "hello" }],
    });

    await expect(async () => {
      for await (const _ of generator) {
        // should not execute
      }
    }).rejects.toThrow(AIProviderError);
  });

  it("normalizes provider errors into standard AIProviderError hierarchy", () => {
    // 401 Unauthorized
    const err401 = provider.normalizeError({ status: 401, message: "Unauthorized API key" });
    expect(err401).toBeInstanceOf(NVIDIAConfigurationError);

    // 404 Model Not Found
    const err404 = provider.normalizeError({ status: 404, message: "Model not found" });
    expect(err404.code).toBe("NVIDIA_MODEL_NOT_FOUND");
    expect(err404.status).toBe(404);

    // 422 Validation Error
    const err422 = provider.normalizeError({ status: 422, message: "Temperature out of bounds" });
    expect(err422.code).toBe("NVIDIA_VALIDATION_ERROR");
    expect(err422.status).toBe(422);

    // 429 Rate Limit
    const err429 = provider.normalizeError({ status: 429, message: "Rate limit exceeded" });
    expect(err429).toBeInstanceOf(ProviderRateLimitError);
    expect(err429.status).toBe(429);
    expect(err429.retryable).toBe(true);

    // 503 / 504 Timeout
    const err503 = provider.normalizeError({ status: 503, message: "Service Unavailable / cold start" });
    expect(err503).toBeInstanceOf(ProviderTimeoutError);
    expect(err503.status).toBe(504);
  });

  it("streams tokens and captures usage metadata in mocked environment", async () => {
    process.env.NVIDIA_API_KEY = "nvapi-test";
    process.env.NVIDIA_DEPLOYMENT_MODE = "development";

    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: "Namaste" } }] };
      yield { choices: [{ delta: { content: " from" } }] };
      yield {
        choices: [{ delta: { content: " NVIDIA!" } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      };
    })();

    const client = provider.getClient();
    vi.mocked(client.chat.completions.create).mockResolvedValue(mockStream as any);

    const stream = provider.streamChat({
      model: "minimaxai/minimax-m3.1-flash",
      instructions: "You are a helpful assistant.",
      input: [{ role: "user", content: "Hi" }],
    });

    const receivedChunks: string[] = [];
    let usageEventFound = false;

    for await (const event of stream) {
      if (event.type === "token") {
        receivedChunks.push(event.delta);
      } else if (event.type === "usage") {
        usageEventFound = true;
        expect(event.totalTokens).toBe(15);
      }
    }

    expect(receivedChunks.join("")).toBe("Namaste from NVIDIA!");
    expect(usageEventFound).toBe(true);
  });
});

