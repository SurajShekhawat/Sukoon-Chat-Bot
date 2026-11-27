/**
 * Sukoon AI — AI Provider Abstraction Layer
 *
 * Provides a unified streaming and generation interface across Google Gemini, OpenAI, and NVIDIA NIM.
 * Integrates modular provider adapters, model capability validation, and intelligent task routing.
 */

import { BaseAIProvider, AIStreamEvent, ProviderStreamParams } from "./providers/base.provider";
import { GeminiProvider } from "./providers/gemini.provider";
import { OpenAIProvider } from "./providers/openai.provider";
import { NVIDIAProvider } from "./providers/nvidia.provider";
import { providerHealthMonitor } from "./provider-health";
import { taskRouter } from "./task-router";
import { TaskCategory } from "./capability-registry";

export type AIProviderName = "gemini" | "openai" | "nvidia";
export type { AIStreamEvent } from "./providers/base.provider";

export interface AIStreamingParams {
  model?: string;
  instructions: string;
  input: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  signal?: AbortSignal;
  task?: TaskCategory;
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
}

const geminiProvider = new GeminiProvider();
const openAiProvider = new OpenAIProvider();
const nvidiaProvider = new NVIDIAProvider();

export function getProviderInstance(name: AIProviderName): BaseAIProvider {
  switch (name) {
    case "gemini":
      return geminiProvider;
    case "openai":
      return openAiProvider;
    case "nvidia":
      return nvidiaProvider;
    default:
      return geminiProvider;
  }
}

/**
 * Resolves the currently active primary AI provider based on environment variables.
 * Default is 'gemini' when GEMINI_API_KEY is present or AI_PROVIDER=gemini.
 */
export function getActiveAIProvider(): AIProviderName {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "openai") return "openai";
  if (explicit === "nvidia") return "nvidia";
  if (explicit === "gemini") return "gemini";

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey && !geminiKey.startsWith("placeholder") && geminiKey !== "your-gemini-api-key") {
    return "gemini";
  }

  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey && !nvidiaKey.startsWith("placeholder") && nvidiaKey !== "your-nvidia-api-key") {
    return "nvidia";
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey.startsWith("sk-") && !openAiKey.startsWith("sk-proj-placeholder")) {
    return "openai";
  }

  return "gemini";
}

/**
 * Returns the active default model identifier being used for inference.
 */
export function getActiveAIModel(): string {
  const provider = getActiveAIProvider();
  if (provider === "gemini") {
    return process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  }
  if (provider === "nvidia") {
    return process.env.NVIDIA_DEFAULT_CHAT_MODEL || "minimaxai/minimax-m3.1-flash";
  }
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

/**
 * Unified streaming generator across Google Gemini, OpenAI, and NVIDIA NIM with multi-tier fallback.
 * Uses taskRouter to preserve routing policies and prevent infinite fallback loops.
 */
export async function* streamAI(
  params: AIStreamingParams
): AsyncGenerator<AIStreamEvent, void, unknown> {
  const task: TaskCategory = params.task || "COMPANION_CHAT";

  // If a specific model is explicitly requested without a task override, stream directly with fallback
  if (params.model) {
    const primary = getActiveAIProvider();
    const primaryInst = getProviderInstance(primary);

    try {
      yield* primaryInst.streamChat({
        model: params.model,
        instructions: params.instructions,
        input: params.input,
        signal: params.signal,
        timeoutMs: params.timeoutMs,
        temperature: params.temperature,
        maxTokens: params.maxTokens,
      });
      return;
    } catch (primaryErr: any) {
      console.warn(`[streamAI] Primary provider '${primary}' failed; checking fallbacks:`, primaryErr?.message);

      // Attempt fallback providers if configured
      const fallbackProviders: AIProviderName[] = ["gemini", "nvidia", "openai"].filter(
        (p) => p !== primary
      ) as AIProviderName[];

      for (const fbName of fallbackProviders) {
        const fbInst = getProviderInstance(fbName);
        if (fbInst.isConfigured() && providerHealthMonitor.isHealthy(fbName)) {
          try {
            console.log(`[streamAI] Activating fallback provider '${fbName}'`);
            const fallbackModel =
              fbName === "gemini"
                ? process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
                : fbName === "nvidia"
                ? process.env.NVIDIA_DEFAULT_CHAT_MODEL || "minimaxai/minimax-m3.1-flash"
                : process.env.OPENAI_MODEL || "gpt-4o-mini";

            yield* fbInst.streamChat({
              model: fallbackModel,
              instructions: params.instructions,
              input: params.input,
              signal: params.signal,
              timeoutMs: params.timeoutMs,
              temperature: params.temperature,
              maxTokens: params.maxTokens,
            });
            return;
          } catch (fbErr: any) {
            console.warn(`[streamAI] Fallback provider '${fbName}' also failed:`, fbErr?.message);
          }
        }
      }

      throw primaryErr;
    }
  }

  // Capability-based task routing with intelligent fallback
  yield* taskRouter.streamTask(task, {
    instructions: params.instructions,
    input: params.input,
    signal: params.signal,
    timeoutMs: params.timeoutMs,
    temperature: params.temperature,
    maxTokens: params.maxTokens,
  });
}
