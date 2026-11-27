import { GoogleGenAI } from "@google/genai";

let geminiInstance: GoogleGenAI | null = null;

export class GeminiConfigurationError extends Error {
  constructor(message: string = "GEMINI_API_KEY is not configured.") {
    super(message);
    this.name = "GeminiConfigurationError";
  }
}

/**
 * Returns a server-side Google Gemini client singleton.
 * Strictly used ONLY on the server side.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (
    !apiKey ||
    apiKey.startsWith("placeholder") ||
    apiKey === "your-gemini-api-key"
  ) {
    throw new GeminiConfigurationError(
      "Gemini API key is not configured. Please set a valid GEMINI_API_KEY in your .env.local file to enable live AI responses."
    );
  }

  if (!geminiInstance) {
    geminiInstance = new GoogleGenAI({
      apiKey,
    });
  }

  return geminiInstance;
}

export interface GeminiStreamingParams {
  model?: string;
  instructions: string;
  input: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  signal?: AbortSignal;
}

export interface AIStreamTokenEvent {
  type: "token";
  delta: string;
}

export interface AIStreamUsageEvent {
  type: "usage";
  totalTokens: number;
}

export type AIStreamEvent = AIStreamTokenEvent | AIStreamUsageEvent;

/**
 * Invokes Google Gemini API with streaming enabled.
 * Maps conversational turns to Gemini's role/contents model and yields tokens.
 */
export async function* streamGeminiResponse(
  params: GeminiStreamingParams
): AsyncGenerator<AIStreamEvent, void, unknown> {
  const ai = getGeminiClient();
  const model = params.model || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

  // Transform input to Gemini contents format
  // Note: Gemini roles are 'user' and 'model'
  const contents = params.input
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: msg.content }],
    }));

  if (contents.length === 0) {
    contents.push({ role: "user", parts: [{ text: "Hello" }] });
  }

  const responseStream = await ai.models.generateContentStream({
    model,
    contents,
    config: {
      systemInstruction: params.instructions,
      abortSignal: params.signal,
    },
  });

  let totalTokens = 0;

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield {
        type: "token",
        delta: chunk.text,
      };
    }
    if (chunk.usageMetadata?.totalTokenCount) {
      totalTokens = chunk.usageMetadata.totalTokenCount;
    }
  }

  yield {
    type: "usage",
    totalTokens,
  };
}

