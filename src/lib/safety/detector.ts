import { LanguageCode } from "@/types/database";
import { SafetyScanResult, SafetyCategory, SafetyAction } from "@/types/safety";
import { getHelplinesForRegion } from "./helplines";

// ============================================================================
// 1. TIER 1: Explicit Acute Crisis Patterns (Suicide, Self-Harm, Violent End)
// ============================================================================
const EXPLICIT_CRISIS_PATTERNS: Record<LanguageCode, RegExp[]> = {
  en: [
    /\b(suicide|suicidal|kill myself|want to die|end(ing)? my life|end it all)\b/i,
    /\b(slit my wrists?|overdose|hang myself|jump off a (bridge|building|cliff))\b/i,
    /\b(self-?harm|cutting myself|hurt myself badly|bleed to death)\b/i,
    /\b(jump in front of a (train|metro|truck|bus))\b/i,
  ],
  hi: [
    /(आत्महत्या|खुदकुशी|जान दे(ना|ने|नी)|मर जाना चाह(ता|ती) हूँ)/,
    /(फांसी लगाना|नस काट(ना|कर|ने)|ज़हर खा(ना|कर)|अपनी जान (देना|लेना|लेने|देने|दे दूंगा|दे दूंगी|ले लूंगा|ले लूंगी)|अब नहीं जीना)/,
    /(मरने का मन|जी कर क्या करूँ|सब खत्म कर देना चाह(ता|ती) हूँ)/,
    /(ट्रेन के आगे कूद|पंखे से लटक|छत से कूद)/,
  ],
  hinglish: [
    /\b(suicide|mar jana chahta hu|mar jana chahti hu|jaan de dunga|jaan de dungi)\b/i,
    /\b(ab jeene ka mann nahi hai|zinda rehna nahi chahta|zinda rehna nahi chahti)\b/i,
    /\b(sab khatam kar dunga|sab khatam kar dungi|apni jaan le lunga|apni jaan le lungi)\b/i,
    /\b(nas kaat lunga|nas kaat lungi|phaansi laga lunga|zahar kha lunga)\b/i,
    /\b(kud jaunga|kud jaungi|train ke aage|chhat se kud)\b/i,
  ],
};

