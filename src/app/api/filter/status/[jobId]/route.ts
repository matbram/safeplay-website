import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { fetchYouTubeDuration } from "@/lib/youtube";
import { fetchWithRetry, isRetryableError } from "@/lib/retry";
import { prepareTranscriptForCache } from "@/lib/transcript-utils";

const ORCHESTRATOR_URL = process.env.ORCHESTRATION_API_URL || "https://safeplay-orchestrator-80308222868.us-central1.run.app";

/**
 * When a job completes, clean up duplicate failed jobs for the same video.
 * Since the video is now cached, those failed jobs are resolved.
 */
async function resolveSiblingFailedJobs(youtubeId: string, completedJobId: string) {
  try {
    const supabase = createServiceClient();
    const { data: siblings, error } = await supabase
      .from("filter_jobs")
      .select("id, job_id")
      .eq("youtube_id", youtubeId)
      .eq("status", "failed")
      .neq("job_id", completedJobId);

    if (error || !siblings || siblings.length === 0) return;

    await supabase
      .from("filter_jobs")
      .delete()
      .in("id", siblings.map((s) => s.id));

    log("auto-resolve", `Resolved ${siblings.length} sibling failed jobs`, {
      youtubeId,
      resolvedJobIds: siblings.map((s) => s.job_id),
    });
  } catch (err) {
    console.error("Failed to resolve sibling jobs:", err);
  }
}

