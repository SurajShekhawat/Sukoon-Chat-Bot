import { describe, it, expect } from "vitest";
import {
  getModel,
  resolveModelId,
  isModelSupported,
  validateModelForTask,
  listModels,
  getRecommendedModelForTask,
  MODEL_REGISTRY,
} from "@/lib/ai/model-registry";
import { validateCapabilitiesForTask, checkLicensingCompliance } from "@/lib/ai/capability-registry";

describe("AI Model Registry & Capability Engine", () => {
  it("resolves canonical model IDs and known aliases", () => {
    expect(resolveModelId("minimaxai/minimax-m3.1-flash")).toBe("minimaxai/minimax-m3.1-flash");
    expect(resolveModelId("minimax/minimax-m3.1-flash")).toBe("minimaxai/minimax-m3.1-flash");
    expect(resolveModelId("minimax-m3.1-flash")).toBe("minimaxai/minimax-m3.1-flash");
    expect(resolveModelId("nemotron-3.5-super-vl")).toBe("nvidia/nemotron-3.5-super-vl-120b-a12b");
    expect(resolveModelId("gemini-flash-lite")).toBe("gemini-3.5-flash-lite");
  });

  it("retrieves model definitions with accurate metadata", () => {
    const minimax = getModel("minimaxai/minimax-m3.1-flash");
    expect(minimax).toBeDefined();
    expect(minimax?.provider).toBe("nvidia");
    expect(minimax?.family).toBe("minimax");
    expect(minimax?.capabilities).toContain("CODING");
    expect(minimax?.capabilities).toContain("TEXT_STREAMING");
    expect(minimax?.contextWindow).toBe(1_000_000);
    expect(minimax?.licensingTier).toBe("DEVELOPMENT_ONLY");

    const nemotron = getModel("nvidia/nemotron-3.5-super-vl-120b-a12b");
    expect(nemotron).toBeDefined();
    expect(nemotron?.provider).toBe("nvidia");
    expect(nemotron?.capabilities).toContain("REASONING_EFFORT");
    expect(nemotron?.capabilities).toContain("VISION_IMAGE");
  });

  it("validates model capabilities for task categories", () => {
    // MiniMax supports CODING
    const codingValidation = validateModelForTask("minimaxai/minimax-m3.1-flash", "CODING");
    expect(codingValidation.valid).toBe(true);

    // MiniMax does NOT support TEXT_TO_SPEECH
    const ttsValidation = validateModelForTask("minimaxai/minimax-m3.1-flash", "TEXT_TO_SPEECH");
    expect(ttsValidation.valid).toBe(false);
    expect(ttsValidation.error).toContain("lacks required capabilities");

    // Magpie supports TEXT_TO_SPEECH
    const magpieValidation = validateCapabilitiesForTask(
      MODEL_REGISTRY["nvidia/magpie-tts-zeroshot"].capabilities,
      "TEXT_TO_SPEECH"
    );
    expect(magpieValidation.valid).toBe(true);
  });

  it("safeguards disabled models from task execution", () => {
    const cosmosValidation = validateModelForTask("nvidia/cosmos-nemotron-34b", "VIDEO_ANALYSIS");
    expect(cosmosValidation.valid).toBe(false);
    expect(cosmosValidation.error).toContain("disabled in the configuration");
  });

  it("evaluates NVIDIA deployment licensing compliance", () => {
    // Development mode allows DEVELOPMENT_ONLY tier
    const devCheck = checkLicensingCompliance("nvidia", "DEVELOPMENT_ONLY", "development");
    expect(devCheck.compliant).toBe(true);
    expect(devCheck.isDevOnly).toBe(true);

    // Production mode rejects DEVELOPMENT_ONLY tier without enterprise license
    const prodCheck = checkLicensingCompliance("nvidia", "DEVELOPMENT_ONLY", "production");
    expect(prodCheck.compliant).toBe(false);
    expect(prodCheck.warning).toContain("CRITICAL LICENSING SAFEGUARD");

    // Commercial production tier passes in production mode
    const enterpriseCheck = checkLicensingCompliance("nvidia", "COMMERCIAL_PRODUCTION", "production");
    expect(enterpriseCheck.compliant).toBe(true);
  });

  it("filters and lists models by provider and task", () => {
    const nvidiaModels = listModels({ provider: "nvidia" });
    expect(nvidiaModels.length).toBeGreaterThanOrEqual(4);

    const codingModels = listModels({ task: "CODING", enabledOnly: true });
    expect(codingModels.some((m) => m.id === "minimaxai/minimax-m3.1-flash")).toBe(true);
  });

  it("recommends appropriate models for tasks", () => {
    const recommendedReasoning = getRecommendedModelForTask("COMPLEX_REASONING", "nvidia");
    expect(recommendedReasoning).toBeDefined();
    expect(recommendedReasoning?.provider).toBe("nvidia");

    const recommendedCompanion = getRecommendedModelForTask("COMPANION_CHAT", "gemini");
    expect(recommendedCompanion?.id).toBe("gemini-3.5-flash-lite");
  });
});

