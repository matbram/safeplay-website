import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * GET /api/extension/user
 * Validates an access token and returns user info for the Chrome extension
 *
 * Headers:
 *   Authorization: Bearer <access_token>
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const accessToken = authHeader.replace("Bearer ", "");

    // Create a Supabase client with the user's access token
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Verify the token by getting the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Get user's credit balance
    const { data: credits } = await supabase
      .from("credit_balances")
      .select("available_credits, used_this_period, period_end")
      .eq("user_id", user.id)
      .single();

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, subscription_tier, subscription_status")
      .eq("id", user.id)
      .single();

    // Get user's preferences
    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("default_filter_type, sensitivity_level, custom_words")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: profile?.display_name || user.email?.split("@")[0],
      },
      subscription: {
        tier: profile?.subscription_tier || "free",
        status: profile?.subscription_status || "active",
      },
      credits: {
        available: credits?.available_credits ?? 0,
        usedThisPeriod: credits?.used_this_period ?? 0,
        periodEnd: credits?.period_end,
      },
      preferences: {
        filterType: preferences?.default_filter_type || "mute",
        sensitivityLevel: preferences?.sensitivity_level || "moderate",
        customWords: preferences?.custom_words || [],
      },
    });
  } catch (error) {
    console.error("Extension user API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
