import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema, UpdateProfileInput } from "@/lib/validation/auth";
import { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Retrieves the current authenticated user's profile.
 * RLS ensures only the row matching auth.uid() can be returned.
 */
export async function getCurrentProfile(): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code === "PGRST116") {
    // Profile not found: auto-provision fallback if trigger has not fired yet
    const newProfile = {
      id: user.id,
      display_name: (user.user_metadata?.full_name as string) || "Friend",
      preferred_language: ((user.user_metadata?.preferred_language as string) || "hinglish") as "hi" | "hinglish" | "en",
      memory_consent: true,
      voice_consent: false,
      theme: "warm-light" as const,
    };

    const { data: created, error: insertError } = await supabase
      .from("profiles")
      .insert(newProfile)
      .select("*")
      .single();

    if (insertError) {
      console.error("Failed to provision profile:", insertError);
      return null;
    }
    return created;
  }

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile;
}

/**
 * Updates the profile of the current authenticated user.
 */
export async function updateCurrentProfile(input: UpdateProfileInput): Promise<{
  success: boolean;
  profile?: ProfileRow;
  error?: string;
}> {
  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const updateData: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {};
  if (parsed.data.displayName !== undefined) updateData.display_name = parsed.data.displayName;
  if (parsed.data.preferredLanguage !== undefined) updateData.preferred_language = parsed.data.preferredLanguage;
  if (parsed.data.memoryConsent !== undefined) updateData.memory_consent = parsed.data.memoryConsent;
  if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme;

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, profile: data };
}

/**
 * Updates the explicit voice consent of the user.
 */
export async function updateVoiceConsent(userId: string, consent: boolean): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ voice_consent: consent })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

