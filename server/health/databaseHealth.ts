import { sql } from "drizzle-orm";
import { getDb } from "../db";
import { resolveDatabaseConfig } from "../config/databaseConfig";
import { checkSupabaseHealth } from "./supabaseHealth";

export type DatabaseHealthMode = "connected" | "fallback";

export type DatabaseHealth = {
  available: boolean;
  latencyMs: number | null;
  provider: string;
  mode: DatabaseHealthMode;
  checkedAt: string;
  reason?: string;
};

function normalizeReason(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error || "unknown_error");
  if (/database not available|not configured|placeholder|missing/i.test(message)) return "database_not_configured";
  if (/ECONNREFUSED|connection refused/i.test(message)) return "connection_refused";
  if (/ETIMEDOUT|timeout/i.test(message)) return "timeout";
  if (/access denied|permission/i.test(message)) return "permission_denied";
  return message.slice(0, 180);
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const checkedAt = new Date().toISOString();
  const config = resolveDatabaseConfig();
  const provider = config.provider;

  if (config.provider === "supabase_postgresql") {
    const supabase = await checkSupabaseHealth();
    return {
      available: supabase.available,
      latencyMs: supabase.latencyMs,
      provider: supabase.provider,
      mode: supabase.available ? "connected" : "fallback",
      checkedAt: supabase.checkedAt,
      reason: supabase.available
        ? `supabase_probe:${supabase.probe?.schema || "unknown"}.${supabase.probe?.table || "unknown"}`
        : supabase.reason || "supabase_unavailable",
    };
  }

  if (!config.configured) {
    return {
      available: false,
      latencyMs: null,
      provider,
      mode: "fallback",
      checkedAt,
      reason: "database_not_configured",
    };
  }

  if (!config.runtimeCompatible) {
    return {
      available: false,
      latencyMs: null,
      provider,
      mode: "fallback",
      checkedAt,
      reason: config.reason || "database_runtime_not_compatible",
    };
  }

  const started = Date.now();
  try {
    const db = await getDb();
    if (!db) {
      return {
        available: false,
        latencyMs: Date.now() - started,
        provider,
        mode: "fallback",
        checkedAt,
        reason: "database_not_available",
      };
    }

    if (typeof (db as any).execute === "function") {
      await (db as any).execute(sql`select 1 as health_check`);
    }

    return {
      available: true,
      latencyMs: Date.now() - started,
      provider,
      mode: "connected",
      checkedAt,
    };
  } catch (error) {
    return {
      available: false,
      latencyMs: Date.now() - started,
      provider,
      mode: "fallback",
      checkedAt,
      reason: normalizeReason(error),
    };
  }
}
