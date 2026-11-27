/**
 * Sukoon AI — OpenAI Provider Adapter
 *
 * Implements BaseAIProvider using the official openai SDK.
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
  ProviderRateLimitError,
  ProviderTimeoutError,
} from "./base.provider";
import { getOpenAIClient, streamOpenAIResponse } from "../openai";
import { getModel } from "../model-registry";

export class OpenAIProvider implements BaseAIProvider {
  public readonly name = "openai" as const;

  public isConfigured(): boolean {
    const key = process.env.OPENAI_API_KEY;
    return !!key && key.startsWith("sk-") && !key.startsWith("sk-proj-placeholder");
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
      const responseStream = await streamOpenAIResponse({
        model: params.model,
        instructions: params.instructions,
        input: params.input,
        signal: combinedSignal,
      });

      let totalTokens = 0;
      for await (const event of responseStream) {
        if (event.type === "response.output_text.delta" && event.delta) {
          yield {
            type: "token",
            delta: event.delta,
          };
        } else if (event.type === "response.completed" && event.response?.usage) {
          totalTokens = event.response.usage.total_tokens || 0;
        }
      }

      yield {
        type: "usage",
        totalTokens,
      };
    } catch (err: unknown) {
      if (timeoutController.signal.aborted && !params.signal?.aborted) {
        throw new ProviderTimeoutError(
          `OpenAI request timed out after ${timeoutMs}ms`,
          "openai"
        );
      }
      throw this.normalizeError(err, params.model);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async generateText(params: ProviderGenerateParams): Promise<ProviderTextResult> {
    const start = Date.now();
    const client = getOpenAIClient();

    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    if (params.instructions) {
      messages.push({ role: "system", content: params.instructions });
    }
    for (const msg of params.input) {
      messages.push({ role: msg.role, content: msg.content });
    }

    try {
      const response = await client.chat.completions.create({
        model: params.model,
        messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }, {
        signal: params.signal,
      });

      const choice = response.choices[0];
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;
      const totalTokens = response.usage?.total_tokens || promptTokens + completionTokens;

      return {
        text: choice?.message?.content || "",
        model: params.model,
        provider: "openai",
        tokensUsed: {
          promptTokens,
          completionTokens,
          totalTokens,
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
        provider: "openai",
        status: "unconfigured",
        message: "OPENAI_API_KEY is not configured.",
        checkedAt,
      };
    }

    const start = Date.now();
    try {
      const client = getOpenAIClient();
      await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [{ role: "user", content: "Ping" }],
        max_tokens: 5,
      });

      return {
        provider: "openai",
        status: "healthy",
        latencyMs: Date.now() - start,
        message: "OpenAI API is responsive.",
        checkedAt,
        modelsAvailable: ["gpt-4o-mini", "gpt-4o"],
      };
    } catch (err: any) {
      const normalized = this.normalizeError(err);
      return {
        provider: "openai",
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

    if (
      status === 429 ||
      errorObj?.code === "insufficient_quota" ||
      msg.includes("insufficient_quota") ||
      msg.includes("credit_balance_exhausted")
    ) {
      return new ProviderRateLimitError(
        `OpenAI quota or rate limit exceeded: ${msg}`,
        "openai"
      );
    }

    if (errorObj?.name === "AbortError" || msg.toLowerCase().includes("timeout")) {
      return new ProviderTimeoutError(
        `OpenAI connection timed out: ${msg}`,
        "openai"
      );
    }

    return new AIProviderError(msg, {
      code: errorObj?.code || "OPENAI_API_ERROR",
      status: typeof status === "number" ? status : 500,
      retryable: status >= 500 && status < 600,
      provider: "openai",
      model: modelId,
    });
  }
}

