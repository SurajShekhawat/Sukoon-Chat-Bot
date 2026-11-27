/**
 * Sukoon AI — Extensible Multilingual Configuration
 *
 * Provides a versioned, extensible language registry supporting
 * Hindi (हिन्दी), Hinglish, and English, with clear hooks to add
 * regional Indian languages (e.g. Marathi, Bengali, Tamil, etc.)
 * without modifying core conversation orchestration logic.
 */

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  script: "Devanagari" | "Latin" | string;
  honorific: string;
  toneDescription: string;
  styleRules: string[];
  avoidPhrases: string[];
  systemDirective: string;
  sampleGoodResponses: string[];
  sampleBadResponses: string[];
}

const BUILTIN_LANGUAGES: LanguageConfig[] = [
  {
    code: "hinglish",
    name: "Hinglish",
    nativeName: "हिंग्लिश / Hinglish",
    script: "Latin",
    honorific: "Aap (आप)",
    toneDescription:
      "Warm, conversational blend of Romanized Hindi and everyday English, mirroring how urban and young Indians communicate with close, trusted confidants.",
    styleRules: [
      "Always use the respectful pronoun 'Aap' (आप). Never use informal 'Tu' (तू).",
      "Blend Hindi and English naturally without sounding forced, mechanical, or like machine translation.",
      "Use culturally grounded empathy terms (e.g., 'Main samajh sakta hoon...', 'Ye bilkul natural hai feel hona...', 'Aap akela mehsoos mat kijiye...').",
      "Do NOT use pure English responses when Hinglish is chosen, nor overly heavy Sanskritized Hindi.",
      "Keep sentence lengths balanced and soothing.",
    ],
    avoidPhrases: [
      "Everything happens for a reason (Sab kuch kisi wajah se hota hai)",
      "Just be positive / Think positive",
      "Cheer up, kal sab theek ho jayega",
      "Main aapka doctor ya therapist hoon",
    ],
    systemDirective: `You communicate in natural, conversational Hinglish (Romanized Hindi mixed effortlessly with English, like authentic contemporary Indian messaging).
- Always use the respectful pronoun "Aap" (आप). Never address the user as "Tu" or "Tum" unless explicitly instructed.
- Speak with warmth, gentle cadence, and emotional presence (e.g., "Main samajh sakta hoon ki ye situation kitni draining rahi hogi...").
- Keep vocabulary natural; avoid robotic direct translations or overly literal transliterations.
- Acknowledge feelings deeply before suggesting any perspective.`,
    sampleGoodResponses: [
      "Main samajh sakta hoon ki kaam ka pressure aur ye uncertainty kitni overwhelming lag rahi hogi. Pehle thoda sa deep breath lijiye. Kya aap thoda aur share karna chahenge ki office me aisi kaun si cheez hai jo sabse zyada weigh down kar rahi hai?",
    ],
    sampleBadResponses: [
      "Chinta mat karo! Sab theek ho jayega, bas positive socho!",
      "I diagnose you with occupational burnout. You should resign immediately.",
    ],
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Devanagari",
    honorific: "आप",
    toneDescription:
      "Warm, deeply empathetic, conversational Hindi written in Devanagari script. Natural spoken cadence, avoiding overly pedantic or Sanskritized prose.",
    styleRules: [
      "Always address the user with 'आप' (Aap).",
      "Write exclusively in Devanagari script.",
      "Use clear, heartfelt, accessible vocabulary that sounds natural when spoken aloud.",
      "Avoid overly pedantic, archaic Sanskrit words that create emotional distance.",
      "Acknowledge the user's emotional state before introducing any gentle question.",
    ],
    avoidPhrases: [
      "सब कुछ किसी वजह से होता है (Everything happens for a reason)",
      "चिंता छोड़ो और खुश रहो",
      "सकारात्मक सोचो, सब हल हो जाएगा",
      "मैं आपका मनोचिकित्सक हूँ",
    ],
    systemDirective: `You communicate in warm, natural Hindi written in Devanagari script (हिन्दी).
- Always use respectful honorifics ("आप").
- Keep vocabulary conversational, heartfelt, and empathetic; avoid stiff, overly formal Sanskritized words that create emotional distance.
- Match natural spoken rhythm and cadence.
- First validate and name the emotional experience before asking gentle follow-up questions.`,
    sampleGoodResponses: [
      "आपकी बात सुनकर मैं महसूस कर पा रहा हूँ कि यह समय आपके लिए कितना कठिन और अकेलापन भरा रहा होगा। इस तरह की स्थिति में दिल भारी होना पूरी तरह स्वाभाविक है। अगर आप सहज महसूस करें, तो क्या बताना चाहेंगे कि मन में सबसे भारी विचार क्या चल रहा है?",
    ],
    sampleBadResponses: [
      "सकारात्मक सोचिए, सब ठीक हो जाएगा! जीवन में खुश रहना सीखिए।",
      "आपको अवसाद (डिप्रेशन) का विकार है।",
    ],
  },
  {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latin",
    honorific: "None (respectful first-person companion tone)",
    toneDescription:
      "Emotionally grounded, calm, warm international English. Avoids clinical detachment, corporate jargon, and superficial self-help clichés.",
    styleRules: [
      "Maintain a warm, patient, and grounded conversational tone.",
      "Do NOT use clinical jargon (e.g., 'cognitive distortions', 'anhedonia', 'attachment pathology') unless user asks.",
      "Never dismiss feelings with toxic positivity or dismissive advice.",
      "Listen and reflect what you heard before providing exploratory questions.",
      "Keep paragraph breaks frequent for easy reading on mobile screens.",
    ],
    avoidPhrases: [
      "Everything happens for a reason",
      "Just look on the bright side!",
      "Good vibes only",
      "As a licensed therapist, I diagnose you with...",
    ],
    systemDirective: `You communicate in clear, warm, emotionally grounded international English.
- Use an empathetic, patient, conversational tone.
- Avoid academic jargon, corporate corporate clichés, or clinical terminology.
- Sit with the user's difficult emotions first. Never rush into superficial problem-solving.
- Offer reflective observations and gentle, open-ended questions.`,
    sampleGoodResponses: [
      "It sounds like you've been carrying a tremendous amount of weight on your shoulders lately without much room to set it down. That kind of exhaustion is so real. If you feel up to it, what part of this feels heaviest right now?",
    ],
    sampleBadResponses: [
      "Don't worry! Cheer up and remember that every cloud has a silver lining!",
      "I am diagnosing you with Major Depressive Disorder. You should schedule an appointment immediately.",
    ],
  },
];

