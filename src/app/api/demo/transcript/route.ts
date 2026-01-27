import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// Types
interface TranscriptSegment {
  text: string;
  start: number;
  end: number;
  start_time?: number;
  end_time?: number;
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

// Padding settings (matching Chrome extension)
const PADDING_BEFORE_MS = 100;
const PADDING_AFTER_MS = 30;
const MERGE_THRESHOLD_MS = 100;

// Check if word is safe (not profanity despite containing profanity substring)
function isSafeWord(word: string): boolean {
  return SAFE_WORDS.has(word.toLowerCase());
}

// Find profanity in a text segment
function findProfanityInSegment(
  segment: TranscriptSegment
): { word: string; severity: SeverityLevel; startTime: number; endTime: number }[] {
  const results: { word: string; severity: SeverityLevel; startTime: number; endTime: number }[] = [];
  const text = segment.text.toLowerCase().trim();
  const startTime = segment.start_time ?? segment.start;
  const endTime = segment.end_time ?? segment.end;

  // Check if entire segment is a safe word
  if (isSafeWord(text)) {
    return results;
  }

  // Check for exact word match
  const exactSeverity = PROFANITY_MAP.get(text);
  if (exactSeverity) {
    results.push({
      word: text,
      severity: exactSeverity,
      startTime,
      endTime,
    });
    return results;
  }

  // Check for embedded profanity
  const words = text.split(/\s+/);
  const segmentDuration = endTime - startTime;
  const charCount = text.length;

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
        // Calculate approximate timing based on character position
        const wordStartRatio = charIndex / charCount;
        const wordEndRatio = (charIndex + word.length) / charCount;

        results.push({
          word: profanity,
          severity,
          startTime: startTime + wordStartRatio * segmentDuration,
          endTime: startTime + wordEndRatio * segmentDuration,
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

    const supabase = createServiceClient();

    // Try to fetch from database
    const { data: video, error } = await supabase
      .from("videos")
      .select("transcript, duration_seconds, title")
      .eq("youtube_id", videoId)
      .single();

    if (error || !video?.transcript) {
      // Return a message that transcript is not available
      // In production, you might want to trigger a transcription job
      return NextResponse.json(
        {
          error: "Transcript not available for this video",
          error_code: "TRANSCRIPT_NOT_FOUND",
          message: "Please filter this video first to generate a transcript"
        },
        { status: 404 }
      );
    }

    // Parse the transcript to find profanity timestamps
    const transcript = video.transcript;
    let segments: TranscriptSegment[] = [];

    // Handle different transcript formats
    if (transcript.segments) {
      segments = transcript.segments.map((seg: Record<string, unknown>) => ({
        text: seg.text as string,
        start: (seg.start_time ?? seg.start) as number,
        end: (seg.end_time ?? seg.end) as number,
        start_time: seg.start_time as number | undefined,
        end_time: seg.end_time as number | undefined,
      }));
    }

    // Find profanity timestamps
    const profanityTimestamps = parseTranscript(segments);

    return NextResponse.json({
      segments: segments.map(s => ({
        text: s.text,
        start: s.start,
        end: s.end,
      })),
      profanity_timestamps: profanityTimestamps,
      duration: video.duration_seconds || transcript.duration || 0,
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
