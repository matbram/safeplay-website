/**
 * Strip character-level timing data from transcript segments before caching.
 *
 * Character timing arrays (`characters: [{char, start, end}, ...]`) can be
 * very large for long videos — a 3-hour video produces ~6MB+ of character
 * timing data alone, which causes Supabase upsert timeouts.
 *
 * Segment-level timing (start/end per segment) is preserved, and profanity
 * detection falls back to linear estimation without character data.
 */
export function prepareTranscriptForCache(
  transcript: Record<string, unknown>
): Record<string, unknown> {
  if (!transcript || !Array.isArray(transcript.segments)) {
    return transcript;
  }

  return {
    ...transcript,
    segments: transcript.segments.map(
      (segment: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { characters, ...rest } = segment;
        return rest;
      }
    ),
  };
}
