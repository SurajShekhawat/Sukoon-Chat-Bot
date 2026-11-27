import { createClient } from "@/lib/supabase/server";
import { chatRequestSchema } from "@/lib/validation/chat";
import {
  getConversationById,
  getConversationMessages,
  saveUserMessage,
  saveAssistantMessage,
  generateAutoTitle,
  updateConversation,
} from "@/lib/services/conversation";
import { getCurrentProfile } from "@/lib/services/profile";
import { getActiveMemoriesForChat } from "@/lib/services/memory";
import {
  checkRateLimit,
  recordMessageSent,
  acquireRequestLock,
  releaseRequestLock,
} from "@/lib/security/rate-limiter";
import { scanUserMessage } from "@/lib/safety/detector";
import {
  getDeescalationMessage,
  getHarmfulAdviceRefusal,
  getPromptInjectionRefusal,
} from "@/lib/safety/deescalation";
import { logSafetyAudit } from "@/lib/security/audit-logger";
import { AIOrchestrator } from "@/lib/ai/orchestrator";
import { streamAI, getActiveAIModel } from "@/lib/ai/provider";
import { AIConfigurationError } from "@/lib/ai/openai";
import { GeminiConfigurationError } from "@/lib/ai/gemini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const supabase = await createClient();

  // 1. Authenticate user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 2. Validate request payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.errors[0]?.message || "Validation failed" }),
      {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { conversationId, message, language } = parsed.data;

  // 3. Check rate limits & burst protection
  const rateLimit = checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        error:
          rateLimit.reason === "burst_limit_exceeded"
            ? "Too many messages in a short time. Please breathe and wait a moment."
            : "Daily message quota reached. Please return tomorrow for more reflection.",
        retryAfter: rateLimit.retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rateLimit.retryAfterSeconds || 60),
        },
      }
    );
  }

  // 4. Duplicate request protection
  const lockAcquired = acquireRequestLock(user.id, conversationId);
  if (!lockAcquired) {
    return new Response(
      JSON.stringify({
        error: "A response is already generating for this conversation. Please wait.",
      }),
      {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // 5. Verify conversation ownership
  const { conversation, error: convError } = await getConversationById(user.id, conversationId);
  if (convError || !conversation) {
    releaseRequestLock(user.id, conversationId);
    return new Response(JSON.stringify({ error: "Conversation not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 6. Persist incoming user message
  const { message: savedUserMsg, error: saveErr } = await saveUserMessage(
    user.id,
    conversationId,
    message
  );

  if (saveErr || !savedUserMsg) {
    releaseRequestLock(user.id, conversationId);
    return new Response(JSON.stringify({ error: "Failed to persist user message" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 7. Auto-rename conversation if still using default title
  if (conversation.title === "New Conversation") {
    const autoTitle = generateAutoTitle(message);
    await updateConversation(user.id, conversationId, { title: autoTitle });
  }

  // 8. Multi-Tier Safety & Crisis Screening
  const safetyScan = scanUserMessage(message, language, "IN");

  const encoder = new TextEncoder();

  // If crisis, self-harm, harmful advice, or prompt injection is detected:
  // halt external LLM call and serve safe deterministic de-escalation / refusal.
  if (!safetyScan.isSafe && safetyScan.level === "crisis") {
    releaseRequestLock(user.id, conversationId);
    recordMessageSent(user.id);

    let responseText = getDeescalationMessage(language);
    let eventType: Parameters<typeof logSafetyAudit>[0]["eventType"] = "crisis_intercepted";
    const serveHelplines = safetyScan.category !== "prompt_injection";

    if (safetyScan.category === "prompt_injection") {
      responseText = getPromptInjectionRefusal(language);
      eventType = "prompt_injection_blocked";
    } else if (safetyScan.category === "harmful_advice") {
      responseText = getHarmfulAdviceRefusal(language);
      eventType = "harmful_advice_blocked";
    } else if (safetyScan.category === "ambiguous_distress") {
      responseText = getDeescalationMessage(language);
      eventType = "ambiguous_distress_intercepted";
    }

    // Anonymized Audit Logging (DATA MINIMIZATION ENFORCED)
    logSafetyAudit({
      eventType,
      userId: user.id,
      category: safetyScan.category || "crisis",
      severity: safetyScan.category === "prompt_injection" ? "medium" : "high",
      language,
      metadata: {
        helplinesServed: serveHelplines,
        matchedCategory: safetyScan.category || "unknown",
      },
    });

    const { message: assistantMsg } = await saveAssistantMessage(
      user.id,
      conversationId,
      responseText,
      0,
      {
        safety_flags: {
          level: "crisis",
          category: safetyScan.category,
          matchedPattern: safetyScan.matchedPattern,
        },
      }
    );

    const stream = new ReadableStream({
      start(controller) {
        // 1. Emit start event
        controller.enqueue(
          encoder.encode(
            `event: start\ndata: ${JSON.stringify({
              conversationId,
              userMessageId: savedUserMsg.id,
              requestId,
            })}\n\n`
          )
        );

        // 2. Emit crisis safety alert with helplines if crisis/harmful advice
        if (serveHelplines) {
          controller.enqueue(
            encoder.encode(
              `event: safety_alert\ndata: ${JSON.stringify({
                level: "crisis",
                category: safetyScan.category,
                helplines: safetyScan.recommendedHelplines,
              })}\n\n`
            )
          );
        }

        // 3. Emit tokens of refusal / de-escalation response
        controller.enqueue(
          encoder.encode(`event: token\ndata: ${JSON.stringify({ delta: responseText })}\n\n`)
        );

        // 4. Emit done event
        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              assistantMessageId: assistantMsg?.id,
              tokensUsed: 0,
            })}\n\n`
          )
        );

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Request-Id": requestId,
      },
    });
  }

  // 9. Prepare context for safe generation
  const profile = await getCurrentProfile();
  const userMemories = await getActiveMemoriesForChat(user.id, 15);

  // Load prior messages in conversation (last 12 for context window)
  const { messages: priorMessages } = await getConversationMessages(user.id, conversationId);
  const priorHistory = (priorMessages || []).slice(-12).map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  const orchestrated = AIOrchestrator.prepareChatTurn({
    userId: user.id,
    userName: profile?.display_name || "Friend",
    userMessage: message,
    preferredLanguage: language || profile?.preferred_language,
    conversationHistory: priorHistory,
    memories: userMemories,
  });

  // 10. Server-Sent Events Streaming from OpenAI Responses API
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `event: start\ndata: ${JSON.stringify({
            conversationId,
            userMessageId: savedUserMsg.id,
            requestId,
          })}\n\n`
        )
      );

      let accumulatedAssistantText = "";
      let totalTokensUsed = 0;

      try {
        const responseStream = streamAI({
          instructions: orchestrated.systemInstructions,
          input: orchestrated.contextMessages,
          signal: request.signal,
        });

        for await (const chunk of responseStream) {
          if (chunk.type === "token") {
            accumulatedAssistantText += chunk.delta;
            controller.enqueue(
              encoder.encode(
                `event: token\ndata: ${JSON.stringify({ delta: chunk.delta })}\n\n`
              )
            );
          } else if (chunk.type === "usage") {
            totalTokensUsed = chunk.totalTokens;
          }
        }

        // Post-generation guardrail inspection
        const inspection = AIOrchestrator.inspectAssistantOutput(accumulatedAssistantText);
        if (!inspection.isSafe) {
          console.warn("[Guardrail Warning] Response triggered safety flags:", inspection.warnings);
          logSafetyAudit({
            eventType: "safety_guardrail_triggered",
            userId: user.id,
            category: "output_guardrail",
            severity: "medium",
            language: orchestrated.resolvedLanguage,
            metadata: {
              warningsCount: inspection.warnings.length,
              triggeredFlags: Object.entries(inspection.flags)
                .filter(([, v]) => v)
                .map(([k]) => k)
                .join(", "),
            },
          });
        }

        // Persist finalized assistant response to database
        const activeModel = getActiveAIModel();
        const { message: savedAssistant } = await saveAssistantMessage(
          user.id,
          conversationId,
          accumulatedAssistantText,
          totalTokensUsed,
          {
            language: orchestrated.resolvedLanguage,
            model: activeModel,
            promptVersion: orchestrated.promptVersion,
            guardrailFlags: inspection.flags,
          }
        );

        recordMessageSent(user.id);

        controller.enqueue(
          encoder.encode(
            `event: done\ndata: ${JSON.stringify({
              assistantMessageId: savedAssistant?.id,
              tokensUsed: totalTokensUsed,
            })}\n\n`
          )
        );
      } catch (err: unknown) {
        console.error("Streaming error in /api/chat:", err);

        let errorMessage = "An unexpected error occurred while communicating with your companion.";
        if (err instanceof AIConfigurationError || err instanceof GeminiConfigurationError) {
          errorMessage = err.message;
        } else if (err instanceof Error && (err.name === "AbortError" || err.message.toLowerCase().includes("abort"))) {
          errorMessage = "Generation was stopped.";
        } else if (
          typeof err === "object" &&
          err !== null &&
          ("code" in err || "status" in err || "type" in err || "message" in err)
        ) {
          const apiErr = err as {
            code?: string | number;
            status?: number;
            type?: string;
            message?: string;
          };

          const rawMsg = String(apiErr.message || "");

          if (
            apiErr.code === "credit_balance_exhausted" ||
            apiErr.type === "insufficient_quota" ||
            rawMsg.includes("credit_balance_exhausted") ||
            rawMsg.includes("insufficient_quota")
          ) {
            errorMessage =
              "OpenAI API credits exhausted (insufficient quota): Your OpenAI account has $0 remaining credits. Please recharge your billing credits or configure GEMINI_API_KEY in .env.local.";
          } else if (
            apiErr.status === 401 ||
            apiErr.code === "invalid_api_key" ||
            rawMsg.includes("API key not valid") ||
            rawMsg.includes("API_KEY_INVALID")
          ) {
            errorMessage =
              "AI authentication failed: The provided API key is invalid. Please verify GEMINI_API_KEY or OPENAI_API_KEY in .env.local.";
          } else if (apiErr.status === 429 || rawMsg.includes("RESOURCE_EXHAUSTED")) {
            errorMessage =
              "AI rate limit reached. Please wait a few seconds and try again.";
          } else if (apiErr.message) {
            errorMessage = `AI Service Error: ${apiErr.message}`;
          }
        }

        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: errorMessage })}\n\n`)
        );
      } finally {
        releaseRequestLock(user.id, conversationId);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Request-Id": requestId,
    },
  });
}

