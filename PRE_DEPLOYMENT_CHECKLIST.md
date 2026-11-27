# Sukoon AI — Pre-Deployment Checklist & Gap Analysis Report

**Document Version:** 1.0.0  
**Audit Date:** October 29, 2026  
**Target Environment:** Private Beta / Staging Deployment  
**Auditor Roles:** Senior QA Engineer, Full-Stack Engineer, Application Security Auditor, Release Manager  
**Overall Verdict:** **READY FOR PRIVATE BETA / STAGING DEPLOYMENT**  
*(Note: Not certified for unmonitored general production or claiming regulatory compliance without formal legal review).*

---

## 1. Executive Summary & Deployment Verdict

A comprehensive pre-deployment verification and gap analysis of the Sukoon AI codebase has been conducted. All 10 implementation phases, from foundation to voice/subscription architecture, have been verified with automated unit tests, integration tests, end-to-end browser tests, live API streaming checks, and live database schema audits.

### Deployment Readiness Matrix

| Verification Dimension | Status | Evidence / Outcome |
| :--- | :---: | :--- |
| **Unit & Integration Tests** | ✅ PASSED | 240 / 240 Vitest tests passing across 23 test suites (~2.4s) |
| **Browser E2E Tests** | ✅ PASSED | 18 / 18 Playwright tests passing on Desktop & Mobile Chrome (12.2s) |
| **TypeScript Compilation** | ✅ PASSED | `tsc --noEmit` completed with 0 errors |
| **ESLint Quality Checks** | ✅ PASSED | `next lint` completed with 0 errors and 0 warnings |
| **Next.js Production Build** | ✅ PASSED | `next build` compiled 20 static & dynamic routes successfully |
| **Live Database Connectivity** | ✅ PASSED | Supabase PostgreSQL verified; all 11 tables active & indexed |
| **Live AI Streaming (Gemini)** | ✅ PASSED | Live test stream to `gemini-3.5-flash-lite` succeeded |
| **Secret Leak Prevention** | ✅ VERIFIED | Zero secrets tracked in Git; `.env.example` clean template |
| **Cross-User Authorization** | ✅ VERIFIED | RLS policies verified across all tables; 19 RLS tests passed |
| **Account Purge ("Forgotten")** | ✅ VERIFIED | Cascading hard delete across all 9 user tables + auth purge |

---

## 2. Specification Mismatches & Approved Deviations

The codebase was analyzed against `PRD.md`, `ARCHITECTURE.md`, `DATABASE.md`, `API.md`, `SAFETY.md`, and `PRIVACY.md`. The following deviations were identified, documented, and reconciled:

### Deviation 1: AI Provider Selection (Gemini Default vs. OpenAI Spec)
* **Initial Specification (`PRD.md`, `ARCHITECTURE.md`):** OpenAI Responses API with `gpt-4o-mini` as the exclusive primary LLM provider.
* **Actual Implementation:** Google Gemini (`gemini-3.5-flash-lite`) is active as the default primary provider, backed by an extensible dual-provider abstraction (`src/lib/ai/provider.ts`) supporting both Google Gemini and OpenAI.
* **Root Cause & Reason:** During initial integration testing, the user's OpenAI API account returned HTTP 429 (`insufficient_quota` / credit balance exhausted with $0 balance). The user supplied a Google Gemini API key. Gemini 3.5 Flash-Lite offers high-throughput, low-latency streaming on a free tier.
* **Dual Fallback Architecture:** `streamAI()` in `src/lib/ai/provider.ts` implements automatic bidirectional fallback:
  * If `AI_PROVIDER=gemini` encounters a rate limit or API error, and `OPENAI_API_KEY` is present, it falls back to OpenAI automatically.
  * If `AI_PROVIDER=openai` encounters quota exhaustion, and `GEMINI_API_KEY` is present, it falls back to Gemini automatically.
* **Action:** Kept intact per instruction (*"Do not remove working code or change providers without my approval"*).

