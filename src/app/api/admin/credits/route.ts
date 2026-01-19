import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_credits");
    if (!admin) return response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const offset = (page - 1) * limit;

    const supabase = createServiceClient();

    // Build query
    let query = supabase
      .from("credit_transactions")
      .select(
        `
        id,
        user_id,
        amount,
        balance_after,
        type,
        description,
        created_at,
        profiles!credit_transactions_user_id_fkey(email, full_name)
      `,
        { count: "exact" }
      );

    // Apply type filter
    if (type) {
      query = query.eq("type", type);
    }

    // Apply sorting and pagination
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error("Credit transactions fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      );
    }

    // Filter by search (email) if needed
    let filteredTransactions = transactions || [];
    if (search) {
      filteredTransactions = filteredTransactions.filter((tx) => {
        const profile = tx.profiles as unknown as { email: string; full_name: string | null } | null;
        return profile?.email?.toLowerCase().includes(search.toLowerCase());
      });
    }

    // Calculate stats
    const [usageResult, issuedResult, adjustmentsResult, balanceResult] =
      await Promise.all([
        // Total credits used
        supabase
          .from("credit_transactions")
          .select("amount")
          .lt("amount", 0),

        // Credits issued this month
        supabase
          .from("credit_transactions")
          .select("amount")
          .gt("amount", 0)
          .gte(
            "created_at",
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          ),

        // Manual adjustments this month
        supabase
          .from("credit_transactions")
          .select("id", { count: "exact", head: true })
          .in("type", ["adjustment", "refund", "bonus", "correction"])
          .gte(
            "created_at",
            new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          ),

        // Average balance per user
        supabase.from("credit_balances").select("used_this_period"),
      ]);

    const totalCreditsUsed = Math.abs(
      usageResult.data?.reduce((sum, r) => sum + r.amount, 0) || 0
    );

    const totalCreditsIssued =
      issuedResult.data?.reduce((sum, r) => sum + r.amount, 0) || 0;

    const totalAdjustments = adjustmentsResult.count || 0;

    const userCount = balanceResult.data?.length || 1;
    const totalUsedThisPeriod =
      balanceResult.data?.reduce((sum, r) => sum + (r.used_this_period || 0), 0) ||
      0;
    const averageUsagePerUser = totalUsedThisPeriod / userCount;

    return NextResponse.json({
      transactions: filteredTransactions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: {
        totalCreditsUsed,
        totalCreditsIssued,
        totalAdjustments,
        averageUsagePerUser,
      },
    });
  } catch (error) {
    console.error("Admin credits error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
