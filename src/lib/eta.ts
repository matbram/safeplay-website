/**
 * Expected-completion-time helper for filter jobs.
 *
 * The formula mirrors the Chrome extension's countdown (src/content/time-estimator.ts
 * in the extension repo) so the ETA the server returns is consistent with what
 * the user sees on YouTube.
 */

/**
 * Returns the expected job completion time in seconds for a video of the given
 * duration, or null if the duration isn't known.
 */
export function computeEstimate(durationSeconds: number | null | undefined): number | null {
  if (!durationSeconds || durationSeconds <= 0) return null;
  return Math.max(25, Math.round(20 + durationSeconds / 13));
}
