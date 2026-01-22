import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { fetchYouTubeVideoInfo } from "@/lib/youtube";

// Logging helper for consistent format
function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [FILTER-PREVIEW] [${context}] ${message}${dataStr}`);
}

// Calculate credit cost: 1 credit per minute, minimum 1 credit
// Round at 30 seconds (Math.round rounds at 0.5 = 30 seconds)
function calculateCreditCost(durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const minutes = Math.round(durationSeconds / 60);
  return Math.max(1, minutes);
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);

    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const { youtube_url, youtube_id } = await request.json();

    // Extract YouTube ID from URL if needed
    let videoId = youtube_id;
    if (!videoId && youtube_url) {
      videoId = extractYouTubeId(youtube_url);
    }

    if (!videoId) {
      log(requestId, "Invalid video ID");
      return NextResponse.json(
        { error: "Invalid YouTube URL or ID" },
        { status: 400 }
      );
    }

    log(requestId, "=== Preview Request ===", { videoId });

    // First, check if we have this video cached in our database with a transcript
    const { data: cachedVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("youtube_id", videoId)
      .single();

    // Get user's credit balance
    const { data: creditBalance } = await supabase
      .from("credit_balances")
      .select("available_credits")
      .eq("user_id", auth.user.id)
      .single();

    const userCredits = creditBalance?.available_credits || 0;

    if (cachedVideo && cachedVideo.transcript) {
      log(requestId, "Returning cached video", {
        title: cachedVideo.title,
        duration: cachedVideo.duration_seconds,
        hasTranscript: true
      });
      // Video is cached with transcript - free to rewatch
      return NextResponse.json({
        youtube_id: cachedVideo.youtube_id,
        title: cachedVideo.title,
        channel_name: cachedVideo.channel_name,
        duration_seconds: cachedVideo.duration_seconds,
        thumbnail_url: cachedVideo.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        credit_cost: 0, // Free for cached videos
        cached: true,
        has_transcript: true,
        user_credits: userCredits,
      });
    }

    // Video not cached - fetch metadata from YouTube
    log(requestId, "Video not cached, fetching from YouTube", { videoId });

    let title = "Unknown Video";
    let channelName: string | null = null;
    let durationSeconds = 0;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Fetch YouTube metadata using Data API with fallbacks
    const youtubeData = await fetchYouTubeVideoInfo(videoId);

    if (youtubeData) {
      title = youtubeData.title;
      channelName = youtubeData.channelName;
      durationSeconds = youtubeData.durationSeconds;
      thumbnailUrl = youtubeData.thumbnailUrl;
      log(requestId, "YouTube fetch result", {
        title,
        channel: channelName,
        duration: durationSeconds,
        source: "fetchYouTubeVideoInfo"
      });
    } else {
      log(requestId, "fetchYouTubeVideoInfo returned null, trying oEmbed fallback");
      // Fallback to oEmbed (doesn't have duration but at least gets title)
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedResponse = await fetch(oembedUrl);

        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          title = oembedData.title || title;
          channelName = oembedData.author_name || null;
          thumbnailUrl = oembedData.thumbnail_url || thumbnailUrl;
          log(requestId, "oEmbed fallback result", { title, channel: channelName });
        } else {
          log(requestId, "oEmbed request failed", { status: oembedResponse.status });
        }
      } catch (err) {
        log(requestId, "oEmbed exception", { error: String(err) });
      }
    }

    const creditCost = calculateCreditCost(durationSeconds);

    log(requestId, "Preview response", {
      title,
      duration: durationSeconds,
      creditCost,
      durationUnavailable: durationSeconds === 0
    });

    return NextResponse.json({
      youtube_id: videoId,
      title: title,
      channel_name: channelName,
      duration_seconds: durationSeconds,
      thumbnail_url: thumbnailUrl,
      credit_cost: creditCost,
      cached: false,
      has_transcript: false,
      user_credits: userCredits,
      has_sufficient_credits: userCredits >= creditCost || creditCost === 0,
      // If duration is still 0, we couldn't get it
      ...(durationSeconds === 0 && {
        credit_cost_note: "Duration unavailable. Cost will be ~1 credit per minute.",
      }),
    });
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Filter preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video info" },
      { status: 500 }
    );
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
