import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Creates or reuses a client-side Supabase client.
 * Strictly uses NEXT_PUBLIC_ credentials with browser cookies.
 * NEVER uses service-role credentials.
 */
export function createClient(): SupabaseClient<Database> {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
    ) as unknown as SupabaseClient<Database>;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
    ) as unknown as SupabaseClient<Database>;
  }

  return browserClient;
}