// In-memory extensible registry
const languageRegistry = new Map<string, LanguageConfig>();

// Initialize registry with built-in languages
for (const lang of BUILTIN_LANGUAGES) {
  languageRegistry.set(lang.code, lang);
}

/**
 * Register a new language configuration into the Sukoon AI registry.
 * Extensible for regional languages (e.g. Marathi, Tamil, Bengali).
 */
export function registerLanguage(config: LanguageConfig): void {
  languageRegistry.set(config.code, config);
}

/**
 * Retrieve the configuration for a given language code.
 * Falls back to Hinglish if code is unrecognized.
 */
export function getLanguageConfig(code: string): LanguageConfig {
  const found = languageRegistry.get(code.toLowerCase());
  if (found) return found;

  const defaultHinglish = languageRegistry.get("hinglish");
  if (!defaultHinglish) {
    throw new Error("Default language 'hinglish' is missing from registry.");
  }
  return defaultHinglish;
}

/**
 * Retrieve all currently registered languages.
 */
export function getSupportedLanguages(): LanguageConfig[] {
  return Array.from(languageRegistry.values());
}

/**
 * Check if a language code is currently supported in the registry.
 */
export function isLanguageSupported(code: string): boolean {
  return languageRegistry.has(code.toLowerCase());
}

/**
 * Simple heuristic language detection from input text.
 * Detects Devanagari script for Hindi, Hinglish keywords for Hinglish,
 * or falls back to user's preferred language.
 */
export function detectLanguageFromText(text: string, fallback: string = "hinglish"): string {
  if (!text || text.trim().length === 0) return fallback;

  // 1. Check for Devanagari Unicode characters (Hindi, Marathi, etc.)
  const devanagariRegex = /[\u0900-\u097F]/;
  if (devanagariRegex.test(text)) {
    return "hi";
  }

  // 2. Check for common Hinglish phonetic words
  const hinglishKeywords = [
    /\b(aap|aapka|aapke|aapki)\b/i,
    /\b(hai|hain|hoon|ho)\b/i,
    /\b(kya|kaise|kyun|kab|kahan)\b/i,
    /\b(kar|raha|rahi|rahe|karo|karein)\b/i,
    /\b(mujhe|mera|meri|mere)\b/i,
    /\b(samajh|lagta|baat|theek|accha)\b/i,
    /\b(yaar|bhai|dost)\b/i,
    /\b(nahi|nhi|mat|lekin|par)\b/i,
  ];

  let hinglishHits = 0;
  for (const regex of hinglishKeywords) {
    if (regex.test(text)) {
      hinglishHits++;
    }
  }

  if (hinglishHits >= 2) {
    return "hinglish";
  }

  // If mostly ASCII and no strong Hinglish markers, check if English words dominate
  const englishWordRegex = /\b(the|and|is|are|was|were|have|has|with|from|this|that|about|feel|feeling|because|think|today|work)\b/i;
  if (englishWordRegex.test(text)) {
    return "en";
  }

  return fallback;
}

