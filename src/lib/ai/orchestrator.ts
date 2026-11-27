import { buildVersionedSystemPrompt, sanitizeUserInput } from "./prompts/system-instructions";
import { CURRENT_SYSTEM_PROMPT_VERSION } from "./prompts/version";
import {
  detectLanguageFromText,
  getLanguageConfig,
  isLanguageSupported,
} from "./languages/config";
import { streamAI, AIStreamingParams, getActiveAIModel } from "./provider";

export interface ChatTurnParams {
  userId: string;
  userName?: string;
  userMessage: string;
  preferredLanguage?: string;
  conversationHistory?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  memories?: Array<{ category: string; content: string }>;
  signal?: AbortSignal;
}

export interface PreparedChatTurn {
  systemInstructions: string;
  contextMessages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  resolvedLanguage: string;
  promptVersion: string;
}

export interface GuardrailInspectionResult {
  isSafe: boolean;
  warnings: string[];
  flags: {
    therapistImpersonation: boolean;
    medicationPrescription: boolean;
    toxicPositivity: boolean;
    promptLeakage: boolean;
    guaranteedSafetyClaims: boolean;
    emergencyServiceReplacement: boolean;
  };
}

/**
 * Sukoon AI Orchestrator
 *
 * Prepares versioned prompts, enforces untrusted boundary encapsulation,
 * resolves multilingual preferences, and inspects outputs for clinical or
 * personality boundary breaches.
 */
export class AIOrchestrator {
  /**
   * Resolves the user's conversational language.
   * Prioritizes the user's explicitly stated preference, but if their current
   * message indicates a clear switch to another supported language (e.g. Hindi Devanagari),
   * provides smooth continuity.
   */
  static resolveLanguage(userMessage: string, preferredLanguage?: string): string {
    const fallback =
      preferredLanguage && isLanguageSupported(preferredLanguage)
        ? preferredLanguage
        : "hinglish";

    // If preferred language is already a supported language using Devanagari (e.g. 'mr', 'hi'),
    // preserve the user's preferred language
    const preferredConfig = getLanguageConfig(fallback);
    const hasDevanagari = /[\u0900-\u097F]/.test(userMessage);

    if (hasDevanagari && preferredConfig.script === "Devanagari") {
      return fallback;
    }

    const detected = detectLanguageFromText(userMessage, fallback);
    return detected;
  }

  /**
   * Prepares the full context payload for the OpenAI Responses API.
   * All user messages are strictly wrapped inside <untrusted_user_message> tags.
   */
  static prepareChatTurn(params: ChatTurnParams): PreparedChatTurn {
    const resolvedLanguage = this.resolveLanguage(params.userMessage, params.preferredLanguage);
    const langConfig = getLanguageConfig(resolvedLanguage);

    const systemInstructions = buildVersionedSystemPrompt({
      userName: params.userName || "Friend",
      language: langConfig.code,
      memories: params.memories,
      promptVersion: CURRENT_SYSTEM_PROMPT_VERSION.version,
    });

    // Format context history, wrapping user messages in untrusted boundaries
    const history = params.conversationHistory || [];
    const formattedHistory = history.map((msg) => {
      if (msg.role === "user") {
        const cleaned = sanitizeUserInput(msg.content);
        return {
          role: "user" as const,
          content: `<untrusted_user_message>\n${cleaned}\n</untrusted_user_message>`,
        };
      }
      return msg;
    });

    // Check if the latest user message is already in history
    const currentCleaned = sanitizeUserInput(params.userMessage || "");
    const lastMsg = history[history.length - 1];
    const isAlreadyAppended =
      lastMsg &&
      lastMsg.role === "user" &&
      sanitizeUserInput(lastMsg.content) === currentCleaned;

    const contextMessages = isAlreadyAppended
      ? formattedHistory
      : currentCleaned
        ? [
            ...formattedHistory,
            {
              role: "user" as const,
              content: `<untrusted_user_message>\n${currentCleaned}\n</untrusted_user_message>`,
            },
          ]
        : formattedHistory;

    return {
      systemInstructions,
      contextMessages,
      resolvedLanguage: langConfig.code,
      promptVersion: CURRENT_SYSTEM_PROMPT_VERSION.version,
    };
  }

