import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

const ORCHESTRATOR_URL = process.env.ORCHESTRATION_API_URL || "https://safeplay-orchestrator-production.up.railway.app";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATION_API_KEY;

// The specific demo video ID that's allowed to be fetched without auth
const DEMO_VIDEO_ID = "73_1biulkYk";

// Types
interface CharacterTiming {
  char: string;
  start: number;
  end: number;
}

interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  start_time?: number;
  end_time?: number;
  characters?: CharacterTiming[];  // Character-level timing for precision
}

interface MuteInterval {
  start: number;
  end: number;
  word: string;
  severity: "mild" | "moderate" | "severe" | "religious";
}

type SeverityLevel = "mild" | "moderate" | "severe" | "religious";

// Profanity list (same as Chrome extension)
const PROFANITY_MAP: Map<string, SeverityLevel> = new Map([
  // Severe
  ["fuck", "severe"],
  ["fucking", "severe"],
  ["fucked", "severe"],
  ["fucker", "severe"],
  ["fuckers", "severe"],
  ["fucks", "severe"],
  ["motherfucker", "severe"],
  ["motherfucking", "severe"],
  ["cunt", "severe"],
  ["cunts", "severe"],

  // Moderate
  ["shit", "moderate"],
  ["shits", "moderate"],
  ["shitty", "moderate"],
  ["bullshit", "moderate"],
  ["horseshit", "moderate"],
  ["ass", "moderate"],
  ["asses", "moderate"],
  ["asshole", "moderate"],
  ["assholes", "moderate"],
  ["bastard", "moderate"],
  ["bitch", "moderate"],
  ["bitches", "moderate"],
  ["bitchy", "moderate"],
  ["cock", "moderate"],
  ["dick", "moderate"],
  ["dicks", "moderate"],
  ["dickhead", "moderate"],
  ["pussy", "moderate"],
  ["prick", "moderate"],
  ["slut", "moderate"],
  ["whore", "moderate"],
  ["twat", "moderate"],

  // Mild
  ["damn", "mild"],
  ["damned", "mild"],
  ["dammit", "mild"],
  ["damnit", "mild"],
  ["hell", "mild"],
  ["crap", "mild"],
  ["crappy", "mild"],
  ["piss", "mild"],
  ["pissed", "mild"],

  // Religious
  ["goddamn", "religious"],
  ["goddamnit", "religious"],
  ["god damn", "religious"],
  ["jesus", "religious"],
  ["jesus christ", "religious"],
  ["christ", "religious"],
  ["holy shit", "religious"],
  ["holy fuck", "religious"],
]);

// Safe words that contain profanity substrings
const SAFE_WORDS = new Set([
  // Words containing "ass"
  "class", "classes", "classic", "classical", "classify", "classified",
  "grass", "grassy", "grassland",
  "pass", "passed", "passes", "passing", "passage", "passenger", "passport", "password",
  "bypass", "bypassed",
  "compass",
  "bass", "bassist",
  "mass", "masses", "massive",
  "brass",
  "glass", "glasses",
  "sass", "sassy",
  "lass", "lassie",
  "cassette", "casserole",
  "assassin", "assassination",
  "embassy", "ambassador",
  "harass", "harassment",
  "assume", "assumed", "assuming", "assumption",
  "assure", "assured", "assurance",
  "assess", "assessed", "assessment",
  "asset", "assets",
  "assign", "assigned", "assignment",
  "assist", "assisted", "assistant", "assistance",
  "associate", "associated", "association",

  // Words containing "hell"
  "hello", "hellos",
  "shell", "shells", "shellfish",
  "dwell", "dwelling",
  "swell", "swelling",
  "well", "wells", "wellness", "farewell",
  "spell", "spelling",
  "smell", "smells", "smelly",
  "bell", "bells", "doorbell",
  "cell", "cells", "cellular",
  "fell", "fella", "fellow",
  "jelly",
  "tell", "telling", "teller",
  "sell", "selling", "seller",
  "yell", "yelling",
  "excel", "excellent", "excellence",
  "expel", "expelled",
  "compel", "compelling",
  "repel", "repellent",
  "rebellion", "rebellious",

  // Words containing "damn"
  "amsterdam",
  "macadam", "madame", "madam",

  // Words containing "cock"
  "peacock",
  "cockpit",
  "cocktail",
  "cockatoo",
  "hancock", "hitchcock",

  // Words containing "dick"
  "dickens",
  "benedict",
  "predict", "predicted", "prediction",
  "addict", "addicted", "addiction",
  "verdict",
  "indict", "indictment",
  "contradict", "contradiction",
  "dictionary",
  "dictate", "dictation",

  // Words containing "crap"
  "scrap", "scraps", "scrapped", "scrapbook",

  // Words containing "piss"
  "mississippi",
]);

