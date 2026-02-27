# Prompt for: SafePlay Profanity Engine Service (NEW REPO)

Copy everything below the line into Claude Code in a new empty directory.

---

## Task

Build a new microservice called `safeplay-profanity-engine`. This is a standalone Express.js/TypeScript API that classifies profanity in video transcripts into semantic "buckets" (e.g., all variants of "damn" — damn, dammit, damnit, dayum, goddamn — get classified into a "damn" bucket). SafePlay's orchestrator will call this service after transcription, passing in the full transcript, and this service returns a profanity map with bucket assignments for each profane word.

## Architecture Context

SafePlay is a YouTube profanity filtering platform. The processing pipeline is:

```
Orchestrator Pipeline:
  1. Call YT-DLP service     → download audio
  2. Call ElevenLabs Scribe  → get transcript with word-level timing
  3. Call THIS SERVICE       → classify profanity into buckets  ← YOU ARE BUILDING THIS
  4. Cache everything        → store in Supabase
```

This service is called by the orchestrator (server-to-server), not by end users directly.

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** Supabase (PostgreSQL) — shared instance with the rest of SafePlay
- **AI/LLM:** Anthropic Claude API (claude-haiku-4-5-20251001 for cost efficiency)
- **Deployment:** Railway (Docker)

## Database Schema (ALREADY EXISTS — do NOT create tables)

The following tables already exist in Supabase. Your service reads from and writes to them:

```sql
-- Canonical profanity buckets (~21 rows, pre-seeded)
profanity_buckets (
  id TEXT PRIMARY KEY,              -- 'damn', 'ass', 'fuck', 'shit', etc.
  label TEXT NOT NULL,              -- 'D-word (Damn)', 'F-word', etc.
  severity TEXT NOT NULL,           -- 'mild', 'moderate', 'severe', 'religious'
  default_blocked BOOLEAN,
  display_order INTEGER
)

-- Known variants (seeded with ~120 entries, GROWS over time via AI discovery)
profanity_variants (
  id UUID PRIMARY KEY,
  variant TEXT NOT NULL,            -- 'dammit', 'dayum', 'goddamn', etc.
  bucket_id TEXT REFERENCES profanity_buckets(id),
  source TEXT NOT NULL,             -- 'dictionary' or 'ai_discovered'
  confidence REAL DEFAULT 1.0,
  UNIQUE(variant, bucket_id)        -- a variant can map to multiple buckets
)

-- Per-video classification results (this service WRITES to this)
video_profanity_map (
  id UUID PRIMARY KEY,
  youtube_id TEXT NOT NULL,
  timestamp_start REAL NOT NULL,    -- seconds
  timestamp_end REAL NOT NULL,      -- seconds
  surface_form TEXT NOT NULL,       -- word as it appeared in transcript
  bucket_ids TEXT[] NOT NULL,       -- array of bucket IDs
  confidence REAL DEFAULT 1.0,
  source TEXT DEFAULT 'dictionary'  -- 'dictionary' or 'ai_discovered'
)
```

## API Endpoints to Build

### POST /api/classify

Main endpoint. Receives a transcript, returns profanity classifications.

**Request:**
```json
{
  "youtube_id": "dQw4w9WgXcQ",
  "transcript_text": "Full transcript as a single string...",
  "segments": [
    {
      "text": "damn",
      "start_time": 12.34,
      "end_time": 12.78
    },
    {
      "text": "that's",
      "start_time": 12.78,
      "end_time": 13.10
    }
  ]
}
```

**Response:**
```json
{
  "youtube_id": "dQw4w9WgXcQ",
  "profanity_map": [
    {
      "timestamp_start": 12.34,
      "timestamp_end": 12.78,
      "surface_form": "damn",
      "bucket_ids": ["damn"],
      "confidence": 1.0,
      "source": "dictionary"
    }
  ],
  "stats": {
    "total_profanity_found": 15,
    "dictionary_matches": 13,
    "ai_discoveries": 2,
    "buckets_hit": ["fuck", "damn", "shit"],
    "processing_time_ms": 1200
  }
}
```

### GET /api/buckets

Returns all canonical buckets (for the extension/website to display in settings).

**Response:**
```json
{
  "buckets": [
    {
      "id": "fuck",
      "label": "F-word",
      "severity": "severe",
      "default_blocked": true,
      "display_order": 1,
      "variant_count": 11
    }
  ]
}
```

### GET /health

Standard health check.

```json
{
  "status": "ok",
  "timestamp": "2026-02-27T...",
  "services": {
    "supabase": "connected",
    "anthropic": "available"
  }
}
```

## Classification Algorithm (Two-Pass)

### Pass 1: Dictionary Matching (fast, free)

