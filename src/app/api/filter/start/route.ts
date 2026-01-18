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

    const { youtube_id, filter_type, custom_words, sensitivity_level } = await request.json();

    if (!youtube_id) {
      return NextResponse.json(
        { error: "YouTube ID is required" },
        { status: 400 }
      );
    }

    // Check user's credit balance
    const { data: creditBalance } = await supabase
      .from("credit_balances")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    const availableCredits = creditBalance?.available_credits || 0;

    // Check if video is already cached (free to rewatch)
    const { data: cachedVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("youtube_id", youtube_id)
      .single();

    let creditCost = 0;

    if (cachedVideo && cachedVideo.transcript) {
      // Video already transcribed - free to rewatch
      creditCost = 0;

      // Record in filter history
      const { data: historyEntry } = await supabase
        .from("filter_history")
        .insert({
          user_id: session.user.id,
          video_id: cachedVideo.id,
          filter_type: filter_type || "mute",
          custom_words: custom_words || [],
          credits_used: 0,
        })
        .select()
        .single();

      return NextResponse.json({
        status: "completed",
        cached: true,
        transcript: cachedVideo.transcript,
        video: {
          youtube_id: cachedVideo.youtube_id,
          title: cachedVideo.title,
          channel_name: cachedVideo.channel_name,
          duration_seconds: cachedVideo.duration_seconds,
          thumbnail_url: cachedVideo.thumbnail_url,
        },
        history_id: historyEntry?.id,
        credits_used: 0,
      });
    }

    // Call orchestrator to start filtering
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (ORCHESTRATOR_API_KEY) {
      headers["Authorization"] = `Bearer ${ORCHESTRATOR_API_KEY}`;
    }

    const response = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
      method: "POST",
      headers,
      body: JSON.stringify({ youtube_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to start filtering", error_code: data.error_code },
        { status: response.status }
      );
    }

    // If already completed on orchestrator (cached there)
    if (data.status === "completed" && data.transcript) {
      const durationSeconds = data.transcript.duration || 300;
      creditCost = calculateCreditCost(durationSeconds);

      // Check credits
      if (creditCost > availableCredits) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            error_code: "INSUFFICIENT_CREDITS",
            required: creditCost,
            available: availableCredits,
          },
          { status: 400 }
        );
      }

      // Deduct credits
      const newBalance = availableCredits - creditCost;
      const newUsed = (creditBalance?.used_this_period || 0) + creditCost;

      await supabase
        .from("credit_balances")
        .update({
          available_credits: newBalance,
          used_this_period: newUsed,
        })
        .eq("user_id", session.user.id);

      // Record credit transaction
      await supabase.from("credit_transactions").insert({
        user_id: session.user.id,
        amount: -creditCost,
        balance_after: newBalance,
        type: "filter",
        description: `Filtered video: ${data.video?.title || youtube_id}`,
      });

      // Cache video in our database
      const { data: videoRecord } = await supabase
        .from("videos")
        .upsert({
          youtube_id: youtube_id,
          title: data.video?.title || data.transcript.title || "Unknown Video",
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`,
          transcript: data.transcript,
          cached_at: new Date().toISOString(),
        })
        .select()
        .single();

      // Record in filter history
      const { data: historyEntry } = await supabase
        .from("filter_history")
        .insert({
          user_id: session.user.id,
          video_id: videoRecord?.id,
          filter_type: filter_type || "mute",
          custom_words: custom_words || [],
          credits_used: creditCost,
        })
        .select()
        .single();

      return NextResponse.json({
        status: "completed",
        cached: true,
        transcript: data.transcript,
        video: {
          youtube_id: youtube_id,
          title: data.video?.title || data.transcript.title || "Unknown Video",
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`,
        },
        history_id: historyEntry?.id,
        credits_used: creditCost,
      });
    }

    // Processing started - return job ID for polling
    if (data.status === "processing" && data.job_id) {
      // Store pending job in database
      await supabase.from("filter_jobs").upsert({
        job_id: data.job_id,
        user_id: session.user.id,
        youtube_id: youtube_id,
        filter_type: filter_type || "mute",
        custom_words: custom_words || [],
        status: "processing",
        created_at: new Date().toISOString(),
      });

      return NextResponse.json({
        status: "processing",
        job_id: data.job_id,
        youtube_id: youtube_id,
        message: "Video processing started",
      });
    }

    // Handle failed status
    if (data.status === "failed") {
      return NextResponse.json(
        { error: data.error || "Failed to process video", error_code: data.error_code },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Filter start error:", error);
    return NextResponse.json(
      { error: "Failed to start filtering" },
      { status: 500 }
    );
  }
}

function calculateCreditCost(durationSeconds: number): number {
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.max(1, minutes);
}
