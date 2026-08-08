import { checkDatabaseHealth } from "./databaseHealth";
import { checkLlmProviderHealth } from "../llm/providerHealth";

export type ReadinessHealth = {
  server: true;
  database: Awaited<ReturnType<typeof checkDatabaseHealth>>;
  llm: Awaited<ReturnType<typeof checkLlmProviderHealth>>;
  ready: boolean;
  mode: "ready" | "blocked";
  checkedAt: string;
  productionBlockers: string[];
};

export async function buildReadinessHealth(): Promise<ReadinessHealth> {
  const [database, llm] = await Promise.all([
    checkDatabaseHealth(),
    checkLlmProviderHealth(),
  ]);

  const productionBlockers: string[] = [];
  if (!database.available) productionBlockers.push("database_unavailable");
  if (!llm.available) productionBlockers.push("llm_unavailable");

  const ready = productionBlockers.length === 0;

  return {
    server: true,
    database,
    llm,
    ready,
    mode: ready ? "ready" : "blocked",
    checkedAt: new Date().toISOString(),
    productionBlockers,
  };
}

export async function buildPublicReadinessHealth() {
  const readiness = await buildReadinessHealth();
  return {
    server: readiness.server,
    database: readiness.database.available,
    llm: readiness.llm.available,
    ready: readiness.ready,
    checkedAt: readiness.checkedAt,
    productionBlockers: readiness.productionBlockers,
    details: readiness,
  };
}
