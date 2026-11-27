import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SupabaseClient, createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { Database } from "@/types/database";

/**
 * Creates a server-side Supabase client.
 * Supports:
 * 1. Mobile & API Clients: Authorization: Bearer <jwt> header
 * 2. Web SSR Clients: Next.js cookie-bound session
 *
 * Operates under the authenticated user's session context so all
 * PostgreSQL Row Level Security (RLS) policies are automatically enforced.
 * NEVER uses service-role credentials here.
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  // 1. Check if Bearer token is provided in headers (Mobile Client support)
  try {
    const headerList = await headers();
    const authHeader = headerList.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      if (token) {
        return createSupabaseClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
            },
          }
        );
      }
    }
  } catch {
    // headers() might not be available outside of a request context (e.g., test runs)
  }

  // 2. Web SSR: Cookie-bound client
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
}

/**
 * Creates an admin Supabase client with the service-role key.
 * Strictly used ONLY for backend maintenance (e.g. cascading user account deletion).
 * NEVER import or invoke this in client components or browser code.
 */
export function createAdminClient(): SupabaseClient<Database> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for administrative tasks.");
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  ) as unknown as SupabaseClient<Database>;
}
