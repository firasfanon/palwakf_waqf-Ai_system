#!/usr/bin/env tsx

/**
 * Migration Script Draft 2 — Batch 2
 * ----------------------------------
 * Scope:
 *   1) fetchedContent              -> assistant.fetched_content
 *   2) fetchLogs                   -> assistant.fetch_logs
 *   3) classificationRatings       -> assistant.classification_ratings
 *   4) fetchedContentReviewEvents  -> assistant.review_events
 *
 * Source:
 *   local runtime store (resilient path search)
 *
 * Destination:
 *   Supabase PostgREST (assistant schema)
 *
 * Notes:
 * - Conservative second migration batch
 * - Requires Batch 1 to have completed already
 * - Reads Batch 1 source-id mapping if available
 * - Takes a backup snapshot before doing anything
 * - Does NOT delete or mutate the local runtime store
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

type FetchedContentRow = {
  id: string;
  source_id: string | null;
  title: string | null;
  content: string | null;
  source_url: string | null;
  category: string | null;
  relevance_score: number | null;
  status: "draft" | "in_review" | "approved" | "rejected" | "archived";
  metadata_json: Record<string, Json>;
  fetched_at: string;
};

type FetchLogRow = {
  id: string;
  source_id: string | null;
  status: "queued" | "running" | "success" | "failed" | "partial";
  items_count: number;
  error_message: string | null;
  details_json: Record<string, Json>;
  started_at: string | null;
  finished_at: string | null;
};

type ClassificationRatingRow = {
  id: string;
  target_type: "fetched_content" | "knowledge_document" | "reference_document" | "tool_output";
  target_id: string;
  rating: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

type ReviewEventRow = {
  id: string;
  target_type: "reference_document" | "knowledge_document" | "fetched_content" | "tool_output";
  target_id: string;
  event_type:
    | "submit_for_review"
    | "approve"
    | "reject"
    | "archive"
    | "send_back"
    | "update_governance"
    | "manual_override";
  decision: "approve" | "reject" | "archive" | "send_back" | null;
  notes: string | null;
  performed_by: string | null;
  performed_at: string;
  metadata_json: Record<string, Json>;
};

type MigrationReport = {
  timestamp: string;
  sourceFile: string;
  backupFile: string;
  targetSchema: string;
  targetTables: string[];
  counts: {
    localFetchedContent: number;
    localFetchLogs: number;
    localClassificationRatings: number;
    localReviewEvents: number;
    migratedFetchedContent: number;
    migratedFetchLogs: number;
    migratedClassificationRatings: number;
    migratedReviewEvents: number;
  };
  files: {
    fetchedContentIdMapFile: string;
    reportFile: string;
    sourceIdMapFileUsed: string | null;
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
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return null;
}

function asNumber(value: Json): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function coerceIso(value: Json, fallback = new Date().toISOString()): string {
  const text = asString(value);
  if (!text) return fallback;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? fallback : d.toISOString();
}

function asInt(value: Json, fallback = 0): number {
  const n = asNumber(value);
  return n === null ? fallback : Math.trunc(n);
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
    path.resolve(cwd, ".manus", "db", "local_runtime_store.json"),
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

async function loadLatestKnowledgeSourceIdMap(reportDir: string): Promise<{ map: Record<string, string>; file: string | null }> {
  try {
    const files = await fs.readdir(reportDir);
    const candidates = files
      .filter((f) => /^batch1_knowledge_sources_id_map_.*\.json$/.test(f))
      .sort()
      .reverse();

    for (const file of candidates) {
      const full = path.join(reportDir, file);
      const json = await readJsonFile(full);
      const rec = asRecord(json);
      if (rec) {
        const out: Record<string, string> = {};
        for (const [k, v] of Object.entries(rec)) {
          const s = asString(v);
          if (s) out[k] = s;
        }
        return { map: out, file: full };
      }
    }
  } catch {
    // ignore
  }

  return { map: {}, file: null };
}

function normalizeFetchedStatus(raw: Json): FetchedContentRow["status"] {
  const value = asString(raw)?.toLowerCase();
  switch (value) {
    case "in_review":
    case "review":
      return "in_review";
    case "approved":
      return "approved";
    case "rejected":
      return "rejected";
    case "archived":
      return "archived";
    default:
      return "draft";
  }
}

function normalizeFetchLogStatus(raw: Json): FetchLogRow["status"] {
  const value = asString(raw)?.toLowerCase();
  switch (value) {
    case "queued":
      return "queued";
    case "running":
      return "running";
    case "success":
      return "success";
    case "failed":
    case "error":
      return "failed";
    case "partial":
      return "partial";
    default:
      return "success";
  }
}

function normalizeRating(value: Json): number {
  const n = asInt(value, 3);
  if (n < 1) return 1;
  if (n > 5) return 5;
  return n;
}

function normalizeClassificationTargetType(raw: Json): ClassificationRatingRow["target_type"] {
  const value = asString(raw)?.toLowerCase();
  switch (value) {
    case "knowledge_document":
    case "knowledgedocument":
      return "knowledge_document";
    case "reference_document":
    case "referencedocument":
      return "reference_document";
    case "tool_output":
    case "tooloutput":
      return "tool_output";
    default:
      return "fetched_content";
  }
}

function normalizeReviewTargetType(raw: Json): ReviewEventRow["target_type"] {
  const value = asString(raw)?.toLowerCase();
  switch (value) {
    case "reference_document":
    case "referencedocument":
      return "reference_document";
    case "knowledge_document":
    case "knowledgedocument":
      return "knowledge_document";
    case "tool_output":
    case "tooloutput":
      return "tool_output";
    default:
      return "fetched_content";
  }
}

function normalizeDecision(raw: Json): ReviewEventRow["decision"] {
  const value = asString(raw)?.toLowerCase();
  switch (value) {
    case "approve":
    case "approved":
      return "approve";
    case "reject":
    case "rejected":
      return "reject";
    case "archive":
    case "archived":
      return "archive";
    case "send_back":
    case "sendback":
    case "return":
      return "send_back";
    default:
      return null;
  }
}

function normalizeEventType(raw: Json): ReviewEventRow["event_type"] {
  const value = asString(raw)?.toLowerCase();
  switch (value) {
    case "submit_for_review":
    case "submit":
      return "submit_for_review";
    case "approve":
    case "approved":
      return "approve";
    case "reject":
    case "rejected":
      return "reject";
    case "archive":
    case "archived":
      return "archive";
    case "send_back":
    case "sendback":
    case "return":
      return "send_back";
    case "manual_override":
      return "manual_override";
    default:
      return "update_governance";
  }
}

function resolveMappedSourceId(raw: Json, sourceIdMap: Record<string, string>): string | null {
  const source = asString(raw);
  if (!source) return null;
  return sourceIdMap[source] ?? null;
}

function normalizeFetchedContent(raw: Json, sourceIdMap: Record<string, string>): { rows: FetchedContentRow[]; idMap: Record<string, string> } {
  if (!Array.isArray(raw)) return { rows: [], idMap: {} };

  const rows: FetchedContentRow[] = [];
  const idMap: Record<string, string> = {};

  raw.forEach((item, index) => {
    const rec = asRecord(item);
    if (!rec) return;

    const legacyId =
      asString(rec.id) ??
      asString(rec.contentId) ??
      asString(rec.content_id) ??
      `index:${index}`;

    const title =
      asString(rec.title) ??
      asString(rec.name) ??
      asString(rec.label);

    const content =
      asString(rec.content) ??
      asString(rec.text) ??
      asString(rec.body);

    const stableId = deterministicUuid(`assistant.fetched_content:${legacyId}:${title ?? ""}`);

    const row: FetchedContentRow = {
      id: stableId,
      source_id: resolveMappedSourceId(rec.sourceId ?? rec.source_id ?? rec.knowledgeSourceId, sourceIdMap),
      title,
      content,
      source_url:
        asString(rec.sourceUrl) ??
        asString(rec.source_url) ??
        asString(rec.url),
      category: asString(rec.category),
      relevance_score: asNumber(rec.relevanceScore ?? rec.relevance_score),
      status: normalizeFetchedStatus(rec.status),
      metadata_json: {
        legacy_id: legacyId,
        original_record: rec,
      },
      fetched_at: coerceIso(rec.fetchedAt ?? rec.fetched_at ?? rec.createdAt ?? rec.created_at),
    };

    rows.push(row);
    idMap[legacyId] = stableId;
  });

  return { rows, idMap };
}

function normalizeFetchLogs(raw: Json, sourceIdMap: Record<string, string>): FetchLogRow[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item, index) => {
    const rec = asRecord(item);
    if (!rec) return [];

    const legacyId =
      asString(rec.id) ??
      asString(rec.logId) ??
      asString(rec.log_id) ??
      `index:${index}`;

    const stableId = deterministicUuid(`assistant.fetch_logs:${legacyId}`);

    return [{
      id: stableId,
      source_id: resolveMappedSourceId(rec.sourceId ?? rec.source_id ?? rec.knowledgeSourceId, sourceIdMap),
      status: normalizeFetchLogStatus(rec.status),
      items_count: asInt(rec.itemsCount ?? rec.items_count, 0),
      error_message: asString(rec.error) ?? asString(rec.errorMessage) ?? asString(rec.error_message),
      details_json: {
        legacy_id: legacyId,
        original_record: rec,
      },
      started_at: asString(rec.startedAt ?? rec.started_at) ? coerceIso(rec.startedAt ?? rec.started_at) : null,
      finished_at: asString(rec.finishedAt ?? rec.finished_at) ? coerceIso(rec.finishedAt ?? rec.finished_at) : null,
    }];
  });
}

function normalizeClassificationRatings(raw: Json, fetchedContentIdMap: Record<string, string>): ClassificationRatingRow[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item, index) => {
    const rec = asRecord(item);
    if (!rec) return [];

    const legacyId =
      asString(rec.id) ??
      `index:${index}`;

    const stableId = deterministicUuid(`assistant.classification_ratings:${legacyId}`);
    const targetType = normalizeClassificationTargetType(rec.targetType ?? rec.target_type);

    const rawTargetId =
      asString(rec.targetId) ??
      asString(rec.target_id) ??
      asString(rec.fetchedContentId) ??
      asString(rec.fetched_content_id);

    const mappedTargetId =
      targetType === "fetched_content" && rawTargetId
        ? (fetchedContentIdMap[rawTargetId] ?? deterministicUuid(`assistant.fetched_content:${rawTargetId}`))
        : (rawTargetId ? deterministicUuid(`${targetType}:${rawTargetId}`) : deterministicUuid(`${targetType}:unknown:${index}`));

    return [{
      id: stableId,
      target_type: targetType,
      target_id: mappedTargetId,
      rating: normalizeRating(rec.rating),
      notes: asString(rec.notes) ?? asString(rec.comment),
      created_by: asString(rec.createdBy ?? rec.created_by),
      created_at: coerceIso(rec.createdAt ?? rec.created_at),
    }];
  });
}

function normalizeReviewEvents(raw: Json, fetchedContentIdMap: Record<string, string>): ReviewEventRow[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item, index) => {
    const rec = asRecord(item);
    if (!rec) return [];

    const legacyId =
      asString(rec.id) ??
      `index:${index}`;

    const stableId = deterministicUuid(`assistant.review_events:${legacyId}`);
    const targetType = normalizeReviewTargetType(rec.targetType ?? rec.target_type);

    const rawTargetId =
      asString(rec.targetId) ??
      asString(rec.target_id) ??
      asString(rec.fetchedContentId) ??
      asString(rec.fetched_content_id);

    const mappedTargetId =
      targetType === "fetched_content" && rawTargetId
        ? (fetchedContentIdMap[rawTargetId] ?? deterministicUuid(`assistant.fetched_content:${rawTargetId}`))
        : (rawTargetId ? deterministicUuid(`${targetType}:${rawTargetId}`) : deterministicUuid(`${targetType}:unknown:${index}`));

    return [{
      id: stableId,
      target_type: targetType,
      target_id: mappedTargetId,
      event_type: normalizeEventType(rec.eventType ?? rec.event_type ?? rec.action),
      decision: normalizeDecision(rec.decision ?? rec.status),
      notes: asString(rec.notes) ?? asString(rec.reviewNotes) ?? asString(rec.review_notes),
      performed_by: asString(rec.performedBy ?? rec.reviewedBy ?? rec.performed_by ?? rec.reviewed_by),
      performed_at: coerceIso(rec.performedAt ?? rec.reviewedAt ?? rec.createdAt ?? rec.created_at),
      metadata_json: {
        legacy_id: legacyId,
        original_record: rec,
      },
    }];
  });
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

  console.log("[migration.batch2] starting");
  console.log(`[migration.batch2] runtime file: ${runtimeFile}`);
  console.log(`[migration.batch2] searched candidates: ${searched.length}`);
  console.log(`[migration.batch2] target schema: ${ASSISTANT_SCHEMA}`);

  const store = (await readJsonFile(runtimeFile)) as LocalRuntimeStore;
  const backupPath = await backupFile(runtimeFile, backupDir, stamp);

  const sourceIdMapResult = await loadLatestKnowledgeSourceIdMap(reportDir);
  if (!sourceIdMapResult.file) {
    warnings.push("No Batch 1 knowledge source id-map file was found. Source linking may be null.");
  }

  const { rows: fetchedContentRows, idMap: fetchedContentIdMap } = normalizeFetchedContent(
    store.fetchedContent ?? [],
    sourceIdMapResult.map
  );
  const fetchLogRows = normalizeFetchLogs(store.fetchLogs ?? [], sourceIdMapResult.map);
  const classificationRatingRows = normalizeClassificationRatings(
    store.classificationRatings ?? [],
    fetchedContentIdMap
  );
  const reviewEventRows = normalizeReviewEvents(
    store.fetchedContentReviewEvents ?? [],
    fetchedContentIdMap
  );

  console.log(`[migration.batch2] fetched content rows: ${fetchedContentRows.length}`);
  console.log(`[migration.batch2] fetch log rows: ${fetchLogRows.length}`);
  console.log(`[migration.batch2] classification rating rows: ${classificationRatingRows.length}`);
  console.log(`[migration.batch2] review event rows: ${reviewEventRows.length}`);

  if (fetchedContentRows.length === 0) warnings.push("No fetchedContent records detected in local runtime store.");
  if (fetchLogRows.length === 0) warnings.push("No fetchLogs records detected in local runtime store.");
  if (classificationRatingRows.length === 0) warnings.push("No classificationRatings records detected in local runtime store.");
  if (reviewEventRows.length === 0) warnings.push("No fetchedContentReviewEvents records detected in local runtime store.");

  for (const batch of chunkArray(fetchedContentRows, 100)) {
    await postgrestUpsert({
      baseUrl,
      serviceRoleKey,
      table: "fetched_content",
      rows: batch,
      onConflict: "id",
    });
  }

  for (const batch of chunkArray(fetchLogRows, 100)) {
    await postgrestUpsert({
      baseUrl,
      serviceRoleKey,
      table: "fetch_logs",
      rows: batch,
      onConflict: "id",
    });
  }

  for (const batch of chunkArray(classificationRatingRows, 100)) {
    await postgrestUpsert({
      baseUrl,
      serviceRoleKey,
      table: "classification_ratings",
      rows: batch,
      onConflict: "id",
    });
  }

  for (const batch of chunkArray(reviewEventRows, 100)) {
    await postgrestUpsert({
      baseUrl,
      serviceRoleKey,
      table: "review_events",
      rows: batch,
      onConflict: "id",
    });
  }

  await ensureDir(reportDir);

  const fetchedContentIdMapFile = path.join(reportDir, `batch2_fetched_content_id_map_${stamp}.json`);
  await writeJsonFile(fetchedContentIdMapFile, fetchedContentIdMap);

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    sourceFile: runtimeFile,
    backupFile: backupPath,
    targetSchema: ASSISTANT_SCHEMA,
    targetTables: [
      "assistant.fetched_content",
      "assistant.fetch_logs",
      "assistant.classification_ratings",
      "assistant.review_events",
    ],
    counts: {
      localFetchedContent: fetchedContentRows.length,
      localFetchLogs: fetchLogRows.length,
      localClassificationRatings: classificationRatingRows.length,
      localReviewEvents: reviewEventRows.length,
      migratedFetchedContent: fetchedContentRows.length,
      migratedFetchLogs: fetchLogRows.length,
      migratedClassificationRatings: classificationRatingRows.length,
      migratedReviewEvents: reviewEventRows.length,
    },
    files: {
      fetchedContentIdMapFile,
      reportFile: path.join(reportDir, `migration_batch2_report_${stamp}.json`),
      sourceIdMapFileUsed: sourceIdMapResult.file,
    },
    warnings,
  };

  await writeJsonFile(report.files.reportFile, report);

  console.log("[migration.batch2] completed successfully");
  console.log(`[migration.batch2] backup: ${backupPath}`);
  console.log(`[migration.batch2] fetched-content id map: ${fetchedContentIdMapFile}`);
  console.log(`[migration.batch2] report: ${report.files.reportFile}`);
  if (sourceIdMapResult.file) {
    console.log(`[migration.batch2] source id map used: ${sourceIdMapResult.file}`);
  }

  if (warnings.length > 0) {
    console.warn("[migration.batch2] warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }
}

main().catch((error) => {
  console.error("[migration.batch2] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
