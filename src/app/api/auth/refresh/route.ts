import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Logging helper for consistent format
function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [AUTH-REFRESH] [${context}] ${message}${dataStr}`);
}

/**
 * POST /api/auth/refresh
 * Refreshes an access token using a refresh token
 *
 * Body:
 *   { refreshToken: string }
 */
export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    log(requestId, "=== Token Refresh Request ===");

    const body = await request.json();
    const { refreshToken } = body;

    log(requestId, "Request body", { hasRefreshToken: !!refreshToken, refreshTokenLength: refreshToken?.length });

    if (!refreshToken) {
      log(requestId, "Missing refresh token - returning 400");
      return NextResponse.json(
        { error: "Missing refresh token" },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    log(requestId, "Calling Supabase refreshSession");

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    log(requestId, "Supabase response", {
      hasSession: !!data.session,
      hasError: !!error,
      errorMessage: error?.message,
      userId: data.session?.user?.id
    });

    if (error || !data.session) {
      log(requestId, "Refresh failed", { error: error?.message });
      return NextResponse.json(
        { error: error?.message || "Failed to refresh token" },
        { status: 401 }
      );
    }

    // IMPORTANT: Convert expiresAt to milliseconds for JS Date.now() comparison
    const expiresAtMs = (data.session.expires_at || 0) * 1000;

    log(requestId, "Refresh successful", {
      expiresAt_seconds: data.session.expires_at,
      expiresAt_ms: expiresAtMs,
      expiresIn_minutes: Math.round((expiresAtMs - Date.now()) / 60000)
    });

    // Return with field names matching what the extension expects
    return NextResponse.json({
      token: data.session.access_token,         // Extension expects 'token', not 'accessToken'
      refreshToken: data.session.refresh_token,
      expiresAt: expiresAtMs,                   // In milliseconds
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
      },
    });
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
