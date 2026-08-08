import { resolveDatabaseConfig } from "./config/databaseConfig";
import { buildPublicReadinessHealth } from "./health/readiness";
import { checkSupabaseHealth } from "./health/supabaseHealth";

export type DeploymentEnvironment = "staging" | "production" | "development" | "unknown";

const SAFE_MARKER = /^[A-Za-z0-9._-]{1,96}$/;

function resolveDeploymentEnvironment(): DeploymentEnvironment {
  const raw = String(
    process.env.PALWAKF_DEPLOYMENT_ENV
      || process.env.DEPLOYMENT_ENV
      || process.env.NODE_ENV
      || "unknown",
  ).trim().toLowerCase();

  if (["staging", "stage", "preproduction", "pre-prod"].includes(raw)) return "staging";
  if (["production", "prod"].includes(raw)) return "production";
  if (["development", "dev", "test", "local"].includes(raw)) return "development";
  return "unknown";
}

function safeMarker(value: string | undefined, fallback: string): string {
  const normalized = String(value || "").trim();
  return SAFE_MARKER.test(normalized) ? normalized : fallback;
}

/**
 * MB29A: immutable, secret-free snapshot for a remote staging evidence capture.
 * It intentionally cannot approve production; browser/RBAC/RLS evidence remains
 * a separate human gate.
 */
export async function buildRemoteStagingEvidenceSnapshot() {
  const [readiness, supabase] = await Promise.all([
    buildPublicReadinessHealth(),
    checkSupabaseHealth(),
  ]);
  const databaseConfig = resolveDatabaseConfig();
  const environment = resolveDeploymentEnvironment();
  const deploymentRef = safeMarker(process.env.PALWAKF_DEPLOYMENT_REF, "missing_deployment_ref");
  const baselineId = safeMarker(process.env.PALWAKF_BASELINE_ID, "missing_baseline_id");

  const blockers = [...readiness.productionBlockers];
  if (environment !== "staging") blockers.push("deployment_environment_not_staging");
  if (deploymentRef === "missing_deployment_ref") blockers.push("deployment_ref_missing");
  if (baselineId === "missing_baseline_id") blockers.push("baseline_id_missing");
  if (!databaseConfig.configured || !databaseConfig.runtimeCompatible) blockers.push("database_config_not_runtime_compatible");
  if (!supabase.available) blockers.push("supabase_unavailable");

  const uniqueBlockers = [...new Set(blockers)];
  const readyForBrowserUat = uniqueBlockers.length === 0;

  return {
    contract: "palwakf_mb29a_remote_staging_evidence_v1",
    generatedAt: new Date().toISOString(),
    environment,
    deployment: {
      deploymentRef,
      baselineId,
    },
    health: {
      server: readiness.server,
      database: readiness.database,
      llm: readiness.llm,
      ready: readiness.ready,
      supabase: {
        available: supabase.available,
        mode: supabase.mode,
        latencyMs: supabase.latencyMs,
        provider: supabase.provider,
        probe: supabase.probe || null,
      },
      databaseConfig: {
        configured: databaseConfig.configured,
        provider: databaseConfig.provider,
        dialect: databaseConfig.dialect,
        runtimeCompatible: databaseConfig.runtimeCompatible,
      },
    },
    gate: {
      readyForBrowserUat,
      decision: readyForBrowserUat
        ? "REMOTE_STAGING_RUNTIME_READY_FOR_RBAC_RLS_BROWSER_UAT"
        : "REMOTE_STAGING_RUNTIME_EVIDENCE_INCOMPLETE",
      blockers: uniqueBlockers,
      productionApproved: false,
      productionDecision: "PRODUCTION_NOT_APPROVED_PENDING_REMOTE_BROWSER_RBAC_RLS_EVIDENCE",
    },
  } as const;
}
