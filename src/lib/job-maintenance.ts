import { createServiceClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prepareTranscriptForCache } from "@/lib/transcript-utils";
import { ETA_OVERRUN_BUFFER_SECONDS, ACTIVE_STATUSES } from "@/lib/eta";
import { restartJob } from "@/lib/job-restart";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

// Jobs processing/pending longer than this are considered stale
const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

// Maximum automatic retries before escalating to human review
const MAX_AUTO_RETRIES = 3;

// Don't auto-retry if last attempt was within this window
const RETRY_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

function log(message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
  console.log(`[${timestamp}] [JOB-MAINTENANCE] ${message}${dataStr}`);
}

/**
 * Get a valid Supabase access token for orchestrator calls.
 * Signs in as a service account user to get a real JWT that
 * the orchestrator can validate via supabase.auth.getUser().
 */
async function getServiceAccessToken(): Promise<string | null> {
  const email = process.env.SERVICE_ACCOUNT_EMAIL;
  const password = process.env.SERVICE_ACCOUNT_PASSWORD;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!email || !password || !supabaseUrl || !supabaseAnonKey) {
    log("Service account credentials not configured", {
      hasEmail: !!email,
      hasPassword: !!password,
    });
    return null;
  }

  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      log("Service account sign-in failed", { error: error?.message });
      return null;
    }

    return data.session.access_token;
  } catch (err) {
    log("Service account token error", { error: String(err) });
    return null;
  }
}

/**
 * Build auth headers for orchestrator calls.
 */
async function getOrchestratorHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const accessToken = await getServiceAccessToken();
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  } else if (process.env.SERVICE_API_KEY) {
    headers["Authorization"] = `Bearer ${process.env.SERVICE_API_KEY}`;
  } else {
    log("Warning: No auth token available for orchestrator calls");
  }
  return headers;
}

export interface MaintenanceResults {
  checked_in_progress: number;
  completed_from_check: number;
  failed_from_check: number;
  stale_marked_failed: number;
  duplicates_resolved: number;
  auto_retried: number;
  escalated_to_review: number;
  errors: string[];
}

/**
 * Core job maintenance logic.
 * 1. Check on in-progress jobs by polling orchestrator (like the browser does)
 * 2. Mark truly stale jobs (processing > 30min with no orchestrator response) as failed
 * 3. Resolve duplicate failed jobs where the video is already cached
 * 4. Auto-retry failed jobs (up to MAX_AUTO_RETRIES)
 * 5. Escalate jobs with repeated failures to needs_review
 */
