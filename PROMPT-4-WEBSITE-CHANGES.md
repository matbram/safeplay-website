# Prompt for: SafePlay Website Changes

Copy everything below the line into Claude Code in the `safeplay-website` repo.

---

## Task

Update the SafePlay website to support the new profanity bucket system. This involves:
1. New API endpoints for bucket preferences
2. Updated types for the bucket system
3. Updated settings/preferences page with bucket toggles
4. Updated demo player to use profanity_map
5. API proxy endpoint for the Chrome extension to fetch buckets

## Database Context (tables ALREADY EXIST — do not create)

```sql
profanity_buckets (id TEXT PK, label TEXT, severity TEXT, default_blocked BOOLEAN, display_order INT)
profanity_variants (id UUID PK, variant TEXT, bucket_id TEXT FK, source TEXT, confidence REAL)
video_profanity_map (id UUID PK, youtube_id TEXT, timestamp_start REAL, timestamp_end REAL, surface_form TEXT, bucket_ids TEXT[], confidence REAL, source TEXT)
user_bucket_preferences (id UUID PK, user_id UUID FK, bucket_id TEXT FK, blocked BOOLEAN, UNIQUE(user_id, bucket_id))
```

The `user_bucket_preferences` table is auto-populated for new users via the `handle_new_user()` trigger using `default_blocked` values from `profanity_buckets`.

There is also a Supabase function `initialize_bucket_preferences(user_id)` that can be called to create default preferences for existing users who don't have them yet.

## Changes Required

### 1. Update types (`src/types/index.ts`)

Add these new types:

```typescript
// Profanity bucket (canonical category)
export interface ProfanityBucket {
  id: string;
  label: string;
  severity: 'mild' | 'moderate' | 'severe' | 'religious';
  default_blocked: boolean;
  display_order: number;
  variant_count?: number;  // Optional: populated by API
}

// Per-word profanity classification (from server)
export interface ProfanityMapEntry {
  timestamp_start: number;
  timestamp_end: number;
  surface_form: string;
  bucket_ids: string[];
  confidence: number;
  source: 'dictionary' | 'ai_discovered';
}

// User's bucket preferences
export interface UserBucketPreference {
  bucket_id: string;
  blocked: boolean;
}

// Update the existing FilterJobStatus to include profanity_map
// (already has transcript field, add profanity_map alongside it)
```

Update the existing `FilterJobStatus` interface to include:
```typescript
export interface FilterJobStatus {
  job_id: string;
  status: 'pending' | 'downloading' | 'transcribing' | 'completed' | 'failed';
  progress: number;
  transcript?: TranscriptData;
  profanity_map?: ProfanityMapEntry[];  // ← ADD THIS
  error?: string;
}
```

Update the existing `UserPreferences` interface to add:
```typescript
export interface UserPreferences {
  // ... existing fields ...
  bucket_preferences?: UserBucketPreference[];  // ← ADD THIS (optional for backward compat)
}
```

### 2. New API endpoint: `GET /api/buckets` (`src/app/api/buckets/route.ts`)

Returns all profanity buckets with variant counts. Used by the settings page and Chrome extension.

```typescript
// Fetch all buckets with variant counts
const { data: buckets } = await supabase
  .from('profanity_buckets')
  .select('*')
  .order('display_order');

// Get variant counts per bucket
const { data: variantCounts } = await supabase
  .from('profanity_variants')
  .select('bucket_id')  // count per bucket_id

// Merge and return
return NextResponse.json({ buckets: ... });
```

Auth: Requires authenticated user (use existing createClient pattern).

### 3. New API endpoint: `GET /api/bucket-preferences` (`src/app/api/bucket-preferences/route.ts`)

Returns the authenticated user's bucket preferences.

```typescript
// GET: Fetch user's bucket preferences
const { data: preferences } = await supabase
  .from('user_bucket_preferences')
  .select('bucket_id, blocked')
  .eq('user_id', user.id);

// If no preferences exist (existing user before bucket system), initialize them
if (!preferences || preferences.length === 0) {
  await supabase.rpc('initialize_bucket_preferences', { p_user_id: user.id });
  // Re-fetch
  const { data: newPrefs } = await supabase
    .from('user_bucket_preferences')
    .select('bucket_id, blocked')
    .eq('user_id', user.id);
  return NextResponse.json({ preferences: newPrefs });
}

return NextResponse.json({ preferences });
```

### 4. New API endpoint: `PATCH /api/bucket-preferences` (`src/app/api/bucket-preferences/route.ts`)

Updates the user's bucket preferences. Accepts partial updates.

```typescript
// PATCH body: { preferences: [{ bucket_id: "damn", blocked: true }, ...] }
const { preferences } = await request.json();

for (const pref of preferences) {
  await supabase
    .from('user_bucket_preferences')
    .upsert({
      user_id: user.id,
      bucket_id: pref.bucket_id,
      blocked: pref.blocked,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,bucket_id' });
}

return NextResponse.json({ success: true });
```

### 5. New API endpoint: `POST /api/bucket-preferences/preset` (`src/app/api/bucket-preferences/preset/route.ts`)

