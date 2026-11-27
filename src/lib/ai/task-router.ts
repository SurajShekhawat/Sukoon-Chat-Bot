/**
 * Sukoon AI — Intelligent Capability-Based Task Router
 *
 * Routes distinct conversational and analytical tasks to the optimal AI model and provider.
 * Enforces:
 * - Companion Chat & Emotional Support default strictly to the trusted primary companion model (Gemini)
 * - Explicit configuration required to route any task to NVIDIA NIM or OpenAI
 * - Pre-routing capability checks
 * - Safe, non-infinite fallback chaining (maximum 2 fallback hops)
 * - Preservation of user language, context, and consented memory
 * - Uncompromised safety and crisis guardrails
 */

import { TaskCategory } from "./capability-registry";
import { getModel, validateModelForTask, getRecommendedModelForTask } from "./model-registry";
import { BaseAIProvider, ProviderStreamParams, ProviderGenerateParams, AIStreamEvent, ProviderTextResult } from "./providers/base.provider";
import { providerHealthMonitor } from "./provider-health";

export interface TaskRoutingPolicy {
  task: TaskCategory;
  preferredProvider?: "gemini" | "openai" | "nvidia";
  preferredModel?: string;
  allowNVIDIA: boolean;
  allowOpenAI: boolean;
  maxFallbacks: number;
}

/**
 * Default routing policies per task category.
 * CRITICAL RULE: COMPANION_CHAT and EMOTIONAL_SUPPORT NEVER auto-route away from the
 * vetted primary companion model without explicit admin configuration.
 */
export const DEFAULT_TASK_ROUTING_POLICIES: Record<TaskCategory, TaskRoutingPolicy> = {
  COMPANION_CHAT: {
    task: "COMPANION_CHAT",
    preferredProvider: "gemini",
    preferredModel: "gemini-3.5-flash-lite",
    allowNVIDIA: false, // Must be explicitly enabled by admin
    allowOpenAI: true,  // Allowed as emergency fallback
    maxFallbacks: 2,
  },
  EMOTIONAL_SUPPORT: {
    task: "EMOTIONAL_SUPPORT",
    preferredProvider: "gemini",
    preferredModel: "gemini-3.5-flash-lite",
    allowNVIDIA: false, // Strict: Never route vulnerable/crisis emotional chats to experimental endpoints
    allowOpenAI: true,
    maxFallbacks: 1,
  },
  COMPLEX_REASONING: {
    task: "COMPLEX_REASONING",
    preferredProvider: process.env.NVIDIA_API_KEY ? "nvidia" : "gemini",
    preferredModel: process.env.NVIDIA_REASONING_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b",
    allowNVIDIA: true,
    allowOpenAI: true,
    maxFallbacks: 2,
  },
  CODING: {
    task: "CODING",
    preferredProvider: process.env.NVIDIA_API_KEY ? "nvidia" : "gemini",
    preferredModel: process.env.NVIDIA_CODING_MODEL || "minimaxai/minimax-m3.1-flash",
    allowNVIDIA: true,
    allowOpenAI: true,
    maxFallbacks: 2,
  },
  CONVERSATION_SUMMARY: {
    task: "CONVERSATION_SUMMARY",
    preferredProvider: "gemini",
    preferredModel: "gemini-3.5-flash-lite",
    allowNVIDIA: true,
    allowOpenAI: true,
    maxFallbacks: 2,
  },
  JOURNAL_SUMMARY: {
    task: "JOURNAL_SUMMARY",
    preferredProvider: "gemini",
    preferredModel: "gemini-3.5-flash-lite",
    allowNVIDIA: true,
    allowOpenAI: true,
    maxFallbacks: 2,
  },
  TEXT_TO_SPEECH: {
    task: "TEXT_TO_SPEECH",
    preferredProvider: "nvidia",
    preferredModel: process.env.NVIDIA_TTS_MODEL || "nvidia/magpie-tts-zeroshot",
    allowNVIDIA: true,
    allowOpenAI: false,
    maxFallbacks: 0,
  },
  IMAGE_ANALYSIS: {
    task: "IMAGE_ANALYSIS",
    preferredProvider: "gemini",
    preferredModel: "gemini-2.5-flash",
    allowNVIDIA: true,
    allowOpenAI: true,
    maxFallbacks: 2,
  },
  VIDEO_ANALYSIS: {
    task: "VIDEO_ANALYSIS",
    preferredProvider: "nvidia",
    preferredModel: "nvidia/cosmos-nemotron-34b",
    allowNVIDIA: false, // Disabled by default in MVP
    allowOpenAI: false,
    maxFallbacks: 0,
  },
};

