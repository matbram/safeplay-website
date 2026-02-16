import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get the current admin's access token for orchestrator calls
 */
async function getAdminAccessToken(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

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

    // Try to get live status from orchestrator (with auth)
    // Sync status back to local DB if it changed
    let orchestratorStatus = null;
    let orchestratorError: string | null = null;
    let liveStatus = job.status;
    let liveProgress = job.progress;
    let liveError = job.error;

    const accessToken = await getAdminAccessToken();
    const orchHeaders: Record<string, string> = {};
    if (accessToken) {
      orchHeaders["Authorization"] = `Bearer ${accessToken}`;
    }

    try {
      const orchResponse = await fetch(`${ORCHESTRATOR_URL}/api/jobs/${jobId}`, {
        method: "GET",
        headers: orchHeaders,
        signal: AbortSignal.timeout(5000),
      });

      if (orchResponse.ok) {
        orchestratorStatus = await orchResponse.json();

        // Map orchestrator progress to display progress (same as filter status route)
        if (orchestratorStatus.status) {
          liveStatus = orchestratorStatus.status;
          switch (orchestratorStatus.status) {
            case "pending":
              liveProgress = 5;
              break;
            case "downloading":
              liveProgress = 5 + Math.round((orchestratorStatus.progress || 0) * 0.30);
              break;
            case "transcribing":
              liveProgress = 35 + Math.round((orchestratorStatus.progress || 0) * 0.60);
              break;
            case "completed":
              liveProgress = 100;
              break;
            case "failed":
              liveError = orchestratorStatus.error || orchestratorStatus.error_message || job.error;
              break;
          }

          // Update local DB if status changed
          if (liveStatus !== job.status || liveProgress !== job.progress) {
            const updateData: Record<string, unknown> = {
              status: liveStatus,
              progress: liveProgress,
            };
            if (liveStatus === "failed" && (orchestratorStatus.error || orchestratorStatus.error_message)) {
              updateData.error = orchestratorStatus.error || orchestratorStatus.error_message;
            }
            if (liveStatus === "completed") {
              updateData.completed_at = new Date().toISOString();
            }
            await supabase
              .from("filter_jobs")
              .update(updateData)
              .eq("job_id", jobId);
          }
        }
      } else {
        const errBody = await orchResponse.json().catch(() => ({}));
        orchestratorError = `HTTP ${orchResponse.status}: ${errBody.error || orchResponse.statusText}`;
      }
    } catch (err) {
      orchestratorError = `Unreachable: ${err instanceof Error ? err.message : String(err)}`;
    }

    // Re-check download status if orchestrator reports it
    if (orchestratorStatus?.video?.storage_path || orchestratorStatus?.storage_path) {
      hasDownload = true;
    }
    if (liveStatus === "transcribing" || liveStatus === "completed" || liveProgress > 35) {
      hasDownload = true;
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
        status: liveStatus,
        progress: liveProgress,
        error: liveError,
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
      orchestrator_error: orchestratorError,
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
