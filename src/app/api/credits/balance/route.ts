import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get credit balance
    const { data: balance, error } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch credit balance" },
        { status: 500 }
      );
    }

    // Get subscription to know plan limits
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", user.id)
      .single();

    const plan = subscription?.plans;
    const creditsPerMonth = plan?.credits_per_month || 30;

    return NextResponse.json({
      balance: {
        available: balance.available_credits,
        usedThisPeriod: balance.used_this_period,
        rollover: balance.rollover_credits,
        topup: balance.topup_credits,
        periodStart: balance.period_start,
        periodEnd: balance.period_end,
        planCredits: creditsPerMonth,
        percentUsed: Math.round((balance.used_this_period / creditsPerMonth) * 100),
      },
    });
  } catch (error) {
    console.error("Credit balance fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
