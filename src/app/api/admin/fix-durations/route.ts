import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin-auth";
import { fetchYouTubeVideoInfo } from "@/lib/youtube";

// Logging helper
function log(message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [FIX-DURATIONS] ${message}${dataStr}`);
}

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    const { admin, response } = await requireAdmin(request);
    if (!admin) {
      return response;
    }

    const supabase = createServiceClient();

    // Get count of videos with 0 duration
    const { data: videos, error: fetchError } = await supabase
      .from("videos")
      .select("id, youtube_id, title, duration_seconds")
      .or("duration_seconds.eq.0,duration_seconds.is.null");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({
      videos_with_zero_duration: videos?.length || 0,
      videos: videos?.map(v => ({
        id: v.id,
        youtube_id: v.youtube_id,
        title: v.title,
        duration_seconds: v.duration_seconds
      }))
    });
  } catch (error) {
    console.error("Fix durations preview error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const { admin, response } = await requireAdmin(request);
    if (!admin) {
      return response;
    }

    const supabase = createServiceClient();

    log("=== Starting duration fix ===");

    // Get all videos with 0 or null duration
    const { data: videos, error: fetchError } = await supabase
      .from("videos")
      .select("id, youtube_id, title, duration_seconds")
      .or("duration_seconds.eq.0,duration_seconds.is.null");

    if (fetchError) {
      log("Failed to fetch videos", { error: fetchError.message });
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    log("Found videos to fix", { count: videos?.length || 0 });

    const results = {
      total: videos?.length || 0,
      updated: 0,
      failed: 0,
      skipped: 0,
      details: [] as Array<{
        youtube_id: string;
        title: string;
        old_duration: number | null;
        new_duration: number | null;
        status: string;
        error?: string;
      }>
    };

    for (const video of videos || []) {
      log("Processing video", { youtube_id: video.youtube_id, title: video.title });

      try {
        // Fetch duration from YouTube
        const info = await fetchYouTubeVideoInfo(video.youtube_id);

        if (!info || info.durationSeconds === 0) {
          log("Could not fetch duration", { youtube_id: video.youtube_id });
          results.failed++;
          results.details.push({
            youtube_id: video.youtube_id,
            title: video.title,
            old_duration: video.duration_seconds,
            new_duration: null,
            status: "failed",
            error: "Could not fetch duration from YouTube"
          });
          continue;
        }

        // Update the video record
        const { error: updateError } = await supabase
          .from("videos")
          .update({
            duration_seconds: info.durationSeconds,
            // Also update title and thumbnail if we got better data
            title: info.title || video.title,
            thumbnail_url: info.thumbnailUrl
          })
          .eq("id", video.id);

        if (updateError) {
          log("Failed to update video", { youtube_id: video.youtube_id, error: updateError.message });
          results.failed++;
          results.details.push({
            youtube_id: video.youtube_id,
            title: video.title,
            old_duration: video.duration_seconds,
            new_duration: info.durationSeconds,
            status: "failed",
            error: updateError.message
          });
        } else {
          log("Updated video duration", {
            youtube_id: video.youtube_id,
            old: video.duration_seconds,
            new: info.durationSeconds
          });
          results.updated++;
          results.details.push({
            youtube_id: video.youtube_id,
            title: info.title || video.title,
            old_duration: video.duration_seconds,
            new_duration: info.durationSeconds,
            status: "updated"
          });
        }
      } catch (err) {
        log("Exception processing video", { youtube_id: video.youtube_id, error: String(err) });
        results.failed++;
        results.details.push({
          youtube_id: video.youtube_id,
          title: video.title,
          old_duration: video.duration_seconds,
          new_duration: null,
          status: "failed",
          error: String(err)
        });
      }
    }

    log("=== Duration fix complete ===", {
      total: results.total,
      updated: results.updated,
      failed: results.failed
    });

    return NextResponse.json({
      success: true,
      message: `Updated ${results.updated} of ${results.total} videos`,
      ...results
    });
  } catch (error) {
    console.error("Fix durations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
