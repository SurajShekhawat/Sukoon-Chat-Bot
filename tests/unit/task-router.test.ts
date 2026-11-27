import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { taskRouter } from "@/lib/ai/task-router";
import { providerHealthMonitor } from "@/lib/ai/provider-health";

describe("Intelligent Task Router & Policy Enforcement", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    providerHealthMonitor.reset();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults COMPANION_CHAT and EMOTIONAL_SUPPORT strictly to Gemini companion", () => {
    const chatRoute = taskRouter.resolveRoute("COMPANION_CHAT");
    expect(chatRoute.task).toBe("COMPANION_CHAT");
    expect(chatRoute.providerName).toBe("gemini");
    expect(chatRoute.modelId).toBe("gemini-3.5-flash-lite");

    const emotionRoute = taskRouter.resolveRoute("EMOTIONAL_SUPPORT");
    expect(emotionRoute.task).toBe("EMOTIONAL_SUPPORT");
    expect(emotionRoute.providerName).toBe("gemini");
    expect(emotionRoute.modelId).toBe("gemini-3.5-flash-lite");
  });

  it("prohibits routing emotional support conversations to unvetted models by default", () => {
    const policy = taskRouter.getPolicy("EMOTIONAL_SUPPORT");
    expect(policy.allowNVIDIA).toBe(false);
  });

  it("routes CODING to NVIDIA MiniMax when configured", () => {
    process.env.NVIDIA_API_KEY = "nvapi-test";
    const codingRoute = taskRouter.resolveRoute("CODING");

    expect(codingRoute.task).toBe("CODING");
    expect(codingRoute.providerName).toBe("nvidia");
    expect(codingRoute.modelId).toBe("minimaxai/minimax-m3.1-flash");
  });

  it("routes COMPLEX_REASONING to NVIDIA Nemotron when configured", () => {
    process.env.NVIDIA_API_KEY = "nvapi-test";
    const reasoningRoute = taskRouter.resolveRoute("COMPLEX_REASONING");

    expect(reasoningRoute.task).toBe("COMPLEX_REASONING");
    expect(reasoningRoute.providerName).toBe("nvidia");
    expect(reasoningRoute.modelId).toBe("nvidia/nemotron-3.5-super-vl-120b-a12b");
  });

  it("automatically falls back when circuit breaker trips on primary provider", () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.NVIDIA_API_KEY = "nvapi-test";

    // Simulate 3 failures on NVIDIA to trip circuit breaker
    providerHealthMonitor.recordFailure("nvidia", new Error("Simulated 429 rate limit"));
    providerHealthMonitor.recordFailure("nvidia", new Error("Simulated 429 rate limit"));
    providerHealthMonitor.recordFailure("nvidia", new Error("Simulated 429 rate limit"));

    expect(providerHealthMonitor.isHealthy("nvidia")).toBe(false);

    // Route CODING: since NVIDIA circuit is open, it should route to healthy fallback (Gemini)
    const codingRoute = taskRouter.resolveRoute("CODING");
    expect(codingRoute.providerName).toBe("gemini");
  });

  it("supports custom policy configuration with capability checks", () => {
    taskRouter.setPolicy("CONVERSATION_SUMMARY", {
      preferredProvider: "gemini",
      preferredModel: "gemini-3.5-flash-lite",
    });

    const summaryRoute = taskRouter.resolveRoute("CONVERSATION_SUMMARY");
    expect(summaryRoute.providerName).toBe("gemini");
  });
});
