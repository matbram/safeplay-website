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

    // Build query
    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        email,
        full_name,
        avatar_url,
        created_at,
        updated_at,
        subscriptions!left(
          id,
          plan_id,
          status,
          stripe_customer_id,
          current_period_end,
          cancel_at_period_end
        ),
        credit_balances!left(
          available_credits,
          used_this_period
        )
      `,
        { count: "exact" }
      );

    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = sortOrder === "asc";
    query = query.order(sortBy, { ascending });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error("Users fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    // Filter by plan/status if needed (done client-side due to join limitations)
    let filteredUsers = users || [];

    if (plan) {
      filteredUsers = filteredUsers.filter(
        (u) => (u.subscriptions as { plan_id: string }[])?.[0]?.plan_id === plan
      );
    }

    if (status) {
      filteredUsers = filteredUsers.filter(
        (u) => (u.subscriptions as { status: string }[])?.[0]?.status === status
      );
    }

    // Format response
    const formattedUsers = filteredUsers.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      subscription: (user.subscriptions as Record<string, unknown>[])?.[0] || null,
      credits: (user.credit_balances as Record<string, unknown>[])?.[0] || null,
    }));

    return NextResponse.json({
      users: formattedUsers,
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
