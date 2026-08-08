import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type SupabaseHealthMode = "connected" | "fallback";

export type SupabaseHealth = {
  available: boolean;
  latencyMs: number | null;
  provider: "supabase_postgresql";
  mode: SupabaseHealthMode;
  checkedAt: string;
  reason?: string;
  urlConfigured: boolean;
  keyConfigured: boolean;
  bridgeEnabled: boolean;
  urlSource?: string;
  keySource?: string;
  probe?: {
    schema: string;
    table: string;
  };
};

type SupabaseConfig = {
  url: string;
  key: string;
  urlSource?: string;
  keySource?: string;
  bridgeEnabled: boolean;
};

const truthy = new Set(["1", "true", "yes", "on"]);
const PLACEHOLDER_PATTERN = /PUT_|YOUR_|example|change-this|paste-|password/i;

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || PLACEHOLDER_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

function envFlag(value: string | undefined): boolean {
  return typeof value === "string" && truthy.has(value.trim().toLowerCase());
}

function firstEnv(candidates: string[]): { value: string; source: string } | null {
  for (const source of candidates) {
    const value = getEnv(source);
    if (value) return { value, source };
  }
  return null;
}

export function resolveSupabaseHealthConfig(): SupabaseConfig {
  const url = firstEnv([
    "PLATFORM_SUPABASE_URL",
    "PWF_SUPABASE_URL",
    "SUPABASE_URL",
    "VITE_SUPABASE_URL",
  ]);

  const key = firstEnv([
    "PLATFORM_SUPABASE_SERVICE_ROLE_KEY",
    "PWF_SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "PLATFORM_SUPABASE_ANON_KEY",
    "VITE_SUPABASE_ANON_KEY",
  ]);

  return {
    url: url?.value || "",
    key: key?.value || "",
    urlSource: url?.source,
    keySource: key?.source,
    bridgeEnabled: envFlag(process.env.PLATFORM_BRIDGE_ENABLED),
  };
}

let _healthClient: SupabaseClient | null = null;
let _healthClientCacheKey = "";

function getSupabaseHealthClient(config: SupabaseConfig): SupabaseClient | null {
  if (!config.url || !config.key) return null;
  const cacheKey = `${config.url}::${config.keySource || "key"}`;
  if (!_healthClient || _healthClientCacheKey !== cacheKey) {
    _healthClient = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          "x-palwakf-health-probe": "mb28b-supabase-readiness",
        },
      },
    });
    _healthClientCacheKey = cacheKey;
  }
  return _healthClient;
}

function normalizeSupabaseReason(error: unknown): string {
  const anyError = error as any;
  const message = String(anyError?.message || anyError?.error_description || anyError?.hint || error || "unknown_error");
  const code = String(anyError?.code || "");

  if (/Invalid API key|JWT|apikey|unauthorized/i.test(message)) return "supabase_auth_failed";
  if (/permission denied|row-level security|RLS/i.test(message)) return "supabase_permission_denied";
  if (/Failed to fetch|ECONNREFUSED|ENOTFOUND|network|fetch failed/i.test(message)) return "supabase_network_unavailable";
  if (code === "42P01" || /does not exist|not found|schema cache/i.test(message)) return "supabase_probe_table_unavailable";
  return message.slice(0, 180);
}

const SUPABASE_PROBES = [
  { schema: "assistant", table: "ai_tool_runs", column: "id" },
  { schema: "assistant", table: "knowledge_documents", column: "id" },
  { schema: "assistant", table: "conversations", column: "id" },
  { schema: "public", table: "land_references", column: "id" },
];

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const checkedAt = new Date().toISOString();
  const config = resolveSupabaseHealthConfig();

  if (!config.url || !config.key) {
    return {
      available: false,
      latencyMs: null,
      provider: "supabase_postgresql",
      mode: "fallback",
      checkedAt,
      reason: !config.url ? "supabase_url_not_configured" : "supabase_key_not_configured",
      urlConfigured: Boolean(config.url),
      keyConfigured: Boolean(config.key),
      bridgeEnabled: config.bridgeEnabled,
      urlSource: config.urlSource,
      keySource: config.keySource,
    };
  }

  const client = getSupabaseHealthClient(config);
  if (!client) {
    return {
      available: false,
      latencyMs: null,
      provider: "supabase_postgresql",
      mode: "fallback",
      checkedAt,
      reason: "supabase_client_not_available",
      urlConfigured: true,
      keyConfigured: true,
      bridgeEnabled: config.bridgeEnabled,
      urlSource: config.urlSource,
      keySource: config.keySource,
    };
  }

  const started = Date.now();
  let lastReason = "supabase_probe_failed";

  for (const probe of SUPABASE_PROBES) {
    try {
      const queryClient = probe.schema === "public" ? (client as any) : (client as any).schema(probe.schema);
      const { error } = await queryClient
        .from(probe.table)
        .select(probe.column, { head: true, count: "exact" })
        .limit(1);

      if (!error) {
        return {
          available: true,
          latencyMs: Date.now() - started,
          provider: "supabase_postgresql",
          mode: "connected",
          checkedAt,
          urlConfigured: true,
          keyConfigured: true,
          bridgeEnabled: config.bridgeEnabled,
          urlSource: config.urlSource,
          keySource: config.keySource,
          probe: { schema: probe.schema, table: probe.table },
        };
      }

      lastReason = normalizeSupabaseReason(error);
      if (!["supabase_probe_table_unavailable"].includes(lastReason)) break;
    } catch (error) {
      lastReason = normalizeSupabaseReason(error);
      if (!["supabase_probe_table_unavailable"].includes(lastReason)) break;
    }
  }

  return {
    available: false,
    latencyMs: Date.now() - started,
    provider: "supabase_postgresql",
    mode: "fallback",
    checkedAt,
    reason: lastReason,
    urlConfigured: true,
    keyConfigured: true,
    bridgeEnabled: config.bridgeEnabled,
    urlSource: config.urlSource,
    keySource: config.keySource,
  };
}
