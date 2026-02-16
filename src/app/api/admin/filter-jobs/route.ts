import { createServiceClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/admin-auth";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

/**
 * GET /api/admin/filter-jobs
 * List all filter jobs with filtering, search, pagination
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

    // Get stats
    const [totalResult, failedResult, processingResult, completedResult] =
      await Promise.all([
        supabase
          .from("filter_jobs")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("filter_jobs")
          .select("id", { count: "exact", head: true })
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

    const enrichedJobs = (jobs || []).map((job) => ({
      ...job,
      user_email: userMap[job.user_id] || "Unknown",
    }));

    return NextResponse.json({
      jobs: enrichedJobs,
      total: count || 0,
      stats: {
        total: totalResult.count || 0,
        failed: failedResult.count || 0,
        processing: processingResult.count || 0,
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
 * Admin actions: retry, delete, retranscribe
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

        // Call the orchestrator to start fresh
        const orchResponse = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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

        // Call orchestrator - it will see the file exists and skip download
        const orchResponse = await fetch(`${ORCHESTRATOR_URL}/api/filter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