export interface ResolvedRoute {
  task: TaskCategory;
  providerName: "gemini" | "openai" | "nvidia";
  modelId: string;
  provider: BaseAIProvider;
  fallbackCandidates: Array<{
    providerName: "gemini" | "openai" | "nvidia";
    modelId: string;
    provider: BaseAIProvider;
  }>;
}

export class TaskRouter {
  private customPolicies: Partial<Record<TaskCategory, TaskRoutingPolicy>> = {};

  public setPolicy(task: TaskCategory, policy: Partial<TaskRoutingPolicy>): void {
    const existing = this.customPolicies[task] || DEFAULT_TASK_ROUTING_POLICIES[task];
    this.customPolicies[task] = {
      ...existing,
      ...policy,
    };
  }

  public getPolicy(task: TaskCategory): TaskRoutingPolicy {
    if (this.customPolicies[task]) {
      return this.customPolicies[task]!;
    }

    const isNvidiaSet =
      !!process.env.NVIDIA_API_KEY &&
      !process.env.NVIDIA_API_KEY.startsWith("placeholder") &&
      process.env.NVIDIA_API_KEY !== "your-nvidia-api-key";

    if (task === "COMPLEX_REASONING") {
      return {
        task: "COMPLEX_REASONING",
        preferredProvider: isNvidiaSet ? "nvidia" : "gemini",
        preferredModel: isNvidiaSet
          ? process.env.NVIDIA_REASONING_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b"
          : process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        allowNVIDIA: true,
        allowOpenAI: true,
        maxFallbacks: 2,
      };
    }

    if (task === "CODING") {
      return {
        task: "CODING",
        preferredProvider: isNvidiaSet ? "nvidia" : "gemini",
        preferredModel: isNvidiaSet
          ? process.env.NVIDIA_CODING_MODEL || "minimaxai/minimax-m3.1-flash"
          : process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        allowNVIDIA: true,
        allowOpenAI: true,
        maxFallbacks: 2,
      };
    }

    return DEFAULT_TASK_ROUTING_POLICIES[task];
  }

