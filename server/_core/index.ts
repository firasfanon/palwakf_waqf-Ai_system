import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { ENV } from "./env";
import { registerSchedulerRoutes } from "../http/scheduler_routes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { buildPublicReadinessHealth } from "../health/readiness";
import { resolveDatabaseConfig } from "../config/databaseConfig";
import { checkSupabaseHealth } from "../health/supabaseHealth";
import { buildRemoteStagingEvidenceSnapshot } from "../stagingEvidence";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // Local/dev auth and optional OAuth callback routes
  registerOAuthRoutes(app);
  // Scheduler endpoint for watchlists cron
  registerSchedulerRoutes(app);
  // Mega Batch 28: raw readiness endpoint for staging probes and load balancer checks.
  app.get("/api/health/readiness", async (_req, res) => {
    try {
      const readiness = await buildPublicReadinessHealth();
      res.status(readiness.ready ? 200 : 503).json(readiness);
    } catch (error: any) {
      res.status(503).json({
        server: true,
        database: false,
        llm: false,
        ready: false,
        checkedAt: new Date().toISOString(),
        productionBlockers: ["readiness_check_failed"],
        error: error?.message || "readiness_check_failed",
      });
    }
  });

  // Mega Batch 28B: safe Supabase/PostgreSQL health endpoint. No secret values are returned.
  app.get("/api/health/supabase", async (_req, res) => {
    const health = await checkSupabaseHealth();
    res.status(health.available ? 200 : 503).json(health);
  });

  // Mega Batch 29A: secret-free remote staging evidence snapshot. It is a UAT precondition only.
  app.get("/api/health/staging-evidence", async (_req, res) => {
    try {
      const evidence = await buildRemoteStagingEvidenceSnapshot();
      res.status(evidence.gate.readyForBrowserUat ? 200 : 503).json(evidence);
    } catch (error: any) {
      res.status(503).json({
        contract: "palwakf_mb29a_remote_staging_evidence_v1",
        generatedAt: new Date().toISOString(),
        gate: {
          readyForBrowserUat: false,
          decision: "REMOTE_STAGING_RUNTIME_EVIDENCE_ERROR",
          blockers: ["staging_evidence_snapshot_failed"],
          productionApproved: false,
          productionDecision: "PRODUCTION_NOT_APPROVED_PENDING_REMOTE_BROWSER_RBAC_RLS_EVIDENCE",
        },
      });
    }
  });

  // Mega Batch 28A/28B: safe database configuration diagnostics. No secret values are returned.
  app.get("/api/health/database-config", (_req, res) => {
    const config = resolveDatabaseConfig();
    res.status(config.configured && config.runtimeCompatible ? 200 : 503).json({
      configured: config.configured,
      source: config.source,
      provider: config.provider,
      dialect: config.dialect,
      runtimeCompatible: config.runtimeCompatible,
      redactedUrl: config.redactedUrl,
      reason: config.reason || null,
      acceptedKeys: [
        "PLATFORM_SUPABASE_URL + PLATFORM_SUPABASE_SERVICE_ROLE_KEY",
        "PLATFORM_SUPABASE_URL + PLATFORM_SUPABASE_ANON_KEY",
        "PWF_SUPABASE_URL + PWF_SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY",
        "VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY",
        "DATABASE_URL",
        "MYSQL_DATABASE_URL",
        "DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD",
        "MYSQL_HOST + MYSQL_PORT + MYSQL_DATABASE + MYSQL_USER + MYSQL_PASSWORD",
      ],
    });
  });
  
  // Temporary endpoint for bulk importing references
  app.post("/api/bulk-import-references", async (req, res) => {
    try {
      const { documents } = req.body;
      
      if (!documents || !Array.isArray(documents)) {
        return res.status(400).json({ error: "Invalid input: documents array required" });
      }
      
      const { runtimeCreateKnowledgeDocument } = await import("../runtimeRepository");
      const results: Array<{ success: boolean; title: string; error?: string }> = [];
      let successCount = 0;
      let errorCount = 0;
      
      for (const doc of documents) {
        try {
          await runtimeCreateKnowledgeDocument({
            ...doc,
            createdBy: null,
          });
          successCount++;
          results.push({ success: true, title: doc.title });
        } catch (error: any) {
          errorCount++;
          results.push({ success: false, title: doc.title, error: error.message });
        }
      }
      
      res.json({
        success: true,
        total: documents.length,
        successCount,
        errorCount,
        results,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    if (ENV.publishSchedulerEnabled) {
      import("../cron/publish-scheduler").then(({ startPublishScheduler }) => {
        startPublishScheduler();
      }).catch(console.error);
    } else {
      console.log("[Publish Scheduler] Disabled for local bootstrap");
    }
  });
}

startServer().catch(console.error);
