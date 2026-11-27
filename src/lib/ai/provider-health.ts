/**
 * Sukoon AI — AI Provider Health & Circuit Breaker
 *
 * Tracks live availability, latencies, consecutive failures, and circuit-breaker states
 * across all configured AI providers (Gemini, OpenAI, NVIDIA NIM).
 */

import { ProviderHealthCheckResult } from "./providers/base.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { NVIDIAProvider } from "./providers/nvidia.provider";

export interface ProviderHealthState {
  provider: "gemini" | "openai" | "nvidia";
  status: "healthy" | "degraded" | "unconfigured" | "error";
  consecutiveFailures: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  lastLatencyMs?: number;
  circuitOpenUntil?: number;
  lastErrorMessage?: string;
}

const CIRCUIT_BREAKER_COOLDOWN_MS = 60_000; // 1 minute cooldown after consecutive failures
const FAILURE_THRESHOLD = 3;

class ProviderHealthMonitor {
  private states: Record<"gemini" | "openai" | "nvidia", ProviderHealthState> = {
    gemini: { provider: "gemini", status: "healthy", consecutiveFailures: 0 },
    openai: { provider: "openai", status: "healthy", consecutiveFailures: 0 },
    nvidia: { provider: "nvidia", status: "healthy", consecutiveFailures: 0 },
  };

  private providers = {
    gemini: new GeminiProvider(),
    openai: new OpenAIProvider(),
    nvidia: new NVIDIAProvider(),
  };

  public getProviderInstance(name: "gemini" | "openai" | "nvidia") {
    return this.providers[name];
  }

  public recordSuccess(provider: "gemini" | "openai" | "nvidia", latencyMs: number): void {
    const state = this.states[provider];
    state.status = "healthy";
    state.consecutiveFailures = 0;
    state.lastSuccessTime = Date.now();
    state.lastLatencyMs = latencyMs;
    state.circuitOpenUntil = undefined;
    state.lastErrorMessage = undefined;
  }

  public recordFailure(provider: "gemini" | "openai" | "nvidia", error: any): void {
    const state = this.states[provider];
    state.consecutiveFailures += 1;
    state.lastFailureTime = Date.now();
    state.lastErrorMessage = error?.message || String(error);

    const is429 = error?.status === 429 || error?.code === "RATE_LIMIT_EXCEEDED";

    if (state.consecutiveFailures >= FAILURE_THRESHOLD || is429) {
      state.status = is429 ? "degraded" : "error";
      state.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
    }
  }

  /**
   * Determines if a provider is eligible to handle requests without tripping.
   */
  public isHealthy(provider: "gemini" | "openai" | "nvidia"): boolean {
    const state = this.states[provider];
    if (!this.providers[provider].isConfigured()) {
      return false;
    }

    if (state.circuitOpenUntil && Date.now() < state.circuitOpenUntil) {
      return false; // Circuit breaker open; skip to fallback
    }

    return state.status !== "error";
  }

  public getHealthState(provider: "gemini" | "openai" | "nvidia"): ProviderHealthState {
    const configured = this.providers[provider].isConfigured();
    if (!configured) {
      return {
        ...this.states[provider],
        status: "unconfigured",
      };
    }
    return { ...this.states[provider] };
  }

  /**
   * Probes a specific provider and updates its health state.
   */
  public async probeProvider(provider: "gemini" | "openai" | "nvidia"): Promise<ProviderHealthCheckResult> {
    const inst = this.providers[provider];
    const result = await inst.checkHealth();

    if (result.status === "healthy") {
      this.recordSuccess(provider, result.latencyMs || 0);
    } else if (result.status === "error" || result.status === "degraded") {
      this.recordFailure(provider, new Error(result.message));
    }

    return result;
  }

  /**
   * Probes all registered providers simultaneously.
   */
  public async probeAll(): Promise<Record<"gemini" | "openai" | "nvidia", ProviderHealthCheckResult>> {
    const [geminiRes, openaiRes, nvidiaRes] = await Promise.all([
      this.probeProvider("gemini"),
      this.probeProvider("openai"),
      this.probeProvider("nvidia"),
    ]);

    return {
      gemini: geminiRes,
      openai: openaiRes,
      nvidia: nvidiaRes,
    };
  }

  /**
   * Resets health state for a provider (e.g. after admin credentials update).
   */
  public reset(provider?: "gemini" | "openai" | "nvidia"): void {
    if (provider) {
      this.states[provider] = { provider, status: "healthy", consecutiveFailures: 0 };
    } else {
      this.states = {
        gemini: { provider: "gemini", status: "healthy", consecutiveFailures: 0 },
        openai: { provider: "openai", status: "healthy", consecutiveFailures: 0 },
        nvidia: { provider: "nvidia", status: "healthy", consecutiveFailures: 0 },
      };
    }
  }
}

export const providerHealthMonitor = new ProviderHealthMonitor();