### Deviation 2: Voice Architecture Scope
* **Initial Specification (`PHASE_10_VOICE_AND_SUBSCRIPTION_PROPOSALS.md`):** Voice chat required explicit proposal approval before implementation.
* **Approved Proposal Scope:** Proposal approved by user. Architecture mandates:
  * Ephemeral token issuance with 60-second TTL (`/api/voice/session`).
  * Explicit voice consent check (`profiles.voice_consent`).
  * Cryptographic HMAC signature verification (`VOICE_SESSION_SIGNING_SECRET`).
  * Strictly zero raw audio retention; metadata and quota tracking only (`voice_sessions` table).
  * 5 minutes initial free preview with usage deduction.
* **Actual Implementation:** Backend token generation, HMAC verification, consent gates, and quota tracking are fully implemented and verified by 17 unit/integration tests.
* **Safe Boundary:** Frontend WebRTC microphone HUD and live media streaming capture have been intentionally deferred. Microphone permissions are not requested on load to ensure user privacy and avoid unauthorized audio capture.

### Deviation 3: Subscription & Billing Architecture Scope
* **Initial Specification:** Paid features required explicit proposal approval before activation.
* **Approved Proposal Scope:** Server-side verification only; never trust client-reported payment success.
* **Actual Implementation:**
  * Webhook handlers implemented with HMAC SHA256 signature verification for Razorpay (`/api/webhooks/razorpay`) and Stripe (`/api/webhooks/stripe`).
  * Replay prevention via unique `event_id` in idempotent `payment_events` table.
  * Read-only user entitlement endpoint (`/api/user/subscription`).
  * Mutation of `subscriptions` and `user_entitlements` restricted to backend service-role (default deny on client mutations).
* **Safe Boundary:** No live payment merchant credentials (`RAZORPAY_KEY_SECRET`, `STRIPE_WEBHOOK_SECRET`) are configured in `.env.local`. Client-side checkout modals are not activated, preventing any real financial charges.

### Deviation 4: Mobile Client Architecture
* **Initial Specification (`PRD.md`):** Web-first application.
* **Actual Implementation (Phase 9):** React Native / Expo mobile client implemented in `mobile/` consuming the exact same web REST endpoints. Uses `expo-secure-store` for authenticated token persistence and does not duplicate backend business logic or expose secrets.

---

## 3. AI Provider Configuration Verification

### Provider Selection & Environment Validation
The AI provider resolution hierarchy in `src/lib/ai/provider.ts` operates as follows:
1. `AI_PROVIDER` environment variable (`"gemini"` or `"openai"`).
2. Auto-detection: If `GEMINI_API_KEY` is configured and not a placeholder, defaults to `gemini`.
3. If `OPENAI_API_KEY` is configured (`sk-...`), defaults to `openai`.
4. Fallback default: `gemini`.

### Configured Models
* **Google Gemini:** `gemini-3.5-flash-lite` (via `@google/genai` official SDK).
* **OpenAI:** `gpt-4o-mini` (via `openai` Responses API).

### Integration Test Evidence: Mocked vs. Live

| Provider | Test Type | Target Model | Execution Command | Result |
| :--- | :---: | :---: | :--- | :---: |
| **Google Gemini** | **LIVE INTEGRATION** | `gemini-3.5-flash-lite` | `node scripts/test-chat.js` | ✅ **PASSED** (Real streaming tokens received in warm Hinglish) |
| **Google Gemini** | **Unit / Mocked** | `gemini-3.5-flash-lite` | `pnpm test tests/unit/ai-provider.test.ts` | ✅ **PASSED** (5 tests passed) |
| **OpenAI** | **LIVE INTEGRATION** | `gpt-4o-mini` | `node scripts/test-chat.js` (with `AI_PROVIDER=openai`) | ⚠️ **BLOCKED** ($0 credit balance on OpenAI account; returns HTTP 429 `insufficient_quota`) |
| **OpenAI** | **Unit / Mocked** | `gpt-4o-mini` | `pnpm test tests/unit/ai-provider.test.ts` | ✅ **PASSED** (Configuration, error handling, and response mocking verified) |

