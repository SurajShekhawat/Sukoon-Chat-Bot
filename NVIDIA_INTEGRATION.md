# Sukoon AI — NVIDIA NIM Multi-Model Integration Guide

## 1. Executive Summary

Sukoon AI integrates the **NVIDIA NIM Hosted API Catalog** (`https://integrate.api.nvidia.com/v1`) as a modular, accelerated AI inference provider. This integration expands Sukoon AI's intelligence tier with specialized high-context Mixture-of-Experts (MoE) models and deep analytical reasoning architectures, while strictly preserving Google Gemini as the primary default companion and OpenAI as an automated resilience fallback.

---

## 2. Critical Licensing & Deployment Safeguards

> [!IMPORTANT]
> **DEVELOPMENT & PROTOTYPING RESTRICTION (NVIDIA DEVELOPER PROGRAM)**
>
> The hosted free endpoints accessible at `https://integrate.api.nvidia.com/v1` via the NVIDIA Developer Program (build.nvidia.com) are licensed exclusively for **prototyping, research, evaluation, and testing**.
>
> - **Never** use these free hosted endpoints to serve commercial production end-users or commercial business transactions without a verified **NVIDIA AI Enterprise (NVAIE) license** or a self-hosted NIM microservice container entitlement.
> - A model labeled *Free Endpoint* on `build.nvidia.com` does **not** grant unrestricted commercial rights.
> - Sukoon AI implements an automated deployment safeguard in `src/lib/ai/capability-registry.ts` and `src/lib/ai/providers/nvidia.provider.ts`:
>   - When `NVIDIA_DEPLOYMENT_MODE="production"`, calls to `DEVELOPMENT_ONLY` models are intercepted and rejected with an `AIProviderError` (code: `NVIDIA_LICENSING_RESTRICTION`, HTTP 403) unless an enterprise production entitlement is verified.

---

## 3. Evaluated & Registered NVIDIA Models

All candidate models have been verified against the official NVIDIA Hosted API Catalog:

| Model Identifier | Family | Capabilities | Context Limit | Licensing Tier | Status & Operational Role |
| :--- | :---: | :--- | :---: | :---: | :--- |
| **`minimaxai/minimax-m3.1-flash`**<br>*(alias: `minimax/minimax-m3.1-flash`)* | MiniMax | `TEXT_STREAMING`<br>`TEXT_NON_STREAMING`<br>`SYSTEM_INSTRUCTIONS`<br>`CODING`<br>`REASONING_EFFORT` | **1,000,000** | `DEVELOPMENT_ONLY` | **Active:** General reasoning, coding assistance, high-context agentic workflows. |
| **`nvidia/nemotron-3.5-super-vl-120b-a12b`**<br>*(alias: `nemotron-3.5-super-vl`)* | Nemotron | `TEXT_STREAMING`<br>`TEXT_NON_STREAMING`<br>`SYSTEM_INSTRUCTIONS`<br>`VISION_IMAGE`<br>`REASONING_EFFORT` | **131,072** | `DEVELOPMENT_ONLY` | **Active:** Deep structured reasoning, complex evaluations, and multimodal image analysis. |
| **`nvidia/magpie-tts-zeroshot`** | Magpie | `TEXT_TO_SPEECH` | 4,096 | `DEVELOPMENT_ONLY` | **Preview / Inactive in MVP:** Future TTS experimentation. Microphone capture and voice cloning are **safely disabled** in the MVP. |
| **`nvidia/cosmos-nemotron-34b`**<br>*(alias: `cosmos3-nano`)* | Cosmos | `VIDEO_INPUT`<br>`VISION_IMAGE` | 32,768 | `DEVELOPMENT_ONLY` | **Disabled:** Physical-world foundation model. Unmounted by default to preserve companion privacy and resource efficiency. |

*Note: Specialized biological or unrelated scientific models (e.g. AlphaFold, ESM) are excluded from the conversational platform.*

---

## 4. Environment Variables & Server Configuration

Configure the following server-side environment variables in `.env.local` (or production environment settings). **Never prefix these with `NEXT_PUBLIC_`:**

