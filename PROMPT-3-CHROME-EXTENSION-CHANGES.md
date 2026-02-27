# Prompt for: SafePlay Chrome Extension Changes

Copy everything below the line into Claude Code in the `safeplay-chrome-extension` repo.

---

## Task

Update the Chrome extension to use the new **profanity bucket system** for filtering. Instead of the current approach (client-side dictionary matching with severity levels), the extension should now consume a server-provided `profanity_map` that classifies every profane word in a video into semantic buckets (e.g., "damn", "ass", "fuck"). Users control filtering at the bucket level — "block the damn bucket" blocks damn, dammit, damnit, dayum, goddamn, and any other variant the AI has discovered.

## What's Changing

**Before (current):**
- Extension receives raw transcript (words + timing)
- Extension runs its own 147-word dictionary against every word
- Users filter by severity level (mild/moderate/severe/religious)
- Custom blacklist/whitelist for individual words

**After (new):**
- API now returns a `profanity_map[]` alongside the transcript
- Each entry in profanity_map has `bucket_ids` (e.g., ["damn"], or ["damn", "religious"] for "goddamn")
- Users toggle buckets on/off (e.g., block "F-word", allow "Damn")
- Quick presets still available ("Block All", "Severe Only", "Family Friendly")
- Dictionary fallback remains for when profanity_map is unavailable

## New API Response Format

The `/api/filter/start` and `/api/filter/status/{jobId}` endpoints now include a `profanity_map` field:

```typescript
interface FilterStartResponse {
  success: boolean;
  status: 'completed' | 'processing' | 'failed';
  cached?: boolean;
  transcript?: Transcript;
  profanity_map?: ProfanityMapEntry[];  // ← NEW
  job_id?: string;
  // ... existing fields
}

interface ProfanityMapEntry {
  timestamp_start: number;    // seconds
  timestamp_end: number;      // seconds
  surface_form: string;       // the word as transcribed
  bucket_ids: string[];       // ["damn"], ["shit", "religious"], etc.
  confidence: number;         // 0.0-1.0
  source: 'dictionary' | 'ai_discovered';
}
```

## Changes Required

### 1. Update types (`src/types/index.ts`)

Add new types for the bucket system:

```typescript
// Profanity bucket (canonical category)
interface ProfanityBucket {
  id: string;              // 'damn', 'fuck', 'shit', etc.
  label: string;           // 'Damn', 'F-word', etc.
  severity: SeverityLevel; // For grouping in UI
  default_blocked: boolean;
  display_order: number;
}

// Per-word classification from the server
interface ProfanityMapEntry {
  timestamp_start: number;
  timestamp_end: number;
  surface_form: string;
  bucket_ids: string[];
  confidence: number;
  source: 'dictionary' | 'ai_discovered';
}

// Updated user preferences
interface UserPreferences {
  enabled: boolean;
  filterMode: 'mute' | 'bleep';

  // NEW: Bucket-based preferences (primary)
  bucketPreferences: Record<string, boolean>;  // { "fuck": true, "damn": false, ... }

  // KEEP: Legacy severity levels (used as fallback when profanity_map unavailable)
  severityLevels: {
    mild: boolean;
    moderate: boolean;
    severe: boolean;
    religious: boolean;
  };

  // KEEP: Custom lists (still useful for edge cases)
  customBlacklist: string[];
  customWhitelist: string[];

  // KEEP: Audio settings
  paddingMs: number;
  paddingBeforeMs?: number;
  paddingAfterMs?: number;
  mergeThresholdMs: number;
  autoEnableForFilteredVideos: boolean;
}
```

### 2. Update transcript parser (`src/filter/transcript-parser.ts`)

Add a new method that generates mute intervals from the server-provided profanity_map instead of running client-side detection:

```typescript
// NEW: Generate mute intervals from server-provided profanity_map
createIntervalsFromProfanityMap(
  profanityMap: ProfanityMapEntry[],
  blockedBuckets: Set<string>
): MuteInterval[] {
  const intervals: MuteInterval[] = [];

  for (const entry of profanityMap) {
    // Check if ANY of this word's buckets are blocked by the user
    const isBlocked = entry.bucket_ids.some(id => blockedBuckets.has(id));

    if (isBlocked) {
      intervals.push({
        start: entry.timestamp_start - (this.preferences.paddingBeforeMs ?? this.preferences.paddingMs) / 1000,
        end: entry.timestamp_end + (this.preferences.paddingAfterMs ?? this.preferences.paddingMs) / 1000,
        word: entry.surface_form,
        severity: this.getSeverityForBuckets(entry.bucket_ids),  // For display purposes
      });
    }
  }

  // Also apply custom blacklist against transcript segments (for user-added words not in any bucket)
  // ... existing custom blacklist logic ...

  return this.mergeIntervals(intervals);
}
```

The main `parse()` method should try the profanity_map approach first, falling back to the existing dictionary approach:

```typescript
parse(transcript: Transcript, profanityMap?: ProfanityMapEntry[]): MuteInterval[] {
  const blockedBuckets = new Set(
    Object.entries(this.preferences.bucketPreferences)
      .filter(([_, blocked]) => blocked)
      .map(([id]) => id)
  );

  if (profanityMap && profanityMap.length > 0 && blockedBuckets.size > 0) {
    // Use server-provided profanity map (preferred)
    return this.createIntervalsFromProfanityMap(profanityMap, blockedBuckets);
  }

  // Fallback: use legacy dictionary-based detection
  return this.legacyParse(transcript);
}
```

### 3. Update background script (`src/background/index.ts`)

When receiving filter results from the API, store the `profanity_map` alongside the transcript in the local cache:

