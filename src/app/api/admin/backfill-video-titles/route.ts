import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

/**
 * Fetch video metadata from YouTube's oEmbed API (no API key required)
 */
async function fetchYouTubeMetadata(youtubeId: string): Promise<{ title?: string; author_name?: string } | null> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      title: data.title,
      author_name: data.author_name,
    };
  } catch {
    return null;
  }
}

/**
 * POST /api/admin/backfill-video-titles
 *
 * Updates all videos with "Unknown Video" title by fetching from YouTube.
 * Requires authentication.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);

    if (!auth.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Get all videos with "Unknown Video" or "Video" as title
    const { data: videos, error } = await supabase
      .from("videos")
      .select("id, youtube_id, title")
      .or('title.eq.Unknown Video,title.eq.Video,title.is.null');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!videos || videos.length === 0) {
      return NextResponse.json({
        message: "No videos need updating",
        updated: 0
      });
    }

    console.log(`[BACKFILL] Found ${videos.length} videos to update`);

    let updated = 0;
    let failed = 0;
    const results: Array<{ youtube_id: string; title?: string; error?: string }> = [];

    for (const video of videos) {
      if (!video.youtube_id) {
        results.push({ youtube_id: "unknown", error: "No youtube_id" });
        failed++;
        continue;
      }

      const meta = await fetchYouTubeMetadata(video.youtube_id);

      if (meta?.title) {
        const { error: updateError } = await supabase
          .from("videos")
          .update({
            title: meta.title,
            channel_name: meta.author_name || null
          })
          .eq("id", video.id);

        if (updateError) {
          results.push({ youtube_id: video.youtube_id, error: updateError.message });
          failed++;
        } else {
          results.push({ youtube_id: video.youtube_id, title: meta.title });
          updated++;
          console.log(`[BACKFILL] Updated ${video.youtube_id}: ${meta.title}`);
        }
      } else {
        results.push({ youtube_id: video.youtube_id, error: "Could not fetch from YouTube" });
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return NextResponse.json({
      message: `Updated ${updated} videos, ${failed} failed`,
      total: videos.length,
      updated,
      failed,
      results
    });
  } catch (error) {
    console.error("[BACKFILL] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