  /**
   * Post-generation guardrail inspector.
   * Validates that the AI response adheres to Sukoon's core ethical boundaries.
   */
  static inspectAssistantOutput(output: string): GuardrailInspectionResult {
    const warnings: string[] = [];
    const lower = output.toLowerCase();

    // 1. Check for therapist / doctor impersonation
    // Note: Do not use \b word boundary before/after Devanagari characters in JS RegExp
    const therapistPatterns = [
      /\bi am your (licensed\s+)?(therapist|psychiatrist|doctor|counselor|psychologist)\b/i,
      /\bas your (licensed\s+)?(therapist|psychiatrist|doctor)\b/i,
      /\bi (officially\s+)?diagnose you with\b/i,
      /\byou have been diagnosed with\b/i,
      /\bmain aapka doctor hoon\b/i,
      /(?:^|\s|[.,!?])(मैं आपका (?:डॉक्टर|चिकित्सक|मनोचिकित्सक) हूँ)/i,
    ];

    const therapistImpersonation = therapistPatterns.some((pattern) => pattern.test(output));
    if (therapistImpersonation) {
      warnings.push("Potential clinical or therapist impersonation detected in output.");
    }

    // 2. Check for medication prescriptions
    const medicationPatterns = [
      /\b(prescribe|take)\s+(?:[a-z]+\s+)?\d+\s*(mg|milligram|tablets?|pills?)\b/i,
      /\b(prescribe|prescribing)\s+(?:you\s+)?[a-z]+/i,
      /\bstart taking (sertraline|fluoxetine|escitalopram|xanax|alprazolam|adderall|lexapro)\b/i,
      /\b(sertraline|fluoxetine|escitalopram|xanax|alprazolam|adderall|lexapro|clonazepam|lorazepam|valium|zoloft|prozac)\b/i,
      /(?:^|\s|[.,!?])(दवा (?:लीजिए|खाना शुरू करें))/i,
    ];

    const medicationPrescription = medicationPatterns.some((pattern) => pattern.test(output));
    if (medicationPrescription) {
      warnings.push("Potential medication advice or dosage prescription detected in output.");
    }

    // 3. Check for toxic positivity clichés
    const toxicPositivityPatterns = [
      /\beverything happens for a reason\b/i,
      /\bjust (stay|think|be) positive\b/i,
      /\bgood vibes only\b/i,
      /\bjust smile and be happy\b/i,
      /\bsab kuch kisi wajah se hota hai\b/i,
    ];

    const toxicPositivity = toxicPositivityPatterns.some((pattern) => pattern.test(lower));
    if (toxicPositivity) {
      warnings.push("Superficial toxic positivity or cliché phrase detected in output.");
    }

    // 4. Check for system prompt leaks
    const leakPatterns = [
      /<untrusted_memory_vault>/i,
      /<\/untrusted_memory_vault>/i,
      /<!-- SYSTEM PROMPT VERSION:/i,
      /<untrusted_user_message>/i,
      /<\/untrusted_user_message>/i,
      /## INVIOLABLE OPERATIONAL BOUNDARIES:/i,
    ];

    const promptLeakage = leakPatterns.some((pattern) => pattern.test(output));
    if (promptLeakage) {
      warnings.push("System prompt or boundary XML tag leakage detected in output.");
    }

    // 5. Check for false safety guarantees
    const guaranteePatterns = [
      /\bi (can )?guarantee (your )?safety\b/i,
      /\bi promise (that )?you will (always )?be safe with me\b/i,
      /\bmain guarantee deta hoon aap surakshit hain\b/i,
      /\btrust me completely, nothing bad will happen\b/i,
    ];

    const guaranteedSafetyClaims = guaranteePatterns.some((pattern) => pattern.test(output));
    if (guaranteedSafetyClaims) {
      warnings.push("Inviolable boundary breach: AI cannot make absolute safety guarantees.");
    }

    // 6. Check for emergency service replacement attempts
    const replaceHelplinePatterns = [
      /\b(don't|do not) call (the )?(helpline|emergency|14416|988)\b/i,
      /\byou don't need (a )?(real )?(doctor|hospital|helpline).*?,?\s*(just )?talk to me\b/i,
      /\bdoctor ke paas jaane ki zaroorat nahi hai, mujhse baat karo\b/i,
    ];

    const emergencyServiceReplacement = replaceHelplinePatterns.some((pattern) => pattern.test(output));
    if (emergencyServiceReplacement) {
      warnings.push("Inviolable boundary breach: AI cannot replace emergency services or professional care.");
    }

    const isSafe =
      !therapistImpersonation &&
      !medicationPrescription &&
      !promptLeakage &&
      !guaranteedSafetyClaims &&
      !emergencyServiceReplacement;

    return {
      isSafe,
      warnings,
      flags: {
        therapistImpersonation,
        medicationPrescription,
        toxicPositivity,
        promptLeakage,
        guaranteedSafetyClaims,
        emergencyServiceReplacement,
      },
    };
  }

  /**
   * Invokes the unified streaming AI provider (Gemini / OpenAI) with orchestrated context.
   */
  static async *stream(params: ChatTurnParams) {
    const { systemInstructions, contextMessages } = this.prepareChatTurn(params);

    const streamParams: AIStreamingParams = {
      instructions: systemInstructions,
      input: contextMessages,
      signal: params.signal,
    };

    yield* streamAI(streamParams);
  }
}
