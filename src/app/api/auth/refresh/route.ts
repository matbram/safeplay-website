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
 * Request Body:
 *   { refresh_token: string }
 *
 * Success Response (200):
 *   { access_token: string, refresh_token: string, expires_at: number }
 *
 * Error Response (400/401/500):
 *   { error: string }
 */
export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    log(requestId, "=== Token Refresh Request ===");

    const body = await request.json();
    // Accept both snake_case (standard) and camelCase (legacy) for backwards compatibility
    const refreshToken = body.refresh_token || body.refreshToken;

    log(requestId, "Request body", { hasRefreshToken: !!refreshToken, refreshTokenLength: refreshToken?.length });

    // Note: Supabase refresh tokens are short (~12 chars) - this is normal.
    // The access_token is the long JWT, not the refresh_token.
    log(requestId, "Refresh token received", {
      length: refreshToken?.length ?? 0,
      preview: refreshToken ? refreshToken.substring(0, 12) : "MISSING",
    });

    if (!refreshToken) {
      log(requestId, "Missing refresh token - returning 400");
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Create a Supabase client
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    log(requestId, "Calling Supabase refreshSession");

    // Refresh the session using the provided refresh token
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
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    const expiresAt = data.session.expires_at || 0;

    log(requestId, "Refresh successful", {
      expires_at: expiresAt,
      expiresIn_minutes: Math.round((expiresAt * 1000 - Date.now()) / 60000)
    });

    // Return tokens in snake_case format as expected by the Chrome extension
    return NextResponse.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: expiresAt, // Unix timestamp in seconds
    });
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
