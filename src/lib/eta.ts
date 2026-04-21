/**
 * Expected-completion-time helpers for filter jobs.
 *
 * The formula mirrors the Chrome extension's countdown (src/content/time-estimator.ts
 * in the extension repo) so the ETA the server uses for its stuck-job watchdog is
 * consistent with what the user sees on YouTube.
 */

// Extra wall-clock time beyond ETA before a job is considered stuck.
// Protects against normal variance (network jitter, server load) while still
// firing long before the 30-minute stale sweep.
export const ETA_OVERRUN_BUFFER_SECONDS = 30;

export const ACTIVE_STATUSES: ReadonlySet<string> = new Set([
  "pending",
  "processing",
  "downloading",
  "transcribing",
]);

/**
 * Returns the expected job completion time in seconds for a video of the given
 * duration, or null if the duration isn't known.
 */
export function computeEstimate(durationSeconds: number | null | undefined): number | null {
  if (!durationSeconds || durationSeconds <= 0) return null;
  return Math.max(25, Math.round(20 + durationSeconds / 13));
}

/**
 * True if the given job row is in an active state and has been running longer
 * than its ETA plus the overrun buffer. Rows without an ETA are skipped — the
 * 30-minute stale sweep covers them.
 */
export function isEtaOverrun(
  job: {
    status: string;
    created_at: string;
    eta_seconds: number | null;
  },
  now: number = Date.now()
): boolean {
  if (job.eta_seconds == null || job.eta_seconds <= 0) return false;
  if (!ACTIVE_STATUSES.has(job.status)) return false;
  const createdAt = new Date(job.created_at).getTime();
  if (Number.isNaN(createdAt)) return false;
  const thresholdMs = (job.eta_seconds + ETA_OVERRUN_BUFFER_SECONDS) * 1000;
  return now - createdAt > thresholdMs;
}
