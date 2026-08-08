import { z } from "zod";
import { TRPCError } from "@trpc/server";

// ⚠️ عدّل مسار publicProcedure ليطابق مشروعنا (خذ نفس مسار import في routers.ts)
import { publicProcedure } from "../_core/trpc";

// ✅ موجود في server/config/scheduler.ts
import { schedulerConfig } from "../config/scheduler";
const SCHEDULER_ENABLED = schedulerConfig.enabled;
const SCHEDULER_SECRET = schedulerConfig.secret;

// ✅ موجودة مسبقًا في server/db.ts (لا تعدل db.ts)
import {
  acquireSchedulerLock,
  releaseSchedulerLock,
  createAlertRun,
  finishAlertRun,
  runWatchlists,
} from "../db";

export const runScheduled = publicProcedure
  .input(
    z.object({
      trigger: z.enum(["cron", "manual"]).optional().default("cron"),
      limitItems: z.number().int().min(10).max(1000).optional().default(200),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const headers =
      (ctx as any)?.req?.headers ??
      (ctx as any)?.headers ??
      (ctx as any)?.request?.headers ??
      {};
    const secret =
      (headers["x-scheduler-secret"] ?? headers["X-Scheduler-Secret"]) as
        | string
        | undefined;

    if (!SCHEDULER_ENABLED) {
      return { success: true, status: "skipped", reason: "disabled" };
    }
    if (!secret || secret !== SCHEDULER_SECRET) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid scheduler secret" });
    }

    const lockKey = "watchlists_cron";
    const gotLock = await acquireSchedulerLock(lockKey, 10);
    if (!gotLock) {
      return { success: true, status: "skipped", reason: "locked" };
    }

    const runId = await createAlertRun(input.trigger);

    try {
      const result: any = await runWatchlists(input.limitItems);
      const createdCount = Number(result?.createdCount ?? result?.created ?? 0);

      await finishAlertRun(runId?.id ?? 0, "success", createdCount, undefined);
      await releaseSchedulerLock(lockKey);

      return { success: true, status: "success", createdCount };
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : "Unknown error";
      await finishAlertRun(runId?.id ?? 0, "failed", 0, msg ?? undefined);
      await releaseSchedulerLock(lockKey);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
    }
  });
