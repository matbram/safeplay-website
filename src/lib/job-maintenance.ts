import { createServiceClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { prepareTranscriptForCache } from "@/lib/transcript-utils";

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

export interface MaintenanceResults {
  stale_marked_failed: number;
  duplicates_resolved: number;
  auto_retried: number;
  escalated_to_review: number;
  errors: string[];
}

/**
 * Core job maintenance logic.
 * 1. Marks stale jobs (processing > 30min) as failed
 * 2. Resolves duplicate failed jobs where the video is already cached
 * 3. Auto-retries failed jobs (up to MAX_AUTO_RETRIES)
 * 4. Escalates jobs with repeated failures to needs_review
 */
export async function runJobMaintenance(): Promise<MaintenanceResults> {
  const supabase = createServiceClient();
  const now = Date.now();
  const results: MaintenanceResults = {
    stale_marked_failed: 0,
    duplicates_resolved: 0,
    auto_retried: 0,
    escalated_to_review: 0,
    errors: [],
  };

  // ─────────────────────────────────────────────────────
  // Step 1: Mark stale jobs as failed
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
  // Step 2: Resolve duplicate failed jobs
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
    // Step 3 & 4: Auto-retry or escalate
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
        log("Skipping retry (cooldown)", {
          youtube_id: youtubeId,
          last_retry_ago_ms: now - lastRetry,
        });
        continue;
      }

      // Attempt auto-retry
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

        // Reset the primary job
        await supabase
          .from("filter_jobs")
          .update({
            status: "pending",
            progress: 0,
            error: null,
            completed_at: null,
            auto_retry_count: retryCount + 1,
            last_auto_retry_at: new Date().toISOString(),
          })
          .eq("id", primaryJob.id);

        // Call orchestrator with auth token
        // Priority: 1) Service account JWT (real Supabase user token)
        //           2) SERVICE_API_KEY (orchestrator's service-to-service auth)
        const orchHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const accessToken = await getServiceAccessToken();
        if (accessToken) {
          orchHeaders["Authorization"] = `Bearer ${accessToken}`;
        } else if (process.env.SERVICE_API_KEY) {
          orchHeaders["Authorization"] = `Bearer ${process.env.SERVICE_API_KEY}`;
        } else {
          log("Warning: No auth token available for orchestrator call", {
            youtube_id: youtubeId,
          });
        }

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

        // Update job with new orchestrator job_id
        await supabase
          .from("filter_jobs")
          .update({
            status: orchData.status || "processing",
            job_id: orchData.job_id || primaryJob.job_id,
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
