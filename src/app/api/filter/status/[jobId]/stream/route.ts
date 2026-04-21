import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { fetchYouTubeDuration } from "@/lib/youtube";
import { fetchWithRetry, isRetryableError } from "@/lib/retry";
import { prepareTranscriptForCache } from "@/lib/transcript-utils";

const ORCHESTRATOR_URL = process.env.ORCHESTRATION_API_URL || "https://safeplay-orchestrator-80308222868.us-central1.run.app";

/**
 * When a job completes, clean up duplicate failed jobs for the same video.
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
  console.log(`[${timestamp}] [FILTER-SSE] [${context}] ${message}${dataStr}`);
}

function calculateCreditCost(durationSeconds: number): number {
  const minutes = Math.round(durationSeconds / 60);
  return Math.max(1, minutes);
}

// Map orchestrator status to UI-friendly progress
function mapProgress(status: string, progress: number): { displayProgress: number; displayMessage: string } {
  let displayProgress = progress || 0;
  let displayMessage = "";

  switch (status) {
    case "pending":
      displayProgress = 5;
      displayMessage = "Preparing video...";
      break;
    case "downloading":
      displayProgress = 5 + Math.round((progress || 0) * 0.30);
      displayMessage = "Downloading video...";
      break;
    case "transcribing":
      displayProgress = 35 + Math.round((progress || 0) * 0.60);
      displayMessage = "Analyzing audio...";
      break;
    case "completed":
      displayProgress = 100;
      displayMessage = "Complete!";
      break;
    case "failed":
      displayMessage = "Processing failed";
      break;
    default:
      displayMessage = "Processing...";
  }

  return { displayProgress, displayMessage };
}

// Process job completion: save video, deduct credits, create history
async function processCompletion(
  requestId: string,
  jobId: string,
  userId: string,
  jobRecord: { youtube_id: string; filter_type?: string; custom_words?: string[] },
  data: { transcript?: { duration?: number; title?: string }; video?: { title?: string; channel_name?: string; duration?: number }; duration?: number }
): Promise<{
  success: boolean;
  error?: string;
  error_code?: string;
  credits_used?: number;
  history_id?: string;
  video?: {
    youtube_id: string;
    title: string;
    channel_name: string | null;
    duration_seconds: number;
    thumbnail_url: string;
  };
}> {
  const supabase = createServiceClient();

  log(requestId, "=== Processing completion ===");

  // Get duration from various sources
  let durationSeconds = data.transcript?.duration || data.video?.duration || data.duration || 0;
  log(requestId, "Duration from orchestrator", { durationSeconds });

  // Fetch from YouTube if not available
  if (durationSeconds === 0 && jobRecord.youtube_id) {
    log(requestId, "Fetching duration from YouTube", { youtubeId: jobRecord.youtube_id });
    durationSeconds = await fetchYouTubeDuration(jobRecord.youtube_id);
    log(requestId, "YouTube duration result", { durationSeconds });
  }

  const creditCost = calculateCreditCost(durationSeconds);
  log(requestId, "Credit calculation", { durationSeconds, creditCost });

  // Check user's credit balance
  const { data: creditBalance, error: balanceError } = await supabase
    .from("credit_balances")
    .select("*")
    .eq("user_id", userId)
    .single();

  log(requestId, "Credit balance lookup", {
    available: creditBalance?.available_credits,
    error: balanceError?.message
  });

  const availableCredits = creditBalance?.available_credits || 0;

  // Check credits
  if (creditCost > availableCredits) {
    log(requestId, "INSUFFICIENT CREDITS", { required: creditCost, available: availableCredits });

    await supabase
      .from("filter_jobs")
      .update({ status: "failed", error: "Insufficient credits" })
      .eq("job_id", jobId);

    return {
      success: false,
      error: "Insufficient credits",
      error_code: "INSUFFICIENT_CREDITS",
    };
  }

  // Cache video in database BEFORE deducting credits
  // Strip character/word-level timing to reduce payload size for long videos
  const { data: videoRecord, error: videoError } = await supabase
    .from("videos")
    .upsert({
      youtube_id: jobRecord.youtube_id,
      title: (() => { const t = data.video?.title || data.transcript?.title; return (t && t !== "(cached)") ? t : "Unknown Video"; })(),
      channel_name: data.video?.channel_name || null,
      duration_seconds: durationSeconds,
      thumbnail_url: `https://img.youtube.com/vi/${jobRecord.youtube_id}/hqdefault.jpg`,
      transcript: prepareTranscriptForCache(data.transcript as Record<string, unknown>),
      cached_at: new Date().toISOString(),
    }, { onConflict: 'youtube_id' })
    .select()
    .single();

  log(requestId, "Video cache result", {
    success: !videoError,
    videoId: videoRecord?.id,
    error: videoError?.message
  });

  if (videoError || !videoRecord) {
    log(requestId, "CRITICAL: Video cache failed - not deducting credits", {
      error: videoError?.message,
    });
    await supabase
      .from("filter_jobs")
      .update({ status: "failed", error: "Failed to save video" })
      .eq("job_id", jobId);

    return {
      success: false,
      error: "Failed to save video. Credits were not charged. Please try again.",
      error_code: "CACHE_FAILED",
    };
  }

  // Video cached successfully — now deduct credits
  const newBalance = availableCredits - creditCost;
  const newUsed = (creditBalance?.used_this_period || 0) + creditCost;

  log(requestId, "Deducting credits", { creditCost, oldBalance: availableCredits, newBalance });

  await supabase
    .from("credit_balances")
    .update({
      available_credits: newBalance,
      used_this_period: newUsed,
    })
    .eq("user_id", userId);

  // Record credit transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -creditCost,
    balance_after: newBalance,
    type: "filter",
    description: `Filtered video: ${data.video?.title || jobRecord.youtube_id}`,
  });

  // Create history entry
  const { data: historyEntry, error: historyError } = await supabase
    .from("filter_history")
    .insert({
      user_id: userId,
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
    error: historyError?.message
  });

  // Mark job as completed
  await supabase
    .from("filter_jobs")
    .update({
      status: "completed",
      credits_used: creditCost,
      completed_at: new Date().toISOString(),
    })
    .eq("job_id", jobId);

  // Auto-resolve any duplicate failed jobs for this video
  await resolveSiblingFailedJobs(jobRecord.youtube_id, jobId);

  log(requestId, "=== Job finalized ===", { creditsUsed: creditCost, historyId: historyEntry?.id });

  return {
    success: true,
    credits_used: creditCost,
    history_id: historyEntry?.id,
    video: {
      youtube_id: jobRecord.youtube_id,
      title: (() => { const t = data.video?.title || data.transcript?.title; return (t && t !== "(cached)") ? t : "Unknown Video"; })(),
      channel_name: data.video?.channel_name || null,
      duration_seconds: durationSeconds,
      thumbnail_url: `https://img.youtube.com/vi/${jobRecord.youtube_id}/hqdefault.jpg`,
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    const { jobId } = await params;
    log(requestId, "=== SSE Stream Request ===", { jobId });

    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);
    log(requestId, "Auth result", { userId: auth.user?.id, error: auth.error });

    if (!auth.user) {
      log(requestId, "Auth failed - returning 401");
      return new Response(JSON.stringify({ error: auth.error || "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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
      error: jobError?.message
    });

    if (!jobRecord) {
      log(requestId, "Job not found - returning 404");
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If job already completed in our DB, return JSON immediately
    if (jobRecord.status === "completed") {
      log(requestId, "Job already completed in DB");
      return new Response(JSON.stringify({
        status: "completed",
        cached: true,
        progress: 100,
        message: "Complete!",
        credits_used: jobRecord.credits_used || 0,
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Connect to orchestrator's SSE endpoint using the current orchestrator-side id.
    const orchestratorJobId: string = jobRecord.orchestrator_job_id || jobRecord.job_id;

    const headers: Record<string, string> = {
      "Accept": "text/event-stream",
    };

    if (auth.accessToken) {
      headers["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    log(requestId, "Connecting to orchestrator SSE", { url: `${ORCHESTRATOR_URL}/api/jobs/${orchestratorJobId}/stream` });

    let orchestratorResponse: Response;
    try {
      orchestratorResponse = await fetchWithRetry(
        `${ORCHESTRATOR_URL}/api/jobs/${orchestratorJobId}/stream`,
        { headers },
        {
          maxAttempts: 3,
          initialDelayMs: 1000,
          onRetry: (attempt, error, delayMs) => {
            log(requestId, `Retry attempt ${attempt}`, { error: error.message, delayMs });
          },
        }
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log(requestId, "Failed to connect to orchestrator", { error: errorMsg });

      // If retryable error, suggest client retry
      if (isRetryableError(error)) {
        return new Response(JSON.stringify({
          error: "Orchestrator temporarily unavailable",
          error_code: "ORCHESTRATOR_UNAVAILABLE",
          retry: true,
        }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to connect to orchestrator" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const contentType = orchestratorResponse.headers.get("Content-Type") || "";
    log(requestId, "Orchestrator response", {
      status: orchestratorResponse.status,
      contentType,
    });

    // If orchestrator returns JSON (job already completed), process and return
    if (contentType.includes("application/json")) {
      const data = await orchestratorResponse.json();
      log(requestId, "Orchestrator returned JSON", { status: data.status, cached: data.cached });

      if (data.status === "completed" && data.transcript) {
        // Process completion
        const result = await processCompletion(
          requestId,
          jobId,
          auth.user.id,
          jobRecord,
          data
        );

        if (!result.success) {
          return new Response(JSON.stringify({
            status: "failed",
            error: result.error,
            error_code: result.error_code,
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          status: "completed",
          cached: true,
          progress: 100,
          message: "Complete!",
          credits_used: result.credits_used,
          history_id: result.history_id,
          video: result.video,
          transcript: data.transcript,
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Return orchestrator's JSON response as-is for other statuses
      return new Response(JSON.stringify(data), {
        status: orchestratorResponse.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // SSE response - create a transform stream to proxy events
    if (!orchestratorResponse.body) {
      log(requestId, "No response body from orchestrator");
      return new Response(JSON.stringify({ error: "No response body" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Track job record and user for completion processing
    const userId = auth.user.id;
    let completionProcessed = false;

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          // Pass through heartbeat comments
          if (line.startsWith(':')) {
            controller.enqueue(encoder.encode(line + '\n'));
            continue;
          }

          // Handle event data
          if (line.startsWith('data:')) {
            try {
              const jsonStr = line.slice(5).trim();
              if (!jsonStr) continue;

              const eventData = JSON.parse(jsonStr);
              log(requestId, "SSE event", { type: eventData.type || 'unknown', status: eventData.status });

              // Map progress for progress events
              if (eventData.status && eventData.progress !== undefined) {
                const { displayProgress, displayMessage } = mapProgress(eventData.status, eventData.progress);
                eventData.progress = displayProgress;
                eventData.message = displayMessage;

                // Update job progress in DB
                await supabase
                  .from("filter_jobs")
                  .update({
                    status: eventData.status,
                    progress: displayProgress,
                  })
                  .eq("job_id", jobId);
              }

              // Handle completion
              if (eventData.type === 'complete' || (eventData.status === 'completed' && eventData.transcript)) {
                if (!completionProcessed) {
                  completionProcessed = true;
                  log(requestId, "Processing completion from SSE");

                  const result = await processCompletion(
                    requestId,
                    jobId,
                    userId,
                    jobRecord,
                    eventData
                  );

                  if (!result.success) {
                    // Send error event
                    const errorEvent = {
                      type: 'error',
                      status: 'failed',
                      error: result.error,
                      error_code: result.error_code,
                    };
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorEvent)}\n\n`));
                    return;
                  }

                  // Enrich completion event with our data
                  eventData.credits_used = result.credits_used;
                  eventData.history_id = result.history_id;
                  eventData.video = result.video;
                  eventData.progress = 100;
                  eventData.message = "Complete!";
                }
              }

              // Handle error events
              if (eventData.type === 'error' || eventData.status === 'failed') {
                log(requestId, "Error event from orchestrator", { error: eventData.error });
                await supabase
                  .from("filter_jobs")
                  .update({ status: "failed", error: eventData.error || "Processing failed" })
                  .eq("job_id", jobId);
              }

              // Send the transformed event
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`));
            } catch (parseError) {
              // If can't parse, pass through as-is
              controller.enqueue(encoder.encode(line + '\n'));
            }
          } else if (line.startsWith('event:')) {
            // Pass through event type lines
            controller.enqueue(encoder.encode(line + '\n'));
          } else if (line === '') {
            // Pass through empty lines (event separators)
            controller.enqueue(encoder.encode('\n'));
          }
        }
      },
    });

    // Pipe orchestrator response through transform and to client
    const responseStream = orchestratorResponse.body.pipeThrough(transformStream);

    return new Response(responseStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("SSE stream error:", error);
    return new Response(JSON.stringify({ error: "Failed to establish stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
