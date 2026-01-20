import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

/**
 * GET /api/debug/history
 * Debug endpoint to check filter_history and videos tables for current user
 */
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

    const supabase = createServiceClient();
    const userId = auth.user.id;

    // Get filter_history entries
    const { data: history, error: historyError } = await supabase
      .from("filter_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get filter_jobs entries
    const { data: jobs, error: jobsError } = await supabase
      .from("filter_jobs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Get videos that match the video_ids in history
    const videoIds = history?.map(h => h.video_id).filter(Boolean) || [];
    let videos: Array<{ id: string; youtube_id: string; title: string; duration_seconds: number }> = [];
    let videosError = null;

    if (videoIds.length > 0) {
      const result = await supabase
        .from("videos")
        .select("id, youtube_id, title, duration_seconds")
        .in("id", videoIds);
      videos = result.data || [];
      videosError = result.error;
    }

    // Get credit balance
    const { data: credits, error: creditsError } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get credit transactions
    const { data: transactions, error: txError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Build video lookup map
    const videoMap = new Map(videos.map(v => [v.id, v]));

    // Enrich history with video data
    const enrichedHistory = history?.map(h => ({
      ...h,
      video_data: videoMap.get(h.video_id) || null,
      video_found: videoMap.has(h.video_id),
    }));

    return NextResponse.json({
      debug: true,
      user_id: userId,
      filter_history: {
        count: history?.length || 0,
        error: historyError?.message,
        items: enrichedHistory,
      },
      filter_jobs: {
        count: jobs?.length || 0,
        error: jobsError?.message,
        items: jobs,
      },
      videos: {
        count: videos.length,
        error: videosError?.message,
        items: videos,
      },
      credits: {
        data: credits,
        error: creditsError?.message,
      },
      transactions: {
        count: transactions?.length || 0,
        error: txError?.message,
        items: transactions,
      },
    });
  } catch (error) {
    console.error("Debug history error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: String(error) },
      { status: 500 }
    );
  }
}
