import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { fetchWithRetry, isRetryableError } from "@/lib/retry";
import { prepareTranscriptForCache } from "@/lib/transcript-utils";
import { computeEstimate } from "@/lib/eta";
import { fetchYouTubeDuration } from "@/lib/youtube";

const ORCHESTRATOR_URL = process.env.ORCHESTRATION_API_URL || "https://safeplay-orchestrator-80308222868.us-central1.run.app";

// Logging helper for consistent format
function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [FILTER-START] [${context}] ${message}${dataStr}`);
}

export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    log(requestId, "=== Filter Start Request ===");

    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);
    log(requestId, "Auth result", { userId: auth.user?.id, error: auth.error });

    if (!auth.user) {
      log(requestId, "Auth failed - returning 401");
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const { youtube_id, filter_type, custom_words } = body;
    log(requestId, "Request body", { youtube_id, filter_type, custom_words });

    if (!youtube_id) {
      log(requestId, "Missing youtube_id - returning 400");
      return NextResponse.json(
        { error: "YouTube ID is required" },
        { status: 400 }
      );
    }

    // Check if video is already cached in OUR database (free to rewatch)
    const { data: cachedVideo, error: cacheError } = await supabase
      .from("videos")
      .select("*")
      .eq("youtube_id", youtube_id)
      .single();

    log(requestId, "Cache lookup result", {
      found: !!cachedVideo,
      hasTranscript: !!cachedVideo?.transcript,
      videoId: cachedVideo?.id,
      error: cacheError?.message
    });

    if (cachedVideo && cachedVideo.transcript) {
      // Video already transcribed in our DB - free to rewatch
      log(requestId, "Video cached - inserting history (free rewatch)");

      const { data: historyEntry, error: historyError } = await supabase
        .from("filter_history")
        .insert({
          user_id: auth.user.id,
          video_id: cachedVideo.id,
          filter_type: filter_type || "mute",
          custom_words: custom_words || [],
          credits_used: 0,
        })
        .select()
        .single();

      log(requestId, "History insert result", {
        success: !historyError,
        historyId: historyEntry?.id,
        error: historyError?.message
      });

      log(requestId, "=== Returning cached result (0 credits) ===");
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

    // Video not in our cache - call orchestrator to start filtering with retry logic
    log(requestId, "Video not cached - calling orchestrator", { url: ORCHESTRATOR_URL });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (auth.accessToken) {
      headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetchWithRetry(
        `${ORCHESTRATOR_URL}/api/filter`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ youtube_id }),
        },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          onRetry: (attempt, error, delayMs) => {
            log(requestId, `Retry attempt ${attempt}`, { error: error.message, delayMs });
          },
        }
      );
    } catch (fetchError) {
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      log(requestId, "Failed to reach orchestrator after retries", { error: errorMsg });

      // If retryable error, return 503 so client can retry
      if (isRetryableError(fetchError)) {
        return NextResponse.json(
          { error: "Orchestrator temporarily unavailable. Please try again.", error_code: "ORCHESTRATOR_UNAVAILABLE" },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Failed to start filtering" },
        { status: 502 }
      );
    }

    const data = await response.json();
    log(requestId, "Orchestrator response", {
      status: response.status,
      responseStatus: data.status,
      hasTranscript: !!data.transcript,
      jobId: data.job_id
    });

    if (!response.ok) {
      log(requestId, "Orchestrator error", { error: data.error, errorCode: data.error_code });
      return NextResponse.json(
        { error: data.error || "Failed to start filtering", error_code: data.error_code },
        { status: response.status }
      );
    }

    // If orchestrator has it cached and returns completed immediately
    if (data.status === "completed" && data.transcript) {
      log(requestId, "Orchestrator returned completed immediately");

      const durationSeconds = data.transcript.duration || 0;
      const creditCost = calculateCreditCost(durationSeconds);
      log(requestId, "Credit calculation", { durationSeconds, creditCost });

      // Check user's credit balance
      const { data: creditBalance, error: balanceError } = await supabase
        .from("credit_balances")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      log(requestId, "Credit balance lookup", {
        available: creditBalance?.available_credits,
        usedThisPeriod: creditBalance?.used_this_period,
        error: balanceError?.message
      });

      const availableCredits = creditBalance?.available_credits || 0;

      if (creditCost > availableCredits) {
        log(requestId, "INSUFFICIENT CREDITS", { required: creditCost, available: availableCredits });
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

      // Cache video in our database BEFORE deducting credits
      // Strip character-level timing to reduce payload size for long videos
      const { data: videoRecord, error: videoError } = await supabase
        .from("videos")
        .upsert({
          youtube_id: youtube_id,
          title: (() => { const t = data.video?.title || data.transcript.title; return (t && t !== "(cached)") ? t : "Unknown Video"; })(),
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg`,
          transcript: prepareTranscriptForCache(data.transcript),
          cached_at: new Date().toISOString(),
        }, { onConflict: 'youtube_id' })
        .select()
        .single();

      log(requestId, "Video cache result", {
        success: !videoError,
        videoId: videoRecord?.id,
        youtubeId: youtube_id,
        error: videoError?.message,
        errorCode: videoError?.code
      });

      if (videoError || !videoRecord) {
        log(requestId, "CRITICAL: Video cache failed - not deducting credits", {
          error: videoError?.message,
          code: videoError?.code
        });
        return NextResponse.json(
          { error: "Failed to save video. Credits were not charged. Please try again.", error_code: "CACHE_FAILED" },
          { status: 502 }
        );
      }

      // Video cached successfully — now deduct credits
      const newBalance = availableCredits - creditCost;
      const newUsed = (creditBalance?.used_this_period || 0) + creditCost;

      log(requestId, "Deducting credits", {
        creditCost,
        oldBalance: availableCredits,
        newBalance,
        oldUsed: creditBalance?.used_this_period,
        newUsed
      });

      const { error: creditUpdateError } = await supabase
        .from("credit_balances")
        .update({
          available_credits: newBalance,
          used_this_period: newUsed,
        })
        .eq("user_id", auth.user.id);

      log(requestId, "Credit update result", {
        success: !creditUpdateError,
        error: creditUpdateError?.message
      });

      // Record credit transaction
      const { data: txData, error: txError } = await supabase.from("credit_transactions").insert({
        user_id: auth.user.id,
        amount: -creditCost,
        balance_after: newBalance,
        type: "filter",
        description: `Filtered video: ${data.video?.title || youtube_id}`,
      }).select().single();

      log(requestId, "Transaction insert result", {
        success: !txError,
        txId: txData?.id,
        error: txError?.message
      });

      // Record in filter history
      const { data: historyEntry, error: historyError } = await supabase
        .from("filter_history")
        .insert({
          user_id: auth.user.id,
          video_id: videoRecord.id,
          filter_type: filter_type || "mute",
          custom_words: custom_words || [],
          credits_used: creditCost,
        })
        .select()
        .single();

      log(requestId, "History insert result", {
        success: !historyError,
        historyId: historyEntry?.id,
        videoId: videoRecord.id,
        creditsUsed: creditCost,
        error: historyError?.message,
        errorCode: historyError?.code
      });

      log(requestId, "=== Filter complete ===", { creditsUsed: creditCost, newBalance });

      return NextResponse.json({
        status: "completed",
        cached: true,
        transcript: data.transcript,
        video: {
          youtube_id: youtube_id,
          title: (() => { const t = data.video?.title || data.transcript.title; return (t && t !== "(cached)") ? t : "Unknown Video"; })(),
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg`,
        },
        history_id: historyEntry?.id,
        credits_used: creditCost,
      });
    }

    // Processing started - save job and return job ID for polling
    if (data.status === "processing" && data.job_id) {
      log(requestId, "Processing started - saving job", { jobId: data.job_id });

      // Resolve video duration for ETA calculation. Prefer orchestrator → cached video → YouTube.
      let durationForEta: number =
        data.transcript?.duration ||
        data.video?.duration ||
        data.duration ||
        cachedVideo?.duration_seconds ||
        0;
      if (!durationForEta && youtube_id) {
        try {
          durationForEta = await fetchYouTubeDuration(youtube_id);
        } catch (err) {
          log(requestId, "ETA duration lookup failed", { error: String(err) });
        }
      }
      const etaSeconds = computeEstimate(durationForEta);
      log(requestId, "ETA computed", { durationForEta, etaSeconds });

      const { error: jobError } = await supabase.from("filter_jobs").upsert({
        job_id: data.job_id,
        orchestrator_job_id: data.job_id,
        user_id: auth.user.id,
        youtube_id: youtube_id,
        filter_type: filter_type || "mute",
        custom_words: custom_words || [],
        status: "processing",
        eta_seconds: etaSeconds,
        created_at: new Date().toISOString(),
      });

      log(requestId, "Job save result", { success: !jobError, error: jobError?.message });

      return NextResponse.json({
        status: "processing",
        job_id: data.job_id,
        youtube_id: youtube_id,
        message: "Video processing started",
      });
    }

    // Handle failed status
    if (data.status === "failed") {
      log(requestId, "Orchestrator returned failed status", { error: data.error });
      return NextResponse.json(
        { error: data.error || "Failed to process video", error_code: data.error_code },
        { status: 400 }
      );
    }

    log(requestId, "Returning raw orchestrator response", { status: data.status });
    return NextResponse.json(data);
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Filter start error:", error);
    return NextResponse.json(
      { error: "Failed to start filtering" },
      { status: 500 }
    );
  }
}

function calculateCreditCost(durationSeconds: number): number {
  // 1 credit per minute of video, minimum 1 credit
  // Round at 30 seconds (Math.round rounds at 0.5 = 30 seconds)
  const minutes = Math.round(durationSeconds / 60);
  return Math.max(1, minutes);
}