1. On startup, load `profanity_variants` table into an in-memory Map<string, {bucket_ids: string[], confidence: number}[]>.
2. Also load the safe words list to avoid false positives (words like "class", "hello", "passport" that contain profanity substrings).
3. For each transcript segment, check if the word (lowercased, stripped of punctuation) matches a known variant.
4. If match found, record it with source="dictionary", confidence=1.0.
5. For multi-word segments, also check for embedded profanity (e.g., "motherfucker" contains "fuck").

**Safe words list** (include ALL of these to prevent false positives):
```
class, classes, classic, classical, classify, classified,
grass, grassy, grassland,
pass, passed, passes, passing, passage, passenger, passport, password,
bypass, bypassed, compass, bass, bassist,
mass, masses, massive, brass, glass, glasses,
sass, sassy, lass, lassie,
cassette, casserole, assassin, assassination,
embassy, ambassador, harass, harassment,
assume, assumed, assuming, assumption,
assure, assured, assurance,
assess, assessed, assessment, asset, assets,
assign, assigned, assignment,
assist, assisted, assistant, assistance,
associate, associated, association,
hello, hellos, shell, shells, shellfish,
dwell, dwelling, swell, swelling,
well, wells, wellness, farewell,
spell, spelling, smell, smells, smelly,
bell, bells, doorbell, cell, cells, cellular,
fell, fella, fellow, jelly,
tell, telling, teller, sell, selling, seller,
yell, yelling, excel, excellent, excellence,
expel, expelled, compel, compelling,
repel, repellent, rebellion, rebellious,
amsterdam, macadam, madame, madam,
peacock, cockpit, cocktail, cockatoo, hancock, hitchcock,
dickens, benedict, predict, predicted, prediction,
addict, addicted, addiction, verdict,
indict, indictment, contradict, contradiction,
dictionary, dictate, dictation,
scrap, scraps, scrapped, scrapbook,
mississippi,
godfather, goddess, godly, godspeed, godforsaken,
landlord, warlord, overlord,
therapist, analyze, analytics, manslaughter,
cocktail, buttress, butterscotch, butterfly, button,
scunthorpe, penistone, shitake, cockatiel
```

### Pass 2: AI Classification (for unknown words/euphemisms)

After the dictionary pass, collect all words that:
- Were NOT matched by the dictionary
- AND are not in the safe words list
- AND are not common English words (optionally skip very common words)

Send these unmatched words to Claude Haiku with the full transcript context for classification.

**LLM Prompt (use this exact structure):**

```
You are a profanity classification engine for SafePlay, a video content filter.

You will receive a transcript and a list of words from that transcript that may be profanity, euphemisms, slang variants, or creative spellings of swear words. Your job is to determine if each word is profane and, if so, which canonical bucket(s) it belongs to.

The canonical profanity buckets are:
- fuck: F-word and all variants
- shit: S-word and all variants
- ass: A-word and all variants (butt-related)
- bitch: B-word and all variants
- damn: Damn and all variants
- hell: Hell (as profanity)
- crap: Crap and variants
- piss: Piss and variants
- dick: D-word (penis-related) and variants
- cock: C-word (penis-related) and variants
- pussy: P-word and variants
- bastard: Bastard and variants
- slut: Slut and variants
- whore: Whore and variants
- cunt: C-word (vulva-related) and variants
- twat: Twat and variants
- prick: Prick (as insult) and variants
- racial_slurs: Any racial slurs
- homophobic: Any homophobic slurs
- ableist: Any ableist slurs
- religious: Religious exclamations used as profanity (god, jesus, lord, holy X, etc.)

IMPORTANT RULES:
- Only classify words that ARE actually profane in context. Do NOT flag normal words.
- A word can belong to MULTIPLE buckets (e.g., "goddamn" → ["damn", "religious"])
- Include a confidence score from 0.5 to 1.0 (0.5 = uncertain, 1.0 = definitely profane)
- Consider the surrounding transcript context to determine if a word is profane
- "hell" in "what the hell" is profane. "hell" in "hell is a concept in theology" may not be.
- Common euphemisms to catch: "dayum", "effing", "frigging", "a-hole", "b*tch", "WTF", "STFU", etc.

FULL TRANSCRIPT FOR CONTEXT:
{transcript_text}

WORDS TO CLASSIFY (with their timestamps):
{unmatched_words_json}

Respond with ONLY a JSON array. No explanation, no markdown:
[
  {"word": "dayum", "bucket_ids": ["damn"], "confidence": 0.95},
  {"word": "frigging", "bucket_ids": ["fuck"], "confidence": 0.85}
]

If none of the words are profane, respond with: []
```

**After AI classification:**
- For each AI-discovered variant with confidence >= 0.7, INSERT it into the `profanity_variants` table with source='ai_discovered'. This way the dictionary grows over time and the AI has less work to do on future videos.
- Store all results (dictionary + AI) in `video_profanity_map`.