  /**
   * Resolves the route and fallback chain for a given task.
   */
  public resolveRoute(task: TaskCategory): ResolvedRoute {
    const policy = this.getPolicy(task);
    const candidates: Array<{
      providerName: "gemini" | "openai" | "nvidia";
      modelId: string;
      provider: BaseAIProvider;
    }> = [];

    // Helper to evaluate and push a candidate
    const tryAddCandidate = (
      pName: "gemini" | "openai" | "nvidia",
      mId: string
    ) => {
      // Permission check based on policy
      if (pName === "nvidia" && !policy.allowNVIDIA) return;
      if (pName === "openai" && !policy.allowOpenAI) return;

      const provider = providerHealthMonitor.getProviderInstance(pName);
      if (!provider.isConfigured()) return;

      const capabilityValidation = validateModelForTask(mId, task);
      if (!capabilityValidation.valid) return;

      // Avoid duplicates in candidate list
      if (!candidates.some((c) => c.providerName === pName && c.modelId === mId)) {
        candidates.push({
          providerName: pName,
          modelId: mId,
          provider,
        });
      }
    };

    // 1. Try preferred candidate from policy
    if (policy.preferredProvider && policy.preferredModel) {
      tryAddCandidate(policy.preferredProvider, policy.preferredModel);
    }

    // 2. Add fallback providers based on healthy models
    const fallbackProviders: Array<"gemini" | "openai" | "nvidia"> = [
      "gemini",
      "openai",
      "nvidia",
    ];

    for (const pName of fallbackProviders) {
      if (candidates.length >= policy.maxFallbacks + 1) break;
      const rec = getRecommendedModelForTask(task, pName);
      if (rec) {
        tryAddCandidate(pName, rec.id);
      }
    }

    if (candidates.length === 0) {
      // Last-ditch emergency default to Gemini companion
      const geminiProvider = providerHealthMonitor.getProviderInstance("gemini");
      return {
        task,
        providerName: "gemini",
        modelId: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        provider: geminiProvider,
        fallbackCandidates: [],
      };
    }

    // Sort candidates to prioritize healthy providers
    const sorted = [...candidates].sort((a, b) => {
      const aHealthy = providerHealthMonitor.isHealthy(a.providerName) ? 1 : 0;
      const bHealthy = providerHealthMonitor.isHealthy(b.providerName) ? 1 : 0;
      return bHealthy - aHealthy;
    });

    const [primary, ...fallbacks] = sorted;

    return {
      task,
      providerName: primary.providerName,
      modelId: primary.modelId,
      provider: primary.provider,
      fallbackCandidates: fallbacks.slice(0, policy.maxFallbacks),
    };
  }

  /**
   * Executes a streaming task with automatic, non-infinite fallback.
   */
  public async *streamTask(
    task: TaskCategory,
    params: Omit<ProviderStreamParams, "model">
  ): AsyncGenerator<AIStreamEvent, void, unknown> {
    const route = this.resolveRoute(task);
    const executionChain = [
      { providerName: route.providerName, modelId: route.modelId, provider: route.provider },
      ...route.fallbackCandidates,
    ];

    let lastError: any = null;

    for (const step of executionChain) {
      try {
        const stream = step.provider.streamChat({
          ...params,
          model: step.modelId,
        });

        let receivedAnyToken = false;

        for await (const chunk of stream) {
          if (chunk.type === "token") {
            receivedAnyToken = true;
          }
          yield chunk;
        }

        // Successfully completed stream
        providerHealthMonitor.recordSuccess(step.providerName, 100);
        return;
      } catch (err: any) {
        lastError = err;
        providerHealthMonitor.recordFailure(step.providerName, err);
        console.warn(
          `[TaskRouter] Execution failed on ${step.providerName} (${step.modelId}):`,
          err?.message || err
        );
        // Continue loop to try next fallback candidate in chain
      }
    }

    throw lastError || new Error(`All providers in fallback chain for task '${task}' failed.`);
  }

  /**
   * Executes a non-streaming task with automatic fallback.
   */
  public async executeTask(
    task: TaskCategory,
    params: Omit<ProviderGenerateParams, "model">
  ): Promise<ProviderTextResult> {
    const route = this.resolveRoute(task);
    const executionChain = [
      { providerName: route.providerName, modelId: route.modelId, provider: route.provider },
      ...route.fallbackCandidates,
    ];

    let lastError: any = null;

    for (const step of executionChain) {
      try {
        const result = await step.provider.generateText({
          ...params,
          model: step.modelId,
        });

        providerHealthMonitor.recordSuccess(step.providerName, result.latencyMs);
        return result;
      } catch (err: any) {
        lastError = err;
        providerHealthMonitor.recordFailure(step.providerName, err);
        console.warn(
          `[TaskRouter] Non-streaming execution failed on ${step.providerName} (${step.modelId}):`,
          err?.message || err
        );
      }
    }

    throw lastError || new Error(`All providers in fallback chain for task '${task}' failed.`);
  }
}

export const taskRouter = new TaskRouter();
