/**
 * Sukoon AI — AI Model Registry
 *
 * Centralized catalog of AI models across Google Gemini, OpenAI, and NVIDIA NIM.
 * Maintains model capabilities, context limits, pricing estimates, licensing tiers,
 * and task compatibilities with capability-driven validation.
 */

import {
  ModelCapability,
  TaskCategory,
  NVIDIALicensingTier,
  validateCapabilitiesForTask,
} from "./capability-registry";

export interface PricingEstimate {
  inputPer1M: number;
  outputPer1M: number;
  currency: string;
  freeTier: boolean;
  notes?: string;
}

export interface ModelDefinition {
  id: string;
  displayName: string;
  provider: "gemini" | "openai" | "nvidia";
  family: string;
  description: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  maxOutputTokens: number;
  licensingTier: NVIDIALicensingTier;
  enabled: boolean;
  isExperimental: boolean;
  status: "active" | "preview" | "disabled";
  recommendedTasks: TaskCategory[];
  pricingEstimate: PricingEstimate;
  aliases?: string[];
}

/**
 * Built-in registry of verified models.
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  // ---------------------------------------------------------------------------
  // Google Gemini
  // ---------------------------------------------------------------------------
  "gemini-3.5-flash-lite": {
    id: "gemini-3.5-flash-lite",
    displayName: "Gemini 3.5 Flash-Lite",
    provider: "gemini",
    family: "gemini",
    description:
      "Ultra-low latency, empathetic multilingual streaming chat model. Primary companion for Sukoon AI.",
    capabilities: [
      "TEXT_STREAMING",
      "TEXT_NON_STREAMING",
      "SYSTEM_INSTRUCTIONS",
      "CODING",
      "REASONING_EFFORT",
    ],
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    licensingTier: "COMMERCIAL_PRODUCTION",
    enabled: true,
    isExperimental: false,
    status: "active",
    recommendedTasks: ["COMPANION_CHAT", "EMOTIONAL_SUPPORT", "CODING", "CONVERSATION_SUMMARY", "JOURNAL_SUMMARY"],
    pricingEstimate: {
      inputPer1M: 0.075,
      outputPer1M: 0.3,
      currency: "USD",
      freeTier: true,
      notes: "Free tier with 15 RPM / 1M TPM",
    },
    aliases: ["gemini-flash-lite", "gemini-default"],
  },
  "gemini-2.5-flash": {
    id: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    provider: "gemini",
    family: "gemini",
    description: "High-speed multimodal companion with strong multimodal understanding and reasoning.",
    capabilities: [
      "TEXT_STREAMING",
      "TEXT_NON_STREAMING",
      "SYSTEM_INSTRUCTIONS",
      "VISION_IMAGE",
      "VIDEO_INPUT",
      "AUDIO_INPUT",
      "CODING",
      "REASONING_EFFORT",
    ],
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    licensingTier: "COMMERCIAL_PRODUCTION",
    enabled: true,
    isExperimental: false,
    status: "active",
    recommendedTasks: ["COMPANION_CHAT", "COMPLEX_REASONING", "CODING", "IMAGE_ANALYSIS"],
    pricingEstimate: {
      inputPer1M: 0.15,
      outputPer1M: 0.6,
      currency: "USD",
      freeTier: true,
    },
  },

  // ---------------------------------------------------------------------------
  // OpenAI
  // ---------------------------------------------------------------------------
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    provider: "openai",
    family: "gpt",
    description: "Compact, efficient secondary fallback model with fast conversational turnaround.",
    capabilities: [
      "TEXT_STREAMING",
      "TEXT_NON_STREAMING",
      "SYSTEM_INSTRUCTIONS",
      "VISION_IMAGE",
    ],
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    licensingTier: "COMMERCIAL_PRODUCTION",
    enabled: true,
    isExperimental: false,
    status: "active",
    recommendedTasks: ["COMPANION_CHAT", "CONVERSATION_SUMMARY"],
    pricingEstimate: {
      inputPer1M: 0.15,
      outputPer1M: 0.6,
      currency: "USD",
      freeTier: false,
      notes: "Requires funded OpenAI credit balance",
    },
    aliases: ["gpt-4o-mini-2024-07-18"],
  },
  "gpt-4o": {
    id: "gpt-4o",
    displayName: "GPT-4o",
    provider: "openai",
    family: "gpt",
    description: "High-capability flagship model for complex analytical queries.",
    capabilities: [
      "TEXT_STREAMING",
      "TEXT_NON_STREAMING",
      "SYSTEM_INSTRUCTIONS",
      "VISION_IMAGE",
      "CODING",
      "REASONING_EFFORT",
    ],
    contextWindow: 128_000,
    maxOutputTokens: 16_384,
    licensingTier: "COMMERCIAL_PRODUCTION",
    enabled: true,
    isExperimental: false,
    status: "active",
    recommendedTasks: ["COMPLEX_REASONING", "IMAGE_ANALYSIS"],
    pricingEstimate: {
      inputPer1M: 2.5,
      outputPer1M: 10.0,
      currency: "USD",
      freeTier: false,
    },
  },

  // ---------------------------------------------------------------------------
  // NVIDIA NIM Hosted Catalog
  // ---------------------------------------------------------------------------
  "minimaxai/minimax-m3.1-flash": {
    id: "minimaxai/minimax-m3.1-flash",
    displayName: "MiniMax M3.1 Flash",
    provider: "nvidia",
    family: "minimax",
    description:
      "High-throughput native multimodal MoE model for agent workflows, coding assistance, and reasoning.",
    capabilities: [
      "TEXT_STREAMING",
      "TEXT_NON_STREAMING",
      "SYSTEM_INSTRUCTIONS",
      "CODING",
      "REASONING_EFFORT",
    ],
    contextWindow: 1_000_000,
    maxOutputTokens: 8_192,
    licensingTier: "DEVELOPMENT_ONLY",
    enabled: true,
    isExperimental: false,
    status: "active",
    recommendedTasks: ["CODING", "COMPLEX_REASONING", "CONVERSATION_SUMMARY", "JOURNAL_SUMMARY"],
    pricingEstimate: {
      inputPer1M: 0.0,
      outputPer1M: 0.0,
      currency: "USD",
      freeTier: true,
      notes: "NVIDIA Developer Program free hosted tier (DEVELOPMENT_ONLY)",
    },
    aliases: ["minimax/minimax-m3.1-flash", "minimax-m3.1-flash"],
  },
  "nvidia/nemotron-3.5-super-vl-120b-a12b": {
    id: "nvidia/nemotron-3.5-super-vl-120b-a12b",
    displayName: "Nemotron 3.5 Super VL",
    provider: "nvidia",
    family: "nemotron",
    description:
      "Advanced multimodal and deep analytical reasoning model optimized for complex structured evaluations.",
    capabilities: [
      "TEXT_STREAMING",
      "TEXT_NON_STREAMING",
      "SYSTEM_INSTRUCTIONS",
      "VISION_IMAGE",
      "REASONING_EFFORT",
    ],
    contextWindow: 131_072,
    maxOutputTokens: 4_096,
    licensingTier: "DEVELOPMENT_ONLY",
    enabled: true,
    isExperimental: false,
    status: "active",
    recommendedTasks: ["COMPLEX_REASONING", "IMAGE_ANALYSIS"],
    pricingEstimate: {
      inputPer1M: 0.0,
      outputPer1M: 0.0,
      currency: "USD",
      freeTier: true,
      notes: "NVIDIA Developer Program free hosted tier (DEVELOPMENT_ONLY)",
    },
    aliases: [
      "nemotron-3.5-super-vl",
      "nvidia/llama-3.1-nemotron-70b-instruct",
      "nemotron-super-vl",
    ],
  },
  "nvidia/magpie-tts-zeroshot": {
    id: "nvidia/magpie-tts-zeroshot",
    displayName: "Magpie TTS ZeroShot",
    provider: "nvidia",
    family: "magpie",
    description:
      "Zero-shot generative text-to-speech synthesis. Future audio preview; microphone & live cloning disabled in MVP.",
    capabilities: ["TEXT_TO_SPEECH"],
    contextWindow: 4_096,
    maxOutputTokens: 0,
    licensingTier: "DEVELOPMENT_ONLY",
    enabled: false, // Inactive in current MVP per safety specifications
    isExperimental: true,
    status: "preview",
    recommendedTasks: ["TEXT_TO_SPEECH"],
    pricingEstimate: {
      inputPer1M: 0.0,
      outputPer1M: 0.0,
      currency: "USD",
      freeTier: true,
      notes: "Experimental preview - zero audio capture in MVP",
    },
    aliases: ["magpie-tts", "magpie-tts-zeroshot"],
  },
  "nvidia/cosmos-nemotron-34b": {
    id: "nvidia/cosmos-nemotron-34b",
    displayName: "Cosmos Nemotron 34B",
    provider: "nvidia",
    family: "cosmos",
    description:
      "Physical AI and world foundation model. Kept disabled unless a dedicated video analysis capability is configured.",
    capabilities: ["VIDEO_INPUT", "VISION_IMAGE"],
    contextWindow: 32_768,
    maxOutputTokens: 4_096,
    licensingTier: "DEVELOPMENT_ONLY",
    enabled: false, // Inactive in current companion MVP
    isExperimental: true,
    status: "disabled",
    recommendedTasks: ["VIDEO_ANALYSIS"],
    pricingEstimate: {
      inputPer1M: 0.0,
      outputPer1M: 0.0,
      currency: "USD",
      freeTier: true,
      notes: "Disabled by default for companion privacy and safety",
    },
    aliases: ["cosmos-nemotron", "cosmos3-nano"],
  },
};

/**
 * Resolves any model alias (e.g. "minimax-m3.1-flash") to its canonical ID.
 */