// Padding settings (matching Chrome extension defaults from src/types/index.ts)
const PADDING_BEFORE_MS = 100;  // 100ms before word starts
const PADDING_AFTER_MS = 30;    // 30ms after word ends
const MERGE_THRESHOLD_MS = 100;

// Check if word is safe (not profanity despite containing profanity substring)
function isSafeWord(word: string): boolean {
  return SAFE_WORDS.has(word.toLowerCase());
}

// Get timing for a character range using character-level timing if available
function getCharacterLevelTiming(
  segment: TranscriptSegment,
  startIndex: number,
  endIndex: number
): { startTime: number; endTime: number } {
  const segmentStart = segment.start_time ?? segment.start;
  const segmentEnd = segment.end_time ?? segment.end;

  // Use character-level timing if available (matching Chrome extension)
  if (segment.characters && segment.characters.length > 0) {
    const startChar = segment.characters[startIndex];
    const endChar = segment.characters[Math.min(endIndex - 1, segment.characters.length - 1)];

    return {
      startTime: startChar?.start ?? segmentStart,
      endTime: endChar?.end ?? segmentEnd,
    };
  }

  // Fall back to linear estimation based on character position
  const segmentDuration = segmentEnd - segmentStart;
  const charCount = segment.text.length || 1;

  const wordStartRatio = startIndex / charCount;
  const wordEndRatio = endIndex / charCount;

  return {
    startTime: segmentStart + wordStartRatio * segmentDuration,
    endTime: segmentStart + wordEndRatio * segmentDuration,
  };
}

// Find profanity in a text segment
function findProfanityInSegment(
  segment: TranscriptSegment
): { word: string; severity: SeverityLevel; startTime: number; endTime: number }[] {
  const results: { word: string; severity: SeverityLevel; startTime: number; endTime: number }[] = [];
  const text = segment.text.toLowerCase().trim();

  // Check if entire segment is a safe word
  if (isSafeWord(text)) {
    return results;
  }

  // Check for exact word match (entire segment is one profane word)
  const exactSeverity = PROFANITY_MAP.get(text);
  if (exactSeverity) {
    // Use character-level timing for precision
    const { startTime, endTime } = getCharacterLevelTiming(segment, 0, segment.text.length);
    results.push({
      word: text,
      severity: exactSeverity,
      startTime,
      endTime,
    });
    return results;
  }

  // Check for embedded profanity in multi-word segments
  const words = text.split(/\s+/);

  let charIndex = 0;
  for (const word of words) {
    const wordLower = word.replace(/[^a-z]/g, "");

    if (isSafeWord(wordLower)) {
      charIndex += word.length + 1;
      continue;
    }

    // Check if this word is profanity
    for (const [profanity, severity] of PROFANITY_MAP) {
      if (wordLower === profanity || wordLower.includes(profanity)) {
        // Use character-level timing for precision (matching Chrome extension)
        const { startTime, endTime } = getCharacterLevelTiming(
          segment,
          charIndex,
          charIndex + word.length
        );

        results.push({
          word: profanity,
          severity,
          startTime,
          endTime,
        });
        break;
      }
    }

    charIndex += word.length + 1;
  }

  return results;
}

