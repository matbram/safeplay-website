import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";
import { restartJob } from "@/lib/job-restart";

// A job is restartable if it's stuck in an in-progress state or failed outright.
const RESTARTABLE_STATUSES = new Set([
  "pending",
  "processing",
  "downloading",
  "transcribing",
  "failed",
]);

function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
  console.log(`[${timestamp}] [FILTER-RETRY] [${context}] ${message}${dataStr}`);
}

/**
 * POST /api/filter/retry
 *
 * Restart a stuck or failed job as a fresh orchestrator job. Reuses the same
 * filter_jobs row and keeps the client-facing job_id stable (swaps only the
 * internal orchestrator_job_id).
 *
 * Body: { action: "restart", job_id }
 *
 * Auth: user session cookie or bearer token. Ownership is strictly verified
 * against filter_jobs.user_id.
 *
 * Note: Re-transcribing an already-completed video burns ElevenLabs minutes on
 * our account, so it's an admin-only action — see /api/admin/filter-jobs.
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(7);

  try {
    log(requestId, "=== Filter Retry Request ===");

    const auth = await authenticateRequest(request);
    if (!auth.user) {
      return NextResponse.json(
        { error: auth.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const { action, job_id } = body as {
      action?: string;
      job_id?: string;
    };

    if (action !== "restart") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'restart'." },
        { status: 400 }
      );
    }

    const orchHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (auth.accessToken) {
      orchHeaders["Authorization"] = `Bearer ${auth.accessToken}`;
    }

    return await handleRestart(requestId, supabase, auth.user.id, job_id, orchHeaders);
  } catch (error) {
    log(requestId, "EXCEPTION", { error: String(error) });
    console.error("Filter retry error:", error);
    return NextResponse.json(
      { error: "Failed to retry job" },
      { status: 500 }
    );
  }
}

/**
 * Restart a stuck / failed job. Reuses the existing filter_jobs row and keeps
 * `job_id` stable (so the Chrome extension's polling URL keeps working). Only
 * the internal `orchestrator_job_id` is swapped to the new orchestrator-side id.
 */
async function handleRestart(
  requestId: string,
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  jobIdParam: string | undefined,
  orchHeaders: Record<string, string>
) {
  if (!jobIdParam) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  const { data: job, error: jobError } = await supabase
    .from("filter_jobs")
    .select("*")
    .eq("job_id", jobIdParam)
    .eq("user_id", userId)
    .single();

  if (jobError || !job) {
    log(requestId, "Job not found or not owned", { jobIdParam, error: jobError?.message });
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!RESTARTABLE_STATUSES.has(job.status)) {
    log(requestId, "Job is not restartable", { status: job.status });
    return NextResponse.json(
      {
        error:
          job.status === "completed"
            ? "This job already completed. Use Re-transcribe instead."
            : `Cannot restart a job in '${job.status}' status.`,
      },
      { status: 400 }
    );
  }

  log(requestId, "Calling restartJob helper", { youtube_id: job.youtube_id });

  const result = await restartJob(
    supabase,
    {
      id: job.id,
      job_id: job.job_id,
      orchestrator_job_id: job.orchestrator_job_id,
      youtube_id: job.youtube_id,
      auto_retry_count: job.auto_retry_count,
    },
    {
      autoRetry: false,
      reason: "user-initiated-restart",
      orchHeaders,
    }
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, error_code: result.error_code },
      { status: result.http_status || 502 }
    );
  }

  return NextResponse.json({
    status: result.status,
    job_id: job.job_id,
    youtube_id: job.youtube_id,
    message: "Job restarted",
  });
}
