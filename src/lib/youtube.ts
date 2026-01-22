/**
 * Shared YouTube utilities for fetching video metadata
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Parse ISO 8601 duration (PT1H2M3S) to seconds
 */
function parseISO8601Duration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video info using official YouTube Data API v3 (most reliable)
 */
async function fetchFromYouTubeDataAPI(videoId: string): Promise<{
  title: string;
  channelName: string | null;
  durationSeconds: number;
  thumbnailUrl: string;
} | null> {
  if (!YOUTUBE_API_KEY) {
    console.log("[YouTube API] No YOUTUBE_API_KEY configured, skipping Data API");
    return null;
  }

  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error("[YouTube API] Data API request failed:", response.status, await response.text());
      return null;
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log("[YouTube API] Video not found:", videoId);
      return null;
    }

    const item = data.items[0];
    const snippet = item.snippet;
    const contentDetails = item.contentDetails;

    const durationSeconds = parseISO8601Duration(contentDetails?.duration || "PT0S");

    // Get highest quality thumbnail available
    const thumbnails = snippet?.thumbnails;
    const thumbnailUrl =
      thumbnails?.maxres?.url ||
      thumbnails?.standard?.url ||
      thumbnails?.high?.url ||
      thumbnails?.medium?.url ||
      thumbnails?.default?.url ||
      `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    console.log("[YouTube API] Successfully fetched from Data API:", {
      videoId,
      title: snippet?.title,
      duration: durationSeconds
    });

    return {
      title: snippet?.title || "Unknown Video",
      channelName: snippet?.channelTitle || null,
      durationSeconds,
      thumbnailUrl,
    };
  } catch (error) {
    console.error("[YouTube API] Data API error:", error);
    return null;
  }
}

// Helper function to extract a JSON object from a string starting at a given position
function extractJsonObject(str: string, startIndex: number): string | null {
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  let jsonStart = -1;

  for (let i = startIndex; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") {
      if (depth === 0) jsonStart = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && jsonStart !== -1) {
        return str.substring(jsonStart, i + 1);
      }
    }
  }

  return null;
}

// Scrape YouTube page to extract video metadata from ytInitialPlayerResponse
async function scrapeYouTubeMetadata(videoId: string): Promise<{
  title: string;
  channelName: string | null;
  durationSeconds: number;
  thumbnailUrl: string;
} | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Cookie": "CONSENT=YES+cb; SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA3X3AxGgJlbiACGgYIgJnSmgY",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch YouTube page:", response.status);
      return null;
    }

    const html = await response.text();

    // Find ytInitialPlayerResponse and extract the JSON object
    const playerResponseMarker = "var ytInitialPlayerResponse = ";
    const playerResponseStart = html.indexOf(playerResponseMarker);

    if (playerResponseStart !== -1) {
      const jsonStart = playerResponseStart + playerResponseMarker.length;
      const jsonString = extractJsonObject(html, jsonStart);

      if (jsonString) {
        try {
          const playerData = JSON.parse(jsonString);
          const videoDetails = playerData.videoDetails;

          if (videoDetails) {
            const result = {
              title: videoDetails.title || "Unknown Video",
              channelName: videoDetails.author || null,
              durationSeconds: parseInt(videoDetails.lengthSeconds || "0", 10),
              thumbnailUrl:
                videoDetails.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            };
            console.log("[YouTube API] Page scraping succeeded (ytInitialPlayerResponse):", {
              videoId,
              title: result.title,
              duration: result.durationSeconds
            });
            return result;
          }
        } catch (parseError) {
          console.error("Failed to parse ytInitialPlayerResponse:", parseError);
        }
      }
    }

    // Fallback: try ytInitialData
    const initialDataMarker = "var ytInitialData = ";
    const initialDataStart = html.indexOf(initialDataMarker);

    if (initialDataStart !== -1) {
      const jsonStart = initialDataStart + initialDataMarker.length;
      const jsonString = extractJsonObject(html, jsonStart);

      if (jsonString) {
        try {
          const initialData = JSON.parse(jsonString);
          const contents = initialData.contents?.twoColumnWatchNextResults?.results?.results?.contents;
          if (contents) {
            for (const content of contents) {
              const primaryInfo = content.videoPrimaryInfoRenderer;
              const secondaryInfo = content.videoSecondaryInfoRenderer;

              if (primaryInfo?.title?.runs?.[0]?.text) {
                console.log("[YouTube API] Page scraping partial success (ytInitialData - no duration):", {
                  videoId,
                  title: primaryInfo.title.runs[0].text
                });
                return {
                  title: primaryInfo.title.runs[0].text,
                  channelName: secondaryInfo?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || null,
                  durationSeconds: 0, // Not available in this structure
                  thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                };
              }
            }
          }
        } catch (parseError) {
          console.error("Failed to parse ytInitialData:", parseError);
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error scraping YouTube:", error);
    return null;
  }
}

/**
 * Fetch video info using multiple methods with fallbacks:
 * 1. Official YouTube Data API v3 (most reliable, requires API key)
 * 2. YouTube's internal player API (no auth required, but may be blocked)
 * 3. Page scraping (last resort)
 */
export async function fetchYouTubeVideoInfo(videoId: string): Promise<{
  title: string;
  channelName: string | null;
  durationSeconds: number;
  thumbnailUrl: string;
} | null> {
  // Method 1: Try official YouTube Data API v3 (most reliable)
  const dataApiResult = await fetchFromYouTubeDataAPI(videoId);
  if (dataApiResult && dataApiResult.durationSeconds > 0) {
    return dataApiResult;
  }

  // Method 2: Try YouTube's internal player API
  try {
    console.log("[YouTube API] Trying internal player API for:", videoId);
    const response = await fetch("https://www.youtube.com/youtubei/v1/player", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify({
        videoId: videoId,
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20240101.00.00",
            hl: "en",
            gl: "US",
          },
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const videoDetails = data.videoDetails;

      if (videoDetails?.lengthSeconds) {
        console.log("[YouTube API] Internal player API succeeded:", videoId);
        return {
          title: videoDetails.title || "Unknown Video",
          channelName: videoDetails.author || null,
          durationSeconds: parseInt(videoDetails.lengthSeconds, 10),
          thumbnailUrl:
            videoDetails.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
            `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        };
      }
    }
  } catch (error) {
    console.error("[YouTube API] Internal player API failed:", error);
  }

  // Method 3: Fallback to page scraping
  console.log("[YouTube API] Falling back to page scraping for:", videoId);
  return scrapeYouTubeMetadata(videoId);
}

/**
 * Fetch just the duration for a YouTube video (faster than full info)
 */
export async function fetchYouTubeDuration(videoId: string): Promise<number> {
  const info = await fetchYouTubeVideoInfo(videoId);
  return info?.durationSeconds || 0;
}
