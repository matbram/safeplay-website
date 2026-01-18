import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ORCHESTRATOR_URL = process.env.ORCHESTRATION_API_URL || "https://safeplay-orchestrator-production.up.railway.app";
const ORCHESTRATOR_API_KEY = process.env.ORCHESTRATION_API_KEY;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if this job belongs to the user
    const { data: jobRecord } = await supabase
      .from("filter_jobs")
      .select("*")
      .eq("job_id", jobId)
      .eq("user_id", session.user.id)
      .single();

    if (!jobRecord) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Poll orchestrator for status
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

    // Map orchestrator progress to UI-friendly progress
    let displayProgress = data.progress || 0;
    let displayMessage = "";

    switch (data.status) {
      case "pending":
        displayProgress = 5;
        displayMessage = "Queued for processing...";
        break;
      case "downloading":
        displayProgress = 5 + (data.progress || 0) * 0.25; // 5-30%
        displayMessage = "Downloading video...";
        break;
      case "transcribing":
        displayProgress = 30 + (data.progress || 0) * 0.55; // 30-85%
        displayMessage = "Analyzing audio and detecting profanity...";
        break;
      case "completed":
        displayProgress = 100;
        displayMessage = "Processing complete!";
        break;
      case "failed":
        displayMessage = data.error || "Processing failed";
        break;
    }

    // If completed, finalize the job
    if (data.status === "completed" && data.transcript) {
      const durationSeconds = data.transcript.duration || 300;
      const creditCost = calculateCreditCost(durationSeconds);

      // Check user's credit balance
      const { data: creditBalance } = await supabase
        .from("credit_balances")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      const availableCredits = creditBalance?.available_credits || 0;

      // Check credits (only deduct if not already deducted)
      if (jobRecord.status !== "completed") {
        if (creditCost > availableCredits) {
          // Update job status to failed due to insufficient credits
          await supabase
            .from("filter_jobs")
            .update({ status: "failed", error: "Insufficient credits" })
            .eq("job_id", jobId);

          return NextResponse.json(
            {
              status: "failed",
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

        await supabase
          .from("credit_balances")
          .update({
            available_credits: newBalance,
            used_this_period: newUsed,
          })
          .eq("user_id", session.user.id);

        // Record credit transaction
        await supabase.from("credit_transactions").insert({
          user_id: session.user.id,
          amount: -creditCost,
          balance_after: newBalance,
          type: "filter",
          description: `Filtered video: ${data.video?.title || jobRecord.youtube_id}`,
        });

        // Cache video in our database
        const { data: videoRecord } = await supabase
          .from("videos")
          .upsert({
            youtube_id: jobRecord.youtube_id,
            title: data.video?.title || data.transcript.title || "Unknown Video",
            channel_name: data.video?.channel_name || null,
            duration_seconds: durationSeconds,
            thumbnail_url: `https://img.youtube.com/vi/${jobRecord.youtube_id}/maxresdefault.jpg`,
            transcript: data.transcript,
            cached_at: new Date().toISOString(),
          })
          .select()
          .single();

        // Record in filter history
        const { data: historyEntry } = await supabase
          .from("filter_history")
          .insert({
            user_id: session.user.id,
            video_id: videoRecord?.id,
            filter_type: jobRecord.filter_type || "mute",
            custom_words: jobRecord.custom_words || [],
            credits_used: creditCost,
          })
          .select()
          .single();

        // Update job status to completed
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
          message: displayMessage,
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

      // Already completed, just return the data
      return NextResponse.json({
        status: "completed",
        progress: 100,
        message: displayMessage,
        transcript: data.transcript,
        video: data.video,
        credits_used: jobRecord.credits_used || 0,
      });
    }

    // Update job status
    await supabase
      .from("filter_jobs")
      .update({
        status: data.status,
        progress: displayProgress,
      })
      .eq("job_id", jobId);

    // Return status update
    return NextResponse.json({
      status: data.status,
      progress: Math.round(displayProgress),
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
  const minutes = Math.ceil(durationSeconds / 60);
  return Math.max(1, minutes);
}
