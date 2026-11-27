/**
 * Sukoon AI — Google Gemini Provider Adapter
 *
 * Implements BaseAIProvider using the official @google/genai SDK.
 */

import { GoogleGenAI } from "@google/genai";
import {
  BaseAIProvider,
  ProviderStreamParams,
  ProviderGenerateParams,
  ProviderTextResult,
  ProviderHealthCheckResult,
  AIStreamEvent,
  AIProviderError,
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "./base.provider";
import { getGeminiClient, streamGeminiResponse } from "../gemini";
import { getModel } from "../model-registry";

export class GeminiProvider implements BaseAIProvider {
  public readonly name = "gemini" as const;

  public isConfigured(): boolean {
    const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    return !!key && !key.startsWith("placeholder") && key !== "your-gemini-api-key";
  }

  public supportsStreaming(modelId: string): boolean {
    const def = getModel(modelId);
    return def ? def.capabilities.includes("TEXT_STREAMING") : true;
  }

  public async *streamChat(params: ProviderStreamParams): AsyncGenerator<AIStreamEvent, void, unknown> {
    const timeoutMs = params.timeoutMs || 25000;
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

    let combinedSignal = params.signal;
    if (params.signal) {
      params.signal.addEventListener("abort", () => timeoutController.abort());
    }
    combinedSignal = timeoutController.signal;

    try {
      yield* streamGeminiResponse({
        model: params.model,
        instructions: params.instructions,
        input: params.input,
        signal: combinedSignal,
      });
    } catch (err: unknown) {
      if (timeoutController.signal.aborted && !params.signal?.aborted) {
        throw new ProviderTimeoutError(
          `Gemini request timed out after ${timeoutMs}ms`,
          "gemini"
        );
      }
      throw this.normalizeError(err, params.model);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async generateText(params: ProviderGenerateParams): Promise<ProviderTextResult> {
    const start = Date.now();
    const ai = getGeminiClient();

    const contents = params.input
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: msg.content }],
      }));

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Hello" }] });
    }

    try {
      const response = await ai.models.generateContent({
        model: params.model,
        contents,
        config: {
          systemInstruction: params.instructions,
          abortSignal: params.signal,
          temperature: params.temperature,
          maxOutputTokens: params.maxTokens,
        },
      });

      const totalTokens = response.usageMetadata?.totalTokenCount || 0;
      const promptTokens = response.usageMetadata?.promptTokenCount || 0;
      const completionTokens = response.usageMetadata?.candidatesTokenCount || 0;

      return {
        text: response.text || "",
        model: params.model,
        provider: "gemini",
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens: totalTokens || promptTokens + completionTokens,
        },
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      throw this.normalizeError(err, params.model);
    }
  }

  public async checkHealth(): Promise<ProviderHealthCheckResult> {
    const checkedAt = new Date().toISOString();
    if (!this.isConfigured()) {
      return {
        provider: "gemini",
        status: "unconfigured",
        message: "GEMINI_API_KEY is not configured.",
        checkedAt,
      };
    }

    const start = Date.now();
    try {
      const ai = getGeminiClient();
      await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
        contents: "Ping",
      });

      return {
        provider: "gemini",
        status: "healthy",
        latencyMs: Date.now() - start,
        message: "Gemini API is responsive and healthy.",
        checkedAt,
        modelsAvailable: ["gemini-3.5-flash-lite", "gemini-2.5-flash"],
      };
    } catch (err: any) {
      const normalized = this.normalizeError(err);
      return {
        provider: "gemini",
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
    const status = errorObj?.status || errorObj?.code || 500;

    if (status === 429 || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return new ProviderRateLimitError(
        `Gemini rate limit or quota exceeded: ${msg}`,
        "gemini"
      );
    }

    if (errorObj?.name === "AbortError" || msg.toLowerCase().includes("timeout")) {
      return new ProviderTimeoutError(
        `Gemini connection timed out: ${msg}`,
        "gemini"
      );
    }

    return new AIProviderError(msg, {
      code: "GEMINI_API_ERROR",
      status: typeof status === "number" ? status : 500,
      retryable: status >= 500 && status < 600,
      provider: "gemini",
      model: modelId,
    });
  }
}