export async function runJobMaintenance(): Promise<MaintenanceResults> {
  const supabase = createServiceClient();
  const now = Date.now();
  const results: MaintenanceResults = {
    checked_in_progress: 0,
    completed_from_check: 0,
    failed_from_check: 0,
    stale_marked_failed: 0,
    duplicates_resolved: 0,
    auto_retried: 0,
    escalated_to_review: 0,
    errors: [],
  };

  // ─────────────────────────────────────────────────────
  // Step 1: Check on in-progress jobs by polling orchestrator
  // This is the same thing the user's browser does via /api/filter/status/[jobId]
  // ─────────────────────────────────────────────────────
  const { data: inProgressJobs } = await supabase
    .from("filter_jobs")
    .select("id, job_id, orchestrator_job_id, youtube_id, user_id")
    .in("status", ["processing", "pending", "downloading", "transcribing"]);

  if (inProgressJobs && inProgressJobs.length > 0) {
    const orchHeaders = await getOrchestratorHeaders();

    for (const job of inProgressJobs) {
      results.checked_in_progress++;
      const orchestratorJobId = job.orchestrator_job_id || job.job_id;

      try {
        const statusResponse = await fetch(
          `${ORCHESTRATOR_URL}/api/jobs/${orchestratorJobId}`,
          {
            method: "GET",
            headers: orchHeaders,
            signal: AbortSignal.timeout(15000),
          }
        );

        if (!statusResponse.ok) {
          // Orchestrator doesn't know about this job or returned an error
          // Don't mark failed yet — let the stale check handle it if it's old enough
          const errData = await statusResponse.json().catch(() => ({}));
          log("Orchestrator status check error", {
            job_id: job.job_id,
            youtube_id: job.youtube_id,
            http_status: statusResponse.status,
            error: errData.error,
          });
          continue;
        }

        const data = await statusResponse.json();

        if (data.status === "completed" && data.transcript) {
          // Job completed! Save the transcript just like the status endpoint does.
          log("Job completed on orchestrator", {
            job_id: job.job_id,
            youtube_id: job.youtube_id,
          });

          try {
            const cleanedTranscript = prepareTranscriptForCache(
              data.transcript as Record<string, unknown>
            );
            const { error: upsertError } = await supabase
              .from("videos")
              .upsert(
                {
                  youtube_id: job.youtube_id,
                  transcript: cleanedTranscript,
                  title: (() => {
                    const t =
                      data.transcript?.title || data.video?.title;
                    return t && t !== "(cached)" ? t : "Unknown Video";
                  })(),
                  thumbnail_url: `https://img.youtube.com/vi/${job.youtube_id}/hqdefault.jpg`,
                  cached_at: new Date().toISOString(),
                },
                { onConflict: "youtube_id" }
              );

            if (!upsertError) {
              await supabase
                .from("filter_jobs")
                .update({
                  status: "completed",
                  progress: 100,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", job.id);

              results.completed_from_check++;
              log("Job finalized from maintenance check", {
                job_id: job.job_id,
                youtube_id: job.youtube_id,
              });
            }
          } catch (err) {
            log("Failed to save transcript from check", {
              job_id: job.job_id,
              error: String(err),
            });
          }
        } else if (data.status === "failed") {
          // Orchestrator says job failed
          await supabase
            .from("filter_jobs")
            .update({
              status: "failed",
              error: data.error || "Failed on orchestrator",
            })
            .eq("id", job.id);

          results.failed_from_check++;
          log("Job failed on orchestrator", {
            job_id: job.job_id,
            youtube_id: job.youtube_id,
            error: data.error,
          });
        } else {
          // Still processing — update progress and leave it alone
          await supabase
            .from("filter_jobs")
            .update({
              status: data.status || "processing",
              progress: data.progress || 0,
            })
            .eq("id", job.id);
        }
      } catch (err) {
        // Network error polling orchestrator — leave the job alone for now
        log("Failed to poll orchestrator for job", {
          job_id: job.job_id,
          error: String(err),
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────
  // Step 2: Mark stale jobs as failed
  // Only jobs that survived Step 1 (orchestrator unreachable or unknown)
  // ─────────────────────────────────────────────────────
  const staleThreshold = new Date(now - STALE_THRESHOLD_MS).toISOString();

  const { data: staleJobs } = await supabase
    .from("filter_jobs")
    .select("id, job_id, youtube_id")
    .in("status", ["processing", "pending", "downloading", "transcribing"])
    .lt("created_at", staleThreshold);

  if (staleJobs && staleJobs.length > 0) {
    const { error: staleUpdateError } = await supabase
      .from("filter_jobs")
      .update({
        status: "failed",
        error: "Auto-marked as failed (stale/stuck job)",
      })
      .in(
        "id",
        staleJobs.map((j) => j.id)
      );

    if (staleUpdateError) {
      results.errors.push(`stale update: ${staleUpdateError.message}`);
    } else {
      results.stale_marked_failed = staleJobs.length;
    }

    log("Marked stale jobs as failed", {
      count: staleJobs.length,
      job_ids: staleJobs.map((j) => j.job_id),
    });
  }

  // ─────────────────────────────────────────────────────
  // Step 3: Resolve duplicate failed jobs
  // ─────────────────────────────────────────────────────
  const { data: failedJobs } = await supabase
    .from("filter_jobs")
    .select(
      "id, job_id, youtube_id, auto_retry_count, needs_review, last_auto_retry_at"
    )
    .eq("status", "failed");

  if (failedJobs && failedJobs.length > 0) {
    const failedYoutubeIds = [
      ...new Set(failedJobs.map((j) => j.youtube_id)),
    ];

    const [cachedResult, completedJobsResult] = await Promise.all([
      supabase
        .from("videos")
        .select("youtube_id")
        .in("youtube_id", failedYoutubeIds)
        .not("transcript", "is", null),
      supabase
        .from("filter_jobs")
        .select("youtube_id")
        .in("youtube_id", failedYoutubeIds)
        .eq("status", "completed"),
    ]);

    const resolvedIds = new Set<string>();
    cachedResult.data?.forEach((v) => resolvedIds.add(v.youtube_id));
    completedJobsResult.data?.forEach((j) => resolvedIds.add(j.youtube_id));

    // Delete resolved failed jobs
    const toResolve = failedJobs.filter((j) =>
      resolvedIds.has(j.youtube_id)
    );

    if (toResolve.length > 0) {
      const { error: resolveError } = await supabase
        .from("filter_jobs")
        .delete()
        .in(
          "id",
          toResolve.map((j) => j.id)
        );

      if (resolveError) {
        results.errors.push(`resolve duplicates: ${resolveError.message}`);
      } else {
        results.duplicates_resolved = toResolve.length;
      }

      log("Resolved duplicate failed jobs", {
        count: toResolve.length,
        youtube_ids: [...new Set(toResolve.map((j) => j.youtube_id))],
      });
    }

    // ─────────────────────────────────────────────────────
    // Step 4 & 5: Auto-retry or escalate
    // ─────────────────────────────────────────────────────
    const unresolvedJobs = failedJobs.filter(
      (j) => !resolvedIds.has(j.youtube_id) && !j.needs_review
    );

    // Group by youtube_id — only retry one job per video
    const jobsByVideo = new Map<string, typeof unresolvedJobs>();
    for (const job of unresolvedJobs) {
      if (!jobsByVideo.has(job.youtube_id)) {
        jobsByVideo.set(job.youtube_id, []);
      }
      jobsByVideo.get(job.youtube_id)!.push(job);
    }

    const orchHeaders = await getOrchestratorHeaders();

    for (const [youtubeId, videoJobs] of jobsByVideo) {
      const primaryJob = videoJobs.reduce((best, j) =>
        (j.auto_retry_count || 0) < (best.auto_retry_count || 0) ? j : best
      );

      const retryCount = primaryJob.auto_retry_count || 0;

      // Escalate if exceeded max retries
      if (retryCount >= MAX_AUTO_RETRIES) {
        const { error: escalateError } = await supabase
          .from("filter_jobs")
          .update({ needs_review: true })
          .in(
            "id",
            videoJobs.map((j) => j.id)
          );

        if (escalateError) {
          results.errors.push(
            `escalate ${youtubeId}: ${escalateError.message}`
          );
        } else {
          results.escalated_to_review += videoJobs.length;
          log("Escalated to human review", {
            youtube_id: youtubeId,
            retry_count: retryCount,
            job_count: videoJobs.length,
          });
        }
        continue;
      }

      // Check cooldown
      const lastRetry = primaryJob.last_auto_retry_at
        ? new Date(primaryJob.last_auto_retry_at).getTime()
        : 0;
      if (now - lastRetry < RETRY_COOLDOWN_MS) {
        continue;
      }

      // Attempt auto-retry — same as clicking retry in the admin UI
      try {
        // Clear cached video data
        try {
          const { data: files } = await supabase.storage
            .from("videos")
            .list(youtubeId);
          if (files && files.length > 0) {
            await supabase.storage
              .from("videos")
              .remove(files.map((f) => `${youtubeId}/${f.name}`));
          }
        } catch {
          // Storage cleanup is best-effort
        }

        await supabase
          .from("videos")
          .delete()
          .eq("youtube_id", youtubeId);

        // Reset the job
        await supabase
          .from("filter_jobs")
          .update({
            status: "pending",
            progress: 0,
            error: null,
            completed_at: null,
            created_at: new Date().toISOString(),
            auto_retry_count: retryCount + 1,
            last_auto_retry_at: new Date().toISOString(),
          })
          .eq("id", primaryJob.id);

        // Call orchestrator — same request as the admin retry
        const orchResponse = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
          method: "POST",
          headers: orchHeaders,
          body: JSON.stringify({ youtube_id: youtubeId, force: true }),
          signal: AbortSignal.timeout(30000),
        });

        const orchData = await orchResponse.json();

        if (!orchResponse.ok) {
          await supabase
            .from("filter_jobs")
            .update({
              status: "failed",
              error: `Auto-retry #${retryCount + 1} failed: ${orchData.error || "Orchestrator error"}`,
            })
            .eq("id", primaryJob.id);

          log("Auto-retry failed (orchestrator error)", {
            youtube_id: youtubeId,
            attempt: retryCount + 1,
            error: orchData.error,
          });
          continue;
        }

        // Update job with orchestrator response. Keep client-facing job_id
        // stable — only swap the orchestrator-side id so the Chrome extension's
        // polling URL keeps working across auto-retries.
        await supabase
          .from("filter_jobs")
          .update({
            status: orchData.status || "processing",
            orchestrator_job_id: orchData.job_id || primaryJob.job_id,
          })
          .eq("id", primaryJob.id);

        // If orchestrator returned immediate completion, save it
        if (orchData.transcript && orchData.status === "completed") {
          try {
            const cleanedTranscript = prepareTranscriptForCache(
              orchData.transcript as Record<string, unknown>
            );
            const { error: upsertError } = await supabase
              .from("videos")
              .upsert(
                {
                  youtube_id: youtubeId,
                  transcript: cleanedTranscript,
                  title: (() => {
                    const t =
                      orchData.transcript?.title || orchData.video?.title;
                    return t && t !== "(cached)" ? t : "Unknown Video";
                  })(),
                  thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
                  cached_at: new Date().toISOString(),
                },
                { onConflict: "youtube_id" }
              );

            if (!upsertError) {
              await supabase
                .from("filter_jobs")
                .update({
                  status: "completed",
                  progress: 100,
                  completed_at: new Date().toISOString(),
                })
                .eq("id", primaryJob.id);
            }
          } catch (err) {
            log("Failed to save transcript on auto-retry", {
              youtube_id: youtubeId,
              error: String(err),
            });
          }
        }

        // Clean up sibling failed jobs for this video
        const siblingIds = videoJobs
          .filter((j) => j.id !== primaryJob.id)
          .map((j) => j.id);
        if (siblingIds.length > 0) {
          await supabase.from("filter_jobs").delete().in("id", siblingIds);
        }

        results.auto_retried++;
        log("Auto-retry initiated", {
          youtube_id: youtubeId,
          attempt: retryCount + 1,
          new_job_id: orchData.job_id,
          status: orchData.status,
          siblings_cleaned: siblingIds.length,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        results.errors.push(`retry ${youtubeId}: ${errorMsg}`);

        await supabase
          .from("filter_jobs")
          .update({
            status: "failed",
            error: `Auto-retry #${retryCount + 1} failed: ${errorMsg}`,
            auto_retry_count: retryCount + 1,
            last_auto_retry_at: new Date().toISOString(),
          })
          .eq("id", primaryJob.id);

        log("Auto-retry exception", {
          youtube_id: youtubeId,
          attempt: retryCount + 1,
          error: errorMsg,
        });
      }
    }
  }

  log("=== Job Maintenance Complete ===", results as unknown as Record<string, unknown>);
  return results;
}

export interface EtaSweepResults {
  checked: number;
  restarted: number;
  escalated: number;
  errors: string[];
}

/**
 * Fast watchdog for jobs whose ElevenLabs transcription has silently hung.
 *
 * ElevenLabs is a black box: we only know a job completed when its webhook
 * fires. If the webhook is dropped or ElevenLabs wedges, the orchestrator has
 * no signal and the job sits forever. This sweep detects that by comparing
 * wall-clock elapsed to the ETA we stored at job creation, and auto-restarts
 * via `restartJob` — which keeps the client-facing `job_id` stable so the
 * Chrome extension's polling URL doesn't break.
 *
 * Designed to run on a short interval (every 30s) separate from the 10-minute
 * `runJobMaintenance` sweep.
 */
export async function sweepEtaOverruns(): Promise<EtaSweepResults> {
  const supabase = createServiceClient();
  const results: EtaSweepResults = {
    checked: 0,
    restarted: 0,
    escalated: 0,
    errors: [],
  };

  const now = Date.now();
  // Upper bound on created_at so rows younger than the minimum possible
  // ETA+buffer are excluded from the query entirely. Actual threshold per row
  // is rechecked in-process because eta_seconds varies per video.
  //
  // Minimum ETA is 25s (formula floor) + buffer = 55s, so anything younger than
  // that can't possibly have overrun.
  const candidateCutoff = new Date(now - 55_000).toISOString();

  const { data: candidates, error } = await supabase
    .from("filter_jobs")
    .select(
      "id, job_id, orchestrator_job_id, youtube_id, status, created_at, eta_seconds, auto_retry_count"
    )
    .in("status", Array.from(ACTIVE_STATUSES))
    .not("eta_seconds", "is", null)
    .lt("created_at", candidateCutoff);

  if (error) {
    results.errors.push(`query: ${error.message}`);
    return results;
  }

  if (!candidates || candidates.length === 0) {
    return results;
  }

  const stuck = candidates.filter((job) => {
    if (job.eta_seconds == null) return false;
    const createdAt = new Date(job.created_at).getTime();
    if (Number.isNaN(createdAt)) return false;
    const thresholdMs = (job.eta_seconds + ETA_OVERRUN_BUFFER_SECONDS) * 1000;
    return now - createdAt > thresholdMs;
  });

  if (stuck.length === 0) {
    return results;
  }

  const orchHeaders = await getOrchestratorHeaders();

  for (const job of stuck) {
    results.checked++;
    try {
      const result = await restartJob(
        supabase,
        {
          id: job.id,
          job_id: job.job_id,
          orchestrator_job_id: job.orchestrator_job_id,
          youtube_id: job.youtube_id,
          auto_retry_count: job.auto_retry_count ?? 0,
        },
        {
          autoRetry: true,
          reason: "auto-retry-eta-overrun",
          orchHeaders,
        }
      );

      if (result.skipped) continue;
      if (result.success) {
        results.restarted++;
      } else if (result.error?.includes("Max auto-retries")) {
        results.escalated++;
      } else {
        results.errors.push(`${job.job_id}: ${result.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.errors.push(`${job.job_id}: ${msg}`);
      log("ETA sweep exception", { job_id: job.job_id, error: msg });
    }
  }

  if (results.checked > 0) {
    log("[auto-retry-eta-overrun] sweep complete", results as unknown as Record<string, unknown>);
  }
  return results;
}
