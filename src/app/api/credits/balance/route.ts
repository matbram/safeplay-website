import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

export async function GET(request: NextRequest) {
  try {
    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);

    if (!auth.user || !auth.supabase) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = auth.supabase;

    // Get credit balance - use maybeSingle() to handle missing record
    const { data: balance, error } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", auth.user.id)
      .maybeSingle();

    if (error) {
      console.error("Credit balance fetch error:", error);
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
      .maybeSingle();

    const plan = subscription?.plans as { credits_per_month?: number } | null;
    const creditsPerMonth = plan?.credits_per_month || 30;

    // Return default values if no balance record exists
    return NextResponse.json({
      balance: {
        available: balance?.available_credits || 0,
        usedThisPeriod: balance?.used_this_period || 0,
        rollover: balance?.rollover_credits || 0,
        topup: balance?.topup_credits || 0,
        periodStart: balance?.period_start || null,
        periodEnd: balance?.period_end || null,
        planCredits: creditsPerMonth,
        percentUsed: balance ? Math.round((balance.used_this_period / creditsPerMonth) * 100) : 0,
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
