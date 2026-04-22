# Transcription Pipeline Audit & Retry Feature

Audit of the website's transcription/job lifecycle plus the new user-facing retry system added on branch `claude/audit-website-features-KKOEs`.

---

## 1. Pipeline inventory (end to end)

The website is a thin client for the orchestrator service. ElevenLabs itself lives in the orchestrator — not in this repo.

### Request flow

1. **`POST /api/filter/preview`** — user pastes a URL; we fetch YouTube metadata (`src/lib/youtube.ts`) and return a credit estimate. No processing yet.
2. **`POST /api/filter/start`** — the filter button calls this.
   - Cache hit in `videos.transcript` → returns transcript immediately, inserts a free `filter_history` row, 0 credits.
   - Cache miss → calls `ORCHESTRATOR_URL/api/filter`, inserts a `filter_jobs` row with `status='processing'`.
3. **Status updates**:
   - Primary: `GET /api/filter/status/{jobId}/stream` (SSE proxy around the orchestrator's stream).
   - Fallback: `GET /api/filter/status/{jobId}` polling every 2s.
4. **Completion** (`src/app/api/filter/status/[jobId]/route.ts`) — on `status==='completed'` + transcript:
   - Upserts `videos` with cleaned transcript (`prepareTranscriptForCache` strips char-level timing).
   - Deducts credits, writes `credit_transactions`, writes `filter_history`.
   - Marks the job `completed`, auto-resolves sibling failed rows for the same video.

### Safety nets already in place

- `src/lib/retry.ts` — exponential-backoff wrapper around all orchestrator fetches (3 attempts, handles 502/503/504/ECONNRESET/timeouts).
- `src/lib/job-maintenance.ts` + `GET /api/cron/job-maintenance` — marks jobs stale after 30 min of no progress, auto-retries failed jobs up to 3× with a 10-minute cooldown, auto-resolves duplicate failed jobs when the video is already cached elsewhere, and escalates to `needs_review=true` after max retries.
- Admin surface: `/admin/filter-jobs` with `retry`, `retranscribe`, `delete`, `save_transcript`, `mark_stale_failed`, `reset_all_retries`, `cleanup_resolved`, `run_maintenance`.

### Database

`filter_jobs` — id (UUID PK), job_id (text unique, stable client-facing id), `orchestrator_job_id` (text, current orchestrator-side id — may differ from job_id after auto-restart), user_id, youtube_id, filter_type, custom_words, status, progress, credits_used, error, auto_retry_count, needs_review, last_auto_retry_at, `eta_seconds` (expected completion time at creation), created_at, completed_at, is_retranscribe.

`videos` — youtube_id (unique), title/channel/duration/thumbnail, `transcript` (JSONB), cached_at. (The `storage_path` column still exists but is no longer written or read by the website — ElevenLabs ingests YouTube URLs directly, so there's no downloaded audio file on our side.)

`filter_history` — per-user per-video record of each filter run, with credits_used.

`credit_balances`, `credit_transactions` — balance state + ledger.

---

## 2. Gaps surfaced by the audit

| # | Gap | Status |
|---|-----|-------|
| 1 | No user-facing way to recover from a stuck/failed job — only admins could retry. | **Fixed**: customer-facing restart via `/api/filter/retry?action=restart`, with the Chrome extension firing one in-session retry when a job exceeds its ETA. Server-side `runJobMaintenance` provides the background safety net (see Section 7). |
| 2 | Re-transcribing burns ElevenLabs minutes on us, so it can't be exposed to customers. | **Admin-only** — surfaced on the admin filter-jobs list and detail pages. |
| 3 | `filter/status` always deducts credits on completion — doing that on a retranscribe would double-charge the customer. | **Fixed** by the `is_retranscribe` flag, set by the admin retranscribe handler. |
| 4 | Admin UI had a "Download Available / No Download" badge and a `has_download` inference based on `videos.storage_path` + progress. | **Removed** — ElevenLabs ingests YouTube URLs directly, so the website no longer manages or tracks a downloaded audio file. |
| 5 | SSE stream (`/api/filter/status/{jobId}/stream`) polls the orchestrator internally rather than being pushed — so "live" is only as fresh as the proxy's poll interval. | **Noted** — orchestrator-side; not touched here. |
| 6 | No cleanup of orphan `videos` rows or Supabase Storage objects after long periods of disuse. | **Noted**. |
| 7 | `prepareTranscriptForCache` strips character-level timing to reduce payload; long videos fall back to linear estimation. | **Noted** — existing behavior. |
| 8 | No YouTube download code in the website repo (confirmed: no `ytdl`, `yt-dlp`, `youtube-dl`, or related). | **Clean**, as intended. |

---

## 3. Retry / restart surfaces

### Customer-facing: `POST /api/filter/retry` (restart only)

Auth is per-user (session cookie or bearer). Ownership is strictly enforced against `filter_jobs.user_id`.

- Input: `{ action: "restart", job_id }`
- Allowed when the job is in `pending | processing | downloading | transcribing | failed`. Completed jobs return 400 — re-running a completed transcription is admin-only.
- Goes through the shared `restartJob` helper (`src/lib/job-restart.ts`). The helper treats a restart as a full fresh request: it deletes the cached `videos` row for the YouTube id, fires a best-effort `DELETE /api/jobs/{oldOrchestratorJobId}` so the orchestrator can release the wedged job, and then calls `POST /api/filter` **without** `force: true` — the same code path `/api/filter/start` uses on a first-time filter. The client-facing `job_id` stays stable across the swap so the Chrome extension's polling URL doesn't break; only `orchestrator_job_id` changes.
- No credit charge — credits only get deducted at completion, and the old job never completed.
- The filter page (`src/app/(dashboard)/filter/page.tsx`) surfaces a "Restart job" button via its 90-second progress watchdog. The Chrome extension uses the same `/api/filter/retry?action=restart` endpoint to fire its own in-session retry once a job exceeds its ETA (see Section 7).

### Admin-only: re-transcribe

Re-transcribing a completed video burns ElevenLabs minutes on our account, so it isn't exposed to customers. The action lives only in the admin dashboard:

- **List** (`src/app/(admin)/admin/filter-jobs/page.tsx`): the Retranscribe icon shows on every non-active job (i.e. status not in `pending | processing | downloading | transcribing`).
- **Detail** (`src/app/(admin)/admin/filter-jobs/[jobId]/page.tsx`): same visibility rule, sitting next to Retry / Save Transcript / Delete.
- **Endpoint** (`src/app/api/admin/filter-jobs/route.ts`, `case "retranscribe"`): clears `videos.transcript`, resets the existing `filter_jobs` row to `pending` with `is_retranscribe=true`, and calls the orchestrator without `force` so cached audio is reused if present (otherwise re-downloaded).
- **No customer charge:** `is_retranscribe=true` causes `/api/filter/status/[jobId]/route.ts` to skip credit deduction and `credit_transactions` insertion on completion. A zero-credit `filter_history` row is still written for traceability.

### Schema

`supabase-filter-jobs.sql` — idempotent migration adds `is_retranscribe BOOLEAN DEFAULT false` alongside the existing `auto_retry_count / needs_review / last_auto_retry_at` migrations. Used by the admin retranscribe path.

---

## 4. UX failure-mode checklist

| Scenario | Behavior |
|---|---|
| Orchestrator unreachable during restart | 503 with `error_code: ORCHESTRATOR_UNAVAILABLE`; UI shows error, user can retry. `filter_jobs` left in `pending` (the stale detector will catch it if it hangs). |
| Orchestrator 4xx on restart | Row marked `failed` with the orchestrator's error message; banner re-surfaces. |
| User clicks Retry twice | Second click is no-op — the button disables while `retrying=true`. |
| Customer hits `/api/filter/retry` with `action: "retranscribe"` | 400 "Invalid action" — re-transcribing is admin-only. |
| Admin retranscribes while customer is polling for status | `is_retranscribe=true` is set on the row, so `/api/filter/status` skips credit deduction at completion. Customer sees progress reset to 0 then climb to 100, no extra charge. |
| Admin retranscribes a job whose audio was deleted from storage | Orchestrator re-downloads the audio (we call without `force`, so it's a normal pipeline run). Slower but correct. |
| Restart mid-transcribe races with orchestrator completion | The old orchestrator job's result is abandoned (we no longer poll that orchestrator_job_id). If the new job is the one that completes, we still get a clean finalize. No double-charge because `credits_used` is only written on completion and only against the row's current orchestrator_job_id. |

---

## 5. Files touched

| File | Change |
|---|---|
| `src/app/api/filter/retry/route.ts` | Customer-facing retry endpoint, `restart` action only. |
| `src/app/api/filter/status/[jobId]/route.ts` | Gate credit deduction + transaction on `!is_retranscribe`. |
| `src/app/(dashboard)/filter/page.tsx` | Stuck detection + manual restart button. |
| `src/app/(admin)/admin/filter-jobs/page.tsx` | Retranscribe icon visible on every non-active job. |
| `src/app/(admin)/admin/filter-jobs/[jobId]/page.tsx` | Same — Retranscribe sits next to Retry / Save Transcript / Delete. |
| `src/app/api/admin/filter-jobs/route.ts` | Admin retranscribe sets `is_retranscribe=true` on the row so the customer isn't re-charged. |
| `supabase-filter-jobs.sql` | `ADD COLUMN IF NOT EXISTS is_retranscribe BOOLEAN DEFAULT false`. |
| `docs/TRANSCRIPTION_AUDIT.md` | This file. |

---

## 6. Suggested follow-ups

- **Migration application** — run `npm run db:migrate` (or apply `supabase-filter-jobs.sql`) in staging before the feature ships; the SSE + status routes reference the new column.
- **Telemetry** — add a counter on retry usage (mode=restart vs retranscribe) so you can tell if stuck transcriptions are increasing over time.
- **Orchestrator-side cleanup** — when a user restarts a stuck job, consider firing a best-effort `DELETE /api/jobs/{oldJobId}` to the orchestrator so it stops transcribing audio nobody will read. Today we just abandon it.
- **Retranscribe across engine versions** — once the orchestrator exposes a transcript engine version, surface it in history UI so users know which version they're on and whether a re-transcribe would gain anything.

---

## 7. Stuck-job recovery model

ElevenLabs is a black box. The orchestrator only learns a transcription is done when ElevenLabs fires a webhook back. If the webhook is dropped (or ElevenLabs internally wedges), the job sits "in progress" forever. We can't poll ElevenLabs for live progress, so any recovery has to be time-based.

The responsibility is split cleanly:

### Server side: background guarantee (`runJobMaintenance`)

The existing 10-minute `runJobMaintenance` sweep in `src/lib/job-maintenance.ts` is the sole background safety net — wired up in `src/instrumentation.ts`. Each run:

- Polls the orchestrator for every in-progress job and updates our local `filter_jobs` row.
- Marks jobs that have been sitting in a non-terminal status longer than `STALE_THRESHOLD_MS` (30 min) as `failed`.
- Auto-retries `failed` rows up to `MAX_AUTO_RETRIES` (3) with a 10-minute cooldown between attempts. Each retry deletes the cached `videos` row so the orchestrator starts genuinely fresh.
- Escalates to `needs_review=true` after retries are exhausted.

That gives roughly a 2-hour total wall-clock budget per video before we declare it truly dead. If any retry succeeds, the transcript is cached in `videos.transcript` and the next time anyone filters that URL it's instant.

### Extension side: in-session retry

The Chrome extension is the only consumer with live tab context, so it owns the fast-path retry. The `/api/filter/status/[jobId]` response now includes:

- `eta_seconds` — the completion estimate stored at job creation (`max(25, round(20 + duration/13))`).
- `created_at` — so the extension can compute elapsed time without its own clock state.

The extension's policy: if `elapsed > eta_seconds + 30` and status isn't terminal, call `POST /api/filter/retry?action=restart` once. That endpoint goes through the shared `restartJob` helper in `src/lib/job-restart.ts`, which deletes the cached `videos` row, fires a best-effort `DELETE /api/jobs/{oldOrchestratorJobId}`, and calls `POST /api/filter` without `force:true` — the same path a first-time filter takes. If the retry also stalls past the same threshold, the extension shows a "having trouble, check back later" message and stops polling. The server's background sweep continues working.

### Dedupe in `/api/filter/start`

When the customer comes back later and clicks Filter again on a video whose job is still running in the background, `/api/filter/start` now returns the existing in-flight `filter_jobs` row (matched on `user_id` + `youtube_id`, status in `pending | processing | downloading | transcribing`) instead of kicking off a second orchestrator run.

### Stable client-facing id

`filter_jobs.job_id` is permanently stable — the value we returned to the extension on the first `/api/filter/start`. `filter_jobs.orchestrator_job_id` holds whatever the orchestrator currently knows this job by and is swapped by `restartJob` without the extension's URL changing. All orchestrator-bound calls (`/api/filter/status/[jobId]`, its SSE variant, `/api/filter/events/[jobId]`, the admin routes, the maintenance sweep) resolve to `orchestrator_job_id` internally.

### Chrome extension

The extension needs a small update to consume `eta_seconds` + `created_at` and fire its one retry — out of scope for this repo but unblocked by the status-response additions.