```typescript
// In the START_FILTER handler, after receiving API response:
if (response.profanity_map) {
  // Store profanity_map with the cached transcript
  cachedTranscripts[youtubeId] = {
    ...response.transcript,
    profanity_map: response.profanity_map,
  };
}
```

Also add a message handler for fetching available buckets:

```typescript
case 'GET_BUCKETS':
  // Fetch bucket definitions from API (cache for 24 hours)
  const buckets = await fetchBuckets();
  sendResponse({ buckets });
  break;
```

The `fetchBuckets()` function should call `GET /api/buckets` on the profanity engine (proxied through the website API) or fall back to a hardcoded list.

### 4. Update content script (`src/content/index.ts`)

When applying the filter, pass the profanity_map to the transcript parser:

```typescript
// When filter data is received:
const moteIntervals = transcriptParser.parse(
  transcript,
  filterResponse.profanity_map  // Pass profanity map if available
);
```

### 5. Update options page (`src/options/index.ts`)

Replace or supplement the severity toggles with bucket toggles:

**New UI layout:**

```
┌─────────────────────────────────────────────┐
│ What would you like filtered?               │
│                                             │
│ Quick Presets:                               │
│ [Block All] [Severe Only] [Family Friendly] │
│                                             │
│ ── Severe ──────────────────────────────── │
│ [✓] F-word (fuck, fucking, etc.)           │
│ [✓] C-word (cunt)                           │
│ [✓] Racial Slurs                            │
│ [✓] Homophobic Slurs                        │
│ [✓] Ableist Slurs                           │
│                                             │
│ ── Moderate ────────────────────────────── │
│ [✓] S-word (shit, bullshit, etc.)          │
│ [✓] A-word (ass, asshole, etc.)            │
│ [✓] B-word (bitch)                          │
│ [✓] D-word (dick)                           │
│ [✓] C-word (cock)                           │
│ [✓] P-word (pussy)                          │
│ [✓] Bastard                                 │
│ [✓] Slut                                    │
│ [✓] Whore                                   │
│ [✓] Twat                                    │
│ [✓] Prick                                   │
│                                             │
│ ── Mild ────────────────────────────────── │
│ [ ] Damn                                    │
│ [ ] Hell                                    │
│ [ ] Crap                                    │
│ [ ] Piss                                    │
│                                             │
│ ── Religious ───────────────────────────── │
│ [ ] Religious Exclamations (god, jesus, etc)│
│                                             │
│ ── Custom Words ────────────────────────── │
│ Additional words to always block: [input]   │
│ Words to never block: [input]               │
└─────────────────────────────────────────────┘
```

**Preset logic:**
- "Block All" → all buckets blocked = true
- "Severe Only" → only severity='severe' buckets blocked
- "Family Friendly" → severe + moderate blocked, mild + religious unblocked (this is the default)

### 6. Update popup (`src/popup/index.ts`)

The popup can show a summary of what's being filtered for the current video:

```
SafePlay Active ✓
Filtering: 12 instances across 4 categories
  F-word (5) · S-word (4) · Damn (2) · Religious (1)
[Settings] [Disable]
```

### 7. Default bucket preferences

When a user first installs or hasn't set bucket preferences, derive defaults from the existing `default_blocked` values in the bucket definitions:

```typescript
const DEFAULT_BUCKET_PREFERENCES: Record<string, boolean> = {
  fuck: true,
  shit: true,
  ass: true,
  bitch: true,
  damn: false,       // mild - not blocked by default
  hell: false,       // mild
  crap: false,       // mild
  piss: false,       // mild
  dick: true,
  cock: true,
  pussy: true,
  bastard: true,
  slut: true,
  whore: true,
  cunt: true,
  twat: true,
  prick: true,
  racial_slurs: true,
  homophobic: true,
  ableist: true,
  religious: false,  // opt-in
};
```

### 8. Migration for existing users

When loading preferences, check if `bucketPreferences` exists. If not, derive it from the existing `severityLevels`:

```typescript
function migrateToBucketPreferences(prefs: UserPreferences): Record<string, boolean> {
  if (prefs.bucketPreferences && Object.keys(prefs.bucketPreferences).length > 0) {
    return prefs.bucketPreferences;
  }

  // Migrate from severity-based to bucket-based
  const bucketPrefs: Record<string, boolean> = {};
  for (const [bucketId, bucket] of BUCKET_DEFINITIONS) {
    switch (bucket.severity) {
      case 'severe':   bucketPrefs[bucketId] = prefs.severityLevels.severe; break;
      case 'moderate': bucketPrefs[bucketId] = prefs.severityLevels.moderate; break;
      case 'mild':     bucketPrefs[bucketId] = prefs.severityLevels.mild; break;
      case 'religious':bucketPrefs[bucketId] = prefs.severityLevels.religious; break;
    }
  }
  return bucketPrefs;
}
```

### 9. Keep the profanity-list.ts as fallback

Do NOT remove the existing profanity dictionary (`src/filter/profanity-list.ts`). It serves as the fallback when:
- The API returns no profanity_map (old cached videos)
- The profanity engine was down when the video was processed
- The user is offline and using a locally cached transcript

The dictionary-based detection is the safety net.

## Key Principles

1. **Backward compatible.** If the API doesn't return a profanity_map, fall back to existing dictionary detection seamlessly.
2. **Bucket preferences are the primary control.** Severity levels become a secondary/legacy system.
3. **A word is muted if ANY of its buckets are blocked.** "Goddamn" (buckets: ["damn", "religious"]) is muted if the user blocks "damn" OR "religious" (or both).
4. **The popup/options should feel simpler, not more complex.** The bucket UI replaces the severity toggles — it's more granular but presented clearly with grouping.

Commit all changes with a clear commit message.
