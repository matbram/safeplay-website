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

`filter_jobs` — id (UUID PK), job_id (text unique, orchestrator ID), user_id, youtube_id, filter_type, custom_words, status, progress, credits_used, error, auto_retry_count, needs_review, last_auto_retry_at, created_at, completed_at. **New column:** `is_retranscribe BOOLEAN DEFAULT false`.

`videos` — youtube_id (unique), title/channel/duration/thumbnail, `transcript` (JSONB), `storage_path` (to the audio file in Supabase Storage), cached_at.

`filter_history` — per-user per-video record of each filter run, with credits_used.

`credit_balances`, `credit_transactions` — balance state + ledger.

---

## 2. Gaps surfaced by the audit

| # | Gap | Status |
|---|-----|-------|
| 1 | No user-facing way to recover from a stuck/failed job — only admins could retry. | **Fixed** in this PR. |
| 2 | No user-facing re-transcribe for completed videos (for when the engine improves). | **Fixed** in this PR. |
| 3 | `filter/status` always deducts credits on completion — doing that on a retranscribe would double-charge the user. | **Fixed** by the `is_retranscribe` flag. |
| 4 | `storage_path` on `videos` can be NULL even when a download exists; admin UI falls back to progress-based inference. | **Noted** — orchestrator-side; not touched here. |
| 5 | SSE stream (`/api/filter/status/{jobId}/stream`) polls the orchestrator internally rather than being pushed — so "live" is only as fresh as the proxy's poll interval. | **Noted** — orchestrator-side; not touched here. |
| 6 | No cleanup of orphan `videos` rows or Supabase Storage objects after long periods of disuse. | **Noted**. |
| 7 | `prepareTranscriptForCache` strips character-level timing to reduce payload; long videos fall back to linear estimation. | **Noted** — existing behavior. |
| 8 | No YouTube download code in the website repo (confirmed: no `ytdl`, `yt-dlp`, `youtube-dl`, or related). | **Clean**, as intended. |

---

## 3. New feature: user-facing retry

### API: `POST /api/filter/retry`

Auth is per-user (session cookie or bearer). Ownership is strictly enforced against `filter_jobs.user_id` / `filter_history.user_id`.

**Mode 1 — `action: "restart"`** (stuck / failed mid-pipeline)

