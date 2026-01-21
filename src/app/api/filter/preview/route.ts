import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { fetchYouTubeVideoInfo } from "@/lib/youtube";

// Calculate credit cost: 1 credit per minute, minimum 1 credit
// Round at 30 seconds (Math.round rounds at 0.5 = 30 seconds)
function calculateCreditCost(durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const minutes = Math.round(durationSeconds / 60);
  return Math.max(1, minutes);
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: "Invalid YouTube URL or ID" },
        { status: 400 }
      );
    }

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
    let title = "Unknown Video";
    let channelName: string | null = null;
    let durationSeconds = 0;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    // Fetch YouTube metadata using internal API with page scraping fallback
    const scrapedData = await fetchYouTubeVideoInfo(videoId);

    if (scrapedData) {
      title = scrapedData.title;
      channelName = scrapedData.channelName;
      durationSeconds = scrapedData.durationSeconds;
      thumbnailUrl = scrapedData.thumbnailUrl;
    } else {
      // Fallback to oEmbed (doesn't have duration but at least gets title)
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedResponse = await fetch(oembedUrl);

        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          title = oembedData.title || title;
          channelName = oembedData.author_name || null;
          thumbnailUrl = oembedData.thumbnail_url || thumbnailUrl;
        }
      } catch (err) {
        console.error("Failed to fetch oEmbed data:", err);
      }
    }

    const creditCost = calculateCreditCost(durationSeconds);

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
