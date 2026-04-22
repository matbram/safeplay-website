import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchWithRetry, isRetryableError } from "@/lib/retry";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

// Max auto-retries before the watchdog gives up and escalates to needs_review.
// Kept in sync with job-maintenance's MAX_AUTO_RETRIES.
export const MAX_AUTO_RETRIES = 3;

export interface RestartableJob {
  id: string;
  job_id: string;
  orchestrator_job_id: string | null;
  youtube_id: string;
  auto_retry_count?: number | null;
}

export interface RestartJobOptions {
  /**
   * If true, this is an automatic restart triggered by the watchdog — bumps
   * auto_retry_count and escalates to needs_review at MAX_AUTO_RETRIES.
   * If false, this is a user-initiated restart and the retry counters reset.
   */
  autoRetry: boolean;
  /** Human-readable reason used in error messages + log lines. */
  reason: string;
  /** Auth headers for the orchestrator call. */
  orchHeaders: Record<string, string>;
}

export interface RestartJobResult {
  success: boolean;
  /** True when another process restarted this job first and we backed off. */
  skipped?: boolean;
  status?: string;
  orchestrator_job_id?: string;
  error?: string;
  error_code?: string;
  http_status?: number;
}

function log(message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
  console.log(`[${timestamp}] [JOB-RESTART] ${message}${dataStr}`);
}

/**
 * Restart a stuck filter job without changing the client-facing `job_id`.
 *
 * Behaves like a fresh filter request end-to-end: deletes the cached `videos`
 * row so nothing stale sticks around, fires a best-effort `DELETE` to the
 * orchestrator for the old wedged job, and then calls `POST /api/filter`
 * **without** `force: true` — matching the code path we've confirmed produces
 * a genuinely fresh ElevenLabs run (the same path `/api/filter/start` uses).
 *
 * The `filter_jobs.job_id` stays stable across all of this so the Chrome
 * extension's polling URL keeps working; only `orchestrator_job_id` swaps.
 *
 * Race-safe: the reset UPDATE is guarded by the expected `orchestrator_job_id`,
 * so two concurrent watchdogs can't both restart the same job.
 */
