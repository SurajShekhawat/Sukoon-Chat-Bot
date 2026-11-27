/**
 * Sukoon AI — Base AI Provider Contract
 *
 * Defines the shared abstract interface for all AI provider adapters (Gemini, OpenAI, NVIDIA NIM).
 * Standardizes streaming chat, text generation, error normalization, retry policies, and health probing.
 */

export interface AIStreamTokenEvent {
  type: "token";
  delta: string;
}

export interface AIStreamUsageEvent {
  type: "usage";
  totalTokens: number;
  promptTokens?: number;
  completionTokens?: number;
}

export type AIStreamEvent = AIStreamTokenEvent | AIStreamUsageEvent;

export interface ProviderMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ProviderStreamParams {
  model: string;
  instructions: string;
  input: ProviderMessage[];
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ProviderGenerateParams {
  model: string;
  instructions?: string;
  input: ProviderMessage[];
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}

export interface ProviderTextResult {
  text: string;
  model: string;
  provider: "gemini" | "openai" | "nvidia";
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface ProviderHealthCheckResult {
  provider: "gemini" | "openai" | "nvidia";
  status: "healthy" | "degraded" | "unconfigured" | "error";
  latencyMs?: number;
  message: string;
  checkedAt: string;
  modelsAvailable?: string[];
  licensingNotice?: string;
}

/**
 * Standardized error representation across all AI providers.
 */
export class AIProviderError extends Error {
  public code: string;
  public status: number;
  public retryable: boolean;
  public provider: "gemini" | "openai" | "nvidia";
  public model?: string;

  constructor(
    message: string,
    options: {
      code: string;
      status?: number;
      retryable?: boolean;
      provider: "gemini" | "openai" | "nvidia";
      model?: string;
    }
  ) {
    super(message);
    this.name = "AIProviderError";
    this.code = options.code;
    this.status = options.status || 500;
    this.retryable = options.retryable ?? false;
    this.provider = options.provider;
    this.model = options.model;
  }
}

export class ModelCapabilityError extends AIProviderError {
  constructor(message: string, provider: "gemini" | "openai" | "nvidia", model?: string) {
    super(message, {
      code: "CAPABILITY_UNSUPPORTED",
      status: 422,
      retryable: false,
      provider,
      model,
    });
    this.name = "ModelCapabilityError";
  }
}

export class ProviderRateLimitError extends AIProviderError {
  public retryAfterSeconds?: number;

  constructor(message: string, provider: "gemini" | "openai" | "nvidia", retryAfter?: number) {
    super(message, {
      code: "RATE_LIMIT_EXCEEDED",
      status: 429,
      retryable: true,
      provider,
    });
    this.name = "ProviderRateLimitError";
    this.retryAfterSeconds = retryAfter;
  }
}

export class ProviderTimeoutError extends AIProviderError {
  constructor(message: string, provider: "gemini" | "openai" | "nvidia") {
    super(message, {
      code: "PROVIDER_TIMEOUT",
      status: 504,
      retryable: true,
      provider,
    });
    this.name = "ProviderTimeoutError";
  }
}

/**
 * Common interface that all modular providers must implement.
 */
export interface BaseAIProvider {
  readonly name: "gemini" | "openai" | "nvidia";

  /**
   * Returns true if required API credentials and base environment are configured.
   */
  isConfigured(): boolean;

  /**
   * Verifies if a given model supports streaming.
   */
  supportsStreaming(modelId: string): boolean;

  /**
   * Streams conversational tokens via AsyncGenerator.
   */
  streamChat(params: ProviderStreamParams): AsyncGenerator<AIStreamEvent, void, unknown>;

  /**
   * Generates complete text in a single non-streaming call.
   */
  generateText(params: ProviderGenerateParams): Promise<ProviderTextResult>;

  /**
   * Performs an active health check on the provider.
   */
  checkHealth(): Promise<ProviderHealthCheckResult>;

  /**
   * Normalizes arbitrary provider exceptions into AIProviderError.
   */
  normalizeError(err: unknown, modelId?: string): AIProviderError;
}

