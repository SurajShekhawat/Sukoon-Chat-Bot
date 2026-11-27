import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check Authorization header for mobile clients
  const authHeader = request.headers.get("authorization");
  let user = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const { data } = await supabase.auth.getUser(token);
      user = data.user;
    }
  } else {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  }

  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Protected paths requiring authentication
  const isProtectedPath =
    pathname.startsWith("/chat") ||
    pathname.startsWith("/memories") ||
    pathname.startsWith("/mood") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/api/conversations") ||
    pathname.startsWith("/api/memories") ||
    pathname.startsWith("/api/mood") ||
    pathname.startsWith("/api/goals") ||
    pathname.startsWith("/api/user");

  // Auth pages (login, signup)
  const isAuthPath = pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user && isProtectedPath) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthPath) {
    url.pathname = "/chat";
    url.searchParams.delete("redirectTo");
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
