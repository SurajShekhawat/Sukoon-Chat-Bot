# PRIVACY.md: Privacy Governance, Consent & Data Protection

## 1. Compliance & Privacy Philosophy

Sukoon AI handles deeply personal and emotional reflections. Privacy is treated not merely as a regulatory requirement, but as an indispensable prerequisite for psychological safety.

### Governing Frameworks:
- **India DPDP Act 2023:** Digital Personal Data Protection Act standards for lawful processing, explicit consent, user notice, and right to erasure.
- **GDPR & CCPA Alignment:** Principles of data minimization, purpose limitation, transparency, and self-serve deletion.

---

## 2. Consent-Driven Memory Governance

### 2.1 The Principle of Informed Consent
- **Zero Passive Scraping:** Sukoon AI never indexes background facts into persistent memory without explicit consent or user-enabled auto-consent settings.
- **Granular Control in Memory Vault:**
  - View all active memories in plain text.
  - Edit or refine inaccurate memories.
  - Deactivate/pause memories without deleting them.
  - Delete individual memories permanently.
  - Wipe all memories with one click.

### 2.2 Proactive In-Chat Confirmation
When the assistant detects a salient fact that might help future empathy (e.g., *"My mother had surgery last week"*), it can ask:
> *"Would you like me to remember that your mother recently had surgery so I can keep that context in mind for our future conversations?"*

If the user declines, the information remains strictly in the transient conversation window and is never committed to `memories`.

---

## 3. Data Protection & Model Training Guarantees

### 3.1 Zero Third-Party Model Training
- API calls to OpenAI utilize commercial endpoints configured under terms that guarantee user prompts, completions, and conversation history are **not** used to train OpenAI foundational models.
- No client-side analytics scripts (e.g. Google Analytics, Hotjar) capture conversational text, user input, or emotional ratings.

### 3.2 Tenant Isolation via Row Level Security (RLS)
- Cross-user data leakage is prevented at the database kernel level through Supabase PostgreSQL Row Level Security.
- Every read, update, insert, and delete is authenticated against `auth.uid() = user_id`.

---

## 4. Log Sanitization & Redaction

### 4.1 Log Masking Policy
Application performance logs (Vercel, Supabase logs, server console) must **never** record:
- User chat messages or assistant completions.
- Memory contents or extracted entities.
- Mood journal notes.
- Passwords or raw authentication tokens.

### 4.2 Allowable Telemetry Metrics
Server telemetry is restricted to:
- HTTP method, status code, latency, and sanitized route (e.g., `POST /api/chat - 200 OK - 420ms`).
- Token usage counts for billing and quota controls (e.g., `prompt_tokens: 150, completion_tokens: 85`).
- Anonymized error codes and stack traces stripped of request payloads.

---

## 5. Right to Be Forgotten & Account Deletion

Users possess complete sovereignty over their data.

### 5.1 Self-Serve Account Deletion Workflow
Initiated via **Settings > Danger Zone > Delete Account**:
1. User provides password confirmation or re-authentication challenge.
2. System calls `/api/user/account` with authenticated credentials.
3. Server executes a transactional cascading deletion:
   ```sql
   -- Purge messages
   delete from public.messages where user_id = current_user_id;
   -- Purge conversations
   delete from public.conversations where user_id = current_user_id;
   -- Purge memories
   delete from public.memories where user_id = current_user_id;
   -- Purge mood entries and goals
   delete from public.mood_entries where user_id = current_user_id;
   delete from public.goals where user_id = current_user_id;
   -- Purge profile
   delete from public.profiles where id = current_user_id;
   -- Permanently remove auth identity in Supabase Auth
   ```
4. Client session cookies are invalidated and purged.
5. User is redirected to the home page with a confirmation notification.

---

## 6. Data Export (Portability)
Users can download a complete machine-readable archive (`sukoon-data-export.json`) containing their profile metadata, conversation histories, memories, and mood logs at any time via **Settings > Export Data**.

---

## 7. Data Retention Lifecycles, Backup Policies & Provider-Side Limitations

### 7.1 Live Database Retention vs. Revocation
1. **Revocation (`is_active = false`):**
   - When a user revokes or pauses a memory item, the record remains in their private table for inspection or reactivation, but is immediately and strictly excluded from all server-side AI prompt generation.
   - When a user pauses the master memory vault (`profiles.memory_consent = false`), zero memories are accessed or injected, regardless of individual memory states.
2. **Permanent Deletion (`DELETE FROM public.memories`):**
   - Individual memory deletion executes a transactional hard-delete (`DELETE`) from the PostgreSQL table immediately.
   - The row is expunged and cannot be retrieved through the application or API.

### 7.2 Database Backup Retention & Roll-off Windows
- **Disaster Recovery Backups:** Supabase automated daily backups and Point-In-Time Recovery (PITR) Write-Ahead Logs (WAL) capture database states for business continuity and disaster recovery.
- **Roll-off Schedule:** Database snapshots are encrypted at rest (AES-256) and are retained on a rolling 7-day to 30-day retention schedule.
- **Permanent Purge:** Disaster recovery snapshots roll off automatically as the retention window elapses. Once a backup snapshot expires, deleted records are permanently, physically, and irreversibly unrecoverable.
- Backups are isolated from production querying and are only restored in the event of catastrophic infrastructure failure.

### 7.3 Third-Party Provider Limitations (OpenAI API)
1. **Zero Model Training:** Sukoon AI utilizes commercial OpenAI API endpoints with contractual guarantees that API inputs, completions, and conversation context are **never used to train or improve OpenAI foundational models**.
2. **Transient Abuse Monitoring Window:** Under standard OpenAI API terms, request and response payloads may be retained on OpenAI's secure servers for up to **30 days solely for the purpose of detecting abuse and misuse**, after which they are permanently deleted. For enterprise Zero Data Retention (ZDR) configurations, transient logging is disabled entirely.
3. **No Third-Party Telemetry:** Sukoon AI does not use third-party analytics trackers, session replay tools, or advertising SDKs. User conversations, emotional journal entries, and memory contents never touch third-party marketing infrastructure.
