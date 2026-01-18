import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    if (cachedVideo && cachedVideo.transcript) {
      // Video is cached with transcript - free to rewatch
      const creditCost = 0; // Free for cached videos

      return NextResponse.json({
        youtube_id: cachedVideo.youtube_id,
        title: cachedVideo.title,
        channel_name: cachedVideo.channel_name,
        duration_seconds: cachedVideo.duration_seconds,
        thumbnail_url: cachedVideo.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        credit_cost: creditCost,
        cached: true,
        has_transcript: true,
      });
    }

    // Video not cached - fetch metadata from YouTube oEmbed API
    let title = "Unknown Video";
    let channelName = null;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

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
      // Continue with default values
    }

    // For uncached videos, we don't know the exact duration yet
    // We'll estimate based on average video length or show "TBD"
    // The actual credit cost will be calculated after processing starts
    const estimatedDurationSeconds = 0; // Unknown until processing
    const estimatedCreditCost = 0; // Will be calculated when we know duration

    return NextResponse.json({
      youtube_id: videoId,
      title: title,
      channel_name: channelName,
      duration_seconds: estimatedDurationSeconds,
      thumbnail_url: thumbnailUrl,
      credit_cost: estimatedCreditCost,
      cached: false,
      has_transcript: false,
      // Note: actual credit cost will be determined after video is processed
      credit_cost_note: "Credit cost will be calculated based on video duration (1 credit per minute)",
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
