import OpenAI from "openai";

let openaiInstance: OpenAI | null = null;

export class AIConfigurationError extends Error {
  constructor(message: string = "OPENAI_API_KEY is not configured.") {
    super(message);
    this.name = "AIConfigurationError";
  }
}

/**
 * Returns a server-side OpenAI client singleton.
 * Strictly used ONLY on the server side.
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey.startsWith("sk-proj-placeholder") || apiKey === "your-openai-api-key") {
    throw new AIConfigurationError(
      "OpenAI API key is not configured. Please set a valid OPENAI_API_KEY in your .env.local file to enable live AI responses."
    );
  }

  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey,
    });
  }

  return openaiInstance;
}

export interface StreamingConversationParams {
  model?: string;
  instructions: string;
  input: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  signal?: AbortSignal;
}

/**
 * Invokes the OpenAI Responses API with streaming enabled.
 * Uses client.responses.create({ model, input, instructions, stream: true })
 */
export async function streamOpenAIResponse(params: StreamingConversationParams) {
  const openai = getOpenAIClient();
  const model = params.model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  // Transform input to Responses API items format
  const inputItems = params.input.map((msg) => ({
    role: msg.role === "assistant" ? ("assistant" as const) : ("user" as const),
    content: msg.content,
  }));

  const stream = await openai.responses.create(
    {
      model,
      instructions: params.instructions,
      input: inputItems,
      stream: true,
    },
    {
      signal: params.signal,
    }
  );

  return stream;
}

