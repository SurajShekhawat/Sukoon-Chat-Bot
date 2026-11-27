/**
 * Sukoon AI — AI Capability & Task Category Registry
 *
 * Defines model capabilities, task routing domains, required capability constraints,
 * and deployment licensing safeguards for NVIDIA NIM and other providers.
 */

export type ModelCapability =
  | "TEXT_STREAMING"
  | "TEXT_NON_STREAMING"
  | "SYSTEM_INSTRUCTIONS"
  | "VISION_IMAGE"
  | "VIDEO_INPUT"
  | "AUDIO_INPUT"
  | "TEXT_TO_SPEECH"
  | "FUNCTION_CALLING"
  | "REASONING_EFFORT"
  | "CODING";

export type TaskCategory =
  | "COMPANION_CHAT"
  | "EMOTIONAL_SUPPORT"
  | "COMPLEX_REASONING"
  | "CODING"
  | "CONVERSATION_SUMMARY"
  | "JOURNAL_SUMMARY"
  | "TEXT_TO_SPEECH"
  | "IMAGE_ANALYSIS"
  | "VIDEO_ANALYSIS";

export type NVIDIALicensingTier = "DEVELOPMENT_ONLY" | "COMMERCIAL_PRODUCTION";

/**
 * Strict capability requirements for each operational task category.
 * A model MUST fulfill all required capabilities before being routed to a task.
 */
export const TASK_CAPABILITY_REQUIREMENTS: Record<TaskCategory, ModelCapability[]> = {
  COMPANION_CHAT: ["TEXT_STREAMING", "SYSTEM_INSTRUCTIONS"],
  EMOTIONAL_SUPPORT: ["TEXT_STREAMING", "SYSTEM_INSTRUCTIONS"],
  COMPLEX_REASONING: ["TEXT_STREAMING", "REASONING_EFFORT"],
  CODING: ["TEXT_STREAMING", "CODING"],
  CONVERSATION_SUMMARY: ["TEXT_NON_STREAMING"],
  JOURNAL_SUMMARY: ["TEXT_NON_STREAMING"],
  TEXT_TO_SPEECH: ["TEXT_TO_SPEECH"],
  IMAGE_ANALYSIS: ["VISION_IMAGE"],
  VIDEO_ANALYSIS: ["VIDEO_INPUT"],
};

/**
 * Validates whether a given list of provided capabilities satisfies
 * the required capabilities for a specific task category.
 */
export function validateCapabilitiesForTask(
  providedCapabilities: ModelCapability[],
  task: TaskCategory
): { valid: boolean; missing: ModelCapability[] } {
  const required = TASK_CAPABILITY_REQUIREMENTS[task] || [];
  const missing = required.filter((cap) => !providedCapabilities.includes(cap));

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Evaluates whether an NVIDIA model deployment meets the licensing safeguard.
 * Hosted free endpoints on build.nvidia.com are for prototyping, evaluation,
 * and testing only, and must NOT be used for unentitled production traffic.
 */
export function checkLicensingCompliance(
  provider: string,
  modelLicensingTier: NVIDIALicensingTier = "DEVELOPMENT_ONLY",
  deploymentMode: string = process.env.NVIDIA_DEPLOYMENT_MODE || "development"
): { compliant: boolean; isDevOnly: boolean; warning?: string; notice: string } {
  if (provider !== "nvidia") {
    return {
      compliant: true,
      isDevOnly: false,
      notice: "Commercial terms governed by provider enterprise agreement.",
    };
  }

  const isDevOnly = modelLicensingTier === "DEVELOPMENT_ONLY";
  const isProductionDeploy = deploymentMode.toLowerCase() === "production";

  if (isDevOnly && isProductionDeploy) {
    return {
      compliant: false,
      isDevOnly: true,
      warning:
        "CRITICAL LICENSING SAFEGUARD: NVIDIA hosted free endpoints are designated for DEVELOPMENT_ONLY. " +
        "Commercial production workloads require a verified NVIDIA AI Enterprise NIM license or self-hosted container entitlement.",
      notice: "DEVELOPMENT_ONLY (Prototyping / Evaluation Free Tier)",
    };
  }

  return {
    compliant: true,
    isDevOnly,
    notice: isDevOnly
      ? "DEVELOPMENT_ONLY (Prototyping / Evaluation Free Tier)"
      : "COMMERCIAL_PRODUCTION (Verified Enterprise Entitlement)",
  };
}

