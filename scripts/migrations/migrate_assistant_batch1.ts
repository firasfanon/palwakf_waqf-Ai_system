#!/usr/bin/env tsx

/**
 * Migration Script Draft 1 — Batch 1 (Resilient Path Version)
 * -----------------------------------------------------------
 * Scope:
 *   1) systemSettings   -> assistant.system_settings
 *   2) knowledgeSources -> assistant.knowledge_sources
 *
 * Improvements in this version:
 * - Accepts explicit override via ASSISTANT_LOCAL_RUNTIME_FILE
 * - Searches multiple likely runtime store paths automatically
 * - Reports all searched paths if no file is found
 * - Uses the first existing candidate
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

type LocalRuntimeStore = Record<string, Json>;

type SystemSettingRow = {
  key: string;
  value_json: Json;
  description?: string | null;
};

type KnowledgeSourceRow = {
  id: string;
  name: string;
  type: "manual" | "seeded" | "external_fetch" | "internal_reference" | "other";
  base_url?: string | null;
  description?: string | null;
  authority_level?: "official" | "semi_official" | "reference" | "unverified" | null;
  is_active: boolean;
  metadata_json: Record<string, Json>;
};

type MigrationReport = {
  timestamp: string;
  sourceFile: string;
  backupFile: string;
  targetSchema: string;
  targetTables: string[];
  counts: {
    localSystemSettings: number;
    localKnowledgeSources: number;
    migratedSystemSettings: number;
    migratedKnowledgeSources: number;
  };
  files: {
    sourceIdMapFile: string;
    reportFile: string;
  };
  warnings: string[];
};

const ASSISTANT_SCHEMA = "assistant";

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveSupabaseUrl(): string {
  const value =
    getEnv("PWF_SUPABASE_URL") ??
    getEnv("SUPABASE_URL") ??
    getEnv("VITE_SUPABASE_URL");

  if (!value) {
    throw new Error(
      "Missing Supabase URL. Set one of: PWF_SUPABASE_URL, SUPABASE_URL, VITE_SUPABASE_URL."
    );
  }

  return value.replace(/\/+$/, "");
}

function resolveServiceRoleKey(): string {
  const value =
    getEnv("PWF_SUPABASE_SERVICE_ROLE_KEY") ??
    getEnv("SUPABASE_SERVICE_ROLE_KEY") ??
    getEnv("SUPABASE_SERVICE_ROLE");

  if (!value) {
    throw new Error(
      "Missing Supabase service role key. Set one of: PWF_SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE."
    );
  }

  return value;
}

function timestampForFile(date = new Date()): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  const hh = date.getHours().toString().padStart(2, "0");
  const mi = date.getMinutes().toString().padStart(2, "0");
  const ss = date.getSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
}

function deterministicUuid(seed: string): string {
  const hash = crypto.createHash("md5").update(seed).digest("hex");
  const chars = hash.split("");

  chars[12] = "4";
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16);

  return `${chars.slice(0, 8).join("")}-${chars.slice(8, 12).join("")}-${chars
    .slice(12, 16)
    .join("")}-${chars.slice(16, 20).join("")}-${chars.slice(20, 32).join("")}`;
}

function asRecord(value: Json): Record<string, Json> | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  return value as Record<string, Json>;
}

function asString(value: Json): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function asBoolean(value: Json, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "t", "yes", "y", "on", "active", "enabled"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "f", "no", "n", "off", "inactive", "disabled"].includes(normalized)) {
      return false;
    }
  }
  return fallback;
}

function normalizeAuthorityLevel(raw: Json): KnowledgeSourceRow["authority_level"] {
  const value = asString(raw)?.toLowerCase();
  switch (value) {
    case "official":
      return "official";
    case "semi_official":
    case "semiofficial":
      return "semi_official";
    case "reference":
      return "reference";
    case "unverified":
      return "unverified";
    default:
      return null;
  }
}

function normalizeKnowledgeSourceType(raw: Json): KnowledgeSourceRow["type"] {
  const value = asString(raw)?.toLowerCase();
  if (!value) return "other";

  if (value === "manual") return "manual";
  if (value === "seeded") return "seeded";
  if (["internal_reference", "internalreference", "internal"].includes(value)) {
    return "internal_reference";
  }
  if (["wikipedia", "rss", "scraper", "pdf_url", "api", "external_fetch", "externalfetch", "fetch"].includes(value)) {
    return "external_fetch";
  }

  return "other";
}

function normalizeSystemSettings(raw: Json): SystemSettingRow[] {
  if (Array.isArray(raw)) {
    const rows: SystemSettingRow[] = [];

    for (const item of raw) {
      const record = asRecord(item);
      if (!record) continue;

      const key = asString(record.key) ?? asString(record.name);
      if (!key) continue;

      const description = asString(record.description);
      const valueJson =
        record.value_json ??
        record.value ??
        record.settings ??
        record.config ??
        null;

      rows.push({
        key,
        value_json: valueJson,
        description,
      });
    }

    return rows;
  }

  const record = asRecord(raw);
  if (!record) return [];

  return Object.entries(record).map(([key, value]) => ({
    key,
    value_json: value,
    description: null,
  }));
}

function normalizeKnowledgeSources(raw: Json): { rows: KnowledgeSourceRow[]; idMap: Record<string, string> } {
  if (!Array.isArray(raw)) {
    return { rows: [], idMap: {} };
  }

  const rows: KnowledgeSourceRow[] = [];
  const idMap: Record<string, string> = {};

  raw.forEach((item, index) => {
    const record = asRecord(item);
    if (!record) return;

    const legacyId =
      asString(record.id) ??
      asString(record.sourceId) ??
      asString(record.source_id) ??
      `index:${index}`;

    const name =
      asString(record.name) ??
      asString(record.title) ??
      asString(record.label) ??
      `Source ${index + 1}`;

    const originalType =
      asString(record.type) ??
      asString(record.sourceType) ??
      asString(record.source_type) ??
      "other";

    const stableId = deterministicUuid(`assistant.knowledge_sources:${legacyId}:${name}`);

    const row: KnowledgeSourceRow = {
      id: stableId,
      name,
      type: normalizeKnowledgeSourceType(originalType),
      base_url:
        asString(record.baseUrl) ??
        asString(record.base_url) ??
        asString(record.url) ??
        asString(record.endpoint) ??
        null,
      description:
        asString(record.description) ??
        asString(record.summary) ??
        null,
      authority_level:
        normalizeAuthorityLevel(
          record.authorityLevel ?? record.authority_level ?? null
        ),
      is_active: asBoolean(
        record.isActive ?? record.is_active ?? true,
        true
      ),
      metadata_json: {
        legacy_id: legacyId,
        legacy_type: originalType,
        original_record: record,
      },
    };

    rows.push(row);
    idMap[legacyId] = stableId;
  });

  return { rows, idMap };
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function readJsonFile(filePath: string): Promise<Json> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as Json;
}

async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function backupFile(sourceFile: string, backupDir: string, stamp: string): Promise<string> {
  await ensureDir(backupDir);
  const backupPath = path.join(backupDir, `local_runtime_store_${stamp}.json`);
  await fs.copyFile(sourceFile, backupPath);
  return backupPath;
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveRuntimeFile(cwd: string): Promise<{ runtimeFile: string; searched: string[] }> {
  const envOverride = getEnv("ASSISTANT_LOCAL_RUNTIME_FILE");
  const candidates = [
    envOverride ? path.resolve(cwd, envOverride) : null,
    path.resolve(cwd, ".palwakf", "runtime", "local_runtime_store.json"),
    path.resolve(cwd, ".manus", "runtime", "local_runtime_store.json"),
    path.resolve(cwd, "local_runtime_store.json"),
    path.resolve(cwd, "runtime", "local_runtime_store.json"),
  ].filter(Boolean) as string[];

  const uniqueCandidates = Array.from(new Set(candidates));

  for (const candidate of uniqueCandidates) {
    if (await fileExists(candidate)) {
      return { runtimeFile: candidate, searched: uniqueCandidates };
    }
  }

  throw new Error(
    [
      "Local runtime file not found.",
      "Searched paths:",
      ...uniqueCandidates.map((p) => `- ${p}`),
      "",
      "You can override the path explicitly with:",
      "ASSISTANT_LOCAL_RUNTIME_FILE=relative/or/absolute/path/to/local_runtime_store.json",
    ].join("\n")
  );
}

async function postgrestUpsert<T extends object>(options: {
  baseUrl: string;
  serviceRoleKey: string;
  table: string;
  rows: T[];
  onConflict: string;
}): Promise<void> {
  if (options.rows.length === 0) return;

  const url = new URL(`${options.baseUrl}/rest/v1/${options.table}`);
  url.searchParams.set("on_conflict", options.onConflict);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      apikey: options.serviceRoleKey,
      Authorization: `Bearer ${options.serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Profile": ASSISTANT_SCHEMA,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(options.rows),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PostgREST upsert failed for ${ASSISTANT_SCHEMA}.${options.table}: ${response.status} ${response.statusText}\n${text}`
    );
  }
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  const { runtimeFile, searched } = await resolveRuntimeFile(cwd);
  const runtimeDir = path.dirname(runtimeFile);
  const backupDir = path.join(runtimeDir, "backups");
  const reportDir = path.join(runtimeDir, "migration_reports");
  const stamp = timestampForFile();

  const warnings: string[] = [];

  const baseUrl = resolveSupabaseUrl();
  const serviceRoleKey = resolveServiceRoleKey();

  console.log("[migration.batch1] starting");
  console.log(`[migration.batch1] runtime file: ${runtimeFile}`);
  console.log(`[migration.batch1] searched candidates: ${searched.length}`);
  console.log(`[migration.batch1] target schema: ${ASSISTANT_SCHEMA}`);

  const store = (await readJsonFile(runtimeFile)) as LocalRuntimeStore;
  const backupPath = await backupFile(runtimeFile, backupDir, stamp);

  const systemSettingsRows = normalizeSystemSettings(store.systemSettings ?? {});
  const { rows: knowledgeSourceRows, idMap } = normalizeKnowledgeSources(store.knowledgeSources ?? []);

  if (systemSettingsRows.length === 0) {
    warnings.push("No systemSettings records detected in local runtime store.");
  }

  if (knowledgeSourceRows.length === 0) {
    warnings.push("No knowledgeSources records detected in local runtime store.");
  }

  console.log(`[migration.batch1] system settings rows: ${systemSettingsRows.length}`);
  console.log(`[migration.batch1] knowledge source rows: ${knowledgeSourceRows.length}`);

  for (const batch of chunkArray(systemSettingsRows, 100)) {
    await postgrestUpsert({
      baseUrl,
      serviceRoleKey,
      table: "system_settings",
      rows: batch,
      onConflict: "key",
    });
  }

  for (const batch of chunkArray(knowledgeSourceRows, 100)) {
    await postgrestUpsert({
      baseUrl,
      serviceRoleKey,
      table: "knowledge_sources",
      rows: batch,
      onConflict: "id",
    });
  }

  await ensureDir(reportDir);

  const sourceIdMapFile = path.join(reportDir, `batch1_knowledge_sources_id_map_${stamp}.json`);
  await writeJsonFile(sourceIdMapFile, idMap);

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    sourceFile: runtimeFile,
    backupFile: backupPath,
    targetSchema: ASSISTANT_SCHEMA,
    targetTables: ["assistant.system_settings", "assistant.knowledge_sources"],
    counts: {
      localSystemSettings: systemSettingsRows.length,
      localKnowledgeSources: knowledgeSourceRows.length,
      migratedSystemSettings: systemSettingsRows.length,
      migratedKnowledgeSources: knowledgeSourceRows.length,
    },
    files: {
      sourceIdMapFile,
      reportFile: path.join(reportDir, `migration_batch1_report_${stamp}.json`),
    },
    warnings,
  };

  await writeJsonFile(report.files.reportFile, report);

  console.log("[migration.batch1] completed successfully");
  console.log(`[migration.batch1] backup: ${backupPath}`);
  console.log(`[migration.batch1] id map: ${sourceIdMapFile}`);
  console.log(`[migration.batch1] report: ${report.files.reportFile}`);

  if (warnings.length > 0) {
    console.warn("[migration.batch1] warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
}

main().catch((error) => {
  console.error("[migration.batch1] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
