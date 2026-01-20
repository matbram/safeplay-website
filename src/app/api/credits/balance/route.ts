import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

// Logging helper for consistent format
function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [CREDITS-BALANCE] [${context}] ${message}${dataStr}`);
}

export async function GET(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    log(requestId, "=== Credit Balance Request ===");

    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);
    log(requestId, "Auth result", { userId: auth.user?.id, error: auth.error });

    if (!auth.user) {
      log(requestId, "Auth failed - returning 401");
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

    log(requestId, "Credit balance lookup", {
      found: !!balance,
      available: balance?.available_credits,
      usedThisPeriod: balance?.used_this_period,
      rollover: balance?.rollover_credits,
      topup: balance?.topup_credits,
      error: error?.message
    });

    if (error) {
      log(requestId, "Balance fetch error", { error: error.message });
      return NextResponse.json(
        { error: "Failed to fetch credit balance" },
        { status: 500 }
      );
    }

    // Get subscription to know plan limits
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*, plans(*)")
      .eq("user_id", auth.user.id)
      .single();

    log(requestId, "Subscription lookup", {
      found: !!subscription,
      planId: subscription?.plan_id,
      planCredits: subscription?.plans?.credits_per_month,
      error: subError?.message
    });

    const plan = subscription?.plans;
    const creditsPerMonth = plan?.credits_per_month || 30;

    const response = {
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
    };

    log(requestId, "Returning balance", response.balance);
    return NextResponse.json(response);
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Credit balance fetch error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
