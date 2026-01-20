import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_subscriptions");
    if (!admin) return response;

    const supabase = createServiceClient();

    // Get all users with subscription info from profiles (subscription data is in profiles table)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Profiles fetch error:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    // Get plans for pricing info
    const { data: plans } = await supabase.from("plans").select("*");
    const plansMap = new Map<string, { name: string; price_cents: number; credits_per_month: number }>();
    plans?.forEach(p => plansMap.set(p.id, p));

    // Format subscriptions from profiles
    const subscriptions = (profiles || []).map(profile => {
      const plan = plansMap.get(profile.subscription_tier);
      return {
        id: profile.id,
        user_id: profile.id,
        plan_id: profile.subscription_tier,
        status: profile.subscription_status,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_subscription_id: profile.stripe_subscription_id,
        current_period_start: null,
        current_period_end: null,
        cancel_at_period_end: false,
        profiles: { email: profile.email, full_name: profile.display_name },
        plans: plan || null,
      };
    });

    // Calculate stats
    const totalSubs = subscriptions.length;
    const activePaid = subscriptions.filter(
      (s) => s.status === "active" && s.plan_id !== "free"
    ).length;

    // Calculate MRR
    const mrr = subscriptions
      .filter((s) => s.status === "active" && s.plan_id !== "free")
      .reduce((sum, s) => {
        return sum + (s.plans?.price_cents || 0);
      }, 0);

    // Churn rate placeholder (would need historical data)
    const churnRate = 0;

    return NextResponse.json({
      subscriptions,
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