// Logging helper for consistent format
function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
  console.log(`[${timestamp}] [FILTER-STATUS] [${context}] ${message}${dataStr}`);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { jobId } = await params;
    log(requestId, "=== Filter Status Check ===", { jobId });

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

    // Check if this job belongs to the user
    const { data: jobRecord, error: jobError } = await supabase
      .from("filter_jobs")
      .select("*")
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id)
      .single();

    log(requestId, "Job lookup result", {
      found: !!jobRecord,
      status: jobRecord?.status,
      youtubeId: jobRecord?.youtube_id,
      error: jobError?.message
    });

    if (!jobRecord) {
      log(requestId, "Job not found - returning 404");
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // If job already completed in our DB, return cached result
    if (jobRecord.status === "completed") {
      log(requestId, "Job already completed in DB", { creditsUsed: jobRecord.credits_used });
      return NextResponse.json({
        status: "completed",
        progress: 100,
        message: "Complete!",
        credits_used: jobRecord.credits_used || 0,
      });
    }

    // Poll orchestrator using the current orchestrator-side id. The client-facing
    // `jobId` (the URL param) stays stable across auto-restarts; the orchestrator
    // id is what actually identifies the underlying job.
    const orchestratorJobId: string = jobRecord.orchestrator_job_id || jobRecord.job_id;
    log(requestId, "Polling orchestrator for status", {
      url: ORCHESTRATOR_URL,
      jobId,
      orchestratorJobId,
    });

    const headers: Record<string, string> = {};

    if (auth.accessToken) {
      headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    let response: Response;
    try {
      response = await fetchWithRetry(
        `${ORCHESTRATOR_URL}/api/jobs/${orchestratorJobId}`,
        { method: "GET", headers },
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
          { error: "Orchestrator temporarily unavailable", error_code: "ORCHESTRATOR_UNAVAILABLE", retry: true },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: "Failed to check status" },
        { status: 502 }
      );
    }

    const data = await response.json();
    log(requestId, "Orchestrator status response", {
      httpStatus: response.status,
      jobStatus: data.status,
      progress: data.progress,
      hasTranscript: !!data.transcript,
      hasVideo: !!data.video
    });

    if (!response.ok) {
      log(requestId, "Orchestrator error - updating job to failed", { error: data.error });
      // Update job status to failed
      await supabase
        .from("filter_jobs")
        .update({ status: "failed", error: data.error })
        .eq("job_id", jobId);

      return NextResponse.json(
        { error: data.error || "Failed to check status", error_code: data.error_code },
        { status: response.status }
      );
    }

    // Map orchestrator status to UI-friendly progress (matching Chrome extension)
    let displayProgress = data.progress || 0;
    let displayMessage = "";

    switch (data.status) {
      case "pending":
        displayProgress = 5;
        displayMessage = "Preparing video...";
        break;
      case "downloading":
        // Map downloading 0-100% to 5-35%
        displayProgress = 5 + Math.round((data.progress || 0) * 0.30);
        displayMessage = "Downloading video...";
        break;
      case "transcribing":
        // Map transcribing 0-100% to 35-95%
        displayProgress = 35 + Math.round((data.progress || 0) * 0.60);
        displayMessage = "Analyzing audio...";
        break;
      case "completed":
        displayProgress = 100;
        displayMessage = "Complete!";
        break;
      case "failed":
        displayMessage = data.error || "Processing failed";
        break;
      default:
        displayMessage = "Processing...";
    }

    log(requestId, "Status mapping", { rawStatus: data.status, displayProgress, displayMessage });

    // Update job progress in our DB
    await supabase
      .from("filter_jobs")
      .update({
        status: data.status,
        progress: displayProgress,
      })
      .eq("job_id", jobId);

    // If completed, finalize the job (save video, deduct credits, save history)
    if (data.status === "completed" && data.transcript) {
      log(requestId, "=== Job completed - finalizing ===");

      // Retranscribe jobs are free (user already paid during the original filter).
      const isRetranscribe = !!jobRecord.is_retranscribe;

      // Try to get duration from multiple possible locations in orchestrator response
      let durationSeconds = data.transcript?.duration || data.video?.duration || data.duration || 0;
      log(requestId, "Duration from orchestrator", {
        transcriptDuration: data.transcript?.duration,
        videoDuration: data.video?.duration,
        topLevelDuration: data.duration,
        result: durationSeconds,
        isRetranscribe,
      });

      // If orchestrator didn't provide duration, fetch from YouTube
      if (durationSeconds === 0 && jobRecord.youtube_id) {
        log(requestId, "Fetching duration from YouTube", { youtubeId: jobRecord.youtube_id });
        durationSeconds = await fetchYouTubeDuration(jobRecord.youtube_id);
        log(requestId, "YouTube duration result", { durationSeconds });
      }

      const creditCost = isRetranscribe ? 0 : calculateCreditCost(durationSeconds);
      log(requestId, "Credit calculation", { durationSeconds, creditCost, isRetranscribe });

      // Check user's credit balance (only meaningful for paid jobs).
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

      // Check credits (retranscribes bypass this since they're free).
      if (!isRetranscribe && creditCost > availableCredits) {
        log(requestId, "INSUFFICIENT CREDITS - marking job as failed", {
          required: creditCost,
          available: availableCredits
        });
        // Update job status to failed due to insufficient credits
        await supabase
          .from("filter_jobs")
          .update({ status: "failed", error: "Insufficient credits" })
          .eq("job_id", jobId);

        return NextResponse.json({
          status: "failed",
          error: "Insufficient credits",
          error_code: "INSUFFICIENT_CREDITS",
          required: creditCost,
          available: availableCredits,
        });
      }

      // Cache video in our database BEFORE deducting credits
      // Strip character/word-level timing to reduce payload size for long videos
      const { data: videoRecord, error: videoError } = await supabase
        .from("videos")
        .upsert({
          youtube_id: jobRecord.youtube_id,
          title: (() => { const t = data.video?.title || data.transcript.title; return (t && t !== "(cached)") ? t : "Unknown Video"; })(),
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${jobRecord.youtube_id}/hqdefault.jpg`,
          transcript: prepareTranscriptForCache(data.transcript),
          cached_at: new Date().toISOString(),
        }, { onConflict: 'youtube_id' })
        .select()
        .single();

      log(requestId, "Video cache result", {
        success: !videoError,
        videoId: videoRecord?.id,
        youtubeId: jobRecord.youtube_id,
        error: videoError?.message,
        errorCode: videoError?.code
      });

      if (videoError || !videoRecord) {
        log(requestId, "CRITICAL: Video cache failed - not deducting credits", {
          error: videoError?.message,
          code: videoError?.code
        });
        // Don't deduct credits — user can retry
        await supabase
          .from("filter_jobs")
          .update({ status: "failed", error: "Failed to save video" })
          .eq("job_id", jobId);

        return NextResponse.json({
          status: "failed",
          error: "Failed to save video. Credits were not charged. Please try again.",
          error_code: "CACHE_FAILED",
        });
      }

      // Video cached successfully — deduct credits only for paid (non-retranscribe) jobs.
      const newBalance = isRetranscribe ? availableCredits : availableCredits - creditCost;
      const newUsed = isRetranscribe
        ? (creditBalance?.used_this_period || 0)
        : (creditBalance?.used_this_period || 0) + creditCost;

      if (!isRetranscribe) {
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
          description: `Filtered video: ${data.video?.title || jobRecord.youtube_id}`,
        }).select().single();

        log(requestId, "Transaction insert result", {
          success: !txError,
          txId: txData?.id,
          error: txError?.message
        });
      } else {
        log(requestId, "Retranscribe completed - skipping credit deduction");
      }

      // Record in filter history (retranscribes log a zero-credit entry for traceability).
      const { data: historyEntry, error: historyError } = await supabase
        .from("filter_history")
        .insert({
          user_id: auth.user.id,
          video_id: videoRecord.id,
          filter_type: jobRecord.filter_type || "mute",
          custom_words: jobRecord.custom_words || [],
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

      // Mark job as completed
      const { error: jobUpdateError } = await supabase
        .from("filter_jobs")
        .update({
          status: "completed",
          credits_used: creditCost,
          completed_at: new Date().toISOString(),
        })
        .eq("job_id", jobId);

      log(requestId, "Job completion update", {
        success: !jobUpdateError,
        error: jobUpdateError?.message
      });

      // Auto-resolve any duplicate failed jobs for this video
      await resolveSiblingFailedJobs(jobRecord.youtube_id, jobId);

      log(requestId, "=== Job finalized ===", { creditsUsed: creditCost, newBalance, historyId: historyEntry?.id });

      return NextResponse.json({
        status: "completed",
        progress: 100,
        message: "Complete!",
        transcript: data.transcript,
        video: {
          youtube_id: jobRecord.youtube_id,
          title: (() => { const t = data.video?.title || data.transcript.title; return (t && t !== "(cached)") ? t : "Unknown Video"; })(),
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${jobRecord.youtube_id}/hqdefault.jpg`,
        },
        history_id: historyEntry?.id,
        credits_used: creditCost,
      });
    }

    // Handle failed status from orchestrator
    if (data.status === "failed") {
      log(requestId, "Orchestrator returned failed status", { error: data.error });
      await supabase
        .from("filter_jobs")
        .update({ status: "failed", error: data.error })
        .eq("job_id", jobId);

      return NextResponse.json({
        status: "failed",
        error: data.error || "Processing failed",
        error_code: data.error_code,
      });
    }

    // Return current status
    log(requestId, "Returning in-progress status", { status: data.status, progress: displayProgress });
    return NextResponse.json({
      status: data.status,
      progress: displayProgress,
      message: displayMessage,
      video: data.video,
    });
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Filter status error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
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
