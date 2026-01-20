import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

function generateRequestId() {
  return Math.random().toString(36).substring(2, 8);
}

function log(requestId: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
  console.log(`[${timestamp}] [RECORD-HISTORY] [${requestId}] ${message}${dataStr}`);
}

/**
 * POST /api/filter/record-history
 *
 * Records filter history for videos served from extension's local cache.
 * This does NOT deduct credits - it only creates a history entry.
 *
 * Request body:
 * - youtube_id: string (required)
 * - title: string (optional)
 * - channel_name: string (optional)
 * - duration_seconds: number (optional)
 * - filter_type: string (optional, defaults to "mute")
 * - custom_words: string[] (optional)
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  log(requestId, "=== Record History Request ===");

  try {
    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);

    log(requestId, "Auth result", { userId: auth.user?.id, error: auth.error });

    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      youtube_id,
      title,
      channel_name,
      duration_seconds,
      filter_type = "mute",
      custom_words = [],
    } = body;

    log(requestId, "Request body", { youtube_id, title, filter_type, duration_seconds });

    if (!youtube_id) {
      return NextResponse.json(
        { error: "youtube_id is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // First, check if video exists in our database
    const { data: existingVideo } = await supabase
      .from("videos")
      .select("id, youtube_id, title")
      .eq("youtube_id", youtube_id)
      .single();

    let videoId: string;

    if (existingVideo) {
      // Video already cached
      videoId = existingVideo.id;
      log(requestId, "Video already cached", { videoId, title: existingVideo.title });
    } else {
      // Insert new video record (without transcript - just metadata)
      const { data: newVideo, error: videoError } = await supabase
        .from("videos")
        .insert({
          youtube_id,
          title: title || "Unknown Video",
          channel_name: channel_name || null,
          duration_seconds: duration_seconds || null,
          thumbnail_url: `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`,
          cached_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (videoError || !newVideo) {
        log(requestId, "Failed to cache video", { error: videoError?.message });
        return NextResponse.json(
          { error: "Failed to cache video metadata" },
          { status: 500 }
        );
      }

      videoId = newVideo.id;
      log(requestId, "Created new video record", { videoId });
    }

    // Check if we already have a history entry for this video today
    // to avoid duplicate entries from repeated extension calls
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: existingHistory } = await supabase
      .from("filter_history")
      .select("id, created_at")
      .eq("user_id", auth.user.id)
      .eq("video_id", videoId)
      .gte("created_at", today.toISOString())
      .limit(1)
      .single();

    if (existingHistory) {
      log(requestId, "History already recorded today", { historyId: existingHistory.id });
      return NextResponse.json({
        success: true,
        message: "History already recorded",
        history_id: existingHistory.id,
        video_id: videoId,
        already_existed: true,
      });
    }

    // Create filter history entry (0 credits since from cache)
    const { data: historyEntry, error: historyError } = await supabase
      .from("filter_history")
      .insert({
        user_id: auth.user.id,
        video_id: videoId,
        filter_type,
        custom_words,
        credits_used: 0, // No credits for cached playback
      })
      .select()
      .single();

    if (historyError) {
      log(requestId, "Failed to create history entry", { error: historyError.message });
      return NextResponse.json(
        { error: "Failed to record history" },
        { status: 500 }
      );
    }

    log(requestId, "=== History recorded successfully ===", {
      historyId: historyEntry.id,
      videoId,
      creditsUsed: 0,
    });

    return NextResponse.json({
      success: true,
      history_id: historyEntry.id,
      video_id: videoId,
      credits_used: 0,
    });
  } catch (error) {
    log(requestId, "Unexpected error", { error: String(error) });
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
