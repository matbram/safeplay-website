import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction, AdminActions } from "@/lib/admin-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_users");
    if (!admin) return response;

    const { userId } = await params;
    const supabase = createServiceClient();

    // Get full user details
    const [
      profileResult,
      subscriptionResult,
      creditsResult,
      transactionsResult,
      ticketsResult,
      notesResult,
      flagsResult,
      filterHistoryResult,
    ] = await Promise.all([
      // Profile
      supabase.from("profiles").select("*").eq("id", userId).single(),

      // Subscription with plan
      supabase
        .from("subscriptions")
        .select("*, plans(*)")
        .eq("user_id", userId)
        .single(),

      // Credit balance
      supabase.from("credit_balances").select("*").eq("user_id", userId).single(),

      // Recent credit transactions
      supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),

      // Support tickets
      supabase
        .from("support_tickets")
        .select("id, subject, status, priority, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),

      // Admin notes
      supabase
        .from("admin_notes")
        .select(
          `
          id,
          note,
          is_pinned,
          created_at,
          admin_id,
          profiles!admin_notes_admin_id_fkey(full_name, email)
        `
        )
        .eq("user_id", userId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false }),

      // Account flags
      supabase
        .from("account_flags")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),

      // Filter history
      supabase
        .from("filter_history")
        .select(
          `
          id,
          filter_type,
          credits_used,
          created_at,
          videos(youtube_id, title)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (profileResult.error) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log view action
    await logAdminAction(
      admin.id,
      AdminActions.VIEW_USER,
      "user",
      userId,
      { email: profileResult.data.email },
      request
    );

    return NextResponse.json({
      user: {
        profile: profileResult.data,
        subscription: subscriptionResult.data,
        credits: creditsResult.data,
        transactions: transactionsResult.data || [],
        tickets: ticketsResult.data || [],
        notes: notesResult.data || [],
        flags: flagsResult.data || [],
        filterHistory: filterHistoryResult.data || [],
      },
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_users");
    if (!admin) return response;

    const { userId } = await params;
    const body = await request.json();
    const supabase = createServiceClient();

    // Only allow updating certain fields
    const allowedFields = ["full_name"];
    const filteredUpdates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        filteredUpdates[field] = body[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    filteredUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("profiles")
      .update(filteredUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Log action
    await logAdminAction(
      admin.id,
      AdminActions.UPDATE_USER,
      "user",
      userId,
      { updates: filteredUpdates },
      request
    );

    return NextResponse.json({
      user: data,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
