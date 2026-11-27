"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signUpSchema } from "@/lib/validation/auth";

export interface AuthState {
  error?: string;
  success?: string;
}

export async function loginAction(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/chat";

  const validation = loginSchema.safeParse({ email, password });
  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Invalid credentials." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: validation.data.email,
    password: validation.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect(redirectTo);
}

export async function signUpAction(
  prevState: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;
  const preferredLanguage = formData.get("preferredLanguage") as string;

  const validation = signUpSchema.safeParse({
    email,
    password,
    displayName: displayName || "Friend",
    preferredLanguage: preferredLanguage || "hinglish",
  });

  if (!validation.success) {
    return { error: validation.error.errors[0]?.message || "Validation failed." };
  }

  const origin = (await headers()).get("origin") || "http://localhost:3000";
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: validation.data.email,
    password: validation.data.password,
    options: {
      data: {
        full_name: validation.data.displayName,
        preferred_language: validation.data.preferredLanguage,
      },
      emailRedirectTo: `${origin}/auth/callback?next=/chat`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If Supabase has email confirmation enabled, data.session will be null
  if (data.user && !data.session) {
    return {
      success:
        "Account created! Please check your email to confirm your account before logging in.",
    };
  }

  redirect("/chat");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