export function resolveModelId(aliasOrId: string): string {
  if (MODEL_REGISTRY[aliasOrId]) {
    return aliasOrId;
  }

  for (const model of Object.values(MODEL_REGISTRY)) {
    if (model.aliases?.includes(aliasOrId)) {
      return model.id;
    }
  }

  return aliasOrId;
}

/**
 * Retrieves a model definition by canonical ID or alias.
 */
export function getModel(modelId: string): ModelDefinition | undefined {
  const canonicalId = resolveModelId(modelId);
  return MODEL_REGISTRY[canonicalId];
}

/**
 * Checks if a model exists in the registry and is recognized.
 */
export function isModelSupported(modelId: string): boolean {
  return !!getModel(modelId);
}

/**
 * Returns all capabilities for a specified model.
 */
export function getModelCapabilities(modelId: string): ModelCapability[] {
  const model = getModel(modelId);
  return model ? model.capabilities : [];
}

/**
 * Validates whether a model can perform a specific task category.
 */
export function validateModelForTask(
  modelId: string,
  task: TaskCategory
): { valid: boolean; model?: ModelDefinition; error?: string } {
  const model = getModel(modelId);
  if (!model) {
    return {
      valid: false,
      error: `Model '${modelId}' is not registered in the AI model catalog.`,
    };
  }

  if (!model.enabled && model.status === "disabled") {
    return {
      valid: false,
      model,
      error: `Model '${model.displayName}' is currently disabled in the configuration.`,
    };
  }

  const { valid, missing } = validateCapabilitiesForTask(model.capabilities, task);
  if (!valid) {
    return {
      valid: false,
      model,
      error: `Model '${model.displayName}' lacks required capabilities for task '${task}': missing [${missing.join(", ")}].`,
    };
  }

  return { valid: true, model };
}

