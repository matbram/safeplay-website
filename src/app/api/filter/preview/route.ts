import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ORCHESTRATOR_URL = process.env.ORCHESTRATION_API_URL || "https://safeplay-orchestrator-production.up.railway.app";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATION_API_KEY;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
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

    // Check if we have cached video metadata
    const { data: cachedVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("youtube_id", videoId)
      .single();

    if (cachedVideo) {
      // Calculate credit cost based on duration
      const creditCost = calculateCreditCost(cachedVideo.duration_seconds);

      return NextResponse.json({
        youtube_id: cachedVideo.youtube_id,
        title: cachedVideo.title,
        channel_name: cachedVideo.channel_name,
        duration_seconds: cachedVideo.duration_seconds,
        thumbnail_url: cachedVideo.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        credit_cost: creditCost,
        cached: true,
        has_transcript: !!cachedVideo.transcript,
      });
    }

    // Call orchestrator API to get video metadata
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (ORCHESTRATOR_API_KEY) {
      headers["Authorization"] = `Bearer ${ORCHESTRATOR_API_KEY}`;
    }

    const response = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
      method: "POST",
      headers,
      body: JSON.stringify({ youtube_id: videoId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to fetch video info", error_code: data.error_code },
        { status: response.status }
      );
    }

    // If the video is already cached on the orchestrator, extract metadata
    if (data.status === "completed" && data.transcript) {
      const durationSeconds = data.transcript.duration || 300;
      const creditCost = calculateCreditCost(durationSeconds);

      // Cache the video metadata in our database
      await supabase.from("videos").upsert({
        youtube_id: videoId,
        title: data.video?.title || data.transcript.title || "Unknown Video",
        channel_name: data.video?.channel_name || null,
        duration_seconds: durationSeconds,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        transcript: data.transcript,
        cached_at: new Date().toISOString(),
      });

      return NextResponse.json({
        youtube_id: videoId,
        title: data.video?.title || data.transcript.title || "Unknown Video",
        channel_name: data.video?.channel_name || null,
        duration_seconds: durationSeconds,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        credit_cost: creditCost,
        cached: true,
        has_transcript: true,
        transcript: data.transcript,
      });
    }

    // If processing started, return job info with estimated duration
    if (data.status === "processing" && data.job_id) {
      return NextResponse.json({
        youtube_id: videoId,
        title: "Loading video info...",
        channel_name: null,
        duration_seconds: 0,
        thumbnail_url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        credit_cost: 0,
        cached: false,
        has_transcript: false,
        job_id: data.job_id,
        status: "processing",
      });
    }

    // Handle failed status
    if (data.status === "failed") {
      return NextResponse.json(
        { error: data.error || "Video unavailable", error_code: data.error_code },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
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

function calculateCreditCost(durationSeconds: number): number {
  // 1 credit per minute of video, minimum 1 credit
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.max(1, minutes);
}
