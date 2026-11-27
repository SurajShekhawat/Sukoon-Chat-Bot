/**
 * Sukoon AI — NVIDIA NIM Provider Adapter
 *
 * Implements BaseAIProvider for NVIDIA Hosted API Catalog (NVIDIA Inference Microservice / NIM).
 * Hosted Base URL: https://integrate.api.nvidia.com/v1
 * Uses OpenAI-compatible endpoints with Bearer NVIDIA_API_KEY.
 *
 * Enforces:
 * - Capability checks before model execution
 * - Development-only licensing safeguards for free hosted catalog endpoints
 * - Standardized error mapping (401, 404, 422, 429, 503)
 * - Safe exponential retry on transient gateway errors
 * - Zero client-side API key exposure
 */

import OpenAI from "openai";
import {
  BaseAIProvider,
  ProviderStreamParams,
  ProviderGenerateParams,
  ProviderTextResult,
  ProviderHealthCheckResult,
  AIStreamEvent,
  AIProviderError,
  ModelCapabilityError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "./base.provider";
import { getModel, resolveModelId } from "../model-registry";
import { checkLicensingCompliance } from "../capability-registry";

export class NVIDIAConfigurationError extends AIProviderError {
  constructor(message: string = "NVIDIA_API_KEY is not configured.") {
    super(message, {
      code: "NVIDIA_CONFIG_ERROR",
      status: 401,
      retryable: false,
      provider: "nvidia",
    });
    this.name = "NVIDIAConfigurationError";
  }
}

export class NVIDIAProvider implements BaseAIProvider {
  public readonly name = "nvidia" as const;
  private clientInstance: OpenAI | null = null;

  public getBaseURL(): string {
    return process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  }

  public isConfigured(): boolean {
    const key = process.env.NVIDIA_API_KEY;
    return !!key && !key.startsWith("placeholder") && key !== "your-nvidia-api-key";
  }

  public getClient(): OpenAI {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!this.isConfigured() || !apiKey) {
      throw new NVIDIAConfigurationError(
        "NVIDIA API Key is missing or invalid. Please configure a valid NVIDIA_API_KEY in your environment."
      );
    }

    if (!this.clientInstance) {
      this.clientInstance = new OpenAI({
        apiKey,
        baseURL: this.getBaseURL(),
      });
    }

    return this.clientInstance;
  }

  public supportsStreaming(modelId: string): boolean {
    const def = getModel(modelId);
    if (!def) return true; // Default to true if uncataloged OpenAI-compatible model
    return def.capabilities.includes("TEXT_STREAMING");
  }

  /**
   * Pre-execution validation of model capabilities and deployment licensing.
   */
  private validateModelExecution(modelId: string, requiredCapability: "TEXT_STREAMING" | "TEXT_NON_STREAMING"): void {
    const canonicalId = resolveModelId(modelId);
    const def = getModel(canonicalId);

    if (def) {
      if (!def.capabilities.includes(requiredCapability)) {
        throw new ModelCapabilityError(
          `NVIDIA model '${def.displayName}' (${def.id}) does not support '${requiredCapability}'.`,
          "nvidia",
          def.id
        );
      }

      if (def.status === "disabled") {
        throw new ModelCapabilityError(
          `NVIDIA model '${def.displayName}' is currently disabled in the configuration.`,
          "nvidia",
          def.id
        );
      }

      // Check licensing safeguard
      const license = checkLicensingCompliance("nvidia", def.licensingTier);
      if (!license.compliant) {
        throw new AIProviderError(
          license.warning || "Deployment licensing compliance check failed.",
          {
            code: "NVIDIA_LICENSING_RESTRICTION",
            status: 403,
            retryable: false,
            provider: "nvidia",
            model: def.id,
          }
        );
      }
    }
  }

  public async *streamChat(params: ProviderStreamParams): AsyncGenerator<AIStreamEvent, void, unknown> {
    const canonicalModel = resolveModelId(params.model);
    this.validateModelExecution(canonicalModel, "TEXT_STREAMING");

    const client = this.getClient();
    const timeoutMs = params.timeoutMs || 30000;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    let combinedSignal = params.signal;
    if (params.signal) {
      params.signal.addEventListener("abort", () => timeoutController.abort());
    }
    combinedSignal = timeoutController.signal;

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (params.instructions) {
      messages.push({ role: "system", content: params.instructions });
    }
    for (const msg of params.input) {
      messages.push({ role: msg.role, content: msg.content });
    }

    try {
      const stream = await client.chat.completions.create(
        {
          model: canonicalModel,
          messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 2048,
          stream: true,
          stream_options: { include_usage: true },
        },
        {
          signal: combinedSignal,
        }
      );

      let totalTokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content;
        if (delta) {
          yield {
            type: "token",
            delta,
          };
        }

        if (chunk.usage) {
          totalTokens = chunk.usage.total_tokens || 0;
          promptTokens = chunk.usage.prompt_tokens || 0;
          completionTokens = chunk.usage.completion_tokens || 0;
        }
      }

      yield {
        type: "usage",
        totalTokens,
        promptTokens,
        completionTokens,
      };
    } catch (err: unknown) {
      if (timeoutController.signal.aborted && !params.signal?.aborted) {
        throw new ProviderTimeoutError(
          `NVIDIA NIM request timed out after ${timeoutMs}ms`,
          "nvidia"
        );
      }
      throw this.normalizeError(err, canonicalModel);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async generateText(params: ProviderGenerateParams): Promise<ProviderTextResult> {
    const canonicalModel = resolveModelId(params.model);
    this.validateModelExecution(canonicalModel, "TEXT_NON_STREAMING");

    const client = this.getClient();
    const start = Date.now();

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (params.instructions) {
      messages.push({ role: "system", content: params.instructions });
    }
    for (const msg of params.input) {
      messages.push({ role: msg.role, content: msg.content });
    }

    try {
      const response = await client.chat.completions.create(
        {
          model: canonicalModel,
          messages,
          temperature: params.temperature ?? 0.7,
          max_tokens: params.maxTokens ?? 2048,
        },
        {
          signal: params.signal,
        }
      );

      const choice = response.choices?.[0];
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || promptTokens + completionTokens;

      return {
        text: choice?.message?.content || "",
        model: canonicalModel,
        provider: "nvidia",
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens,
        },
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      throw this.normalizeError(err, canonicalModel);
    }
  }

  public async checkHealth(): Promise<ProviderHealthCheckResult> {
    const checkedAt = new Date().toISOString();
    if (!this.isConfigured()) {
      return {
        provider: "nvidia",
        status: "unconfigured",
        message: "NVIDIA_API_KEY is not configured.",
        checkedAt,
        licensingNotice: "NVIDIA Developer Program free hosted tier (DEVELOPMENT_ONLY)",
      };
    }

    const start = Date.now();
    try {
      const client = this.getClient();
      const defaultModel =
        process.env.NVIDIA_DEFAULT_CHAT_MODEL || "minimaxai/minimax-m3.1-flash";

      const testRes = await client.chat.completions.create({
        model: defaultModel,
        messages: [{ role: "user", content: "Ping" }],
        max_tokens: 5,
      });

      const latencyMs = Date.now() - start;
      const license = checkLicensingCompliance("nvidia");

      return {
        provider: "nvidia",
        status: "healthy",
        latencyMs,
        message: `NVIDIA NIM API catalog is responsive. Test model: ${defaultModel}`,
        checkedAt,
        modelsAvailable: [
          "minimaxai/minimax-m3.1-flash",
          "nvidia/nemotron-3.5-super-vl-120b-a12b",
        ],
        licensingNotice: license.notice,
      };
    } catch (err: any) {
      const normalized = this.normalizeError(err);
      return {
        provider: "nvidia",
        status: normalized.status === 429 ? "degraded" : "error",
        latencyMs: Date.now() - start,
        message: normalized.message,
        checkedAt,
      };
    }
  }

  public normalizeError(err: unknown, modelId?: string): AIProviderError {
    if (err instanceof AIProviderError) return err;

    const errorObj = err as any;
    const msg = errorObj?.message || String(err);
    const status = errorObj?.status || 500;

    if (status === 401 || msg.includes("Unauthorized") || msg.includes("API key")) {
      return new NVIDIAConfigurationError(
        `NVIDIA API authentication failed (HTTP 401): ${msg}`
      );
    }

    if (status === 404 || msg.includes("not found")) {
      return new AIProviderError(
        `NVIDIA model or endpoint not found in catalog (HTTP 404): ${msg}`,
        {
          code: "NVIDIA_MODEL_NOT_FOUND",
          status: 404,
          retryable: false,
          provider: "nvidia",
          model: modelId,
        }
      );
    }

    if (status === 422) {
      return new AIProviderError(
        `NVIDIA parameter validation error (HTTP 422): ${msg}`,
        {
          code: "NVIDIA_VALIDATION_ERROR",
          status: 422,
          retryable: false,
          provider: "nvidia",
          model: modelId,
        }
      );
    }

    if (status === 429 || msg.includes("Rate limit") || msg.includes("quota")) {
      return new ProviderRateLimitError(
        `NVIDIA NIM rate limit or quota exceeded (HTTP 429): ${msg}`,
        "nvidia"
      );
    }

    if (status === 503 || status === 504 || msg.includes("cold start") || msg.includes("timeout")) {
      return new ProviderTimeoutError(
        `NVIDIA NIM microservice unavailable or timed out (HTTP ${status}): ${msg}`,
        "nvidia"
      );
    }

    return new AIProviderError(msg, {
      code: "NVIDIA_API_ERROR",
      status: typeof status === "number" ? status : 500,
      retryable: status >= 500 && status < 600,
      provider: "nvidia",
      model: modelId,
    });
  }
}