// Create mute intervals with padding
function createMuteIntervals(
  matches: { word: string; severity: SeverityLevel; startTime: number; endTime: number }[]
): MuteInterval[] {
  const paddingBefore = PADDING_BEFORE_MS / 1000;
  const paddingAfter = PADDING_AFTER_MS / 1000;

  return matches.map((match) => ({
    start: Math.max(0, match.startTime - paddingBefore),
    end: match.endTime + paddingAfter,
    word: match.word,
    severity: match.severity,
  }));
}

// Merge overlapping intervals
function mergeIntervals(intervals: MuteInterval[]): MuteInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const mergeThreshold = MERGE_THRESHOLD_MS / 1000;
  const merged: MuteInterval[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end + mergeThreshold) {
      last.end = Math.max(last.end, current.end);
      if (!last.word.includes(current.word)) {
        last.word = `${last.word}, ${current.word}`;
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

// Parse transcript and find profanity
function parseTranscript(segments: TranscriptSegment[]): MuteInterval[] {
  const allMatches: { word: string; severity: SeverityLevel; startTime: number; endTime: number }[] = [];

  for (const segment of segments) {
    const matches = findProfanityInSegment(segment);
    allMatches.push(...matches);
  }

  const intervals = createMuteIntervals(allMatches);
  return mergeIntervals(intervals);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId") || "73_1biulkYk";
    const forceRefresh = searchParams.get("refresh") === "true";

    console.log("[DEMO] Fetching transcript for video:", videoId, forceRefresh ? "(forcing refresh)" : "");

    const supabase = createServiceClient();

    // Try to fetch from database
    const { data: video, error } = await supabase
      .from("videos")
      .select("transcript, duration_seconds, title, youtube_id")
      .eq("youtube_id", videoId)
      .single();

    console.log("[DEMO] Supabase query result:", {
      found: !!video,
      hasTranscript: !!video?.transcript,
      youtubeId: video?.youtube_id,
      title: video?.title,
      error: error?.message,
      errorCode: error?.code,
    });

    if (error || !video?.transcript || forceRefresh) {
      // No transcript in database or force refresh - try to fetch from orchestrator for demo video
      if (videoId === DEMO_VIDEO_ID) {
        console.log("[DEMO] Fetching from orchestrator...", forceRefresh ? "(forced refresh)" : "(not in DB)");

        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (ORCHESTRATOR_API_KEY) {
            headers["Authorization"] = `Bearer ${ORCHESTRATOR_API_KEY}`;
          }

          // First try to get cached transcript from orchestrator
          const orchestratorResponse = await fetch(
            `${ORCHESTRATOR_URL}/api/filter`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({ youtube_id: videoId }),
            }
          );

          if (orchestratorResponse.ok) {
            const data = await orchestratorResponse.json();

            if (data.status === "completed" && data.transcript) {
              const hasCharData = data.transcript.segments?.some((s: Record<string, unknown>) =>
                Array.isArray(s.characters) && s.characters.length > 0
              );
              console.log("[DEMO] Got transcript from orchestrator, hasCharacterTiming:", hasCharData);

              // Cache it in our database for next time
              const durationSeconds = data.transcript.duration || 0;
              await supabase.from("videos").upsert({
                youtube_id: videoId,
                title: data.video?.title || data.transcript.title || "Demo Video",
                channel_name: data.video?.channel_name || null,
                duration_seconds: durationSeconds,
                thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                transcript: data.transcript,
                cached_at: new Date().toISOString(),
              }, { onConflict: "youtube_id" });

              // Parse segments (including character-level timing if available)
              const segments: TranscriptSegment[] = data.transcript.segments
                ? data.transcript.segments.map((seg: Record<string, unknown>) => ({
                    text: seg.text as string,
                    start: (seg.start_time ?? seg.start) as number,
                    end: (seg.end_time ?? seg.end) as number,
                    start_time: seg.start_time as number | undefined,
                    end_time: seg.end_time as number | undefined,
                    characters: seg.characters as CharacterTiming[] | undefined,
                  }))
                : [];

              const profanityTimestamps = parseTranscript(segments);

              // Log interval durations to help debug timing issues
              console.log("[DEMO] Interval durations:", profanityTimestamps.map(p =>
                `${p.word}: ${((p.end - p.start) * 1000).toFixed(0)}ms`
              ));

              return NextResponse.json({
                segments: segments.map((s) => ({
                  text: s.text,
                  start: s.start,
                  end: s.end,
                })),
                profanity_timestamps: profanityTimestamps,
                duration: durationSeconds,
                title: data.video?.title || data.transcript.title || "Demo Video",
                _debug: {
                  hasCharacterTiming: hasCharData,
                  intervals: profanityTimestamps.map(p => ({
                    word: p.word,
                    duration_ms: Math.round((p.end - p.start) * 1000)
                  }))
                },
              });
            }

            // If processing, return a pending status
            if (data.status === "processing") {
              console.log("[DEMO] Video is being processed...");
              return NextResponse.json(
                {
                  error: "Demo video is being processed",
                  error_code: "PROCESSING",
                  message: "The demo video is being prepared. Please try again in a moment.",
                  segments: [],
                  profanity_timestamps: [],
                  duration: 0,
                },
                { status: 202 }
              );
            }
          }
        } catch (orchError) {
          console.error("[DEMO] Failed to fetch from orchestrator:", orchError);
        }
      }

      // Return error for non-demo videos or if orchestrator fails
      return NextResponse.json(
        {
          error: "Transcript not available for this video",
          error_code: "TRANSCRIPT_NOT_FOUND",
          message: "This video needs to be filtered first to generate a transcript.",
          segments: [],
          profanity_timestamps: [],
          duration: 0,
        },
        { status: 404 }
      );
    }

    // Parse the transcript to find profanity timestamps
    const transcript = video.transcript;
    let segments: TranscriptSegment[] = [];

    console.log("[DEMO] Transcript structure:", {
      hasSegments: !!transcript?.segments,
      segmentCount: transcript?.segments?.length,
      sampleSegment: transcript?.segments?.[0],
      duration: transcript?.duration,
    });

    // Handle different transcript formats (including character-level timing if available)
    if (transcript?.segments) {
      segments = transcript.segments.map((seg: Record<string, unknown>) => ({
        text: seg.text as string,
        start: (seg.start_time ?? seg.start) as number,
        end: (seg.end_time ?? seg.end) as number,
        start_time: seg.start_time as number | undefined,
        end_time: seg.end_time as number | undefined,
        characters: seg.characters as CharacterTiming[] | undefined,
      }));
    }

    // Find profanity timestamps
    const profanityTimestamps = parseTranscript(segments);

    console.log("[DEMO] Profanity detection results:", {
      totalSegments: segments.length,
      profanityCount: profanityTimestamps.length,
      hasCharacterTiming: segments.some(s => s.characters && s.characters.length > 0),
      profanities: profanityTimestamps.map(p => ({
        word: p.word,
        start: p.start.toFixed(3),
        end: p.end.toFixed(3),
        duration: ((p.end - p.start) * 1000).toFixed(0) + 'ms'
      })),
    });

    const hasCharData = segments.some(s => s.characters && s.characters.length > 0);

    return NextResponse.json({
      segments: segments.map(s => ({
        text: s.text,
        start: s.start,
        end: s.end,
      })),
      profanity_timestamps: profanityTimestamps,
      duration: video.duration_seconds || transcript?.duration || 0,
      _debug: {
        hasCharacterTiming: hasCharData,
        source: "database",
        intervals: profanityTimestamps.map(p => ({
          word: p.word,
          duration_ms: Math.round((p.end - p.start) * 1000)
        }))
      },
      title: video.title,
    });

  } catch (error) {
    console.error("Demo transcript error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcript" },
      { status: 500 }
    );
  }
}
