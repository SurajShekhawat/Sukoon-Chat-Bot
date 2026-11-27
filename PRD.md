# PRD.md: Product Requirements Document — Sukoon AI (सकून AI)

## 1. Executive Summary & Vision
Sukoon AI is an emotionally intelligent, warm, culturally attuned multilingual AI companion designed to help people work through everyday problems, loneliness, relationship friction, career dilemmas, personal goals, and emotional overwhelm.

**Sukoon (سُکون / सुकून)** stands for inner peace, emotional solace, and calm reassurance. Unlike transactional chatbots or generic assistants, Sukoon AI models the qualities of a trusted, grounded confidant: it actively listens and reflects emotion before offering perspective, remembers context strictly with consent, respects user boundaries, and intentionally directs users toward healthy real-world connections.

---

## 2. Core Product Principles & Non-Negotiable Boundaries

1. **Transparent Identity:** Sukoon AI is an AI companion. It never pretends to be human, never claims to be a licensed psychologist, doctor, or medical provider, and explicitly clarifies its boundaries.
2. **Listen First, Advise Second:** Validation, curiosity, and emotional presence precede advice. The AI should not rush into "solution mode" when someone needs to be heard.
3. **Guard Against Dependency:** Sukoon AI resists emotional monopolization. It prompts users to share breakthroughs with friends, family, mentors, or support circles.
4. **Consent-Driven Memory:** User details are never stored implicitly or permanently without user permission. Users maintain complete visibility, editability, and deletion rights over every memory.
5. **No Hallucinated Memories:** The AI never assumes or fabricates memories not present in verified context.
6. **Safety First (Not Keyword-Only):** The platform combines deterministic pattern checks, semantic intent classification, and compassionate de-escalation workflows. When acute crisis or self-harm is detected, standard chat halts and prominent, localized crisis resources are surfaced.

---

## 3. User Personas & Use Cases

### 3.1 Personas
- **Priya (23, Bangalore - Software Engineer):** Relocated from a small town. Struggles with imposter syndrome, workplace isolation, and evening loneliness. Communicates predominantly in Hinglish. Needs a non-judgmental space to decompress after work.
- **Rahul (29, Delhi - Marketing Specialist):** Grappling with career crossroads, family expectations around marriage, and financial stress. Switches between Hindi and English depending on how vulnerable he feels.
- **Ananya (35, Mumbai - Independent Consultant):** Uses Sukoon as a daily reflective sounding board, mood tracking journal, and accountability partner for personal boundaries.

### 3.2 Primary Use Cases
1. **Emotional Decompression:** Venting about a stressful workday or difficult interaction.
2. **Perspective & Sounding Board:** Sorting out thoughts before an important conversation or decision.
3. **Loneliness Alleviation:** Having a comforting, non-transactional conversation late at night.
4. **Goal & Habit Reflection:** Setting small, sustainable personal growth goals and checking in.
5. **Crisis Triage:** Safe handoff when acute distress, self-harm, or trauma arises.

---

## 4. Multilingual & Cultural Grounding

### Supported Modes:
- **Hindi (हिन्दी):** Natural, warm conversational Hindi in Devanagari script. Avoids stilted formal Sanskritized vocabulary and mechanical translations.
- **Hinglish (हिंग्लिश):** Fluent Romanized conversational Hindi mixed naturally with English, ubiquitous in contemporary Indian texting (*"Main samajh sakta hoon ki office ka atmosphere kafi overwhelming ho gaya tha..."*).
- **English:** Empathetic, grounded, international conversational English.
- **Extensible Architecture:** Pluggable language configurations allowing future expansion into regional languages (e.g., Tamil, Telugu, Marathi, Bengali).

---

## 5. Functional Feature Requirements

### 5.1 Authentication & Profiles
- Email + password and social sign-in via Supabase Auth.
- Secure HTTP-only cookies and JWT validation on all API requests.
- User profile: Preferred name/nickname, primary communication language, memory consent toggle, and theme preference.

