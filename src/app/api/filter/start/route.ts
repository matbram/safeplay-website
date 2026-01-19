import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-helper";

const ORCHESTRATOR_URL = process.env.ORCHESTRATION_API_URL || "https://safeplay-orchestrator-production.up.railway.app";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATION_API_KEY;

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

// Scrape YouTube page to get video duration
async function scrapeYouTubeMetadata(videoId: string): Promise<{ durationSeconds: number } | null> {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const playerResponseMarker = "var ytInitialPlayerResponse = ";
    const playerResponseStart = html.indexOf(playerResponseMarker);

    if (playerResponseStart !== -1) {
      const jsonStart = playerResponseStart + playerResponseMarker.length;
      const jsonString = extractJsonObject(html, jsonStart);

      if (jsonString) {
        try {
          const playerData = JSON.parse(jsonString);
          const videoDetails = playerData.videoDetails;

          if (videoDetails?.lengthSeconds) {
            return {
              durationSeconds: parseInt(videoDetails.lengthSeconds, 10),
            };
          }
        } catch {
          // JSON parse failed
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);

    if (!auth.user || !auth.supabase) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = auth.supabase;
    const { youtube_id, filter_type, custom_words } = await request.json();

    if (!youtube_id) {
      return NextResponse.json(
        { error: "YouTube ID is required" },
        { status: 400 }
      );
    }

    // Check if video is already cached in OUR database (free to rewatch)
    const { data: cachedVideo } = await supabase
      .from("videos")
      .select("*")
      .eq("youtube_id", youtube_id)
      .single();

    if (cachedVideo && cachedVideo.transcript) {
      // Video already transcribed in our DB - free to rewatch
      // Record in filter history (no credits charged)
      const { data: historyEntry, error: historyError } = await supabase
        .from("filter_history")
        .insert({
          user_id: auth.user.id,
          video_id: cachedVideo.id,
          filter_type: filter_type || "mute",
          custom_words: custom_words || [],
          credits_used: 0,
        })
        .select()
        .single();

      if (historyError) {
        console.error("Error saving history:", historyError);
      }

      return NextResponse.json({
        status: "completed",
        cached: true,
        transcript: cachedVideo.transcript,
        video: {
          youtube_id: cachedVideo.youtube_id,
          title: cachedVideo.title,
          channel_name: cachedVideo.channel_name,
          duration_seconds: cachedVideo.duration_seconds,
          thumbnail_url: cachedVideo.thumbnail_url,
        },
        history_id: historyEntry?.id,
        credits_used: 0,
      });
    }

    // Video not in our cache - call orchestrator to start filtering
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (ORCHESTRATOR_API_KEY) {
      headers["Authorization"] = `Bearer ${ORCHESTRATOR_API_KEY}`;
    }

    const response = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
      method: "POST",
      headers,
      body: JSON.stringify({ youtube_id }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to start filtering", error_code: data.error_code },
        { status: response.status }
      );
    }

    // If orchestrator has it cached and returns completed immediately
    if (data.status === "completed" && data.transcript) {
      // Get duration - try multiple sources since transcript.duration is often missing
      let durationSeconds = data.transcript.duration || 0;

      // If duration is 0, try to get it from existing video cache
      if (durationSeconds === 0) {
        const { data: existingVideo } = await supabase
          .from("videos")
          .select("duration_seconds")
          .eq("youtube_id", youtube_id)
          .single();

        if (existingVideo?.duration_seconds) {
          durationSeconds = existingVideo.duration_seconds;
          console.log("Start: Got duration from cached video:", durationSeconds);
        }
      }

      // If still 0, try scraping YouTube
      if (durationSeconds === 0) {
        console.log("Start: Duration still 0, scraping YouTube for:", youtube_id);
        const scrapedData = await scrapeYouTubeMetadata(youtube_id);
        if (scrapedData?.durationSeconds) {
          durationSeconds = scrapedData.durationSeconds;
          console.log("Start: Scraped duration:", durationSeconds);
        }
      }

      const creditCost = calculateCreditCost(durationSeconds);
      console.log("Start: Calculated credit cost:", creditCost, "for duration:", durationSeconds);

      // Check user's credit balance
      const { data: creditBalance } = await supabase
        .from("credit_balances")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      const availableCredits = creditBalance?.available_credits || 0;

      if (creditCost > availableCredits) {
        return NextResponse.json(
          {
            error: "Insufficient credits",
            error_code: "INSUFFICIENT_CREDITS",
            required: creditCost,
            available: availableCredits,
          },
          { status: 400 }
        );
      }

      // Deduct credits
      const newBalance = availableCredits - creditCost;
      const newUsed = (creditBalance?.used_this_period || 0) + creditCost;

      const { error: creditUpdateError } = await supabase
        .from("credit_balances")
        .update({
          available_credits: newBalance,
          used_this_period: newUsed,
        })
        .eq("user_id", auth.user.id);

      if (creditUpdateError) {
        console.error("Error updating credits:", creditUpdateError);
      }

      // Record credit transaction
      const { error: txError } = await supabase.from("credit_transactions").insert({
        user_id: auth.user.id,
        amount: -creditCost,
        balance_after: newBalance,
        type: "filter",
        description: `Filtered video: ${data.video?.title || youtube_id}`,
      });

      if (txError) {
        console.error("Error recording transaction:", txError);
      }

      // Cache video in our database - use upsert with onConflict
      const { data: videoRecord, error: videoError } = await supabase
        .from("videos")
        .upsert(
          {
            youtube_id: youtube_id,
            title: data.video?.title || data.transcript.title || "Unknown Video",
            channel_name: data.video?.channel_name || null,
            duration_seconds: durationSeconds,
            thumbnail_url: `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`,
            transcript: data.transcript,
            cached_at: new Date().toISOString(),
          },
          { onConflict: "youtube_id" }
        )
        .select()
        .single();

      // If upsert failed, try to get existing video
      let videoId = videoRecord?.id;
      if (videoError) {
        console.error("Error caching video:", videoError);
        // Try to get existing video record
        const { data: existingVideo } = await supabase
          .from("videos")
          .select("id")
          .eq("youtube_id", youtube_id)
          .single();
        videoId = existingVideo?.id;
      }

      // Record in filter history (only if we have a video_id)
      let historyEntry = null;
      if (videoId) {
        const { data: history, error: historyError } = await supabase
          .from("filter_history")
          .insert({
            user_id: auth.user.id,
            video_id: videoId,
            filter_type: filter_type || "mute",
            custom_words: custom_words || [],
            credits_used: creditCost,
          })
          .select()
          .single();

        if (historyError) {
          console.error("Error saving history:", historyError);
        }
        historyEntry = history;
      }

      return NextResponse.json({
        status: "completed",
        cached: true,
        transcript: data.transcript,
        video: {
          youtube_id: youtube_id,
          title: data.video?.title || data.transcript.title || "Unknown Video",
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${youtube_id}/maxresdefault.jpg`,
        },
        history_id: historyEntry?.id,
        credits_used: creditCost,
      });
    }

    // Processing started - save job and return job ID for polling
    if (data.status === "processing" && data.job_id) {
      const { error: jobError } = await supabase.from("filter_jobs").upsert({
        job_id: data.job_id,
        user_id: auth.user.id,
        youtube_id: youtube_id,
        filter_type: filter_type || "mute",
        custom_words: custom_words || [],
        status: "processing",
        created_at: new Date().toISOString(),
      });

      if (jobError) {
        console.error("Error saving job:", jobError);
      }

      return NextResponse.json({
        status: "processing",
        job_id: data.job_id,
        youtube_id: youtube_id,
        message: "Video processing started",
      });
    }

    // Handle failed status
    if (data.status === "failed") {
      return NextResponse.json(
        { error: data.error || "Failed to process video", error_code: data.error_code },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Filter start error:", error);
    return NextResponse.json(
      { error: "Failed to start filtering" },
      { status: 500 }
    );
  }
}

function calculateCreditCost(durationSeconds: number): number {
  // 1 credit per minute, rounded at 30 second mark
  if (durationSeconds === 0) return 0;
  const minutes = Math.round(durationSeconds / 60);
  return Math.max(1, minutes);
}
