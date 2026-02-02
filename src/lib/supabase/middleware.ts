import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

// Cache launch mode for 5 seconds to avoid hitting the database on every request
// Short TTL ensures changes propagate quickly while still reducing DB load
let launchModeCache: { isPreLaunch: boolean; timestamp: number } | null = null;
const CACHE_TTL = 5 * 1000; // 5 seconds

async function getLaunchModeFromDB(): Promise<boolean> {
  // Check cache first
  if (launchModeCache && Date.now() - launchModeCache.timestamp < CACHE_TTL) {
    return launchModeCache.isPreLaunch;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return true; // Default to pre-launch if not configured
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "launch_mode")
      .single();

    const isPreLaunch = error || !data ? true : (data.value as { is_pre_launch?: boolean }).is_pre_launch ?? true;

    // Update cache
    launchModeCache = { isPreLaunch, timestamp: Date.now() };

    return isPreLaunch;
  } catch {
    return true;
  }
}

async function isUserAdmin(userId: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey || !userId) {
    return false;
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase
      .from("admin_roles")
      .select("user_id")
      .eq("user_id", userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
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

  // Refresh the session if expired - important for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Always allow these routes regardless of launch mode
  const alwaysAllowedRoutes = [
    "/admin",
    "/api",
    "/privacy",
    "/terms",
    "/cookies",
    "/contact",
  ];
  const isAlwaysAllowed = alwaysAllowedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check launch mode for non-allowed routes
  if (!isAlwaysAllowed && pathname !== "/") {
    const isPreLaunch = await getLaunchModeFromDB();

    if (isPreLaunch) {
      // Check if user is admin - admins can access everything
      const userIsAdmin = user ? await isUserAdmin(user.id) : false;

      if (!userIsAdmin) {
        // Routes blocked during pre-launch (redirect to homepage)
        const blockedRoutes = [
          "/dashboard",
          "/filter",
          "/history",
          "/billing",
          "/settings",
          "/family",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/pricing",
          "/features",
          "/how-it-works",
          "/extension",
          "/faq",
          "/about",
          "/status",
          "/help",
          "/blog",
          "/careers",
          "/credits",
        ];

        const isBlockedRoute = blockedRoutes.some((route) =>
          pathname.startsWith(route)
        );

        if (isBlockedRoute) {
          const url = request.nextUrl.clone();
          url.pathname = "/";
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // Protected routes (require authentication when not in pre-launch)
  const protectedRoutes = [
    "/dashboard",
    "/filter",
    "/history",
    "/billing",
    "/settings",
    "/family",
    "/admin",
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth routes (redirect if logged in)
  const authRoutes = ["/login", "/signup", "/forgot-password"];
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Only apply auth checks if not in pre-launch mode (pre-launch already handled above)
  const isPreLaunch = await getLaunchModeFromDB();

  if (!isPreLaunch) {
    if (isProtectedRoute && !user) {
      // Redirect to login if trying to access protected route without auth
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthRoute && user) {
      // Redirect to dashboard if trying to access auth routes while logged in
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
