import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Role-based route configuration
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/admin"],
  team_leader: ["/team-leader"],
  supervisor: ["/supervisor"],
  assistant: ["/assistant"],
  permanent_worker: ["/worker"],
  adhoc_worker: ["/worker"],
};

const ROLE_REDIRECT: Record<string, string> = {
  admin: "/admin",
  team_leader: "/team-leader",
  supervisor: "/supervisor",
  assistant: "/assistant",
  permanent_worker: "/worker",
  adhoc_worker: "/worker",
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Optimize: Skip heavy auth checks for prefetch requests to speed up client-side transitions
  const isPrefetch =
    request.headers.get("x-purpose") === "prefetch" ||
    request.headers.get("purpose") === "prefetch";

  if (isPrefetch) {
    return supabaseResponse;
  }

  // Get the current session (uses local cookie decoding - instant, <1ms)
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // AUTH GUARD: Redirect unauthenticated users to login
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (!user && pathname !== "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Redirect authenticated users away from login page
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (user && pathname === "/login") {
    // Get user role from metadata
    const role = user.user_metadata?.role || "permanent_worker";
    const url = request.nextUrl.clone();
    url.pathname = ROLE_REDIRECT[role] || "/worker";
    return NextResponse.redirect(url);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ROOT redirect
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (user && pathname === "/") {
    const role = user.user_metadata?.role || "permanent_worker";
    const url = request.nextUrl.clone();
    url.pathname = ROLE_REDIRECT[role] || "/worker";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