// ============================================================================
// 2. TIER 2: Ambiguous Distress & Implicit Despair (Going Beyond Keywords)
// ============================================================================
const AMBIGUOUS_DISTRESS_PATTERNS: RegExp[] = [
  /\b(no (reason|point) (to|in) (waking|wake) up|don't want to wake up( ever)?|never want to wake up)\b/i,
  /\b(better off without me|everyone (would|will) be better off without me)\b/i,
  /\b(nobody (would|will) (care|notice|miss me) if i (disappeared|was gone|died))\b/i,
  /\b(nothing left to (live for|give)|completely empty and done with (this world|life))\b/i,
  /\b(can't take this pain anymore|just make (it|the pain) all stop forever)\b/i,
  /\b(giving away all my (things|possessions|belongings) because i won't need them)\b/i,
  // Hinglish implicit despair
  /\b(kash main kal (subah )?na uthu|kash kal ka din na dekhna pade)\b/i,
  /\b(mere bina sab (zyada )?khush rahenge|sabko mere bina aasaani hogi)\b/i,
  /\b(ab jeene ka koi (matlab|fayda) nahi (hai|raha)|meri zindagi ka koi maksad nahi)\b/i,
  /\b(main is duniya se thak chuka hu|ab bas sab khatam ho jaye)\b/i,
  // Hindi implicit despair
  /(काश मैं कल( सुबह)? कभी न उठूँ|काश मैं हमेशा के लिए सो जाऊँ)/,
  /(सबके लिए मेरे बिना अच्छा होगा|मेरे बिना सब खुश रहेंगे)/,
  /(अब जीने का कोई मतलब नहीं|कुछ नहीं बचा मेरे पास)/,
  /(इस दर्द को हमेशा के लिए खत्म करना है|अब और बर्दाश्त नहीं होता)/,
];

// ============================================================================
// 3. TIER 3: Harmful Advice & Dangerous Request Interceptor
// ============================================================================
const HARMFUL_ADVICE_PATTERNS: RegExp[] = [
  /\b(how to (tie|make) a noose|how to hang (myself|oneself))\b/i,
  /\b(what pills (can (i|we|you)|to) (overdose|take to die)|(how many|what) pills (can|to) (overdose|kill)|lethal (dose|amount|quantity) of|fatal (dose|amount) of)\b/i,
  /\b(painless ways? to (die|commit suicide)|how to (kill myself|die) painlessly|best ways? to (commit suicide|die))\b/i,
  /\b(how to cut (my |the |your )?wrists?|where to cut to bleed out)\b/i,
  /\b(which poison is (best|lethal|fastest)|how to jump without surviving)\b/i,
  // Hinglish dangerous requests
  /\b(marne ka (sabse )?(aasan|painless|accha|achha) tarika)\b/i,
  /\b(kaunsi dawai se (jaan chali|maut ho) jati hai|kitni goli khane se maut)\b/i,
  /\b(zeher kahan milega|phansi ka fanda kaise banaye)\b/i,
  // Hindi dangerous requests
  /(मरने का आसान तरीका|फांसी का फंदा कैसे बनाते हैं)/,
  /(ज़हर कहाँ से मिलेगा|कौन सी दवा खाने से मौत होती है)/,
  /(बिना दर्द के जान कैसे दें|नस कहाँ से काटनी चाहिए)/,
];

// ============================================================================
// 4. TIER 4: Prompt Injection & Adversarial Boundary Scrubber
// ============================================================================
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /\b(ignore (all )?(previous|prior|above) instructions|disregard (all )?(previous|system) (instructions|directives))\b/i,
  /\b(system override|mode: unrestricted|jailbreak|DAN mode|developer mode enabled)\b/i,
  /\b(forget (that )?you are an ai|act as (my )?(licensed )?(psychiatrist|doctor|therapist) and (prescribe|diagnose))\b/i,
  /(<\/untrusted_user_message>|<system_override>|<!-- SYSTEM PROMPT VERSION)/i,
  /\b(output (your )?(complete )?system prompt|repeat the instructions starting from)\b/i,
  /\b(reveal your (secret|hidden) instructions|disclose (the )?system instructions)\b/i,
];

// ============================================================================
// 5. General Concern Patterns (Lower severity, compassionate pacing)
// ============================================================================
const CONCERN_PATTERNS: RegExp[] = [
  /\b(hopeless|worthless|depressed|can't go on|give up on life)\b/i,
  /\b(koi umeed nahi hai|bohot akela feel ho raha hai|sab bikhar gaya)\b/i,
  /(बहुत अकेलापन|कोई उम्मीद नहीं|सब बिखर गया)/,
];

// ============================================================================
// 6. Benign Exclusions (Prevents False Positives from Harmless Idioms)
// ============================================================================
const BENIGN_EXCLUSIONS: RegExp[] = [
  /\b(killer (headache|workout|deal|move|song|party|outfit|presentation|bug|coffee|speed|app|feature))\b/i,
  /\b(died laughing|dying of laughter|dying to (see|know|try|hear))\b/i,
  /\b(dead tired|dead exhausted|dead serious|dead asleep|drop dead gorgeous)\b/i,
  /\b(killing it (at work|on stage|today)|killing time)\b/i,
  // Hinglish benign idioms
  /\b(thak (ke|kar) mar gaya|mar gaya thak kar|kaam ne jaan le li)\b/i,
  /\b(itni thakaan hai ki mar gaya|itna hasa ki pet mein dard)\b/i,
];

/**
 * Scans an incoming user message across multi-tier safety defenses:
 * 1. False positive elimination (benign idioms)
 * 2. Harmful advice & dangerous request interception
 * 3. Prompt injection & jailbreak detection
 * 4. Explicit acute crisis & suicidal ideation
 * 5. Ambiguous distress & implicit despair (multi-token intent)
 * 6. Emotional concern & non-acute support
 */
export function scanUserMessage(
  text: string,
  preferredLanguage: LanguageCode = "hinglish",
  countryCode: "IN" | "US" | "GLOBAL" = "IN"
): SafetyScanResult {
  const normalized = text.trim();
  if (!normalized) {
    return {
      isSafe: true,
      level: "safe",
      category: "safe",
      recommendedHelplines: [],
      recommendedAction: "proceed",
      confidence: 1.0,
    };
  }

  // 1. Check for benign idiomatic expressions first (false positive defense)
  for (const exclusion of BENIGN_EXCLUSIONS) {
    if (exclusion.test(normalized)) {
      return {
        isSafe: true,
        level: "safe",
        category: "safe",
        recommendedHelplines: [],
        recommendedAction: "proceed",
        confidence: 0.95,
      };
    }
  }

  const helplines = getHelplinesForRegion(countryCode);

  // 2. Check for Harmful Advice / Lethal Instructions (IMMINENT DANGER)
  for (const pattern of HARMFUL_ADVICE_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        level: "crisis",
        category: "harmful_advice",
        matchedPattern: pattern.source,
        detectedLanguage: preferredLanguage,
        recommendedHelplines: helplines,
        recommendedAction: "intercept_and_halt",
        confidence: 1.0,
      };
    }
  }

  // 3. Check for Prompt Injection / Adversarial Jailbreaks
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        level: "crisis", // Halted from LLM execution to prevent boundary bypass
        category: "prompt_injection",
        matchedPattern: pattern.source,
        detectedLanguage: preferredLanguage,
        recommendedHelplines: [],
        recommendedAction: "neutralize_injection",
        confidence: 0.98,
      };
    }
  }

  // 4. Check for Explicit Crisis Across Supported Languages
  const hasDevanagari = /[\u0900-\u097F]/.test(normalized);
  const languageCheckOrder: LanguageCode[] = hasDevanagari
    ? ["hi", preferredLanguage === "hi" ? "hinglish" : preferredLanguage, "en"]
    : [preferredLanguage, "hinglish", "en", "hi"].filter(
        (v, i, a) => a.indexOf(v) === i
      ) as LanguageCode[];

  for (const lang of languageCheckOrder) {
    for (const pattern of EXPLICIT_CRISIS_PATTERNS[lang]) {
      if (pattern.test(normalized)) {
        return {
          isSafe: false,
          level: "crisis",
          category: "self_harm",
          matchedPattern: pattern.source,
          detectedLanguage: lang,
          recommendedHelplines: helplines,
          recommendedAction: "intercept_and_halt",
          confidence: 0.99,
        };
      }
    }
  }

  // 5. Check for Ambiguous Distress & Implicit Despair (Not just explicit keywords)
  for (const pattern of AMBIGUOUS_DISTRESS_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isSafe: false,
        level: "crisis",
        category: "ambiguous_distress",
        matchedPattern: pattern.source,
        detectedLanguage: preferredLanguage,
        recommendedHelplines: helplines,
        recommendedAction: "intercept_and_halt",
        confidence: 0.92,
      };
    }
  }

  // 6. Check for Secondary Concern Patterns (Lower severity, compassionate pacing)
  for (const pattern of CONCERN_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        isSafe: true, // Not an acute block, but flagged for supportive presence
        level: "concern",
        category: "general_concern",
        matchedPattern: pattern.source,
        detectedLanguage: preferredLanguage,
        recommendedHelplines: helplines,
        recommendedAction: "ground_with_compassion",
        confidence: 0.85,
      };
    }
  }

  return {
    isSafe: true,
    level: "safe",
    category: "safe",
    detectedLanguage: preferredLanguage,
    recommendedHelplines: [],
    recommendedAction: "proceed",
    confidence: 1.0,
  };
}