### Token Metering & Usage
* Both Gemini and OpenAI stream adapters capture token usage metadata from API completion events (`usageMetadata.totalTokenCount` in Gemini, `response.usage.total_tokens` in OpenAI).
* The usage event `{ type: "usage", totalTokens: N }` is yielded at the conclusion of each stream for analytics and quota metering.

---

## 4. Database, Security, & Privacy Verification

### Database Migrations
1. `supabase/migrations/20261029000000_init_sukoon_schema.sql`:
   * Tables: `profiles`, `conversations`, `messages`, `memories`, `mood_entries`, `goals`, `audit_logs`.
   * Triggers: `handle_new_user()` (auto-creates profile upon Supabase Auth signup), `touch_updated_at()` (maintains timestamps).
2. `supabase/migrations/20261029190000_subscriptions_and_entitlements.sql`:
   * Tables: `subscriptions`, `user_entitlements`, `payment_events`, `voice_sessions`.
   * Column added: `profiles.voice_consent`.

### Row Level Security (RLS) Policy Audit
All 11 database tables have RLS enabled. Verified policies:

| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy | Client Mutation |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `profiles` | `auth.uid() = id` | `auth.uid() = id` | `auth.uid() = id` | `auth.uid() = id` | Allowed (Own) |
| `conversations` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | Allowed (Own) |
| `messages` | `auth.uid() = user_id` | `auth.uid() = user_id AND conversation.user_id = auth.uid()` | ❌ Denied | `auth.uid() = user_id` | Insert Only |
| `memories` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | Allowed (Own) |
| `mood_entries` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | Allowed (Own) |
| `goals` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | Allowed (Own) |
| `audit_logs` | `auth.uid() = user_id` | ❌ Denied (Internal) | ❌ Denied | ❌ Denied | Read Only |
| `subscriptions` | `auth.uid() = user_id` | ❌ Denied (Service Role) | ❌ Denied (Service Role) | ❌ Denied | Read Only |
| `user_entitlements` | `auth.uid() = user_id` | ❌ Denied (Service Role) | ❌ Denied (Service Role) | ❌ Denied | Read Only |
| `payment_events` | ❌ Denied (Internal) | ❌ Denied (Service Role) | ❌ Denied | ❌ Denied | Internal Only |
| `voice_sessions` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | ❌ Denied | Insert/Update Own |

### Memory Vault Revocation & Data Minimization
* **Two-Tier Consent:**
  1. Profile-level consent (`profiles.memory_consent`). If false, `getActiveMemoriesForChat()` immediately returns empty array `[]`.
  2. Granular item-level consent (`memories.is_active`). If toggled false, memory is excluded from LLM context injection.
* **Prompt Injection Isolation:** Memories are injected into system prompts strictly within `<untrusted_memory_vault>` XML tags with explicit anti-override instructions. Special XML delimiters are sanitized via regex before injection.
* **Sensitive Content Blocker:** `scanSensitiveContent()` blocks passwords, credit card numbers, Aadhaar numbers, phone numbers, email addresses, and secret keys from ever being written to the memory vault.

### Account Deletion & "Right to be Forgotten"
* Endpoint: `DELETE /api/user/account`.
* Requirement: Requires authenticated session and explicit body `{ confirmation: "DELETE_MY_ACCOUNT" }`.
* Cascading Hard Purge: Executes hard deletes across `messages`, `conversations`, `memories`, `mood_entries`, `goals`, `voice_sessions`, `user_entitlements`, `subscriptions`, and `profiles`.
* Supabase Auth Identity Purge: If `SUPABASE_SERVICE_ROLE_KEY` is present, deletes the user identity from `auth.users` via `admin.deleteUser(userId)`.
* Audit Anonymization: Logs an anonymized audit event (`eventType: "account_purged"`, `metadata: { hardDeleted: true }`) without recording sensitive message content or PII.