```bash
# ------------------------------------------------------------------------------
# NVIDIA NIM Hosted Catalog Configuration
# ------------------------------------------------------------------------------
NVIDIA_API_KEY="nvapi-..."                                          # Bearer token from build.nvidia.com
NVIDIA_BASE_URL="https://integrate.api.nvidia.com/v1"               # Hosted API Catalog root
NVIDIA_DEFAULT_CHAT_MODEL="minimaxai/minimax-m3.1-flash"           # Default high-throughput chat model
NVIDIA_REASONING_MODEL="nvidia/nemotron-3.5-super-vl-120b-a12b"   # Default complex reasoning model
NVIDIA_CODING_MODEL="minimaxai/minimax-m3.1-flash"                  # Default coding assistance model
NVIDIA_TTS_MODEL="nvidia/magpie-tts-zeroshot"                       # Experimental TTS preview model
NVIDIA_DEPLOYMENT_MODE="development"                                # "development" | "production" (Licensing guard)
```

---

## 5. Architectural Implementation Details

### 5.1 Provider Adapter (`src/lib/ai/providers/nvidia.provider.ts`)
- Implements the shared `BaseAIProvider` contract.
- Utilizes the OpenAI SDK configured with `baseURL: NVIDIA_BASE_URL` and `apiKey: NVIDIA_API_KEY`.
- Validates model capabilities and licensing safeguards prior to dispatching any network request.
- Handles Server-Sent Events (SSE) streaming with `stream_options: { include_usage: true }`.
- Normalizes all HTTP responses and errors into the unified `AIProviderError` hierarchy.

### 5.2 Error Normalization Matrix
| HTTP Status / Pattern | Normalized Error Class | Code | Retryable? | Behavior |
| :---: | :--- | :--- | :---: | :--- |
| **401** (Invalid key) | `NVIDIAConfigurationError` | `NVIDIA_CONFIG_ERROR` | No | Halts execution; alerts administrator to check credentials. |
| **404** (Not found) | `AIProviderError` | `NVIDIA_MODEL_NOT_FOUND` | No | Bypasses model; routes immediately to fallback. |
| **422** (Invalid param) | `AIProviderError` | `NVIDIA_VALIDATION_ERROR` | No | Rejects malformed parameters (e.g. unsupported temperature). |
| **429** (Rate limit) | `ProviderRateLimitError` | `RATE_LIMIT_EXCEEDED` | Yes | Triggers circuit-breaker; routes traffic to healthy fallback. |
| **503 / 504** (NIM timeout) | `ProviderTimeoutError` | `PROVIDER_TIMEOUT` | Yes | Aborts request after 30s timeout; invokes fallback. |

### 5.3 Circuit Breaker & Health Tracking (`src/lib/ai/provider-health.ts`)
- Measures live latencies on every call.
- Trips circuit breaker after 3 consecutive failures or any HTTP 429 rate limit.
- Circuit breaker enters a 60-second cooldown window where subsequent calls immediately bypass NVIDIA and execute via Gemini or OpenAI without stalling for timeouts.

---

## 6. Live Connectivity Verification

Sukoon AI provides an automated diagnostic tool to verify NVIDIA NIM connectivity:

```bash
# Run NVIDIA diagnostic tool
pnpm check:nvidia
```

### Output when `NVIDIA_API_KEY` is not set:
```text
=== Sukoon AI — NVIDIA NIM Live Diagnostics ===
Endpoint Base URL: https://integrate.api.nvidia.com/v1
Target Model: minimaxai/minimax-m3.1-flash
NVIDIA_API_KEY configured?: false

ℹ️  NOTICE: NVIDIA_API_KEY is not configured in .env.local.
👉 Live provider test is SKIPPED. All 10+ mocked automated unit & integration test suites verify full compliance.
```

### Output when `NVIDIA_API_KEY` is configured:
```text
=== Sukoon AI — NVIDIA NIM Live Diagnostics ===
Endpoint Base URL: https://integrate.api.nvidia.com/v1
Target Model: minimaxai/minimax-m3.1-flash
NVIDIA_API_KEY configured?: true

Attempting live test generation with NVIDIA NIM Hosted Catalog...
Namaste! 🙏 Sukoon AI test ping acknowledged.
✅ Stream completed successfully in 412ms!
🎉 NVIDIA NIM INTEGRATION IS FULLY OPERATIONAL!
```

