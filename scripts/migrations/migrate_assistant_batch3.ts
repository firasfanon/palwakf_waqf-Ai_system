#!/usr/bin/env tsx

/**
 * Migration Script Draft 3 — Batch 3
 * ----------------------------------
 * Scope:
 *   1) knowledgeDocuments -> assistant.reference_documents + assistant.knowledge_documents
 *   2) documentFiles      -> assistant.reference_files
 *   3) auto-link          -> assistant.knowledge_citations
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type LocalRuntimeStore = Record<string, Json>;
type JsonRecord = Record<string, Json>;

type KnowledgeSourceDbRow = {
  id: string;
  name: string | null;
  metadata_json?: JsonRecord | null;
};

type ReferenceDocumentRow = {
  id: string;
  source_id: string | null;
  title: string;
  document_type: string | null;
  language: string | null;
  status: "draft" | "in_review" | "approved" | "rejected" | "archived";
  authority_level: "official" | "semi_official" | "reference" | "unverified";
  domain_scope: "waqf_law" | "fiqh" | "administrative" | "historical" | "public_info" | "internal_procedure" | "other";
  source_type: "manual" | "pdf_upload" | "external_fetch" | "system_generated" | "seeded";
  summary: string | null;
  content_text: string | null;
  content_hash: string | null;
  metadata_json: JsonRecord;
  effective_from: string | null;
  effective_to: string | null;
  approval_version: number;
  review_notes: string | null;
  review_decision: "approve" | "reject" | "archive" | "send_back" | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
};

type KnowledgeDocumentRow = {
  id: string;
  reference_document_id: string | null;
  source_id: string | null;
  title: string;
  category: string | null;
  status: "draft" | "in_review" | "approved" | "rejected" | "archived";
  authority_level: "official" | "semi_official" | "reference" | "unverified";
  domain_scope: "waqf_law" | "fiqh" | "administrative" | "historical" | "public_info" | "internal_procedure" | "other";
  source_type: "manual" | "pdf_upload" | "external_fetch" | "system_generated" | "seeded";
  summary: string | null;
  content: string;
  tags: Json;
  is_chat_eligible: boolean;
  chat_priority: number;
  grounding_weight: number;
  approval_version: number;
  review_notes: string | null;
  review_decision: "approve" | "reject" | "archive" | "send_back" | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  effective_from: string | null;
  effective_to: string | null;
  supersedes_document_id: string | null;
  metadata_json: JsonRecord;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
};

type ReferenceFileRow = {
  id: string;
  reference_document_id: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  file_hash: string | null;
  is_primary: boolean;
  ocr_text: string | null;
  extracted_text: string | null;
  metadata_json: JsonRecord;
};

type CitationRow = {
  id: string;
  knowledge_document_id: string;
  reference_document_id: string;
  reference_file_id: string | null;
  citation_type: string | null;
  locator: string | null;
  excerpt: string | null;
  metadata_json: JsonRecord;
};

const ASSISTANT_SCHEMA = "assistant";

function getEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function resolveSupabaseUrl(): string {
  const value = getEnv("PWF_SUPABASE_URL") ?? getEnv("SUPABASE_URL") ?? getEnv("VITE_SUPABASE_URL");
  if (!value) throw new Error("Missing Supabase URL. Set one of: PWF_SUPABASE_URL, SUPABASE_URL, VITE_SUPABASE_URL.");
  return value.replace(/\/+$/, "");
}

function resolveServiceRoleKey(): string {
  const value = getEnv("PWF_SUPABASE_SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SERVICE_ROLE_KEY") ?? getEnv("SUPABASE_SERVICE_ROLE");
  if (!value) throw new Error("Missing Supabase service role key. Set one of: PWF_SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SERVICE_ROLE.");
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
  return `${chars.slice(0,8).join("")}-${chars.slice(8,12).join("")}-${chars.slice(12,16).join("")}-${chars.slice(16,20).join("")}-${chars.slice(20,32).join("")}`;
}

function sha256Text(text: string | null): string | null {
  if (!text) return null;
  return crypto.createHash("sha256").update(text).digest("hex");
}

function asRecord(value: Json): JsonRecord | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  return value as JsonRecord;
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
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asBoolean(value: Json, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["1","true","t","yes","y","on","active","enabled"].includes(v)) return true;
    if (["0","false","f","no","n","off","inactive","disabled"].includes(v)) return false;
  }
  return fallback;
}

function coerceIso(value: Json, fallback?: string | null): string | null {
  const s = asString(value);
  if (!s) return fallback ?? null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? (fallback ?? null) : d.toISOString();
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

  const unique = Array.from(new Set(candidates));
  for (const candidate of unique) {
    if (await fileExists(candidate)) return { runtimeFile: candidate, searched: unique };
  }

  throw new Error([
    "Local runtime file not found.",
    "Searched paths:",
    ...unique.map((p) => `- ${p}`),
    "",
    "You can override the path explicitly with:",
    "ASSISTANT_LOCAL_RUNTIME_FILE=relative/or/absolute/path/to/local_runtime_store.json",
  ].join("\n"));
}

async function loadLatestKnowledgeSourceIdMap(reportDir: string): Promise<{ map: Record<string, string>; file: string | null }> {
  try {
    const files = await fs.readdir(reportDir);
    const candidates = files.filter((f) => /^batch1_knowledge_sources_id_map_.*\.json$/.test(f)).sort().reverse();
    for (const file of candidates) {
      const full = path.join(reportDir, file);
      const json = await readJsonFile(full);
      const rec = asRecord(json);
      if (!rec) continue;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(rec)) {
        const s = asString(v);
        if (s) out[k] = s;
      }
      return { map: out, file: full };
    }
  } catch {}
  return { map: {}, file: null };
}

async function getKnowledgeSourcesFromDb(baseUrl: string, serviceRoleKey: string): Promise<KnowledgeSourceDbRow[]> {
  const url = new URL(`${baseUrl}/rest/v1/knowledge_sources`);
  url.searchParams.set("select", "id,name,metadata_json");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
      "Accept-Profile": ASSISTANT_SCHEMA,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to read assistant.knowledge_sources: ${response.status} ${response.statusText}\n${text}`);
  }

  const json = await response.json();
  return Array.isArray(json) ? (json as KnowledgeSourceDbRow[]) : [];
}

function normalizeDomainScope(rawCategory: string | null): ReferenceDocumentRow["domain_scope"] {
  const c = (rawCategory ?? "").trim().toLowerCase();
  if (!c) return "other";
  if (["fiqh", "jurisprudence", "islamic_law"].includes(c)) return "fiqh";
  if (["waqf_law", "law", "legal", "regulation", "regulations"].includes(c)) return "waqf_law";
  if (["administrative", "procedure", "procedural"].includes(c)) return "administrative";
  if (["historical", "history"].includes(c)) return "historical";
  if (["public_info", "public"].includes(c)) return "public_info";
  if (["internal_procedure", "internal"].includes(c)) return "internal_procedure";
  return "other";
}

function inferSourceType(rec: JsonRecord): ReferenceDocumentRow["source_type"] {
  const sourceUrl = asString(rec.sourceUrl ?? rec.source_url);
  const pdfUrl = asString(rec.pdfUrl ?? rec.pdf_url);
  const fileUrl = asString(rec.fileUrl ?? rec.file_url);
  const source = asString(rec.source)?.toLowerCase() ?? "";

  if (pdfUrl || fileUrl) return "pdf_upload";
  if (sourceUrl?.startsWith("local://")) return "seeded";
  if (sourceUrl || source.includes("http")) return "external_fetch";
  if (asBoolean(rec.isGenerated ?? rec.is_generated, false)) return "system_generated";
  return "manual";
}

function inferStatus(rec: JsonRecord): ReferenceDocumentRow["status"] {
  return asBoolean(rec.isActive ?? rec.is_active, true) ? "approved" : "draft";
}

function inferAuthorityLevel(sourceType: ReferenceDocumentRow["source_type"]): ReferenceDocumentRow["authority_level"] {
  switch (sourceType) {
    case "seeded":
    case "pdf_upload":
    case "external_fetch":
      return "reference";
    default:
      return "unverified";
  }
}

function inferReviewDecision(status: ReferenceDocumentRow["status"]): ReferenceDocumentRow["review_decision"] {
  if (status === "approved") return "approve";
  if (status === "rejected") return "reject";
  if (status === "archived") return "archive";
  return null;
}

function titleFromRecord(rec: JsonRecord, index: number): string {
  return asString(rec.title) ?? asString(rec.name) ?? asString(rec.label) ?? asString(rec.source) ?? `Knowledge Document ${index + 1}`;
}

function summaryFromRecord(rec: JsonRecord): string | null {
  return asString(rec.summary) ?? asString(rec.description);
}

function contentFromRecord(rec: JsonRecord): string {
  return asString(rec.content) ?? asString(rec.text) ?? asString(rec.body) ?? summaryFromRecord(rec) ?? "";
}

function buildKnowledgeSourceIndex(rows: KnowledgeSourceDbRow[]): { byId: Record<string, string>; byName: Record<string, string> } {
  const byId: Record<string, string> = {};
  const byName: Record<string, string> = {};

  for (const row of rows) {
    if (row.id) byId[row.id] = row.id;
    if (row.name) byName[row.name] = row.id;
    const meta = row.metadata_json && typeof row.metadata_json === "object" ? row.metadata_json : null;
    const legacyId = meta ? asString((meta as JsonRecord).legacy_id) : null;
    if (legacyId) byId[legacyId] = row.id;
  }

  return { byId, byName };
}

function resolveSourceId(rec: JsonRecord, sourceIndex: { byId: Record<string, string>; byName: Record<string, string> }): string | null {
  const candidates = [
    asString(rec.sourceId),
    asString(rec.source_id),
    asString(rec.knowledgeSourceId),
    asString(rec.source),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    if (sourceIndex.byId[c]) return sourceIndex.byId[c];
    if (sourceIndex.byName[c]) return sourceIndex.byName[c];
  }

  return null;
}

function makeStoragePath(input: string, fallbackId: string): string {
  if (input.startsWith("local://")) return input;
  if (input.startsWith("http://") || input.startsWith("https://")) return input;
  if (input.startsWith("data:")) return `legacy://inline-data-url/${fallbackId}`;
  return input;
}

function normalizeDocumentFilesArray(raw: Json): JsonRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    const rec = asRecord(item);
    return rec ? [rec] : [];
  });
}

function findFileRecordsForDoc(localDocLegacyId: string, documentFiles: JsonRecord[]): JsonRecord[] {
  return documentFiles.filter(df => {
    const ids = [
      asString(df.documentId),
      asString(df.document_id),
      asString(df.knowledgeDocumentId),
      asString(df.knowledge_document_id),
    ].filter(Boolean) as string[];
    return ids.includes(localDocLegacyId);
  });
}

function buildRows(options: {
  knowledgeDocsRaw: Json;
  documentFilesRaw: Json;
  sourceIndex: { byId: Record<string, string>; byName: Record<string, string> };
}) {
  const knowledgeDocs = Array.isArray(options.knowledgeDocsRaw)
    ? options.knowledgeDocsRaw.flatMap(item => {
        const rec = asRecord(item);
        return rec ? [rec] : [];
      })
    : [];

  const documentFiles = normalizeDocumentFilesArray(options.documentFilesRaw);

  const referenceDocuments: ReferenceDocumentRow[] = [];
  const knowledgeDocuments: KnowledgeDocumentRow[] = [];
  const referenceFiles: ReferenceFileRow[] = [];
  const citations: CitationRow[] = [];
  const referenceIdMap: Record<string, string> = {};
  const knowledgeIdMap: Record<string, string> = {};

  knowledgeDocs.forEach((rec, index) => {
    const legacyId = asString(rec.id) ?? asString(rec.documentId) ?? asString(rec.document_id) ?? `index:${index}`;
    const title = titleFromRecord(rec, index);
    const content = contentFromRecord(rec);
    const summary = summaryFromRecord(rec);
    const category = asString(rec.category);
    const sourceType = inferSourceType(rec);
    const status = inferStatus(rec);
    const authorityLevel = inferAuthorityLevel(sourceType);
    const domainScope = normalizeDomainScope(category);
    const createdAt = coerceIso(rec.createdAt ?? rec.created_at, new Date().toISOString())!;
    const updatedAt = coerceIso(rec.updatedAt ?? rec.updated_at, createdAt) ?? createdAt;
    const sourceId = resolveSourceId(rec, options.sourceIndex);

    const refId = deterministicUuid(`assistant.reference_documents:${legacyId}:${title}`);
    const knowId = deterministicUuid(`assistant.knowledge_documents:${legacyId}:${title}`);
    referenceIdMap[legacyId] = refId;
    knowledgeIdMap[legacyId] = knowId;

    referenceDocuments.push({
      id: refId,
      source_id: sourceId,
      title,
      document_type: asString(rec.documentType ?? rec.document_type) ?? "knowledge_seed",
      language: asString(rec.language) ?? "ar",
      status,
      authority_level: authorityLevel,
      domain_scope: domainScope,
      source_type: sourceType,
      summary,
      content_text: content || null,
      content_hash: sha256Text(content || null),
      metadata_json: {
        legacy_id: legacyId,
        legacy_source_name: asString(rec.source),
        legacy_source_url: asString(rec.sourceUrl ?? rec.source_url),
        original_record: rec,
      },
      effective_from: null,
      effective_to: null,
      approval_version: 1,
      review_notes: null,
      review_decision: inferReviewDecision(status),
      reviewed_by: null,
      reviewed_at: status === "approved" ? createdAt : null,
      created_by: asString(rec.createdBy ?? rec.created_by),
      created_at: createdAt,
      updated_at: updatedAt,
    });

    knowledgeDocuments.push({
      id: knowId,
      reference_document_id: refId,
      source_id: sourceId,
      title,
      category,
      status,
      authority_level: authorityLevel,
      domain_scope: domainScope,
      source_type: sourceType,
      summary,
      content,
      tags: rec.tags ?? [],
      is_chat_eligible: status === "approved",
      chat_priority: 50,
      grounding_weight: 1.0,
      approval_version: 1,
      review_notes: null,
      review_decision: inferReviewDecision(status),
      reviewed_by: null,
      reviewed_at: status === "approved" ? createdAt : null,
      effective_from: null,
      effective_to: null,
      supersedes_document_id: null,
      metadata_json: {
        legacy_id: legacyId,
        legacy_source_name: asString(rec.source),
        legacy_source_url: asString(rec.sourceUrl ?? rec.source_url),
        embedding_present: rec.embedding !== null && rec.embedding !== undefined,
        original_record: rec,
      },
      created_by: asString(rec.createdBy ?? rec.created_by),
      created_at: createdAt,
      updated_at: updatedAt,
    });

    const inlineFileCandidates: JsonRecord[] = [];
    const sourceUrl = asString(rec.sourceUrl ?? rec.source_url);
    const pdfUrl = asString(rec.pdfUrl ?? rec.pdf_url);
    const fileUrl = asString(rec.fileUrl ?? rec.file_url);
    if (sourceUrl) inlineFileCandidates.push({ sourceUrl });
    if (pdfUrl) inlineFileCandidates.push({ pdfUrl });
    if (fileUrl) inlineFileCandidates.push({ fileUrl });

    const explicitFileRecords = findFileRecordsForDoc(legacyId, documentFiles);
    const allFileRecords = explicitFileRecords.length > 0 ? explicitFileRecords : inlineFileCandidates;

    let firstReferenceFileId: string | null = null;
    allFileRecords.forEach((fileRec, fileIndex) => {
      const fileLegacyId = asString(fileRec.id) ?? asString(fileRec.fileId) ?? asString(fileRec.file_id) ?? `${legacyId}:file:${fileIndex}`;
      const refFileId = deterministicUuid(`assistant.reference_files:${fileLegacyId}:${refId}`);
      const candidatePath =
        asString(fileRec.storagePath ?? fileRec.storage_path) ??
        asString(fileRec.fileUrl ?? fileRec.file_url) ??
        asString(fileRec.pdfUrl ?? fileRec.pdf_url) ??
        asString(fileRec.sourceUrl ?? fileRec.source_url) ??
        `legacy://missing-path/${refFileId}`;

      referenceFiles.push({
        id: refFileId,
        reference_document_id: refId,
        storage_path: makeStoragePath(candidatePath, refFileId),
        original_filename: asString(fileRec.originalFilename ?? fileRec.original_filename) ?? asString(fileRec.fileName ?? fileRec.file_name) ?? asString(rec.source),
        mime_type:
          asString(fileRec.mimeType ?? fileRec.mime_type) ??
          (candidatePath.includes(".md") ? "text/markdown" :
           candidatePath.includes(".txt") ? "text/plain" :
           candidatePath.startsWith("data:application/pdf") ? "application/pdf" : null),
        file_size_bytes: asNumber(fileRec.fileSize ?? fileRec.file_size),
        file_hash: asString(fileRec.fileHash ?? fileRec.file_hash),
        is_primary: fileIndex === 0,
        ocr_text: asString(fileRec.ocrText ?? fileRec.ocr_text),
        extracted_text: asString(fileRec.extractedText ?? fileRec.extracted_text) ?? (fileIndex === 0 ? (content || null) : null),
        metadata_json: {
          legacy_file_id: fileLegacyId,
          original_record: fileRec,
        },
      });

      if (firstReferenceFileId === null) firstReferenceFileId = refFileId;
    });

    citations.push({
      id: deterministicUuid(`assistant.knowledge_citations:${knowId}:${refId}`),
      knowledge_document_id: knowId,
      reference_document_id: refId,
      reference_file_id: firstReferenceFileId,
      citation_type: "source_link",
      locator: asString(rec.sourceUrl ?? rec.source_url) ?? asString(rec.source),
      excerpt: content ? content.slice(0, 500) : null,
      metadata_json: { legacy_id: legacyId },
    });
  });

  return { referenceDocuments, knowledgeDocuments, referenceFiles, citations, referenceIdMap, knowledgeIdMap };
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
      "Accept-Profile": ASSISTANT_SCHEMA,
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(options.rows),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PostgREST upsert failed for ${ASSISTANT_SCHEMA}.${options.table}: ${response.status} ${response.statusText}\n${text}`);
  }
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) chunks.push(items.slice(i, i + chunkSize));
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

  console.log("[migration.batch3] starting");
  console.log(`[migration.batch3] runtime file: ${runtimeFile}`);
  console.log(`[migration.batch3] searched candidates: ${searched.length}`);
  console.log(`[migration.batch3] target schema: ${ASSISTANT_SCHEMA}`);

  const store = (await readJsonFile(runtimeFile)) as LocalRuntimeStore;
  const backupPath = await backupFile(runtimeFile, backupDir, stamp);
  await ensureDir(reportDir);

  const sourceIdMapResult = await loadLatestKnowledgeSourceIdMap(reportDir);
  if (!sourceIdMapResult.file) warnings.push("No Batch 1 knowledge source id-map file was found. Source linking may be incomplete.");

  const knowledgeSourcesFromDb = await getKnowledgeSourcesFromDb(baseUrl, serviceRoleKey);
  const sourceIndex = buildKnowledgeSourceIndex(knowledgeSourcesFromDb);

  const built = buildRows({
    knowledgeDocsRaw: store.knowledgeDocuments ?? [],
    documentFilesRaw: store.documentFiles ?? [],
    sourceIndex,
  });

  console.log(`[migration.batch3] local knowledge document rows: ${Array.isArray(store.knowledgeDocuments) ? store.knowledgeDocuments.length : 0}`);
  console.log(`[migration.batch3] local document file rows: ${Array.isArray(store.documentFiles) ? store.documentFiles.length : 0}`);
  console.log(`[migration.batch3] reference document rows: ${built.referenceDocuments.length}`);
  console.log(`[migration.batch3] knowledge document rows: ${built.knowledgeDocuments.length}`);
  console.log(`[migration.batch3] reference file rows: ${built.referenceFiles.length}`);
  console.log(`[migration.batch3] citation rows: ${built.citations.length}`);

  if (built.referenceDocuments.length === 0) warnings.push("No knowledgeDocuments records detected in local runtime store.");
  if (built.referenceFiles.length === 0) warnings.push("No documentFiles rows (or inline file locators) detected for migrated records.");

  for (const batch of chunkArray(built.referenceDocuments, 100)) {
    await postgrestUpsert({ baseUrl, serviceRoleKey, table: "reference_documents", rows: batch, onConflict: "id" });
  }
  for (const batch of chunkArray(built.knowledgeDocuments, 100)) {
    await postgrestUpsert({ baseUrl, serviceRoleKey, table: "knowledge_documents", rows: batch, onConflict: "id" });
  }
  for (const batch of chunkArray(built.referenceFiles, 100)) {
    await postgrestUpsert({ baseUrl, serviceRoleKey, table: "reference_files", rows: batch, onConflict: "id" });
  }
  for (const batch of chunkArray(built.citations, 100)) {
    await postgrestUpsert({ baseUrl, serviceRoleKey, table: "knowledge_citations", rows: batch, onConflict: "id" });
  }

  const referenceDocIdMapFile = path.join(reportDir, `batch3_reference_documents_id_map_${stamp}.json`);
  const knowledgeDocIdMapFile = path.join(reportDir, `batch3_knowledge_documents_id_map_${stamp}.json`);
  await writeJsonFile(referenceDocIdMapFile, built.referenceIdMap);
  await writeJsonFile(knowledgeDocIdMapFile, built.knowledgeIdMap);

  const report = {
    timestamp: new Date().toISOString(),
    sourceFile: runtimeFile,
    backupFile: backupPath,
    targetSchema: ASSISTANT_SCHEMA,
    targetTables: [
      "assistant.reference_documents",
      "assistant.reference_files",
      "assistant.knowledge_documents",
      "assistant.knowledge_citations",
    ],
    counts: {
      localKnowledgeDocuments: Array.isArray(store.knowledgeDocuments) ? store.knowledgeDocuments.length : 0,
      localDocumentFiles: Array.isArray(store.documentFiles) ? store.documentFiles.length : 0,
      migratedReferenceDocuments: built.referenceDocuments.length,
      migratedKnowledgeDocuments: built.knowledgeDocuments.length,
      migratedReferenceFiles: built.referenceFiles.length,
      migratedKnowledgeCitations: built.citations.length,
    },
    files: {
      referenceDocIdMapFile,
      knowledgeDocIdMapFile,
      reportFile: path.join(reportDir, `migration_batch3_report_${stamp}.json`),
      sourceIdMapFileUsed: sourceIdMapResult.file,
    },
    warnings,
  };

  await writeJsonFile(report.files.reportFile, report);

  console.log("[migration.batch3] completed successfully");
  console.log(`[migration.batch3] backup: ${backupPath}`);
  console.log(`[migration.batch3] reference-doc id map: ${referenceDocIdMapFile}`);
  console.log(`[migration.batch3] knowledge-doc id map: ${knowledgeDocIdMapFile}`);
  console.log(`[migration.batch3] report: ${report.files.reportFile}`);
  if (sourceIdMapResult.file) console.log(`[migration.batch3] source id map used: ${sourceIdMapResult.file}`);
  if (warnings.length > 0) {
    console.warn("[migration.batch3] warnings:");
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
}

main().catch((error) => {
  console.error("[migration.batch3] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
