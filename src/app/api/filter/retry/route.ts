import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { fetchWithRetry, isRetryableError } from "@/lib/retry";
import { prepareTranscriptForCache } from "@/lib/transcript-utils";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

// Cooldown between free retranscribes for the same video by the same user.
const RETRANSCRIBE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

// A job is restartable if it's stuck in an in-progress state or failed outright.
const RESTARTABLE_STATUSES = new Set([
  "pending",
  "processing",
  "downloading",
  "transcribing",
  "failed",
]);

function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
  console.log(`[${timestamp}] [FILTER-RETRY] [${context}] ${message}${dataStr}`);
}

/**
 * POST /api/filter/retry
 *
 * Two modes:
 *   - action: "restart"       — Restart a stuck or failed job as a fresh orchestrator job.
 *                               Reuses the same filter_jobs row (swaps job_id).
 *                               Requires: { job_id }
 *
 *   - action: "retranscribe"  — User-initiated free re-transcribe of an already-completed video
 *                               (e.g. because ElevenLabs accuracy improved).
 *                               Clears the cached transcript, creates a fresh filter_jobs row
 *                               flagged is_retranscribe=true, reuses the existing download.
 *                               Requires: { youtube_id }
 *
 * Auth: user session cookie or bearer token. Ownership is strictly verified.
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    log(requestId, "=== Filter Retry Request ===");

    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const { action, job_id, youtube_id } = body as {
      action?: string;
      job_id?: string;
      youtube_id?: string;
    };

    if (action !== "restart" && action !== "retranscribe") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'restart' or 'retranscribe'." },
        { status: 400 }
      );
    }

    const orchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (auth.accessToken) {
      orchHeaders["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    if (action === "restart") {
      return await handleRestart(requestId, supabase, auth.user.id, job_id, orchHeaders);
    }

    return await handleRetranscribe(requestId, supabase, auth.user.id, youtube_id, orchHeaders);
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Filter retry error:", error);
    return NextResponse.json(
      { error: "Failed to retry job" },
      { status: 500 }
    );
  }
}

/**
 * Restart a stuck / failed job. Reuses the existing filter_jobs row but swaps in
 * the new orchestrator job_id so progress continues to be tracked on the same record.
 */
