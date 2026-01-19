import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Parse ISO 8601 duration format (e.g., "PT4M13S", "PT1H2M30S")
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

// Calculate credit cost: 1 credit per minute, minimum 1 credit
function calculateCreditCost(durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.max(1, minutes);
}

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
      return NextResponse.json({
        youtube_id: cachedVideo.youtube_id,
        title: cachedVideo.title,
        channel_name: cachedVideo.channel_name,
        duration_seconds: cachedVideo.duration_seconds,
        thumbnail_url: cachedVideo.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        credit_cost: 0, // Free for cached videos
        cached: true,
        has_transcript: true,
      });
    }

    // Video not cached - fetch metadata from YouTube Data API v3 (includes duration)
    let title = "Unknown Video";
    let channelName = null;
    let durationSeconds = 0;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const youtubeApiKey = process.env.YOUTUBE_API_KEY;

    if (youtubeApiKey) {
      // Use YouTube Data API v3 for full metadata including duration
      try {
        const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${youtubeApiKey}`;
        const apiResponse = await fetch(apiUrl);

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();

          if (apiData.items && apiData.items.length > 0) {
            const video = apiData.items[0];
            title = video.snippet?.title || title;
            channelName = video.snippet?.channelTitle || null;
            thumbnailUrl = video.snippet?.thumbnails?.maxres?.url
              || video.snippet?.thumbnails?.high?.url
              || video.snippet?.thumbnails?.medium?.url
              || thumbnailUrl;

            // Parse ISO 8601 duration (e.g., "PT4M13S")
            if (video.contentDetails?.duration) {
              durationSeconds = parseISO8601Duration(video.contentDetails.duration);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch YouTube Data API:", err);
        // Fall back to oEmbed
      }
    }

    // Fallback to oEmbed if YouTube Data API not available or failed
    if (durationSeconds === 0 || title === "Unknown Video") {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedResponse = await fetch(oembedUrl);

        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          if (title === "Unknown Video") {
            title = oembedData.title || title;
          }
          if (!channelName) {
            channelName = oembedData.author_name || null;
          }
          if (thumbnailUrl.includes("maxresdefault")) {
            thumbnailUrl = oembedData.thumbnail_url || thumbnailUrl;
          }
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
