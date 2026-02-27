# Prompt for: SafePlay Orchestrator Changes

Copy everything below the line into Claude Code in the `safeplay-orchestrator` repo.

---

## Task

Add a profanity classification step to the SafePlay orchestrator's processing pipeline. After transcription completes, the orchestrator should call the new SafePlay Profanity Engine microservice to classify profanity into semantic buckets, then include the result (`profanity_map`) in the cached data and API responses.

## Architecture Context

The orchestrator currently runs this pipeline:
```
1. Download video (YT-DLP service)   → audio file in Supabase Storage
2. Transcribe (ElevenLabs Scribe v2) → transcript with word-level timing
3. Store transcript in Supabase      → cached for future requests
```

You are adding step 2.5:
```
1. Download video (YT-DLP service)
2. Transcribe (ElevenLabs Scribe v2)
2.5. Classify profanity (Profanity Engine service)  ← NEW STEP
3. Store transcript + profanity_map in Supabase
```

## New Environment Variable

Add support for:
```env
PROFANITY_ENGINE_URL=  # e.g., https://safeplay-profanity-engine.up.railway.app
PROFANITY_ENGINE_API_KEY=  # shared SERVICE_API_KEY for auth
```

## Changes Required

### 1. New service file: `src/services/profanityService.ts`

Create a service that calls the profanity engine:

```typescript
interface ProfanityClassifyRequest {
  youtube_id: string;
  transcript_text: string;
  segments: Array<{
    text: string;
    start_time: number;
    end_time: number;
  }>;
}

interface ProfanityMapEntry {
  timestamp_start: number;
  timestamp_end: number;
  surface_form: string;
  bucket_ids: string[];
  confidence: number;
  source: 'dictionary' | 'ai_discovered';
}

interface ProfanityClassifyResponse {
  youtube_id: string;
  profanity_map: ProfanityMapEntry[];
  stats: {
    total_profanity_found: number;
    dictionary_matches: number;
    ai_discoveries: number;
    buckets_hit: string[];
    processing_time_ms: number;
  };
}
```

- `POST {PROFANITY_ENGINE_URL}/api/classify` with `X-API-Key` header
- Timeout: 60 seconds (LLM calls can take time on long transcripts)
- Retry: 1 retry on 5xx errors, no retry on 4xx
- On failure: log the error and return `null` (do NOT fail the entire pipeline)

### 2. Modify `src/services/processingPipeline.ts`

After the transcription step completes and transcript is available, add the profanity classification call:

```typescript
// After transcription succeeds:
let profanityMap = null;
if (process.env.PROFANITY_ENGINE_URL) {
  try {
    profanityMap = await profanityService.classify({
      youtube_id: videoId,
      transcript_text: transcript.full_text,
      segments: transcript.segments,
    });
  } catch (error) {
    console.error(`[Pipeline] Profanity classification failed for ${videoId}, continuing without it:`, error);
    // Don't fail the pipeline — transcript is still usable without classification
  }
}
```

This must be a graceful optional step. If `PROFANITY_ENGINE_URL` is not set, skip it entirely. If the call fails, log and continue.

### 3. Modify transcript storage

When storing the completed job result, also include the profanity_map. The `video_profanity_map` table already exists in Supabase (created by a separate migration). After getting the profanity response, insert the results:

```typescript
if (profanityMap && profanityMap.profanity_map.length > 0) {
  // Delete any existing entries for this video (in case of re-processing)
  await supabase
    .from('video_profanity_map')
    .delete()
    .eq('youtube_id', youtubeId);

  // Insert new profanity map entries
  await supabase
    .from('video_profanity_map')
    .insert(profanityMap.profanity_map.map(entry => ({
      youtube_id: youtubeId,
      timestamp_start: entry.timestamp_start,
      timestamp_end: entry.timestamp_end,
      surface_form: entry.surface_form,
      bucket_ids: entry.bucket_ids,
      confidence: entry.confidence,
      source: entry.source,
    })));
}
```

