/**
 * Sukoon AI — Admin AI Settings API
 *
 * GET  /api/admin/ai-settings -> Returns provider status, models, task routing, and masked credentials.
 * POST /api/admin/ai-settings -> Updates task routing policies with capability validation.
 *
 * SECURITY: Never returns full API keys or sensitive secrets to the client.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MODEL_REGISTRY, listModels, validateModelForTask } from "@/lib/ai/model-registry";
import { providerHealthMonitor } from "@/lib/ai/provider-health";
import { taskRouter, DEFAULT_TASK_ROUTING_POLICIES } from "@/lib/ai/task-router";
import { TaskCategory, checkLicensingCompliance } from "@/lib/ai/capability-registry";
import { getActiveAIProvider, getActiveAIModel } from "@/lib/ai/provider";

export const runtime = "nodejs";

function maskSecret(key?: string): string {
  if (!key || key.startsWith("placeholder") || key.includes("your-")) {
    return "Not Configured";
  }
  if (key.length <= 8) {
    return "********";
  }
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Gather provider health and configuration states
  const geminiConfigured = !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.startsWith("placeholder");
  const openaiConfigured = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith("sk-");
  const nvidiaConfigured = !!process.env.NVIDIA_API_KEY && !process.env.NVIDIA_API_KEY.startsWith("placeholder");

  const geminiHealth = providerHealthMonitor.getHealthState("gemini");
  const openaiHealth = providerHealthMonitor.getHealthState("openai");
  const nvidiaHealth = providerHealthMonitor.getHealthState("nvidia");

  const nvidiaLicense = checkLicensingCompliance("nvidia");

  const providers = {
    gemini: {
      name: "Google Gemini",
      isConfigured: geminiConfigured,
      maskedKey: maskSecret(process.env.GEMINI_API_KEY),
      status: geminiHealth.status,
      lastLatencyMs: geminiHealth.lastLatencyMs,
      defaultModel: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
      isPrimary: getActiveAIProvider() === "gemini",
    },
    openai: {
      name: "OpenAI",
      isConfigured: openaiConfigured,
      maskedKey: maskSecret(process.env.OPENAI_API_KEY),
      status: openaiHealth.status,
      lastLatencyMs: openaiHealth.lastLatencyMs,
      defaultModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
      isPrimary: getActiveAIProvider() === "openai",
    },
    nvidia: {
      name: "NVIDIA NIM",
      isConfigured: nvidiaConfigured,
      maskedKey: maskSecret(process.env.NVIDIA_API_KEY),
      baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
      status: nvidiaHealth.status,
      lastLatencyMs: nvidiaHealth.lastLatencyMs,
      defaultModel: process.env.NVIDIA_DEFAULT_CHAT_MODEL || "minimaxai/minimax-m3.1-flash",
      reasoningModel: process.env.NVIDIA_REASONING_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b",
      codingModel: process.env.NVIDIA_CODING_MODEL || "minimaxai/minimax-m3.1-flash",
      ttsModel: process.env.NVIDIA_TTS_MODEL || "nvidia/magpie-tts-zeroshot",
      isPrimary: getActiveAIProvider() === "nvidia",
      licensingTier: nvidiaLicense.notice,
      isDevOnly: nvidiaLicense.isDevOnly,
      licensingWarning: nvidiaLicense.warning,
    },
  };

  const models = Object.values(MODEL_REGISTRY).map((m) => ({
    id: m.id,
    displayName: m.displayName,
    provider: m.provider,
    family: m.family,
    description: m.description,
    capabilities: m.capabilities,
    contextWindow: m.contextWindow,
    maxOutputTokens: m.maxOutputTokens,
    enabled: m.enabled,
    status: m.status,
    recommendedTasks: m.recommendedTasks,
    pricingEstimate: m.pricingEstimate,
    licensingTier: m.licensingTier,
  }));

  const taskCategories: TaskCategory[] = [
    "COMPANION_CHAT",
    "EMOTIONAL_SUPPORT",
    "COMPLEX_REASONING",
    "CODING",
    "CONVERSATION_SUMMARY",
    "JOURNAL_SUMMARY",
    "TEXT_TO_SPEECH",
    "IMAGE_ANALYSIS",
    "VIDEO_ANALYSIS",
  ];

  const routingPolicies = taskCategories.map((task) => {
    const policy = taskRouter.getPolicy(task);
    return {
      task,
      preferredProvider: policy.preferredProvider,
      preferredModel: policy.preferredModel,
      allowNVIDIA: policy.allowNVIDIA,
      allowOpenAI: policy.allowOpenAI,
      maxFallbacks: policy.maxFallbacks,
    };
  });

  return NextResponse.json({
    activeProvider: getActiveAIProvider(),
    activeModel: getActiveAIModel(),
    providers,
    models,
    routingPolicies,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { task, preferredProvider, preferredModel, allowNVIDIA, allowOpenAI } = body;

  if (!task) {
    return NextResponse.json({ error: "Missing required 'task' field." }, { status: 400 });
  }

  // Capability validation if a specific model was assigned to the task
  if (preferredModel) {
    const validation = validateModelForTask(preferredModel, task as TaskCategory);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || "Model does not satisfy task capabilities." },
        { status: 422 }
      );
    }
  }

  taskRouter.setPolicy(task as TaskCategory, {
    preferredProvider,
    preferredModel,
    allowNVIDIA: typeof allowNVIDIA === "boolean" ? allowNVIDIA : undefined,
    allowOpenAI: typeof allowOpenAI === "boolean" ? allowOpenAI : undefined,
  });

  return NextResponse.json({
    success: true,
    message: `Updated AI routing policy for '${task}' successfully.`,
    updatedPolicy: taskRouter.getPolicy(task as TaskCategory),
  });
}