### 5.2 Conversational Experience
- Server-Sent Events (SSE) streaming with low time-to-first-token (TTFT < 800ms).
- Full conversation management:
  - Create new conversation
  - Dynamic conversation naming based on initial exchange
  - Search conversation history
  - Archive, rename, and delete conversation
  - Stop ongoing streaming generation at any point
  - Retry/regenerate assistant responses
- Persistent message history backed by Supabase PostgreSQL.

### 5.3 Consent-Based Long-Term Memory
- Zero automatic background storage without consent.
- Extraction engine identifies candidate memories (e.g., family members, exam dates, career milestones).
- User options:
  - Manual memory creation in the Memory Vault.
  - In-chat confirmation prompt ("Would you like me to remember that your sister's name is Pooja?").
  - Dedicated Memory Vault UI with view, edit, toggle active, and delete options.

### 5.4 Mood Journal & Growth Goals
- Daily mood check-in (1-5 visual scale with mood tags: Calm, Hopeful, Overwhelmed, Anxious, Content, Tired).
- Contextual reflection: Option to transition a chat into a mood log entry or vice versa.
- Lightweight personal growth goals with status tracking (`in_progress`, `completed`).

### 5.5 Safety & Crisis Workflows
- Multi-tier detection for self-harm, suicidal ideation, abuse, and acute distress.
- Immediate deterministic interceptor stops regular LLM completion.
- Compassionate de-escalation response paired with localized helpline cards:
  - Tele-MANAS (14416 / 1800-891-4416 - India 24/7 Toll-Free)
  - KIRAN (1800-599-0019 - India Govt)
  - Vandrevala Foundation (+91 9999 666 555 - 24/7)
  - AASRA (+91 98204 66726)
  - Global Crisis Support (988)

### 5.6 Privacy & Account Deletion
- Strict data isolation via PostgreSQL Row Level Security (RLS).
- Zero LLM model training on user chat data.
- Complete self-serve account deletion ("Right to be Forgotten") with full cascading purge.
- Data export in standard JSON format.

### 5.7 Multi-Model AI Architecture & NVIDIA NIM Integration
- **Modular Provider System:** Pluggable adapter architecture supporting Google Gemini (primary default companion), OpenAI (secondary fallback), and NVIDIA NIM (hosted catalog for accelerated reasoning and specialized tasks).
- **Intelligent Task-Based Routing:** Routes queries to candidate models based on task domain:
  - *Companion Chat & Emotional Support:* Strict affinity to vetted primary companion models (`gemini-3.5-flash-lite`).
  - *Complex Reasoning:* Accelerated deep reasoning models (`nvidia/nemotron-3.5-super-vl-120b-a12b`).
  - *Coding & Agentic Workflows:* Specialized high-context MoE models (`minimaxai/minimax-m3.1-flash`).
  - *Summaries:* Fast extraction and contextual synthesis.
  - *Experimental Audio/Vision:* Preview support for Magpie TTS and Cosmos world foundation models (safely unmounted in MVP).
- **Deployment Licensing Safeguard:** Automatic enforcement flagging free hosted endpoints as `DEVELOPMENT_ONLY` unless verified with an enterprise NIM production entitlement.
- **Admin AI Configuration Center:** Real-time provider health monitoring, live latency probing, task routing policies, and capability matrix controls without client-side API key exposure.

---

## 6. Non-Functional Requirements
- **Performance:** Sub-second response initiation via streaming.
- **Security:** Strict authorization boundaries, Zod schema validation on every API endpoint, no secrets in client bundles.
- **Accessibility:** WCAG 2.1 AA compliant, screen-reader friendly, accessible keyboard navigation, high-contrast dark/warm themes.
- **Reliability:** Graceful offline handling, optimistic UI updates, resilient retry mechanisms with exponential backoff.
- **Device Support:** Fully responsive mobile-first web layout; structured for future Expo React Native mobile apps.