### 4. Modify API responses to include profanity_map

In the following routes, include the profanity_map when returning completed results:

**`src/routes/filter.ts`** — When returning a cached/completed result:
```typescript
// After fetching transcript, also fetch profanity map
const { data: profanityEntries } = await supabase
  .from('video_profanity_map')
  .select('timestamp_start, timestamp_end, surface_form, bucket_ids, confidence, source')
  .eq('youtube_id', youtubeId);

// Include in response
return res.json({
  status: 'completed',
  cached: true,
  video: { youtube_id: youtubeId, title: video.title },
  transcript: { ... },
  profanity_map: profanityEntries || [],  // NEW FIELD
});
```

**`src/routes/jobs.ts`** — When a job completes:
```typescript
// Include profanity_map in completed job response
if (job.status === 'completed') {
  const { data: profanityEntries } = await supabase
    .from('video_profanity_map')
    .select('timestamp_start, timestamp_end, surface_form, bucket_ids, confidence, source')
    .eq('youtube_id', job.youtube_id);

  responseData.profanity_map = profanityEntries || [];
}
```

**`GET /api/transcript/:youtubeId`** — Also include profanity_map:
```typescript
// Fetch profanity map alongside transcript
const { data: profanityEntries } = await supabase
  .from('video_profanity_map')
  .select('timestamp_start, timestamp_end, surface_form, bucket_ids, confidence, source')
  .eq('youtube_id', youtubeId);

return res.json({
  exists: true,
  transcript: { ... },
  profanity_map: profanityEntries || [],  // NEW FIELD
});
```

### 5. Webhook handler update

In `src/routes/webhooks.ts` (or wherever the ElevenLabs webhook is handled), after the transcript is processed and stored, also trigger the profanity classification:

```typescript
// After webhook processes transcript successfully:
// Trigger profanity classification (non-blocking is fine, or blocking)
if (process.env.PROFANITY_ENGINE_URL) {
  profanityService.classify({
    youtube_id: video.youtube_id,
    transcript_text: fullText,
    segments: segments,
  }).then(result => {
    if (result && result.profanity_map.length > 0) {
      // Store in video_profanity_map table
      supabase.from('video_profanity_map')
        .delete().eq('youtube_id', video.youtube_id)
        .then(() => {
          supabase.from('video_profanity_map')
            .insert(result.profanity_map.map(entry => ({
              youtube_id: video.youtube_id,
              ...entry
            })));
        });
    }
  }).catch(err => {
    console.error(`[Webhook] Profanity classification failed for ${video.youtube_id}:`, err);
  });
}
```

### 6. SSE updates (optional enhancement)

When using SSE for job progress, you can add a profanity classification progress step:

```
downloading  → 0-40%
transcribing → 40-85%
classifying  → 85-95%   ← NEW
completed    → 100%
```

This is optional but gives users visibility into the new step.

## Key Principles

1. **The profanity engine is OPTIONAL.** If `PROFANITY_ENGINE_URL` is not set, skip the step entirely. If the call fails, continue without it. The transcript is still usable — the Chrome extension has a built-in dictionary fallback.

2. **Don't break existing behavior.** All existing API contracts must still work. `profanity_map` is an additional field in responses, not a replacement for anything.

3. **The profanity_map table is already created.** Don't create database tables. Just read from and write to `video_profanity_map`.

4. **Authentication:** Use `X-API-Key` header with the value from `PROFANITY_ENGINE_API_KEY` env var.

## Testing

After making changes, verify:
1. Pipeline still works without `PROFANITY_ENGINE_URL` set (graceful skip)
2. API responses include `profanity_map: []` when no profanity data exists
3. When profanity engine is available, results are stored and returned
4. Existing cached videos still return correctly (with empty profanity_map until re-processed)

Commit all changes with a clear commit message.