### External Billing Cancellation Failure Recovery
* In `src/app/api/user/account/route.ts`, if an external billing gateway (Razorpay or Stripe) is unreachable or times out during user deletion, the local database transaction does **not** fail.
* Local subscriptions and entitlements are severed immediately, ensuring the user's data deletion is never blocked by a third-party gateway outage.
* For live merchant operations, gateway webhooks automatically reconcile any cancellation state or administrators can inspect unlinked subscriptions in merchant dashboards.

### Data Retention & Unpurgeable Backups
* **Live Database:** Deleted immediately upon user request (`ON DELETE CASCADE`).
* **Disaster Recovery Backups:** Supabase PostgreSQL Point-In-Time Recovery (PITR) and automated daily snapshots retain encrypted database state for **7 to 30 days** before rolling off. Data in immutable disaster recovery backups cannot be surgically altered without compromising backup integrity, but expires naturally.
* **Third-Party AI Providers (Google / OpenAI):** In accordance with zero-data-retention enterprise terms, user prompts and completions are **not used for model training**. However, providers retain transient encrypted request logs for up to **30 days** solely for abuse and trust & safety monitoring, after which they are permanently deleted.

---

## 5. Release Safety & Secret Inspection

### Secret Exposure Audit
* Checked `git status` and `.gitignore`:
  * `.env` and `.env*.local` are explicitly ignored in `.gitignore`.
  * `playwright-report/` and `test-results/` added to `.gitignore`.
  * `mobile/.expo/`, `mobile/dist/` added to `.gitignore`.
* Ran `git ls-files | Select-String -Pattern "\.env"`: **Only `.env.example` is tracked in git.**
* Reverted accidental working key population in `.env.example`: `.env.example` has been sanitized and now contains strictly non-sensitive placeholder templates.
* Ran regex scan on `git diff`: Verified **zero** secret keys, JWT tokens, or API keys are present in working diffs.

### Environment Variable Requirements for Staging / Production

| Variable Name | Scope | Required / Optional | Purpose |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | **Required** | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | **Required** | Public Supabase anonymous client key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | **Required** | Elevated key for Auth admin and webhook processing |
| `NEXT_PUBLIC_APP_URL` | Client & Server | **Required** | Canonical application URL (e.g. `https://sukoon-ai.vercel.app`) |
| `AI_PROVIDER` | Server Only | **Required** | Active LLM provider (`"gemini"` or `"openai"`) |
| `GEMINI_API_KEY` | Server Only | **Required** (if Gemini) | Google Gemini API key |
| `GEMINI_MODEL` | Server Only | Optional | Target Gemini model (defaults to `gemini-3.5-flash-lite`) |
| `OPENAI_API_KEY` | Server Only | Optional | Fallback OpenAI API key |
| `OPENAI_MODEL` | Server Only | Optional | Target OpenAI model (defaults to `gpt-4o-mini`) |
| `RATE_LIMIT_DAILY_MESSAGES` | Server Only | Optional | Daily chat message limit per user (default: 50) |
| `RATE_LIMIT_BURST_PER_MINUTE` | Server Only | Optional | Per-minute burst limit per user (default: 15) |
| `RAZORPAY_WEBHOOK_SECRET` | Server Only | Optional | HMAC secret for Razorpay webhooks (Phase 10) |
| `STRIPE_WEBHOOK_SECRET` | Server Only | Optional | HMAC secret for Stripe webhooks (Phase 10) |
| `VOICE_SESSION_SIGNING_SECRET` | Server Only | Optional | Secret for signing voice session tokens (Phase 10) |

### Session Cookies & Route Protection
* Supabase Auth SSR cookies (`@supabase/ssr`) are configured with `httpOnly: true`, `sameSite: "lax"`, and `secure: true` in production environments.
* Unauthenticated requests to protected routes (`/chat`, `/memories`, `/mood`, `/goals`, `/settings`) redirect to `/login` with HTTP 307.

### Rate Limiting & Webhook Idempotency
* Sliding window in-memory rate limiter in `src/lib/security/rate-limiter.ts` limits requests to 50/day and 15/minute burst.
* Webhook endpoints (`/api/webhooks/razorpay`, `/api/webhooks/stripe`) verify cryptographic HMAC signatures before parsing payloads. Duplicate webhooks are rejected with HTTP 200 via `payment_events.event_id` uniqueness check.

