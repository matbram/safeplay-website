import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_credits");
    if (!admin) return response;

    const { userId } = await params;
    const body = await request.json();

    const { amount, reason, type = "adjustment" } = body;

    if (typeof amount !== "number") {
      return NextResponse.json(
        { error: "Amount must be a number" },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const validTypes = ["adjustment", "refund", "bonus", "correction"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid adjustment type" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get current balance
    const { data: currentBalance, error: balanceError } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (balanceError || !currentBalance) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newBalance = currentBalance.available_credits + amount;

    if (newBalance < 0) {
      return NextResponse.json(
        { error: "Cannot set negative balance" },
        { status: 400 }
      );
    }

    // Update balance
    const { error: updateError } = await supabase
      .from("credit_balances")
      .update({
        available_credits: newBalance,
        topup_credits:
          amount > 0
            ? currentBalance.topup_credits + amount
            : currentBalance.topup_credits,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update balance" },
        { status: 500 }
      );
    }

    // Record transaction
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount,
      balance_after: newBalance,
      type,
      description: `Admin ${type}: ${reason}`,
    });

    // Log admin action
    await logAdminAction(
      admin.id,
      AdminActions.CREDIT_ADJUSTMENT,
      "user",
      userId,
      {
        amount,
        reason,
        type,
        previous_balance: currentBalance.available_credits,
        new_balance: newBalance,
      },
      request
    );

    return NextResponse.json({
      success: true,
      previous_balance: currentBalance.available_credits,
      new_balance: newBalance,
      adjustment: amount,
      message: `Successfully ${amount >= 0 ? "added" : "removed"} ${Math.abs(amount)} credits`,
    });
  } catch (error) {
    console.error("Admin credit adjustment error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
