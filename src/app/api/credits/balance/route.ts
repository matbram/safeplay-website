import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  try {
    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);

    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // Get credit balance
    const { data: balance, error } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", auth.user.id)
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
      .eq("user_id", auth.user.id)
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
