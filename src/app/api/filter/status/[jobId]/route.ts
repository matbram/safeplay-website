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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Authenticate via session cookie or bearer token
    const auth = await authenticateRequest(request);

    if (!auth.user || !auth.supabase) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = auth.supabase;

    // Check if this job belongs to the user
    const { data: jobRecord } = await supabase
      .from("filter_jobs")
      .select("*")
      .eq("job_id", jobId)
      .eq("user_id", auth.user.id)
      .single();

    if (!jobRecord) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // If job already completed in our DB, return cached result
    if (jobRecord.status === "completed") {
      return NextResponse.json({
        status: "completed",
        progress: 100,
        message: "Complete!",
        credits_used: jobRecord.credits_used || 0,
      });
    }

    // Poll orchestrator for current status
    const headers: Record<string, string> = {};

    if (ORCHESTRATOR_API_KEY) {
      headers["Authorization"] = `Bearer ${ORCHESTRATOR_API_KEY}`;
    }

    const response = await fetch(`${ORCHESTRATOR_URL}/api/jobs/${jobId}`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      // Update job status to failed
      await supabase
        .from("filter_jobs")
        .update({ status: "failed", error: data.error })
        .eq("job_id", jobId);

      return NextResponse.json(
        { error: data.error || "Failed to check status", error_code: data.error_code },
        { status: response.status }
      );
    }

    // Map orchestrator status to UI-friendly progress (matching Chrome extension)
    let displayProgress = data.progress || 0;
    let displayMessage = "";

    switch (data.status) {
      case "pending":
        displayProgress = 5;
        displayMessage = "Preparing video...";
        break;
      case "downloading":
        // Map downloading 0-100% to 5-35%
        displayProgress = 5 + Math.round((data.progress || 0) * 0.30);
        displayMessage = "Downloading video...";
        break;
      case "transcribing":
        // Map transcribing 0-100% to 35-95%
        displayProgress = 35 + Math.round((data.progress || 0) * 0.60);
        displayMessage = "Analyzing audio...";
        break;
      case "completed":
        displayProgress = 100;
        displayMessage = "Complete!";
        break;
      case "failed":
        displayMessage = data.error || "Processing failed";
        break;
      default:
        displayMessage = "Processing...";
    }

    // Update job progress in our DB
    await supabase
      .from("filter_jobs")
      .update({
        status: data.status,
        progress: displayProgress,
      })
      .eq("job_id", jobId);

    // If completed, finalize the job (deduct credits, save video, save history)
    if (data.status === "completed" && data.transcript) {
      // Get duration - try multiple sources since transcript.duration is often missing
      let durationSeconds = data.transcript.duration || 0;

      // If duration is 0, try to get it from existing video cache
      if (durationSeconds === 0) {
        const { data: existingVideo } = await supabase
          .from("videos")
          .select("duration_seconds")
          .eq("youtube_id", jobRecord.youtube_id)
          .single();

        if (existingVideo?.duration_seconds) {
          durationSeconds = existingVideo.duration_seconds;
          console.log("Status: Got duration from cached video:", durationSeconds);
        }
      }

      // If still 0, try scraping YouTube
      if (durationSeconds === 0) {
        console.log("Status: Duration still 0, scraping YouTube for:", jobRecord.youtube_id);
        const scrapedData = await scrapeYouTubeMetadata(jobRecord.youtube_id);
        if (scrapedData?.durationSeconds) {
          durationSeconds = scrapedData.durationSeconds;
          console.log("Status: Scraped duration:", durationSeconds);
        }
      }

      const creditCost = calculateCreditCost(durationSeconds);
      console.log("Status: Calculated credit cost:", creditCost, "for duration:", durationSeconds);

      // Check user's credit balance
      const { data: creditBalance } = await supabase
        .from("credit_balances")
        .select("*")
        .eq("user_id", auth.user.id)
        .single();

      const availableCredits = creditBalance?.available_credits || 0;

      // Check credits
      if (creditCost > availableCredits) {
        // Update job status to failed due to insufficient credits
        await supabase
          .from("filter_jobs")
          .update({ status: "failed", error: "Insufficient credits" })
          .eq("job_id", jobId);

        return NextResponse.json({
          status: "failed",
          error: "Insufficient credits",
          error_code: "INSUFFICIENT_CREDITS",
          required: creditCost,
          available: availableCredits,
        });
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
        description: `Filtered video: ${data.video?.title || jobRecord.youtube_id}`,
      });

      if (txError) {
        console.error("Error recording transaction:", txError);
      }

      // Cache video in our database - use upsert with onConflict
      const { data: videoRecord, error: videoError } = await supabase
        .from("videos")
        .upsert(
          {
            youtube_id: jobRecord.youtube_id,
            title: data.video?.title || data.transcript.title || "Unknown Video",
            channel_name: data.video?.channel_name || null,
            duration_seconds: durationSeconds,
            thumbnail_url: `https://img.youtube.com/vi/${jobRecord.youtube_id}/maxresdefault.jpg`,
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
          .eq("youtube_id", jobRecord.youtube_id)
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
            filter_type: jobRecord.filter_type || "mute",
            custom_words: jobRecord.custom_words || [],
            credits_used: creditCost,
          })
          .select()
          .single();

        if (historyError) {
          console.error("Error saving history:", historyError);
        }
        historyEntry = history;
      }

      // Mark job as completed
      await supabase
        .from("filter_jobs")
        .update({
          status: "completed",
          credits_used: creditCost,
          completed_at: new Date().toISOString(),
        })
        .eq("job_id", jobId);

      return NextResponse.json({
        status: "completed",
        progress: 100,
        message: "Complete!",
        transcript: data.transcript,
        video: {
          youtube_id: jobRecord.youtube_id,
          title: data.video?.title || data.transcript.title || "Unknown Video",
          channel_name: data.video?.channel_name || null,
          duration_seconds: durationSeconds,
          thumbnail_url: `https://img.youtube.com/vi/${jobRecord.youtube_id}/maxresdefault.jpg`,
        },
        history_id: historyEntry?.id,
        credits_used: creditCost,
      });
    }

    // Handle failed status from orchestrator
    if (data.status === "failed") {
      await supabase
        .from("filter_jobs")
        .update({ status: "failed", error: data.error })
        .eq("job_id", jobId);

      return NextResponse.json({
        status: "failed",
        error: data.error || "Processing failed",
        error_code: data.error_code,
      });
    }

    // Return current status
    return NextResponse.json({
      status: data.status,
      progress: displayProgress,
      message: displayMessage,
      video: data.video,
    });
  } catch (error) {
    console.error("Filter status error:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
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
