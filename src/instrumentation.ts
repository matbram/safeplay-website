export async function register() {
  // Only run the maintenance scheduler on the server (not during build or in edge runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const MAINTENANCE_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

    console.log("[JOB-MAINTENANCE] Scheduling automatic job maintenance every 10 minutes");

    setInterval(async () => {
      try {
        const { runJobMaintenance } = await import("@/lib/job-maintenance");
        await runJobMaintenance();
      } catch (error) {
        console.error("[JOB-MAINTENANCE] Scheduled run failed:", error);
      }
    }, MAINTENANCE_INTERVAL_MS);
  }
}
