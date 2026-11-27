import { LanguageCode } from "@/types/database";
import {
  buildVersionedSystemPrompt,
  sanitizeUserInput as sanitize,
  SystemPromptContext as VersionedContext,
} from "./prompts/system-instructions";

export interface SystemPromptContext {
  userName?: string;
  language: LanguageCode;
  memories?: Array<{ category: string; content: string }>;
}

/**
 * Builds the Sukoon AI system prompt using the version-controlled instructions.
 */
export function buildSystemPrompt(ctx: SystemPromptContext): string {
  return buildVersionedSystemPrompt({
    userName: ctx.userName,
    language: ctx.language,
    memories: ctx.memories,
  });
}

/**
 * Sanitizes untrusted user inputs before placing into the prompt context.
 */
export function sanitizeUserInput(input: string): string {
  return sanitize(input);
}

export { buildVersionedSystemPrompt };
