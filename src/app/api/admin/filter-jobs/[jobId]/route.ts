import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * GET /api/admin/filter-jobs/[jobId]
 * Get detailed info for a single filter job, including orchestrator status
 * and Supabase Storage file existence check.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const { jobId } = await params;
    const supabase = createServiceClient();

    // Fetch the job
    const { data: job, error } = await supabase
      .from("filter_jobs")
      .select("*")
      .eq("job_id", jobId)
      .single();

    if (error || !job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Get user info and video record in parallel
    const [profileResult, videoResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, display_name")
        .eq("id", job.user_id)
        .single(),
      supabase
        .from("videos")
        .select("youtube_id, title, channel_name, duration_seconds, thumbnail_url, transcript, storage_path, cached_at")
        .eq("youtube_id", job.youtube_id)
        .single(),
    ]);

    const profile = profileResult.data;
    const videoRecord = videoResult.data;

    // Determine if download file exists:
    // 1. Check if orchestrator stored a storage_path in the videos table
    // 2. If storage_path exists, verify the file is actually in Supabase Storage
    // 3. Fall back to progress-based inference
    let hasDownload = false;
    let storageFileExists = false;
    const storagePath = videoRecord?.storage_path;

    if (storagePath) {
      // Verify the file actually exists in the 'videos' storage bucket
      try {
        // storage_path could be like "youtube_id/audio.m4a" - extract folder and filename
        const lastSlash = storagePath.lastIndexOf("/");
        const folder = lastSlash > 0 ? storagePath.substring(0, lastSlash) : "";
        const filename = lastSlash > 0 ? storagePath.substring(lastSlash + 1) : storagePath;

        const { data: files } = await supabase.storage
          .from("videos")
          .list(folder, { limit: 10, search: filename });

        storageFileExists = !!(files && files.length > 0);
        hasDownload = storageFileExists;
      } catch {
        // Storage check failed - fall back to storage_path existence
        hasDownload = true;
      }
    }

    // Fall back to progress-based inference if no storage_path
    if (!storagePath) {
      hasDownload =
        job.status === "completed" ||
        job.status === "transcribing" ||
        (job.progress != null && job.progress > 35);
    }

    // Check if resolved (another job for same video succeeded or transcript exists)
    let resolved = false;
    if (job.status === "failed") {
      if (videoRecord?.transcript) {
        resolved = true;
      } else {
        const { data: completedJob } = await supabase
          .from("filter_jobs")
          .select("id")
          .eq("youtube_id", job.youtube_id)
          .eq("status", "completed")
          .limit(1)
          .single();
        if (completedJob) resolved = true;
      }
    }

    // Determine stale status
    const now = Date.now();
    const isStale =
      ["processing", "pending", "downloading", "transcribing"].includes(job.status) &&
      now - new Date(job.created_at).getTime() > STALE_THRESHOLD_MS;

    // Try to get live status from orchestrator (non-blocking, with timeout)
    let orchestratorStatus = null;
    try {
      const orchResponse = await fetch(`${ORCHESTRATOR_URL}/api/jobs/${jobId}`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });
      if (orchResponse.ok) {
        orchestratorStatus = await orchResponse.json();
      }
    } catch {
      // Orchestrator unreachable - that's ok
    }

    // Get related jobs for the same video (other attempts)
    const { data: relatedJobs } = await supabase
      .from("filter_jobs")
      .select("job_id, status, progress, error, created_at, completed_at")
      .eq("youtube_id", job.youtube_id)
      .neq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      job: {
        ...job,
        user_email: profile?.email || profile?.display_name || "Unknown",
        user_display_name: profile?.display_name || null,
        resolved,
        stale: isStale,
        has_download: hasDownload,
      },
      video: videoRecord
        ? {
            title: videoRecord.title,
            channel_name: videoRecord.channel_name,
            duration_seconds: videoRecord.duration_seconds,
            thumbnail_url: videoRecord.thumbnail_url,
            has_transcript: !!videoRecord.transcript,
            has_storage_file: storageFileExists,
            storage_path: storagePath || null,
            cached_at: videoRecord.cached_at,
          }
        : null,
      orchestrator_status: orchestratorStatus,
      related_jobs: relatedJobs || [],
    });
  } catch (error) {
    console.error("Failed to fetch filter job detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch job details" },
      { status: 500 }
    );
  }
}