- Input: `{ action: "restart", job_id }`
- Allowed when the job is in `pending | processing | downloading | transcribing | failed`. Rejected with a redirect-to-retranscribe hint if the job already `completed`.
- Resets the existing `filter_jobs` row (status, progress, error, auto-retry counters, `created_at` so the stale-detector doesn't immediately re-flag it) and calls the orchestrator with `force: true` to bypass any in-flight dedupe.
- Swaps `filter_jobs.job_id` to the new orchestrator job_id. The `id` UUID stays the same so `filter_history` relationships remain intact.
- No credit charge — credits only get deducted at completion, and the old job never completed.

**Mode 2 — `action: "retranscribe"`** (re-run a completed video against a newer engine)

- Input: `{ action: "retranscribe", youtube_id }`
- Ownership check: a `filter_history` row must exist for this user + video.
- 10-minute cooldown per user+video; if an in-flight retranscribe already exists, we return it instead of creating a duplicate.
- Clears `videos.transcript` (keeps `storage_path` + metadata so the orchestrator can skip re-download), then calls the orchestrator without `force`.
- Inserts a new `filter_jobs` row with `is_retranscribe=true`. The original job/history stays intact.
- **Free** — the `filter/status` completion path checks `is_retranscribe` and skips credit deduction and transaction logging. A zero-credit `filter_history` row is still written for traceability.

### UI

- **Filter page** (`src/app/(dashboard)/filter/page.tsx`): a progress watchdog (`STUCK_THRESHOLD_MS = 90s`) notices when progress hasn't moved, flips `stuck=true`, and surfaces a banner with a **Restart job** button. Clicking it tears down the current SSE/polling, calls `/api/filter/retry?action=restart`, and re-subscribes to the new job_id. Also accepts `?retry_job=<jobId>` deep links so other pages can hand off a job and land straight in the processing view.
- **History page** (`src/app/(dashboard)/history/page.tsx`): each row gets a **Re-transcribe** button. Clicking it opens a confirm dialog ("Free — you already paid for this video"), posts to `/api/filter/retry?action=retranscribe`, and routes to `/filter?retry_job=<jobId>` on success.

### Schema change

`supabase-filter-jobs.sql` — idempotent migration adds `is_retranscribe BOOLEAN DEFAULT false` alongside the existing `auto_retry_count / needs_review / last_auto_retry_at` migrations.

---

## 4. UX failure-mode checklist

| Scenario | Behavior |
|---|---|
| Orchestrator unreachable during restart | 503 with `error_code: ORCHESTRATOR_UNAVAILABLE`; UI shows error, user can retry. `filter_jobs` left in `pending` (the stale detector will catch it if it hangs). |
| Orchestrator 4xx on restart | Row marked `failed` with the orchestrator's error message; banner re-surfaces. |
| User clicks Retry twice | Second click is no-op — the button disables while `retrying=true`. |
| User clicks Re-transcribe twice | Second call finds the active retranscribe job and returns it instead of creating a duplicate (same job_id returned, cooldown path). |
| User tries to retranscribe a video they never filtered | 403 "You haven't filtered this video yet" (history check). |
| Retranscribe spam | 10-minute per-user-per-video cooldown returns 429 with `error_code: RETRANSCRIBE_COOLDOWN`. |
| Retranscribe completes synchronously (orchestrator cache hit) | We upsert the transcript, log a 0-credit history entry, and route the user back to `/filter`. No credits moved. |
| Retranscribe completes asynchronously | `filter/status` finalizer sees `is_retranscribe=true`, skips credit deduction + transaction, writes a 0-credit history row so the user can see it. |
| Restart mid-transcribe races with orchestrator completion | The old orchestrator job's result is abandoned (we no longer poll that job_id). If the new job is the one that completes, we still get a clean finalize. No double-charge because `credits_used` is only written on completion and only on the row's current job_id. |
| Deep link `/filter?retry_job=X` for a jobId not owned by the user | `/api/filter/status/{jobId}` returns 404; the filter page surfaces the error via `handleError`. |

---

## 5. Files touched

| File | Change |
|---|---|
| `src/app/api/filter/retry/route.ts` | **New.** User-facing retry endpoint with restart + retranscribe modes. |
| `src/app/api/filter/status/[jobId]/route.ts` | Gate credit deduction + transaction on `!is_retranscribe`. |
| `src/app/(dashboard)/filter/page.tsx` | Stuck detection, restart button, `?retry_job=` deep link handling. |
| `src/app/(dashboard)/history/page.tsx` | Re-transcribe button + confirmation dialog. |
| `supabase-filter-jobs.sql` | `ADD COLUMN IF NOT EXISTS is_retranscribe BOOLEAN DEFAULT false`. |
| `docs/TRANSCRIPTION_AUDIT.md` | This file. |

---

## 6. Suggested follow-ups

- **Migration application** — run `npm run db:migrate` (or apply `supabase-filter-jobs.sql`) in staging before the feature ships; the SSE + status routes reference the new column.
- **Telemetry** — add a counter on retry usage (mode=restart vs retranscribe) so you can tell if stuck transcriptions are increasing over time.
- **Orchestrator-side cleanup** — when a user restarts a stuck job, consider firing a best-effort `DELETE /api/jobs/{oldJobId}` to the orchestrator so it stops transcribing audio nobody will read. Today we just abandon it.
- **Retranscribe across engine versions** — once the orchestrator exposes a transcript engine version, surface it in history UI so users know which version they're on and whether a re-transcribe would gain anything.
