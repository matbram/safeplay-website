import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Calculate credit cost: 1 credit per minute, minimum 1 credit
function calculateCreditCost(durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.max(1, minutes);
}

// Extract JSON object from string starting at given position
function extractJsonObject(str: string, startIndex: number): string | null {
  let braceCount = 0;
  let inString = false;
  let escapeNext = false;

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

    if (!inString) {
      if (char === "{") {
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0) {
          return str.substring(startIndex, i + 1);
        }
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
        // Use a browser-like user agent
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
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
            return {
              title: videoDetails.title || "Unknown Video",
              channelName: videoDetails.author || null,
              durationSeconds: parseInt(videoDetails.lengthSeconds || "0", 10),
              thumbnailUrl:
                videoDetails.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            };
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
          // Navigate to video primary info
          const contents = initialData.contents?.twoColumnWatchNextResults?.results?.results?.contents;
          if (contents) {
            for (const content of contents) {
              const primaryInfo = content.videoPrimaryInfoRenderer;
              const secondaryInfo = content.videoSecondaryInfoRenderer;

              if (primaryInfo?.title?.runs?.[0]?.text) {
                return {
                  title: primaryInfo.title.runs[0].text,
                  channelName: secondaryInfo?.owner?.videoOwnerRenderer?.title?.runs?.[0]?.text || null,
                  durationSeconds: 0, // Not available in this structure
                  thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { youtube_url, youtube_id } = await request.json();

    // Extract YouTube ID from URL if needed
    let videoId = youtube_id;
    if (!videoId && youtube_url) {
      videoId = extractYouTubeId(youtube_url);
    }

    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL or ID" },
        { status: 400 }
      );
    }

    // First, check if we have this video cached in our database with a transcript
    const { data: cachedVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("youtube_id", videoId)
      .single();

    if (cachedVideo && cachedVideo.transcript) {
      // Video is cached with transcript - free to rewatch
      return NextResponse.json({
        youtube_id: cachedVideo.youtube_id,
        title: cachedVideo.title,
        channel_name: cachedVideo.channel_name,
        duration_seconds: cachedVideo.duration_seconds,
        thumbnail_url: cachedVideo.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        credit_cost: 0, // Free for cached videos
        cached: true,
        has_transcript: true,
      });
    }

    // Video not cached - scrape metadata from YouTube page
    let title = "Unknown Video";
    let channelName: string | null = null;
    let durationSeconds = 0;
    let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Scrape YouTube page for metadata including duration
    const scrapedData = await scrapeYouTubeMetadata(videoId);

    if (scrapedData) {
      title = scrapedData.title;
      channelName = scrapedData.channelName;
      durationSeconds = scrapedData.durationSeconds;
      thumbnailUrl = scrapedData.thumbnailUrl;
    } else {
      // Fallback to oEmbed (doesn't have duration but at least gets title)
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedResponse = await fetch(oembedUrl);

        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          title = oembedData.title || title;
          channelName = oembedData.author_name || null;
          thumbnailUrl = oembedData.thumbnail_url || thumbnailUrl;
        }
      } catch (err) {
        console.error("Failed to fetch oEmbed data:", err);
      }
    }

    const creditCost = calculateCreditCost(durationSeconds);

    return NextResponse.json({
      youtube_id: videoId,
      title: title,
      channel_name: channelName,
      duration_seconds: durationSeconds,
      thumbnail_url: thumbnailUrl,
      credit_cost: creditCost,
      cached: false,
      has_transcript: false,
      // If duration is still 0, we couldn't get it
      ...(durationSeconds === 0 && {
        credit_cost_note: "Duration unavailable. Cost will be ~1 credit per minute.",
      }),
    });
  } catch (error) {
    console.error("Filter preview error:", error);
    return NextResponse.json(
      { error: "Failed to fetch video info" },
      { status: 500 }
    );
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