Applies a preset to all bucket preferences at once.

```typescript
// POST body: { preset: 'block_all' | 'severe_only' | 'family_friendly' | 'unblock_all' }
const { preset } = await request.json();

// Fetch all buckets to know their severities
const { data: buckets } = await supabase
  .from('profanity_buckets')
  .select('id, severity, default_blocked');

const updates = buckets.map(bucket => {
  let blocked: boolean;
  switch (preset) {
    case 'block_all':
      blocked = true;
      break;
    case 'unblock_all':
      blocked = false;
      break;
    case 'severe_only':
      blocked = bucket.severity === 'severe';
      break;
    case 'family_friendly':
      blocked = bucket.severity === 'severe' || bucket.severity === 'moderate';
      break;
    default:
      blocked = bucket.default_blocked;
  }
  return { user_id: user.id, bucket_id: bucket.id, blocked, updated_at: new Date().toISOString() };
});

await supabase
  .from('user_bucket_preferences')
  .upsert(updates, { onConflict: 'user_id,bucket_id' });

return NextResponse.json({ success: true, applied_preset: preset });
```

### 6. Update the settings/preferences page

The settings page is at `src/app/(dashboard)/settings/page.tsx` (or similar). Find the section where filter preferences are configured (sensitivity level, custom words) and update it.

**Replace the sensitivity level dropdown** with a bucket toggle interface:

The UI should show:
- Quick preset buttons at the top: "Block All", "Family Friendly" (recommended), "Severe Only", "Unblock All"
- Buckets grouped by severity with collapsible sections
- Each bucket is a toggle (checkbox or switch) with its label
- The current preset should be highlighted if all toggles match a preset

**Fetch buckets and preferences on page load:**
```typescript
// In the settings page component
const [buckets, setBuckets] = useState<ProfanityBucket[]>([]);
const [bucketPrefs, setBucketPrefs] = useState<Record<string, boolean>>({});

useEffect(() => {
  // Fetch buckets and user preferences in parallel
  Promise.all([
    fetch('/api/buckets').then(r => r.json()),
    fetch('/api/bucket-preferences').then(r => r.json()),
  ]).then(([bucketsRes, prefsRes]) => {
    setBuckets(bucketsRes.buckets);
    const prefsMap: Record<string, boolean> = {};
    for (const p of prefsRes.preferences) {
      prefsMap[p.bucket_id] = p.blocked;
    }
    setBucketPrefs(prefsMap);
  });
}, []);
```

**Handle toggle changes:**
```typescript
async function toggleBucket(bucketId: string, blocked: boolean) {
  setBucketPrefs(prev => ({ ...prev, [bucketId]: blocked }));
  await fetch('/api/bucket-preferences', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preferences: [{ bucket_id: bucketId, blocked }] }),
  });
}
```

**Handle preset buttons:**
```typescript
async function applyPreset(preset: string) {
  await fetch('/api/bucket-preferences/preset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preset }),
  });
  // Refresh preferences
  const res = await fetch('/api/bucket-preferences');
  const data = await res.json();
  // Update state...
}
```

**Keep the existing custom_words input** — it's still useful for words not in any bucket. Keep the filter_type (mute/bleep) toggle as-is.

**Keep the existing sensitivity_level field** in user_preferences — don't remove it. It serves as the fallback for the Chrome extension when profanity_map is unavailable. But it can be visually de-emphasized or derived automatically from the bucket selections.

### 7. Update the demo transcript route

In `src/app/api/demo/transcript/route.ts`, when the orchestrator returns data that includes a `profanity_map`, pass it through to the response:

```typescript
// In the response, include profanity_map if available from orchestrator
return NextResponse.json({
  segments: ...,
  profanity_timestamps: profanityTimestamps,  // Keep for backward compat
  profanity_map: data.profanity_map || [],     // NEW: bucket-based data
  duration: ...,
  title: ...,
});
```

### 8. Update the demo player component

In the landing page demo player (`src/components/landing/DemoPlayer.tsx` or similar), if `profanity_map` is available in the response, display bucket information:

- Show which buckets were detected in the demo video
- Show count per bucket (e.g., "F-word (5), S-word (3), Damn (2)")

This helps demonstrate the bucket concept to potential users.

### 9. Extension API bridge

If there's an extension API bridge at `src/app/api/extension/`, add a route that proxies the buckets endpoint so the Chrome extension can fetch bucket definitions:

```typescript
// GET /api/extension/buckets
// Returns profanity buckets for the extension settings page
```

This should work with the extension's existing auth pattern.

## Key Principles

1. **Additive changes only.** Don't remove existing fields/endpoints. The bucket system is an addition, not a replacement of the sensitivity system.
2. **Backward compatible.** Existing user preferences still work. Bucket preferences are initialized lazily for existing users.
3. **The settings page should feel simpler.** Bucket toggles are more intuitive than "sensitivity: moderate" — users can see exactly what they're blocking.
4. **Use existing patterns.** Follow the same auth, Supabase client, and API route patterns already in the codebase.

Commit all changes with a clear commit message.
