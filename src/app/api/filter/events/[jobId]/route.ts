import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { authenticateRequest } from "@/lib/auth-helper";

export const dynamic = "force-dynamic";

const ORCHESTRATOR_URL =
  process.env.ORCHESTRATION_API_URL ||
  "https://safeplay-orchestrator-80308222868.us-central1.run.app";

// Content script origins that may open the SSE stream.
const ALLOWED_ORIGINS = new Set([
  "https://www.youtube.com",
  "https://youtube.com",
]);

function log(context: string, message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` | ${JSON.stringify(data)}` : "";
  console.log(`[${timestamp}] [FILTER-EVENTS] [${context}] ${message}${dataStr}`);
}

function corsHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = { Vary: "Origin" };
  const origin = request.headers.get("origin");
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

function jsonError(
  request: NextRequest,
  status: number,
  body: Record<string, unknown>
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request),
    },
  });
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Accept, Cache-Control",
      "Access-Control-Max-Age": "600",
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const requestId = Math.random().toString(36).substring(7);
  const { jobId } = await params;
  log(requestId, "=== SSE Events Proxy ===", { jobId });

  const auth = await authenticateRequest(request);
  if (!auth.user) {
    log(requestId, "Auth failed", { error: auth.error });
    return jsonError(request, 401, { error: auth.error || "Unauthorized" });
  }

  // Verify the job belongs to the requesting user before opening a stream.
  const supabase = createServiceClient();
  const { data: jobRecord, error: jobError } = await supabase
    .from("filter_jobs")
    .select("job_id")
    .eq("job_id", jobId)
    .eq("user_id", auth.user.id)
    .single();

  if (!jobRecord) {
    log(requestId, "Job not found", { error: jobError?.message });
    return jsonError(request, 404, { error: "Job not found" });
  }

  const upstreamHeaders: Record<string, string> = {
    Accept: "text/event-stream",
  };
  if (auth.accessToken) {
    upstreamHeaders["Authorization"] = `Bearer ${auth.accessToken}`;
  }

  const upstreamUrl = `${ORCHESTRATOR_URL}/api/jobs/${jobId}/stream`;
  log(requestId, "Connecting to orchestrator SSE", { url: upstreamUrl });

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers: upstreamHeaders,
      // Propagate client disconnect so we close the upstream connection too.
      signal: request.signal,
      cache: "no-store",
    });
  } catch (error) {
    log(requestId, "Upstream connection failed", { error: String(error) });
    return jsonError(request, 502, {
      error: "Failed to connect to orchestrator",
      error_code: "ORCHESTRATOR_UNREACHABLE",
    });
  }

  if (!upstream.ok || !upstream.body) {
    log(requestId, "Upstream returned non-OK", { status: upstream.status });
    const status = upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502;
    return jsonError(request, status, {
      error: "Orchestrator stream unavailable",
      upstream_status: upstream.status,
    });
  }

  log(requestId, "Streaming upstream body through");

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
      ...corsHeaders(request),
    },
  });
}
