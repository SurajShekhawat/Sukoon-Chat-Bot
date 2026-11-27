import { Platform } from "react-native";

/**
 * Mobile Client Environment Configuration
 * Strictly adheres to security rules:
 * - NO API keys for OpenAI or Gemini are ever bundled in the mobile app.
 * - Only public Supabase project URL and anon public key are used for user session management.
 * - All AI generation, safety classification, and safety audit logging happen on the backend server.
 */

const getDevApiUrl = () => {
  // 10.0.2.2 is the special Android Emulator alias for host machine's localhost (3000)
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }
  return "http://localhost:3000";
};

export const env = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || getDevApiUrl(),
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
  
  HELPLINES: [
    { name: "Tele-MANAS (Govt. of India)", number: "14416", timing: "24/7 Free & Confidential" },
    { name: "KIRAN Helpline", number: "1800-599-0019", timing: "24/7 Multilingual" },
    { name: "Vandrevala Foundation", number: "+91 9999 666 555", timing: "24/7 Free Support" },
  ],
};

