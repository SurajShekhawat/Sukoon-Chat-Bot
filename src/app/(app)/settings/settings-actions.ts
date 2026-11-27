"use server";

import { revalidatePath } from "next/cache";
import { updateCurrentProfile } from "@/lib/services/profile";

export interface SettingsState {
  error?: string;
  success?: string;
}

export async function updateSettingsAction(
  prevState: SettingsState | undefined,
  formData: FormData
): Promise<SettingsState> {
  const displayName = formData.get("displayName") as string;
  const preferredLanguage = formData.get("preferredLanguage") as "hi" | "hinglish" | "en";
  const memoryConsent = formData.get("memoryConsent") === "on";
  const theme = formData.get("theme") as "warm-light" | "warm-dark" | "system";

  const result = await updateCurrentProfile({
    displayName,
    preferredLanguage,
    memoryConsent,
    theme,
  });

  if (!result.success) {
    return { error: result.error || "Failed to update profile." };
  }

  revalidatePath("/settings");
  revalidatePath("/chat");
  return { success: "Profile settings saved successfully!" };
}

