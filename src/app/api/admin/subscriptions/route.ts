import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_subscriptions");
    if (!admin) return response;

    const supabase = await createClient();

    // Get all subscriptions with user and plan details
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select(
        `
        id,
        user_id,
        plan_id,
        status,
        stripe_customer_id,
        stripe_subscription_id,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        profiles!subscriptions_user_id_fkey(email, full_name),
        plans(name, price_cents, credits_per_month)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Subscriptions fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalSubs = subscriptions?.length || 0;
    const activePaid =
      subscriptions?.filter(
        (s) => s.status === "active" && s.plan_id !== "free"
      ).length || 0;

    // Calculate MRR
    const mrr =
      subscriptions
        ?.filter((s) => s.status === "active" && s.plan_id !== "free")
        .reduce((sum, s) => {
          const plan = s.plans as unknown as { price_cents: number } | null;
          return sum + (plan?.price_cents || 0);
        }, 0) || 0;

    // Churn rate placeholder (would need historical data)
    const churnRate = 0;

    return NextResponse.json({
      subscriptions: subscriptions || [],
      stats: {
        total: totalSubs,
        active: activePaid,
        mrr,
        churnRate,
      },
    });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