async function handleRestart(
  requestId: string,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  jobIdParam: string | undefined,
  orchHeaders: Record<string, string>
) {
  if (!jobIdParam) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from("filter_jobs")
    .select("*")
    .eq("job_id", jobIdParam)
    .eq("user_id", userId)
    .single();

  if (jobError || !job) {
    log(requestId, "Job not found or not owned", { jobIdParam, error: jobError?.message });
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!RESTARTABLE_STATUSES.has(job.status)) {
    log(requestId, "Job is not restartable", { status: job.status });
    return NextResponse.json(
      {
        error:
          job.status === "completed"
            ? "This job already completed. Use Re-transcribe instead."
            : `Cannot restart a job in '${job.status}' status.`,
      },
      { status: 400 }
    );
  }

  // Reset the row so the stale-job detector doesn't immediately re-flag it.
  // Keep id + user_id so filter_history foreign keys remain intact.
  const { error: resetError } = await supabase
    .from("filter_jobs")
    .update({
      status: "pending",
      progress: 0,
      error: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      auto_retry_count: 0,
      needs_review: false,
      last_auto_retry_at: null,
    })
    .eq("id", job.id);

  if (resetError) {
    log(requestId, "Failed to reset job row", { error: resetError.message });
    return NextResponse.json(
      { error: "Failed to reset job state" },
      { status: 500 }
    );
  }

  // Call the orchestrator with force:true so it doesn't return a stale in-flight job.
  log(requestId, "Calling orchestrator for restart", { youtube_id: job.youtube_id });

  let orchResponse: Response;
  try {
    orchResponse = await fetchWithRetry(
      `${ORCHESTRATOR_URL}/api/filter`,
      {
        method: "POST",
        headers: orchHeaders,
        body: JSON.stringify({ youtube_id: job.youtube_id, force: true }),
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
      }
    );
  } catch (fetchError) {
    log(requestId, "Orchestrator unreachable on restart", {
      error: fetchError instanceof Error ? fetchError.message : String(fetchError),
    });
    if (isRetryableError(fetchError)) {
      return NextResponse.json(
        {
          error: "Orchestrator temporarily unavailable. Please try again in a moment.",
          error_code: "ORCHESTRATOR_UNAVAILABLE",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to reach orchestrator" },
      { status: 502 }
    );
  }

  const orchData = await orchResponse.json();
  if (!orchResponse.ok) {
    log(requestId, "Orchestrator rejected restart", {
      status: orchResponse.status,
      error: orchData.error,
    });
    // Mark the job as failed again with the new error so the UI reflects it.
    await supabase
      .from("filter_jobs")
      .update({
        status: "failed",
        error: orchData.error || "Orchestrator rejected restart",
      })
      .eq("id", job.id);
    return NextResponse.json(
      {
        error: orchData.error || "Orchestrator rejected the restart",
        error_code: orchData.error_code,
      },
      { status: orchResponse.status }
    );
  }

  // Orchestrator may return a new job_id (most common) or keep the same one.
  const newJobId: string = orchData.job_id || job.job_id;
  const newStatus: string = orchData.status || "processing";

  const { error: updateError } = await supabase
    .from("filter_jobs")
    .update({
      job_id: newJobId,
      status: newStatus,
      progress: 0,
    })
    .eq("id", job.id);

  if (updateError) {
    log(requestId, "Failed to write new job_id to filter_jobs", {
      error: updateError.message,
    });
    return NextResponse.json(
      { error: "Failed to update job record" },
      { status: 500 }
    );
  }

  log(requestId, "Restart complete", {
    oldJobId: job.job_id,
    newJobId,
    status: newStatus,
  });

  return NextResponse.json({
    status: newStatus,
    job_id: newJobId,
    youtube_id: job.youtube_id,
    message: "Job restarted",
  });
}

/**
 * User-initiated free re-transcribe of an already-completed video.
 * Creates a new filter_jobs row (so history is preserved) flagged is_retranscribe=true.
 * filter/status will see the flag on completion and skip credit deduction.
 */
async function handleRetranscribe(
  requestId: string,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  youtubeIdParam: string | undefined,
  orchHeaders: Record<string, string>
) {
  if (!youtubeIdParam) {
    return NextResponse.json({ error: "youtube_id is required" }, { status: 400 });
  }

  // Ownership check: user must have previously filtered this video.
  const { data: video } = await supabase
    .from("videos")
    .select("id, youtube_id, storage_path, transcript")
    .eq("youtube_id", youtubeIdParam)
    .single();

  if (!video) {
    return NextResponse.json(
      { error: "Video not found in your library" },
      { status: 404 }
    );
  }

  const { data: history } = await supabase
    .from("filter_history")
    .select("id")
    .eq("user_id", userId)
    .eq("video_id", video.id)
    .limit(1)
    .maybeSingle();

  if (!history) {
    return NextResponse.json(
      { error: "You haven't filtered this video yet" },
      { status: 403 }
    );
  }

  // Cooldown: block spammy retranscribes on the same video.
  const cutoff = new Date(Date.now() - RETRANSCRIBE_COOLDOWN_MS).toISOString();
  const { data: recentRetranscribe } = await supabase
    .from("filter_jobs")
    .select("job_id, status, created_at")
    .eq("user_id", userId)
    .eq("youtube_id", youtubeIdParam)
    .eq("is_retranscribe", true)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentRetranscribe && ["pending", "processing", "downloading", "transcribing"].includes(recentRetranscribe.status)) {
    // There's already an active retranscribe — just return it instead of creating another.
    log(requestId, "Returning existing in-flight retranscribe", {
      jobId: recentRetranscribe.job_id,
    });
    return NextResponse.json({
      status: recentRetranscribe.status,
      job_id: recentRetranscribe.job_id,
      youtube_id: youtubeIdParam,
      message: "Re-transcribe already in progress",
    });
  }

  if (recentRetranscribe) {
    return NextResponse.json(
      {
        error: "You re-transcribed this video recently. Please wait a few minutes before trying again.",
        error_code: "RETRANSCRIBE_COOLDOWN",
      },
      { status: 429 }
    );
  }

  // Clear the cached transcript so the orchestrator's new result replaces it.
  // Keep storage_path + metadata so the orchestrator can skip re-download.
  const { error: clearError } = await supabase
    .from("videos")
    .update({ transcript: null })
    .eq("youtube_id", youtubeIdParam);

  if (clearError) {
    log(requestId, "Failed to clear cached transcript", { error: clearError.message });
    return NextResponse.json(
      { error: "Failed to clear cached transcript" },
      { status: 500 }
    );
  }

  // Call orchestrator — no force, so it can skip download if the audio file already exists.
  let orchResponse: Response;
  try {
    orchResponse = await fetchWithRetry(
      `${ORCHESTRATOR_URL}/api/filter`,
      {
        method: "POST",
        headers: orchHeaders,
        body: JSON.stringify({ youtube_id: youtubeIdParam }),
      },
      {
        maxAttempts: 3,
        initialDelayMs: 1000,
      }
    );
  } catch (fetchError) {
    log(requestId, "Orchestrator unreachable on retranscribe", {
      error: fetchError instanceof Error ? fetchError.message : String(fetchError),
    });
    if (isRetryableError(fetchError)) {
      return NextResponse.json(
        {
          error: "Orchestrator temporarily unavailable. Please try again in a moment.",
          error_code: "ORCHESTRATOR_UNAVAILABLE",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Failed to reach orchestrator" },
      { status: 502 }
    );
  }

  const orchData = await orchResponse.json();
  if (!orchResponse.ok) {
    log(requestId, "Orchestrator rejected retranscribe", {
      status: orchResponse.status,
      error: orchData.error,
    });
    return NextResponse.json(
      {
        error: orchData.error || "Orchestrator rejected the re-transcribe",
        error_code: orchData.error_code,
      },
      { status: orchResponse.status }
    );
  }

  // If the orchestrator returned a completed result immediately (cache hit on their end),
  // persist the new transcript right now without charging.
  if (orchData.status === "completed" && orchData.transcript) {
    const cleaned = prepareTranscriptForCache(orchData.transcript as Record<string, unknown>);
    const { error: upsertError } = await supabase
      .from("videos")
      .upsert(
        {
          youtube_id: youtubeIdParam,
          transcript: cleaned,
          cached_at: new Date().toISOString(),
        },
        { onConflict: "youtube_id" }
      );
    if (upsertError) {
      log(requestId, "Failed to upsert retranscribed video", { error: upsertError.message });
    }

    // Log a zero-credit history row so the user can see the retranscribe happened.
    await supabase.from("filter_history").insert({
      user_id: userId,
      video_id: video.id,
      filter_type: "mute",
      custom_words: [],
      credits_used: 0,
    });

    return NextResponse.json({
      status: "completed",
      job_id: orchData.job_id || null,
      youtube_id: youtubeIdParam,
      cached: true,
      message: "Re-transcribe complete",
    });
  }

  // Processing — record the new job flagged as a retranscribe.
  if (orchData.status === "processing" && orchData.job_id) {
    const { error: insertError } = await supabase.from("filter_jobs").upsert({
      job_id: orchData.job_id,
      user_id: userId,
      youtube_id: youtubeIdParam,
      filter_type: "mute",
      custom_words: [],
      status: "processing",
      progress: 0,
      is_retranscribe: true,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      log(requestId, "Failed to insert retranscribe job record", {
        error: insertError.message,
      });
      return NextResponse.json(
        { error: "Failed to record retranscribe job" },
        { status: 500 }
      );
    }

    log(requestId, "Retranscribe started", {
      jobId: orchData.job_id,
      youtube_id: youtubeIdParam,
    });

    return NextResponse.json({
      status: "processing",
      job_id: orchData.job_id,
      youtube_id: youtubeIdParam,
      message: "Re-transcribe started",
    });
  }

  // Fallback: unexpected orchestrator response shape.
  log(requestId, "Unexpected orchestrator response on retranscribe", { orchData });
  return NextResponse.json(
    { error: "Unexpected orchestrator response" },
    { status: 502 }
  );
}
