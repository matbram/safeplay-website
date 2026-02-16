import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

// Jobs processing/pending for longer than this are considered stale
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
 * GET /api/admin/filter-jobs
 * List all filter jobs with filtering, search, pagination.
 * Cross-references failed jobs against the videos table to detect
 * which failures have since been resolved (video now has a transcript).
 */
export async function GET(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("filter_jobs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.ilike("youtube_id", `%${search}%`);
    }

    const { data: jobs, count, error } = await query;

    if (error) throw error;

    // Get user emails for each job
    const userIds = [...new Set((jobs || []).map((j) => j.user_id))];
    let userMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);

      if (profiles) {
        userMap = Object.fromEntries(
          profiles.map((p) => [p.id, p.email || p.display_name || "Unknown"])
        );
      }
    }

    // Check video records for all youtube_ids in this page (for resolved + download + transcript detection)
    const pageYoutubeIds = [...new Set((jobs || []).map((j) => j.youtube_id))];
    let resolvedIds = new Set<string>();
    let downloadedIds = new Set<string>();
    let transcriptIds = new Set<string>();

    if (pageYoutubeIds.length > 0) {
      const { data: videoRecords } = await supabase
        .from("videos")
        .select("youtube_id, transcript, storage_path")
        .in("youtube_id", pageYoutubeIds);

      if (videoRecords) {
        videoRecords.forEach((v) => {
          if (v.transcript) {
            resolvedIds.add(v.youtube_id);
            transcriptIds.add(v.youtube_id);
          }
          if (v.storage_path) downloadedIds.add(v.youtube_id);
        });
      }
    }

    // Also check failed youtube_ids for completed jobs (another resolution path)
    const failedYoutubeIds = [
      ...new Set(
        (jobs || [])
          .filter((j) => j.status === "failed")
          .map((j) => j.youtube_id)
      ),
    ];

    // Also check if a later job for the same youtube_id succeeded
    if (failedYoutubeIds.length > 0) {
      const { data: completedJobs } = await supabase
        .from("filter_jobs")
        .select("youtube_id")
        .in("youtube_id", failedYoutubeIds)
        .eq("status", "completed");

      if (completedJobs) {
        completedJobs.forEach((j) => resolvedIds.add(j.youtube_id));
      }
    }

    // Get stats — count unresolved failures separately
    const [totalResult, allFailedResult, processingResult, completedResult] =
      await Promise.all([
        supabase
          .from("filter_jobs")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("filter_jobs")
          .select("id, youtube_id")
          .eq("status", "failed"),
        supabase
          .from("filter_jobs")
          .select("id", { count: "exact", head: true })
          .in("status", ["processing", "pending"]),
        supabase
          .from("filter_jobs")
          .select("id", { count: "exact", head: true })
          .eq("status", "completed"),
      ]);

    // For unresolved count, check all failed youtube_ids against videos + completed jobs
    const allFailedJobs = allFailedResult.data || [];
    const allFailedYoutubeIds = [
      ...new Set(allFailedJobs.map((j) => j.youtube_id)),
    ];

    let allResolvedIds = new Set<string>();
    if (allFailedYoutubeIds.length > 0) {
      const [cachedResult, completedJobsResult] = await Promise.all([
        supabase
          .from("videos")
          .select("youtube_id")
          .in("youtube_id", allFailedYoutubeIds)
          .not("transcript", "is", null),
        supabase
          .from("filter_jobs")
          .select("youtube_id")
          .in("youtube_id", allFailedYoutubeIds)
          .eq("status", "completed"),
      ]);

      cachedResult.data?.forEach((v) => allResolvedIds.add(v.youtube_id));
      completedJobsResult.data?.forEach((j) =>
        allResolvedIds.add(j.youtube_id)
      );
    }

    const unresolvedCount = allFailedJobs.filter(
      (j) => !allResolvedIds.has(j.youtube_id)
    ).length;
    const resolvedCount = allFailedJobs.length - unresolvedCount;

    const now = Date.now();
    const enrichedJobs = (jobs || []).map((job) => {
      const isStale =
        ["processing", "pending", "downloading", "transcribing"].includes(
          job.status
        ) &&
        now - new Date(job.created_at).getTime() > STALE_THRESHOLD_MS;

      // Check if a downloaded file exists in Supabase Storage (storage_path set by orchestrator)
      // Fall back to progress-based inference if no storage record exists
      const hasDownload =
        downloadedIds.has(job.youtube_id) ||
        job.status === "transcribing" ||
        (job.status === "completed") ||
        (job.progress != null && job.progress > 35);

      return {
        ...job,
        user_email: userMap[job.user_id] || "Unknown",
        resolved: job.status === "failed" && resolvedIds.has(job.youtube_id),
        stale: isStale,
        has_download: hasDownload,
        has_transcript: transcriptIds.has(job.youtube_id),
      };
    });

    const staleCount = enrichedJobs.filter((j) => j.stale).length;

    return NextResponse.json({
      jobs: enrichedJobs,
      total: count || 0,
      stats: {
        total: totalResult.count || 0,
        failed: allFailedJobs.length,
        failed_unresolved: unresolvedCount,
        failed_resolved: resolvedCount,
        processing: processingResult.count || 0,
        stale: staleCount,
        completed: completedResult.count || 0,
      },
    });
  } catch (error) {
    console.error("Failed to fetch filter jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch filter jobs" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/filter-jobs
 * Admin actions: retry, delete, retranscribe, cleanup_resolved
 */
export async function POST(request: NextRequest) {
  try {
    const { admin, response } = await requireAdmin();
    if (!admin) return response;

    const supabase = createServiceClient();
    const body = await request.json();
    const { action, job_id, youtube_id } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "mark_stale_failed": {
        // Find all processing/pending jobs older than the threshold
        const staleThreshold = new Date(
          Date.now() - STALE_THRESHOLD_MS
        ).toISOString();

        const { data: staleJobs } = await supabase
          .from("filter_jobs")
          .select("id, job_id, youtube_id")
          .in("status", ["processing", "pending", "downloading", "transcribing"])
          .lt("created_at", staleThreshold);

        if (!staleJobs || staleJobs.length === 0) {
          return NextResponse.json({ success: true, marked: 0 });
        }

        await supabase
          .from("filter_jobs")
          .update({
            status: "failed",
            error: "Marked as failed by admin (stale/stuck job)",
          })
          .in(
            "id",
            staleJobs.map((j) => j.id)
          );

        await logAdminAction(
          admin.id,
          "mark_stale_failed",
          "filter_jobs",
          "batch",
          {
            marked: staleJobs.length,
            job_ids: staleJobs.map((j) => j.job_id),
          },
          request
        );

        return NextResponse.json({
          success: true,
          marked: staleJobs.length,
        });
      }

      case "cleanup_resolved": {
        // Find all failed jobs
        const { data: failedJobs } = await supabase
          .from("filter_jobs")
          .select("id, job_id, youtube_id")
          .eq("status", "failed");

        if (!failedJobs || failedJobs.length === 0) {
          return NextResponse.json({ success: true, cleaned: 0 });
        }

        const failedYoutubeIds = [
          ...new Set(failedJobs.map((j) => j.youtube_id)),
        ];

        // Find which youtube_ids now have cached transcripts or completed jobs
        const [cachedResult, completedResult] = await Promise.all([
          supabase
            .from("videos")
            .select("youtube_id")
            .in("youtube_id", failedYoutubeIds)
            .not("transcript", "is", null),
          supabase
            .from("filter_jobs")
            .select("youtube_id")
            .in("youtube_id", failedYoutubeIds)
            .eq("status", "completed"),
        ]);

        const resolvedIds = new Set<string>();
        cachedResult.data?.forEach((v) => resolvedIds.add(v.youtube_id));
        completedResult.data?.forEach((j) => resolvedIds.add(j.youtube_id));

        // Delete the resolved failed job records
        const toDelete = failedJobs.filter((j) =>
          resolvedIds.has(j.youtube_id)
        );

        if (toDelete.length > 0) {
          await supabase
            .from("filter_jobs")
            .delete()
            .in(
              "id",
              toDelete.map((j) => j.id)
            );
        }

        await logAdminAction(
          admin.id,
          "cleanup_resolved_jobs",
          "filter_jobs",
          "batch",
          { cleaned: toDelete.length, total_failed: failedJobs.length },
          request
        );

        return NextResponse.json({
          success: true,
          cleaned: toDelete.length,
        });
      }

      case "delete": {
        if (!job_id) {
          return NextResponse.json(
            { error: "job_id is required" },
            { status: 400 }
          );
        }

        // Get the job first
        const { data: job } = await supabase
          .from("filter_jobs")
          .select("*")
          .eq("job_id", job_id)
          .single();

        if (!job) {
          return NextResponse.json(
            { error: "Job not found" },
            { status: 404 }
          );
        }

        // Delete associated video cache if exists
        if (job.youtube_id) {
          await supabase
            .from("videos")
            .delete()
            .eq("youtube_id", job.youtube_id);
        }

        // Delete the filter job
        await supabase.from("filter_jobs").delete().eq("job_id", job_id);

        await logAdminAction(
          admin.id,
          "delete_filter_job",
          "filter_jobs",
          job_id,
          { youtube_id: job.youtube_id, status: job.status },
          request
        );

        return NextResponse.json({ success: true });
      }

      case "retry": {
        if (!youtube_id && !job_id) {
          return NextResponse.json(
            { error: "youtube_id or job_id is required" },
            { status: 400 }
          );
        }

        let targetYoutubeId = youtube_id;

        // Get youtube_id from job if not provided directly
        if (!targetYoutubeId && job_id) {
          const { data: job } = await supabase
            .from("filter_jobs")
            .select("youtube_id")
            .eq("job_id", job_id)
            .single();

          if (!job) {
            return NextResponse.json(
              { error: "Job not found" },
              { status: 404 }
            );
          }
          targetYoutubeId = job.youtube_id;
        }

        // Delete existing cached video so orchestrator will reprocess
        await supabase
          .from("videos")
          .delete()
          .eq("youtube_id", targetYoutubeId);

        // Reset the job status if it exists
        if (job_id) {
          await supabase
            .from("filter_jobs")
            .update({
              status: "pending",
              progress: 0,
              error: null,
              completed_at: null,
            })
            .eq("job_id", job_id);
        }

        // Get admin's access token for orchestrator auth
        const accessToken = await getAdminAccessToken();
        const orchHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          orchHeaders["Authorization"] = `Bearer ${accessToken}`;
        }

        // Call the orchestrator to start fresh
        const orchResponse = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
          method: "POST",
          headers: orchHeaders,
          body: JSON.stringify({ youtube_id: targetYoutubeId }),
        });

        const orchData = await orchResponse.json();

        if (!orchResponse.ok) {
          return NextResponse.json(
            {
              error: orchData.error || "Orchestrator retry failed",
              error_code: orchData.error_code,
            },
            { status: orchResponse.status }
          );
        }

        // Update or create the job record
        if (job_id) {
          await supabase
            .from("filter_jobs")
            .update({
              status: orchData.status || "processing",
              job_id: orchData.job_id || job_id,
            })
            .eq("job_id", job_id);
        }

        await logAdminAction(
          admin.id,
          "retry_filter_job",
          "filter_jobs",
          job_id || targetYoutubeId,
          {
            youtube_id: targetYoutubeId,
            new_job_id: orchData.job_id,
            status: orchData.status,
          },
          request
        );

        return NextResponse.json({
          success: true,
          job_id: orchData.job_id,
          status: orchData.status,
        });
      }

      case "retranscribe": {
        if (!youtube_id && !job_id) {
          return NextResponse.json(
            { error: "youtube_id or job_id is required" },
            { status: 400 }
          );
        }

        let targetYoutubeId = youtube_id;

        if (!targetYoutubeId && job_id) {
          const { data: job } = await supabase
            .from("filter_jobs")
            .select("youtube_id")
            .eq("job_id", job_id)
            .single();

          if (!job) {
            return NextResponse.json(
              { error: "Job not found" },
              { status: 404 }
            );
          }
          targetYoutubeId = job.youtube_id;
        }

        // Delete cached transcript only (keep video record for metadata)
        await supabase
          .from("videos")
          .update({ transcript: null })
          .eq("youtube_id", targetYoutubeId);

        // Reset job
        if (job_id) {
          await supabase
            .from("filter_jobs")
            .update({
              status: "pending",
              progress: 0,
              error: null,
              completed_at: null,
            })
            .eq("job_id", job_id);
        }

        // Get admin's access token for orchestrator auth
        const retranscribeToken = await getAdminAccessToken();
        const retranscribeHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (retranscribeToken) {
          retranscribeHeaders["Authorization"] = `Bearer ${retranscribeToken}`;
        }

        // Call orchestrator - it will see the file exists and skip download
        const orchResponse = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
          method: "POST",
          headers: retranscribeHeaders,
          body: JSON.stringify({ youtube_id: targetYoutubeId }),
        });

        const orchData = await orchResponse.json();

        if (!orchResponse.ok) {
          return NextResponse.json(
            {
              error: orchData.error || "Retranscribe failed",
              error_code: orchData.error_code,
            },
            { status: orchResponse.status }
          );
        }

        if (job_id) {
          await supabase
            .from("filter_jobs")
            .update({
              status: orchData.status || "processing",
              job_id: orchData.job_id || job_id,
            })
            .eq("job_id", job_id);
        }

        await logAdminAction(
          admin.id,
          "retranscribe_filter_job",
          "filter_jobs",
          job_id || targetYoutubeId,
          {
            youtube_id: targetYoutubeId,
            new_job_id: orchData.job_id,
          },
          request
        );

        return NextResponse.json({
          success: true,
          job_id: orchData.job_id,
          status: orchData.status,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Filter jobs admin action error:", error);
    return NextResponse.json(
      { error: "Action failed" },
      { status: 500 }
    );
  }
}