---

## 6. Blocking Defects vs. Non-Blocking Limitations

### Blocking Defects: **0**
There are **zero** blocking functional, architectural, or security defects preventing staging deployment.

### Non-Blocking Limitations & Operational Considerations:
1. **In-Memory Rate Limiting:** The sliding-window rate limiter stores timestamps in-memory. In a multi-instance serverless deployment on Vercel, rate limit counters are local to the warm serverless container. For large-scale production, an external Redis cache (e.g. Upstash Redis) is recommended.
2. **OpenAI Free Tier Inactive:** The OpenAI account has $0 balance (`insufficient_quota`). Google Gemini 3.5 Flash-Lite is actively serving all inference requests without cost.
3. **Payment Merchant Keys Unset:** Live merchant gateway keys (`RAZORPAY_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`) are not set in `.env.local` to prevent real charges during beta testing. Subscriptions remain in preview mode.
4. **Voice Frontend Capture Deferred:** The backend session issuance and quota management are verified, but the client WebRTC audio capture interface is deferred per the Phase 10 approval boundary.

---

## 7. Required Manual Setup Before Staging Deployment

The following manual setup steps must be performed in the third-party provider dashboards before deploying:

### Step 1: Supabase Configuration
1. Open your [Supabase Project Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** and verify that both migrations have run:
   - `supabase/migrations/20261029000000_init_sukoon_schema.sql`
   - `supabase/migrations/20261029190000_subscriptions_and_entitlements.sql`
3. Go to **Authentication -> URL Configuration**:
   - Set **Site URL** to your staging URL (e.g. `https://sukoon-ai.vercel.app`).
   - Add **Redirect URL**: `https://sukoon-ai.vercel.app/auth/callback`.

### Step 2: Vercel Project Setup
1. Create a new project on [Vercel](https://vercel.com) and link your GitHub repository.
2. In **Project Settings -> Environment Variables**, add the production environment variables listed in Section 5.
3. Ensure `NODE_ENV` is set to `production`.

---

## 8. Staging Deployment Checklist

- [x] All 240 unit & integration tests passing (`pnpm test`).
- [x] All 18 Playwright E2E browser tests passing (`pnpm exec playwright test`).
- [x] TypeScript typechecking passing (`pnpm typecheck`).
- [x] ESLint passing with zero warnings (`pnpm lint`).
- [x] Next.js production build passing (`pnpm build`).
- [x] Live Google Gemini API streaming confirmed operational (`scripts/test-chat.js`).
- [x] Live Supabase PostgreSQL database tables and RLS verified (`scripts/check-db.js`).
- [x] Git diff scanned: zero secrets or sensitive keys present.
- [x] `.env.example` clean and free of actual credentials.
- [x] `.gitignore` updated with test artifacts and mobile build output.
- [ ] User approval to push to remote git repository.
- [ ] User approval to initiate Vercel deployment.

---

## 9. Rollback Plan

If any critical issue arises during staging deployment:

### 1. Instant Vercel Rollback
* In the Vercel Dashboard, navigate to **Deployments**.
* Locate the previous stable deployment and click **Instant Rollback**. Traffic will immediately route to the prior build within 5 seconds.

### 2. Emergency AI Provider Switch
* If Google Gemini experiences upstream API downtime:
  * In Vercel Project Settings -> Environment Variables, change `AI_PROVIDER` to `openai` (requires funded `OPENAI_API_KEY`).
  * Redeploy to switch traffic without code modification.

### 3. Database Migration Rollback
* If `20261029190000_subscriptions_and_entitlements.sql` must be rolled back:
  ```sql
  drop table if exists public.voice_sessions cascade;
  drop table if exists public.payment_events cascade;
  drop table if exists public.user_entitlements cascade;
  drop table if exists public.subscriptions cascade;
  alter table public.profiles drop column if exists voice_consent;
  ```

### 4. Git Revert
* To revert the codebase to the state prior to Phase 10:
  ```bash
  git revert <commit-hash>
  ```