## Environment Variables

```env
PORT=3002
NODE_ENV=production

# Supabase (shared instance)
SUPABASE_URL=https://cmuimxnpvghitsbkqtog.supabase.co
SUPABASE_SERVICE_KEY=  # Service role key for writing to tables

# Anthropic (for AI pass)
ANTHROPIC_API_KEY=  # Claude API key

# Auth
SERVICE_API_KEY=  # For orchestrator-to-service authentication
```

## Project Structure

```
safeplay-profanity-engine/
├── src/
│   ├── index.ts                    # Express app setup, middleware, CORS
│   ├── routes/
│   │   ├── classify.ts             # POST /api/classify
│   │   ├── buckets.ts              # GET /api/buckets
│   │   └── health.ts               # GET /health
│   ├── services/
│   │   ├── dictionaryService.ts    # In-memory dictionary lookup from DB
│   │   ├── aiClassifier.ts         # Claude Haiku integration
│   │   ├── classificationPipeline.ts # Orchestrates dict + AI passes
│   │   └── supabaseService.ts      # DB reads/writes
│   ├── data/
│   │   └── safeWords.ts            # Safe words list (hardcoded)
│   ├── middleware/
│   │   └── auth.ts                 # SERVICE_API_KEY validation
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── Dockerfile
├── railway.json
├── package.json
├── tsconfig.json
└── .env.example
```

## Key Implementation Details

1. **Dictionary caching:** Load `profanity_variants` into memory on startup. Refresh every 5 minutes (or on demand) to pick up AI-discovered variants from other videos.

2. **Multi-bucket support:** A variant like "goddamn" has TWO rows in `profanity_variants` (one for "damn", one for "religious"). When you look up "goddamn", collect ALL matching bucket_ids into an array.

3. **Embedded profanity detection:** For words like "motherfucker", check if any known variant is a substring. But always check the safe words list first to avoid matching "class" → "ass".

4. **AI batching:** Don't send one LLM call per word. Batch all unmatched words into a single prompt. For very long transcripts (>50 unmatched words), batch into groups of 50.

5. **Error handling:** If the AI call fails, still return the dictionary results. The AI pass is an enhancement, not a requirement. Set a 30-second timeout on the LLM call.

6. **Spelling normalization** (before dictionary lookup):
   - Lowercase everything
   - Strip leading/trailing punctuation
   - Normalize leetspeak: 0→o, 1→i, 3→e, 4→a, 5→s, 7→t, 8→b, @→a, $→s
   - Collapse repeated characters: fuuuck → fuck (max 2 consecutive same chars)
   - Replace common substitutions: ph→f, ck→k

7. **Authentication:** Validate `X-API-Key` header matches `SERVICE_API_KEY` env var. Return 401 if missing/invalid. This is server-to-server only.

8. **Docker:** Multi-stage build (builder + runtime), non-root user, exposed port 3002.

9. **Railway config:**
```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": { "builder": "DOCKERFILE" },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 30
  }
}
```

## Testing

Include a simple test you can run locally:
```bash
curl -X POST http://localhost:3002/api/classify \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "youtube_id": "test123",
    "transcript_text": "What the fuck is this bullshit? Damn, that dayum thing is crazy. Holy shit!",
    "segments": [
      {"text": "What", "start_time": 0.0, "end_time": 0.3},
      {"text": "the", "start_time": 0.3, "end_time": 0.5},
      {"text": "fuck", "start_time": 0.5, "end_time": 0.8},
      {"text": "is", "start_time": 0.8, "end_time": 1.0},
      {"text": "this", "start_time": 1.0, "end_time": 1.3},
      {"text": "bullshit", "start_time": 1.3, "end_time": 1.8},
      {"text": "Damn", "start_time": 2.0, "end_time": 2.3},
      {"text": "that", "start_time": 2.3, "end_time": 2.5},
      {"text": "dayum", "start_time": 2.5, "end_time": 2.9},
      {"text": "thing", "start_time": 2.9, "end_time": 3.2},
      {"text": "is", "start_time": 3.2, "end_time": 3.4},
      {"text": "crazy", "start_time": 3.4, "end_time": 3.8},
      {"text": "Holy", "start_time": 4.0, "end_time": 4.3},
      {"text": "shit", "start_time": 4.3, "end_time": 4.6}
    ]
  }'
```

Expected: "fuck" → ["fuck"], "bullshit" → ["shit"], "Damn" → ["damn"], "dayum" → AI discovers → ["damn"], "Holy shit" (combining adjacent) → ["shit", "religious"].

Build the complete service. Make sure to init a git repo, create a proper .gitignore (node_modules, dist, .env), and commit all files.
