import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const supabase = createServiceClient();

    // Get dashboard stats
    const [
      usersResult,
      paidSubscriptionsResult,
      creditsResult,
      ticketsResult,
      newUsersToday,
      newUsersWeek,
      revenueResult,
      recentUsersResult,
      recentTicketsResult,
      // Filter job stats
      failedJobsResult,
      processingJobsResult,
      recentFailedJobsResult,
    ] = await Promise.all([
      // Total users
      supabase.from("profiles").select("id", { count: "exact", head: true }),

      // Active paid subscriptions (from profiles table)
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("subscription_status", "active")
        .neq("subscription_tier", "free"),

      // Total credits used this period
      supabase.from("credit_balances").select("used_this_period"),

      // Open tickets
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"]),

      // New users today
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().split("T")[0]),

      // New users this week
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),

      // Revenue this month
      supabase
        .from("invoices")
        .select("amount_cents")
        .eq("status", "paid")
        .gte(
          "created_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
        ),

      // Recent users (from profiles directly)
      supabase
        .from("profiles")
        .select("id, email, display_name, subscription_tier, created_at")
        .order("created_at", { ascending: false })
        .limit(5),

      // Recent tickets
      supabase
        .from("support_tickets")
        .select("id, subject, status, priority, created_at, email")
        .order("created_at", { ascending: false })
        .limit(5),

      // Failed filter jobs count
      supabase
        .from("filter_jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),

      // Currently processing filter jobs count
      supabase
        .from("filter_jobs")
        .select("id", { count: "exact", head: true })
        .in("status", ["processing", "pending"]),

      // Recent failed jobs (for notifications)
      supabase
        .from("filter_jobs")
        .select("job_id, youtube_id, error, created_at, user_id")
        .eq("status", "failed")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    // Calculate total credits used
    const totalCreditsUsed =
      creditsResult.data?.reduce(
        (sum, row) => sum + (row.used_this_period || 0),
        0
      ) || 0;

    // Calculate revenue this month
    const revenueThisMonth =
      revenueResult.data?.reduce((sum, row) => sum + (row.amount_cents || 0), 0) ||
      0;

    // Format recent users
    const recentUsers = recentUsersResult.data?.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.display_name,
      created_at: user.created_at,
      subscription_tier: user.subscription_tier || "free",
    })) || [];

    // Enrich recent failed jobs with user emails
    const failedJobs = recentFailedJobsResult.data || [];
    let recentFailedJobs: Array<{
      job_id: string;
      youtube_id: string;
      error: string | null;
      created_at: string;
      user_email: string;
    }> = [];

    if (failedJobs.length > 0) {
      const userIds = [...new Set(failedJobs.map((j) => j.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds);

      const emailMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        emailMap[p.id] = p.email || "Unknown";
      });

      recentFailedJobs = failedJobs.map((j) => ({
        job_id: j.job_id,
        youtube_id: j.youtube_id,
        error: j.error,
        created_at: j.created_at,
        user_email: emailMap[j.user_id] || "Unknown",
      }));
    }

    return NextResponse.json({
      stats: {
        total_users: usersResult.count || 0,
        active_subscriptions: paidSubscriptionsResult.count || 0,
        total_credits_used: totalCreditsUsed,
        open_tickets: ticketsResult.count || 0,
        new_users_today: newUsersToday.count || 0,
        new_users_week: newUsersWeek.count || 0,
        revenue_this_month: revenueThisMonth,
        failed_jobs: failedJobsResult.count || 0,
        processing_jobs: processingJobsResult.count || 0,
      },
      recentUsers,
      recentTickets: recentTicketsResult.data || [],
      recentFailedJobs,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
