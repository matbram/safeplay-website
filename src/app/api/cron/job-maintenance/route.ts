import { NextResponse } from "next/server";
import { runJobMaintenance } from "@/lib/job-maintenance";

/**
 * GET /api/cron/job-maintenance
 *
 * Manual trigger for job maintenance (e.g. from admin).
 * The automatic schedule runs via instrumentation.ts on server start.
 */
export async function GET() {
  try {
    const results = await runJobMaintenance();
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Job maintenance error:", error);
    return NextResponse.json(
      { error: "Maintenance failed", details: errorMsg },
      { status: 500 }
    );
  }
}
