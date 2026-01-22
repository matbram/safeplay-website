import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// CORS headers for extension access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper to add CORS headers to responses
function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

/**
 * GET /api/extension/session
 *
 * Returns the current session tokens for the extension.
 * The extension calls this endpoint instead of managing its own refresh tokens.
 * This makes the website the single source of truth for authentication.
 *
 * Query params:
 *   extensionId: string (required) - The Chrome extension ID for validation
 *
 * Success Response (200):
 *   {
 *     authenticated: true,
 *     token: string,           // Access token (JWT)
 *     refreshToken: string,    // Refresh token (12 chars - this is normal for Supabase)
 *     expiresAt: number,       // Expiry in milliseconds
 *     userId: string,
 *     user: { id, email, full_name, avatar_url },
 *     tier: string,
 *     subscription: {...},
 *     credits: {...}
 *   }
 *
 * Not authenticated (200):
 *   { authenticated: false }
 *
 * Error (400):
 *   { error: string }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const extensionId = searchParams.get("extensionId");

  // Validate extension ID is provided
  if (!extensionId) {
    return jsonResponse({ error: "Missing extensionId parameter" }, 400);
  }

  try {
    const supabase = await createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[Extension Session] Session error:", sessionError.message);
      return jsonResponse({ authenticated: false, error: sessionError.message });
    }

    if (!session) {
      return jsonResponse({ authenticated: false });
    }

    // Fetch user profile and credits
    let userProfile = null;
    let subscription = null;
    let credits = null;

    try {
      // Get profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, display_name, subscription_tier, subscription_status")
        .eq("id", session.user.id)
        .single();

      // Get credit balance
      const { data: creditData } = await supabase
        .from("credit_balances")
        .select("available_credits, used_this_period")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        userProfile = {
          id: profile.id,
          email: profile.email,
          full_name: profile.display_name || session.user.email?.split("@")[0],
          avatar_url: null,
        };

        const tier = profile.subscription_tier || "free";
        const planAllocation = tier === "free" ? 30 : tier === "individual" ? 750 : tier === "family" ? 1500 : 3750;
        const availableCredits = creditData?.available_credits ?? 0;
        const usedThisPeriod = creditData?.used_this_period ?? 0;

        subscription = {
          id: session.user.id,
          user_id: session.user.id,
          plan_id: tier,
          status: profile.subscription_status || "active",
          plans: {
            id: tier,
            name: tier.charAt(0).toUpperCase() + tier.slice(1),
            monthly_credits: planAllocation,
          },
        };

        credits = {
          available: availableCredits,
          used_this_period: usedThisPeriod,
          plan_allocation: planAllocation,
          percent_consumed: planAllocation > 0 ? Math.round((usedThisPeriod / planAllocation) * 100) : 0,
          plan: tier,
        };
      }
    } catch (err) {
      console.error("[Extension Session] Profile fetch error:", err);
      // Continue with basic session data even if profile fetch fails
    }

    // Build response - expiresAt in milliseconds for JS Date.now() comparison
    const expiresAtMs = (session.expires_at || 0) * 1000;
    const tier = subscription?.plan_id || "free";

    return jsonResponse({
      authenticated: true,
      token: session.access_token,
      refreshToken: session.refresh_token,  // 12 chars is normal for Supabase!
      expiresAt: expiresAtMs,
      userId: session.user.id,
      tier,
      user: userProfile || {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.email?.split("@")[0],
        avatar_url: null,
      },
      subscription,
      credits,
      userCredits: credits ? {
        user_id: session.user.id,
        available_credits: credits.available,
        used_this_period: credits.used_this_period,
        rollover_credits: 0,
      } : null,
    });
  } catch (error) {
    console.error("[Extension Session] Error:", error);
    return jsonResponse({ authenticated: false, error: "Failed to retrieve session" });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Also support POST for backwards compatibility
export async function POST(request: Request) {
  return GET(request);
}
