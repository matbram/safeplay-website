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

    // First, get profiles
    let profilesQuery = supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at, updated_at", { count: "exact" });

    // Apply search filter
    if (search) {
      profilesQuery = profilesQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
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

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    }

    // Get user IDs for batch queries
    const userIds = profiles.map(p => p.id);

    // Fetch subscriptions and credit balances in parallel
    const [subsResult, creditsResult] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("user_id, id, plan_id, status, stripe_customer_id, current_period_end, cancel_at_period_end")
        .in("user_id", userIds),
      supabase
        .from("credit_balances")
        .select("user_id, available_credits, used_this_period")
        .in("user_id", userIds),
    ]);

    // Create lookup maps
    type Subscription = {
      user_id: string;
      id: string;
      plan_id: string;
      status: string;
      stripe_customer_id: string | null;
      current_period_end: string | null;
      cancel_at_period_end: boolean;
    };
    type CreditBalance = {
      user_id: string;
      available_credits: number;
      used_this_period: number;
    };

    const subsMap = new Map<string, Subscription>();
    const creditsMap = new Map<string, CreditBalance>();

    (subsResult.data as Subscription[] | null)?.forEach(sub => subsMap.set(sub.user_id, sub));
    (creditsResult.data as CreditBalance[] | null)?.forEach(credit => creditsMap.set(credit.user_id, credit));

    // Combine data
    let users = profiles.map(profile => ({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      subscription: subsMap.get(profile.id) || null,
      credits: creditsMap.get(profile.id) || null,
    }));

    // Filter by plan/status if needed
    if (plan) {
      users = users.filter(u => u.subscription?.plan_id === plan);
    }

    if (status) {
      users = users.filter(u => u.subscription?.status === status);
    }

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
