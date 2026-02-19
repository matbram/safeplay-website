import { createClient, createServiceClient } from "@/lib/supabase/server";
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
          profiles!admin_notes_admin_id_fkey(display_name, email)
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
          video_id,
          filter_type,
          credits_used,
          created_at,
          videos!filter_history_video_id_fkey(youtube_id, title)
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

    // Only allow updating certain fields (map full_name to display_name)
    const filteredUpdates: Record<string, unknown> = {};
    if (body.full_name !== undefined) {
      filteredUpdates.display_name = body.full_name;
    }
    if (body.display_name !== undefined) {
      filteredUpdates.display_name = body.display_name;
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

/**
 * POST /api/admin/users/[userId]
 * Auth management actions: reset_password, update_email, update_password
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin(request, "manage_users");
    if (!admin) return response;

    const { userId } = await params;
    const body = await request.json();
    const { action } = body;

    const supabase = createServiceClient();

    switch (action) {
      case "reset_password": {
        // Look up the user's email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", userId)
          .single();

        if (!profile?.email) {
          return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
          );
        }

        // Use the anon client to send the password reset email
        // (the admin API doesn't have a "send reset email" method)
        const anonClient = await createClient();
        const { error: resetError } = await anonClient.auth.resetPasswordForEmail(
          profile.email,
          { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || ""}/reset-password` }
        );

        if (resetError) {
          return NextResponse.json(
            { error: resetError.message },
            { status: 400 }
          );
        }

        await logAdminAction(
          admin.id,
          "reset_password",
          "user",
          userId,
          { email: profile.email },
          request
        );

        return NextResponse.json({
          success: true,
          message: `Password reset email sent to ${profile.email}`,
        });
      }

      case "update_email": {
        const { email } = body;

        if (!email) {
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          );
        }

        // Update auth email via admin API
        const { error: emailError } = await supabase.auth.admin.updateUserById(
          userId,
          { email, email_confirm: true }
        );

        if (emailError) {
          return NextResponse.json(
            { error: emailError.message },
            { status: 400 }
          );
        }

        // Also update the profile table
        await supabase
          .from("profiles")
          .update({ email, updated_at: new Date().toISOString() })
          .eq("id", userId);

        await logAdminAction(
          admin.id,
          "update_email",
          "user",
          userId,
          { new_email: email },
          request
        );

        return NextResponse.json({
          success: true,
          message: "Email updated successfully",
        });
      }

      case "update_password": {
        const { password } = body;

        if (!password || password.length < 6) {
          return NextResponse.json(
            { error: "Password must be at least 6 characters" },
            { status: 400 }
          );
        }

        const { error: pwError } = await supabase.auth.admin.updateUserById(
          userId,
          { password }
        );

        if (pwError) {
          return NextResponse.json(
            { error: pwError.message },
            { status: 400 }
          );
        }

        await logAdminAction(
          admin.id,
          "update_password",
          "user",
          userId,
          {},
          request
        );

        return NextResponse.json({
          success: true,
          message: "Password updated successfully",
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Admin user action error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
