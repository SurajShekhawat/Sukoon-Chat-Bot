/**
 * Sukoon AI — System Prompt Version & Integrity Registry
 */

export interface SystemPromptVersionInfo {
  version: string;
  releasedAt: string;
  codename: string;
  changelog: string[];
}

export const CURRENT_SYSTEM_PROMPT_VERSION: SystemPromptVersionInfo = {
  version: "2026-10-29.v2-companion-multilingual",
  releasedAt: "2026-10-29T15:50:00Z",
  codename: "Sukoon Empathetic Presence & Multilingual Vault",
  changelog: [
    "Strict non-clinical identity enforcement (never pretend to be a therapist/doctor; zero diagnoses/prescriptions).",
    "Active listening precedence (sit with emotions and reflect reality before introducing any advice).",
    "Anti-toxic-positivity directives (prohibit superficial clichés like 'Everything happens for a reason' or 'Just smile').",
    "Thoughtful, open-ended follow-up questioning.",
    "Anti-dependency boundaries (refuse exclusive companion claims; encourage real-world relationships).",
    "Untrusted memory vault encapsulation with strict anti-hallucination enforcement.",
    "Prompt injection defense via <untrusted_user_message> boundary enforcement.",
    "Extensible multilingual directive support for Hindi (Devanagari), Hinglish, and English.",
  ],
};

