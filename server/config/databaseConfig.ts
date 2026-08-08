export type DatabaseDialect = "mysql" | "postgresql" | "unknown";

export type DatabaseConfigSource =
  | "DATABASE_URL"
  | "MYSQL_DATABASE_URL"
  | "DB_COMPONENTS"
  | "PLATFORM_SUPABASE"
  | "PWF_SUPABASE"
  | "SUPABASE"
  | "VITE_SUPABASE"
  | "UNCONFIGURED";

export type DatabaseConfigResolution = {
  configured: boolean;
  source: DatabaseConfigSource;
  url: string;
  redactedUrl: string;
  provider: string;
  dialect: DatabaseDialect;
  runtimeCompatible: boolean;
  reason?: string;
};

const PLACEHOLDER_PATTERN = /PUT_LOCAL_DATABASE_URL_HERE|YOUR_DATABASE_URL|example|change-this|password/i;

function isMeaningful(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0 && !PLACEHOLDER_PATTERN.test(value.trim());
}

function firstMeaningfulEnv(candidates: Array<{ source: DatabaseConfigSource; value: string | undefined }>) {
  for (const candidate of candidates) {
    if (isMeaningful(candidate.value)) return { source: candidate.source, value: candidate.value.trim() };
  }
  return null;
}

function hasMeaningfulSupabaseKey(): boolean {
  return Boolean(
    isMeaningful(process.env.PLATFORM_SUPABASE_SERVICE_ROLE_KEY) ||
    isMeaningful(process.env.PWF_SUPABASE_SERVICE_ROLE_KEY) ||
    isMeaningful(process.env.SUPABASE_SERVICE_ROLE_KEY) ||
    isMeaningful(process.env.PLATFORM_SUPABASE_ANON_KEY) ||
    isMeaningful(process.env.VITE_SUPABASE_ANON_KEY)
  );
}

function encodeDatabaseComponent(value: string | undefined): string {
  return encodeURIComponent(value || "");
}

function buildMysqlUrlFromComponents(): string {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
  const port = process.env.DB_PORT || process.env.MYSQL_PORT || "3306";

  if (!isMeaningful(host) || !isMeaningful(database) || !isMeaningful(user)) {
    return "";
  }

  const auth = isMeaningful(password)
    ? `${encodeDatabaseComponent(user)}:${encodeDatabaseComponent(password)}@`
    : `${encodeDatabaseComponent(user)}@`;

  return `mysql://${auth}${host}:${port}/${encodeDatabaseComponent(database)}`;
}

export function inferDatabaseDialect(rawUrl: string): DatabaseDialect {
  const normalized = rawUrl.trim().toLowerCase();
  if (normalized.startsWith("mysql://") || normalized.startsWith("mysql2://")) return "mysql";
  if (normalized.startsWith("postgres://") || normalized.startsWith("postgresql://")) return "postgresql";
  return "unknown";
}

export function inferDatabaseProvider(rawUrl: string): string {
  const normalized = rawUrl.trim().toLowerCase();
  if (!normalized) return "not_configured";
  if (normalized.includes("supabase")) return "supabase_postgresql";
  if (normalized.startsWith("mysql://") || normalized.startsWith("mysql2://")) return "mysql";
  if (normalized.startsWith("postgres://") || normalized.startsWith("postgresql://")) return "postgresql";
  return "database";
}

export function redactDatabaseUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  try {
    const parsed = new URL(rawUrl);
    if (parsed.username) parsed.username = "***";
    if (parsed.password) parsed.password = "***";
    return parsed.toString();
  } catch {
    return rawUrl.replace(/:\/\/([^:@/]+):([^@/]+)@/, "://***:***@");
  }
}

export function resolveDatabaseConfig(): DatabaseConfigResolution {
  const directUrl = process.env.DATABASE_URL?.trim();
  const mysqlUrl = process.env.MYSQL_DATABASE_URL?.trim();
  const componentUrl = buildMysqlUrlFromComponents();
  const supabaseUrl = firstMeaningfulEnv([
    { source: "PLATFORM_SUPABASE", value: process.env.PLATFORM_SUPABASE_URL },
    { source: "PWF_SUPABASE", value: process.env.PWF_SUPABASE_URL },
    { source: "SUPABASE", value: process.env.SUPABASE_URL },
    { source: "VITE_SUPABASE", value: process.env.VITE_SUPABASE_URL },
  ]);

  let source: DatabaseConfigSource = "UNCONFIGURED";
  let url = "";

  if (isMeaningful(directUrl)) {
    source = "DATABASE_URL";
    url = directUrl;
  } else if (isMeaningful(mysqlUrl)) {
    source = "MYSQL_DATABASE_URL";
    url = mysqlUrl;
  } else if (isMeaningful(componentUrl)) {
    source = "DB_COMPONENTS";
    url = componentUrl;
  } else if (supabaseUrl && hasMeaningfulSupabaseKey()) {
    source = supabaseUrl.source;
    url = supabaseUrl.value;
  }

  let dialect = inferDatabaseDialect(url);
  let provider = inferDatabaseProvider(url);
  if (supabaseUrl && url === supabaseUrl.value) {
    dialect = "postgresql";
    provider = "supabase_postgresql";
  }
  const runtimeCompatible = dialect === "mysql" || provider === "supabase_postgresql";

  if (!url) {
    return {
      configured: false,
      source,
      url: "",
      redactedUrl: "",
      provider: "not_configured",
      dialect: "unknown",
      runtimeCompatible: false,
      reason: "database_not_configured",
    };
  }

  if (!runtimeCompatible) {
    return {
      configured: true,
      source,
      url,
      redactedUrl: redactDatabaseUrl(url),
      provider,
      dialect,
      runtimeCompatible: false,
      reason: dialect === "postgresql" ? "database_dialect_mismatch_mysql_runtime_required" : "database_dialect_unknown",
    };
  }

  return {
    configured: true,
    source,
    url,
    redactedUrl: redactDatabaseUrl(url),
    provider,
    dialect,
    runtimeCompatible: true,
    reason: provider === "supabase_postgresql" ? "supabase_health_adapter" : undefined,
  };
}

export function getEffectiveDatabaseUrl(): string {
  const config = resolveDatabaseConfig();
  return config.dialect === "mysql" && config.runtimeCompatible ? config.url : "";
}