export async function restartJob(
  supabase: SupabaseClient,
  job: RestartableJob,
  options: RestartJobOptions
): Promise<RestartJobResult> {
  const currentOrchId = job.orchestrator_job_id ?? job.job_id;
  const currentRetryCount = job.auto_retry_count ?? 0;

  // Auto-restart: if already at the cap, mark failed + needs_review and stop.
  if (options.autoRetry && currentRetryCount >= MAX_AUTO_RETRIES) {
    await supabase
      .from("filter_jobs")
      .update({
        status: "failed",
        needs_review: true,
        error: `Exceeded ${MAX_AUTO_RETRIES} auto-retries after ${options.reason}`,
      })
      .eq("id", job.id);
    log("Auto-retry cap reached — escalating to review", {
      job_id: job.job_id,
      youtube_id: job.youtube_id,
      retry_count: currentRetryCount,
    });
    return {
      success: false,
      error: `Max auto-retries exceeded`,
    };
  }

  const nextRetryCount = options.autoRetry
    ? currentRetryCount + 1
    : 0;

  // Conditional reset — only one restarter wins the race.
  const resetPayload: Record<string, unknown> = {
    status: "pending",
    progress: 0,
    error: null,
    completed_at: null,
    created_at: new Date().toISOString(),
    auto_retry_count: nextRetryCount,
    last_auto_retry_at: options.autoRetry ? new Date().toISOString() : null,
    needs_review: false,
  };

  const { data: resetRows, error: resetError } = await supabase
    .from("filter_jobs")
    .update(resetPayload)
    .eq("id", job.id)
    .eq("orchestrator_job_id", currentOrchId)
    .select("id");

  if (resetError) {
    log("Failed to reset job row", {
      job_id: job.job_id,
      error: resetError.message,
    });
    return {
      success: false,
      error: "Failed to reset job state",
    };
  }

  if (!resetRows || resetRows.length === 0) {
    // Someone else restarted this job first.
    log("Skipped — row already restarted by another process", {
      job_id: job.job_id,
      youtube_id: job.youtube_id,
    });
    return { success: true, skipped: true };
  }

  // Delete the cached videos row so nothing stale is in front of the orchestrator.
  // If the row doesn't exist this is a no-op. If a completion race rewrites it
  // milliseconds later, the upsert in /api/filter/status handles that safely.
  const { error: videosDeleteError } = await supabase
    .from("videos")
    .delete()
    .eq("youtube_id", job.youtube_id);
  if (videosDeleteError) {
    log("Videos-row delete failed (continuing)", {
      job_id: job.job_id,
      youtube_id: job.youtube_id,
      error: videosDeleteError.message,
    });
  }

  // Best-effort: tell the orchestrator to release the wedged old job. We don't
  // wait long and we don't care if this fails — it's hygiene, not a blocker.
  try {
    await fetch(`${ORCHESTRATOR_URL}/api/jobs/${currentOrchId}`, {
      method: "DELETE",
      headers: options.orchHeaders,
      signal: AbortSignal.timeout(3000),
    });
  } catch (cancelError) {
    log("Orchestrator cancel failed (ignored)", {
      job_id: job.job_id,
      orchestrator_job_id: currentOrchId,
      error: cancelError instanceof Error ? cancelError.message : String(cancelError),
    });
  }

  // Call the orchestrator without `force: true` — a plain first-time-style
  // request. Force:true on a wedged job tended to hand us new ids pointing at
  // the same stuck ElevenLabs state; a clean request gets a genuinely new run.
  let orchResponse: Response;
  try {
    orchResponse = await fetchWithRetry(
      `${ORCHESTRATOR_URL}/api/filter`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options.orchHeaders },
        body: JSON.stringify({ youtube_id: job.youtube_id }),
      },
      { maxAttempts: 3, initialDelayMs: 1000 }
    );
  } catch (fetchError) {
    const errMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
    log("Orchestrator unreachable on restart", {
      job_id: job.job_id,
      error: errMsg,
    });
    // Leave the row in pending — the next sweep will try again.
    return {
      success: false,
      error: isRetryableError(fetchError)
        ? "Orchestrator temporarily unavailable"
        : "Failed to reach orchestrator",
      error_code: "ORCHESTRATOR_UNAVAILABLE",
      http_status: isRetryableError(fetchError) ? 503 : 502,
    };
  }

  const orchData = await orchResponse.json();

  if (!orchResponse.ok) {
    log("Orchestrator rejected restart", {
      job_id: job.job_id,
      http_status: orchResponse.status,
      error: orchData.error,
    });
    await supabase
      .from("filter_jobs")
      .update({
        status: "failed",
        error: orchData.error || "Orchestrator rejected restart",
      })
      .eq("id", job.id);
    return {
      success: false,
      error: orchData.error || "Orchestrator rejected restart",
      error_code: orchData.error_code,
      http_status: orchResponse.status,
    };
  }

  const newOrchestratorJobId: string = orchData.job_id || currentOrchId;
  const newStatus: string = orchData.status || "processing";

  const { error: updateError } = await supabase
    .from("filter_jobs")
    .update({
      orchestrator_job_id: newOrchestratorJobId,
      status: newStatus,
      progress: 0,
    })
    .eq("id", job.id);

  if (updateError) {
    log("Failed to persist new orchestrator_job_id", {
      job_id: job.job_id,
      error: updateError.message,
    });
    return {
      success: false,
      error: "Failed to update job record",
    };
  }

  log("Restart complete", {
    job_id: job.job_id,
    youtube_id: job.youtube_id,
    reason: options.reason,
    old_orch_id: currentOrchId,
    new_orch_id: newOrchestratorJobId,
    status: newStatus,
    auto_retry_count: nextRetryCount,
  });

  return {
    success: true,
    status: newStatus,
    orchestrator_job_id: newOrchestratorJobId,
  };
}
