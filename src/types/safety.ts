import { LanguageCode } from "./database";

export type SafetyLevel = "safe" | "concern" | "crisis";

export type SafetyCategory =
  | "safe"
  | "self_harm"
  | "imminent_danger"
  | "ambiguous_distress"
  | "harmful_advice"
  | "prompt_injection"
  | "general_concern";

export type SafetyAction =
  | "proceed"
  | "ground_with_compassion"
  | "intercept_and_halt"
  | "neutralize_injection";

export interface EmergencyHelpline {
  id: string;
  name: string;
  number: string;
  availableHours: string;
  description: string;
  languages: string[];
  website?: string;
  country: "IN" | "US" | "GLOBAL";
}

export interface SafetyScanResult {
  isSafe: boolean;
  level: SafetyLevel;
  category?: SafetyCategory;
  matchedPattern?: string;
  detectedLanguage?: LanguageCode;
  recommendedHelplines: EmergencyHelpline[];
  recommendedAction?: SafetyAction;
  confidence?: number;
}
