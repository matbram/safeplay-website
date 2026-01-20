import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_users");
    if (!admin) return response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const plan = searchParams.get("plan") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "created_at";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const offset = (page - 1) * limit;

    const supabase = createServiceClient();

    // Build query - using actual schema columns
    let profilesQuery = supabase
      .from("profiles")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search) {
      profilesQuery = profilesQuery.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // Apply plan filter
    if (plan) {
      profilesQuery = profilesQuery.eq("subscription_tier", plan);
    }

    // Apply status filter
    if (status) {
      profilesQuery = profilesQuery.eq("subscription_status", status);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    profilesQuery = profilesQuery.order(sortBy, { ascending });

    // Apply pagination
    profilesQuery = profilesQuery.range(offset, offset + limit - 1);

    const { data: profiles, error: profilesError, count } = await profilesQuery;

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch users", details: profilesError.message },
        { status: 500 }
      );
    }

    // Get credit balances for all users
    const userIds = (profiles || []).map(p => p.id);
    const { data: creditBalances } = await supabase
      .from("credit_balances")
      .select("user_id, available_credits, used_this_period")
      .in("user_id", userIds);

    // Create lookup map for credits
    const creditsMap = new Map<string, { available_credits: number; used_this_period: number }>();
    creditBalances?.forEach(cb => creditsMap.set(cb.user_id, cb));

    // Format response to match expected structure
    const users = (profiles || []).map(profile => {
      const credits = creditsMap.get(profile.id);
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.display_name,
        avatar_url: null,
        created_at: profile.created_at,
        subscription: {
          plan_id: profile.subscription_tier,
          status: profile.subscription_status,
          stripe_customer_id: profile.stripe_customer_id,
          stripe_subscription_id: profile.stripe_subscription_id,
        },
        credits: {
          available_credits: credits?.available_credits ?? profile.monthly_quota,
          used_this_period: credits?.used_this_period ?? 0,
        },
      };
    });

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
