import express from "express";
import {
  acquireSchedulerLock,
  releaseSchedulerLock,
  createAlertRun,
  finishAlertRun,
  runWatchlists,
} from "../db";
import { SCHEDULER_ENABLED, SCHEDULER_SECRET } from "../config/scheduler";

export async function registerSchedulerRoutes(app: express.Express) {
  app.post("/api/scheduler/run-watchlists", async (req, res) => {
    try {
      // Check if scheduler is enabled
      if (!SCHEDULER_ENABLED) {
        return res.status(200).json({
          success: true,
          status: "skipped",
          reason: "Scheduler is disabled",
        });
      }

      // Verify secret
      const secret = req.headers["x-scheduler-secret"];
      if (secret !== SCHEDULER_SECRET) {
        return res.status(401).json({
          success: false,
          status: "failed",
          reason: "Invalid scheduler secret",
        });
      }

      // Try to acquire lock
      const lockAcquired = await acquireSchedulerLock("watchlists_cron", 10);
      if (!lockAcquired) {
        return res.status(200).json({
          success: true,
          status: "skipped",
          reason: "Another run is in progress (lock exists)",
        });
      }

      try {
        // Create alert run record
        const runRecord = await createAlertRun("cron");
        const runId = typeof runRecord === "object" && runRecord && "id" in runRecord 
          ? runRecord.id 
          : null;

        if (!runId) {
          throw new Error("Failed to create alert run record");
        }

        // Run watchlists
        const runResult = await runWatchlists(200);

        // Finish run record
        await finishAlertRun(runId, "success", runResult.createdCount, runResult.error || undefined);

        return res.status(200).json({
          success: true,
          status: "success",
          createdCount: runResult.createdCount,
          totalMatches: runResult.totalMatches,
        });
      } finally {
        // Release lock
        await releaseSchedulerLock("watchlists_cron");
      }
    } catch (error) {
      console.error("[Scheduler] Error running watchlists:", error);

      try {
        // Try to record failure
        const runRecord = await createAlertRun("cron");
        const runId = typeof runRecord === "object" && runRecord && "id" in runRecord 
          ? runRecord.id 
          : null;

        if (runId) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          await finishAlertRun(runId, "failed", 0, errorMsg);
        }
      } catch (recordError) {
        console.error("[Scheduler] Failed to record error:", recordError);
      }

      return res.status(500).json({
        success: false,
        status: "failed",
        reason: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