/**
 * Lists models with optional filtering.
 */
export function listModels(filter?: {
  provider?: "gemini" | "openai" | "nvidia";
  task?: TaskCategory;
  enabledOnly?: boolean;
}): ModelDefinition[] {
  let list = Object.values(MODEL_REGISTRY);

  if (filter?.provider) {
    list = list.filter((m) => m.provider === filter.provider);
  }

  if (filter?.enabledOnly) {
    list = list.filter((m) => m.enabled);
  }

  if (filter?.task) {
    const task = filter.task;
    list = list.filter((m) => validateCapabilitiesForTask(m.capabilities, task).valid);
  }

  return list;
}

/**
 * Suggests the best model for a task, respecting an optional provider preference.
 */
export function getRecommendedModelForTask(
  task: TaskCategory,
  preferredProvider?: "gemini" | "openai" | "nvidia"
): ModelDefinition | undefined {
  const candidates = listModels({
    provider: preferredProvider,
    task,
    enabledOnly: true,
  });

  if (candidates.length > 0) {
    // If preferred matches, pick first recommendation
    const recommended = candidates.find((c) => c.recommendedTasks.includes(task));
    return recommended || candidates[0];
  }

  // Fallback to any enabled model that can perform the task
  const fallbackCandidates = listModels({ task, enabledOnly: true });
  return fallbackCandidates[0];
}
