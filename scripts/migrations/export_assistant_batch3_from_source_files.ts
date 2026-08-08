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

type JsonObject = Record<string, Json>;

function getEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function timestampForFile(date = new Date()): string {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`;
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
  const override = getEnv("ASSISTANT_LOCAL_RUNTIME_FILE");
  const candidates = [
    override ? path.resolve(cwd, override) : null,
    path.resolve(cwd, ".manus", "db", "local_runtime_store.json"),
    path.resolve(cwd, ".palwakf", "runtime", "local_runtime_store.json"),
    path.resolve(cwd, ".manus", "runtime", "local_runtime_store.json"),
    path.resolve(cwd, "local_runtime_store.json"),
    path.resolve(cwd, "runtime", "local_runtime_store.json"),
  ].filter(Boolean) as string[];

  const unique = Array.from(new Set(candidates));
  for (const candidate of unique) {
    if (await fileExists(candidate)) {
      return { runtimeFile: candidate, searched: unique };
    }
  }

  throw new Error(
    ["Runtime file not found. Searched paths:", ...unique.map((p) => `- ${p}`)].join("\n"),
  );
}

function asObject(value: Json): JsonObject | null {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  return value as JsonObject;
}

function asString(value: Json): string | null {
  if (typeof value === "string") {
    const v = value.trim();
    return v.length ? v : null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function getFirstNonEmptyString(...values: Json[]): string | null {
  for (const value of values) {
    const s = asString(value);
    if (s) return s;
  }
  return null;
}

function escapeSqlText(value: string | null): string {
  if (value === null) return "null";
  return `'${value.replace(/'/g, "''")}'`;
}

function escapeSqlJson(value: unknown): string {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function toIsoOrNow(value: Json): string {
  const text = asString(value);
  if (!text) return new Date().toISOString();
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function normalizeDomainScope(category: string | null): string {
  const value = (category ?? "").toLowerCase();

  if (["fiqh", "jurisprudence", "islamic_law"].includes(value)) return "fiqh";
  if (["waqf_law", "law", "legal", "regulation", "regulations"].includes(value)) return "waqf_law";
  if (["administrative", "procedure", "procedural"].includes(value)) return "administrative";
  if (["historical", "history"].includes(value)) return "historical";
  if (["public_info", "public"].includes(value)) return "public_info";
  if (["internal_procedure", "internal"].includes(value)) return "internal_procedure";
  return "other";
}

function splitTags(tags: string | null): string[] {
  if (!tags) return [];
  return tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function deterministicUuid(seed: string): string {
  const hash = crypto.createHash("md5").update(seed).digest("hex").split("");

  hash[12] = "4";
  hash[16] = ((parseInt(hash[16], 16) & 0x3) | 0x8).toString(16);

  return `${hash.slice(0, 8).join("")}-${hash.slice(8, 12).join("")}-${hash.slice(12, 16).join("")}-${hash.slice(16, 20).join("")}-${hash.slice(20, 32).join("")}`;
}

async function readUtf8File(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

function extractTitleFromContent(content: string, fallback: string): string {
  const lines = content.split(/\r\n|\n|\r/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const headingMatch = trimmed.match(/^#\s+(.+)$/);
    if (headingMatch) return headingMatch[1].trim();
    if (!trimmed.startsWith("```")) return trimmed;
  }

  return fallback;
}

async function findFileByName(rootDir: string, targetName: string): Promise<string | null> {
  const skipDirs = new Set([
    "node_modules",
    ".git",
    ".dart_tool",
    "build",
    "dist",
    ".next",
    ".turbo",
    "coverage",
  ]);

  async function walk(dir: string): Promise<string | null> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return null;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        const found = await walk(full);
        if (found) return found;
      } else if (entry.isFile()) {
        if (entry.name === targetName) return full;
      }
    }

    return null;
  }

  return walk(rootDir);
}

async function main(): Promise<void> {
  const cwd = process.cwd();
  const { runtimeFile } = await resolveRuntimeFile(cwd);

  console.log(`[batch3.fromfiles] runtime file: ${runtimeFile}`);

  const runtimeRaw = await fs.readFile(runtimeFile, "utf8");
  const runtimeJson = JSON.parse(runtimeRaw) as JsonObject;
  const knowledgeDocs = Array.isArray(runtimeJson.knowledgeDocuments)
    ? runtimeJson.knowledgeDocuments
    : [];

  const reportDir = path.join(path.dirname(runtimeFile), "migration_reports");
  await fs.mkdir(reportDir, { recursive: true });

  const stamp = timestampForFile();
  const sqlPath = path.join(reportDir, `migration_batch3_from_files_${stamp}.sql`);

  const lines: string[] = [];
  lines.push("-- Batch 3 generated SQL from original source files");
  lines.push(`-- Source runtime: ${runtimeFile}`);
  lines.push(`-- Generated at: ${new Date().toISOString()}`);
  lines.push("begin;");
  lines.push("");

  let refCount = 0;
  let knowCount = 0;
  let fileCount = 0;
  let citeCount = 0;
  const missingFiles: string[] = [];

  for (let i = 0; i < knowledgeDocs.length; i++) {
    const rec = asObject(knowledgeDocs[i]);
    if (!rec) continue;

    const sourceName = getFirstNonEmptyString(rec.source);
    const sourceUrl = getFirstNonEmptyString(rec.sourceUrl, rec.source_url);
    const category = getFirstNonEmptyString(rec.category);
    const createdAt = toIsoOrNow(rec.createdAt);
    const updatedAt = toIsoOrNow(rec.updatedAt);

    let relativePath: string | null = null;
    if (sourceUrl && sourceUrl.startsWith("local://")) {
      relativePath = sourceUrl.slice("local://".length);
    }

    let absolutePath: string | null = null;

    if (relativePath) {
      const candidate = path.resolve(cwd, relativePath);
      if (await fileExists(candidate)) {
        absolutePath = candidate;
      }
    }

    if (!absolutePath && sourceName) {
      absolutePath = await findFileByName(cwd, sourceName);
      if (absolutePath) {
        relativePath = path.relative(cwd, absolutePath).replace(/\\/g, "/");
      }
    }

    if (!absolutePath) {
      missingFiles.push(sourceName ?? `index:${i}`);
      continue;
    }

    const content = await readUtf8File(absolutePath);
    const fallbackTitle = sourceName
      ? path.parse(sourceName).name
      : `Source File ${i + 1}`;
    const title = extractTitleFromContent(content, fallbackTitle);

    const legacyId = getFirstNonEmptyString(rec.id, rec.documentId) ?? `index:${i}`;
    const refId = deterministicUuid(`assistant.reference_documents:${legacyId}:${title}`);
    const knowId = deterministicUuid(`assistant.knowledge_documents:${legacyId}:${title}`);
    const fileId = deterministicUuid(`assistant.reference_files:${legacyId}:${refId}`);
    const citeId = deterministicUuid(`assistant.knowledge_citations:${knowId}:${refId}`);

    const domain = normalizeDomainScope(category);
    const tags = splitTags(getFirstNonEmptyString(rec.tags));

    const sourceIdSql = sourceName
      ? `(select id from assistant.knowledge_sources ks where ks.name = ${escapeSqlText(sourceName)} limit 1)`
      : "null";

    const refMeta = {
      legacy_id: legacyId,
      legacy_source_name: sourceName,
      legacy_source_url: sourceUrl,
      source_file_relative_path: relativePath,
      original_record: rec,
    };

    const knowMeta = {
      legacy_id: legacyId,
      legacy_source_name: sourceName,
      legacy_source_url: sourceUrl,
      source_file_relative_path: relativePath,
      original_record: rec,
    };

    const fileMeta = {
      legacy_file_id: legacyId,
      source_file_relative_path: relativePath,
      source_file_absolute_path: absolutePath,
    };

    const citeMeta = {
      legacy_id: legacyId,
      source_file_relative_path: relativePath,
    };

    const storagePath = `local://${(relativePath ?? sourceName ?? `unknown/${legacyId}`).replace(/\\/g, "/")}`;
    const mimeType = absolutePath.endsWith(".md")
      ? "text/markdown"
      : absolutePath.endsWith(".txt")
        ? "text/plain"
        : "text/plain";

    const fileSize = (await fs.stat(absolutePath)).size;
    const excerpt = content.length > 500 ? content.slice(0, 500) : content;

    lines.push("insert into assistant.reference_documents (");
    lines.push("  id, source_id, title, document_type, language, status, authority_level, domain_scope, source_type,");
    lines.push("  summary, content_text, content_hash, metadata_json, effective_from, effective_to, approval_version,");
    lines.push("  review_notes, review_decision, reviewed_by, reviewed_at, created_by, created_at, updated_at");
    lines.push(") values (");
    lines.push(`  ${escapeSqlText(refId)},`);
    lines.push(`  ${sourceIdSql},`);
    lines.push(`  ${escapeSqlText(title)},`);
    lines.push("  'knowledge_seed',");
    lines.push("  'ar',");
    lines.push("  'approved',");
    lines.push("  'reference',");
    lines.push(`  ${escapeSqlText(domain)},`);
    lines.push("  'seeded',");
    lines.push("  null,");
    lines.push(`  ${escapeSqlText(content)},`);
    lines.push("  null,");
    lines.push(`  ${escapeSqlJson(refMeta)},`);
    lines.push("  null,");
    lines.push("  null,");
    lines.push("  1,");
    lines.push("  null,");
    lines.push("  'approve',");
    lines.push("  null,");
    lines.push(`  ${escapeSqlText(createdAt)},`);
    lines.push("  null,");
    lines.push(`  ${escapeSqlText(createdAt)},`);
    lines.push(`  ${escapeSqlText(updatedAt)}`);
    lines.push(")");
    lines.push("on conflict (id) do update set");
    lines.push("  source_id = excluded.source_id,");
    lines.push("  title = excluded.title,");
    lines.push("  content_text = excluded.content_text,");
    lines.push("  metadata_json = excluded.metadata_json,");
    lines.push("  updated_at = excluded.updated_at;");
    lines.push("");
    refCount++;

    lines.push("insert into assistant.knowledge_documents (");
    lines.push("  id, reference_document_id, source_id, title, category, status, authority_level, domain_scope, source_type,");
    lines.push("  summary, content, tags, is_chat_eligible, chat_priority, grounding_weight, approval_version,");
    lines.push("  review_notes, review_decision, reviewed_by, reviewed_at, effective_from, effective_to, supersedes_document_id,");
    lines.push("  metadata_json, created_by, created_at, updated_at");
    lines.push(") values (");
    lines.push(`  ${escapeSqlText(knowId)},`);
    lines.push(`  ${escapeSqlText(refId)},`);
    lines.push(`  ${sourceIdSql},`);
    lines.push(`  ${escapeSqlText(title)},`);
    lines.push(`  ${escapeSqlText(category)},`);
    lines.push("  'approved',");
    lines.push("  'reference',");
    lines.push(`  ${escapeSqlText(domain)},`);
    lines.push("  'seeded',");
    lines.push("  null,");
    lines.push(`  ${escapeSqlText(content)},`);
    lines.push(`  ${escapeSqlJson(tags)},`);
    lines.push("  true,");
    lines.push("  50,");
    lines.push("  1.0,");
    lines.push("  1,");
    lines.push("  null,");
    lines.push("  'approve',");
    lines.push("  null,");
    lines.push(`  ${escapeSqlText(createdAt)},`);
    lines.push("  null,");
    lines.push("  null,");
    lines.push("  null,");
    lines.push(`  ${escapeSqlJson(knowMeta)},`);
    lines.push("  null,");
    lines.push(`  ${escapeSqlText(createdAt)},`);
    lines.push(`  ${escapeSqlText(updatedAt)}`);
    lines.push(")");
    lines.push("on conflict (id) do update set");
    lines.push("  reference_document_id = excluded.reference_document_id,");
    lines.push("  source_id = excluded.source_id,");
    lines.push("  title = excluded.title,");
    lines.push("  category = excluded.category,");
    lines.push("  content = excluded.content,");
    lines.push("  tags = excluded.tags,");
    lines.push("  is_chat_eligible = excluded.is_chat_eligible,");
    lines.push("  metadata_json = excluded.metadata_json,");
    lines.push("  updated_at = excluded.updated_at;");
    lines.push("");
    knowCount++;

    lines.push("insert into assistant.reference_files (");
    lines.push("  id, reference_document_id, storage_path, original_filename, mime_type, file_size_bytes,");
    lines.push("  file_hash, is_primary, ocr_text, extracted_text, metadata_json");
    lines.push(") values (");
    lines.push(`  ${escapeSqlText(fileId)},`);
    lines.push(`  ${escapeSqlText(refId)},`);
    lines.push(`  ${escapeSqlText(storagePath)},`);
    lines.push(`  ${escapeSqlText(sourceName)},`);
    lines.push(`  ${escapeSqlText(mimeType)},`);
    lines.push(`  ${fileSize},`);
    lines.push("  null,");
    lines.push("  true,");
    lines.push("  null,");
    lines.push(`  ${escapeSqlText(content)},`);
    lines.push(`  ${escapeSqlJson(fileMeta)}`);
    lines.push(")");
    lines.push("on conflict (id) do update set");
    lines.push("  storage_path = excluded.storage_path,");
    lines.push("  original_filename = excluded.original_filename,");
    lines.push("  mime_type = excluded.mime_type,");
    lines.push("  file_size_bytes = excluded.file_size_bytes,");
    lines.push("  extracted_text = excluded.extracted_text,");
    lines.push("  metadata_json = excluded.metadata_json;");
    lines.push("");
    fileCount++;

    lines.push("insert into assistant.knowledge_citations (");
    lines.push("  id, knowledge_document_id, reference_document_id, reference_file_id, citation_type, locator, excerpt, metadata_json");
    lines.push(") values (");
    lines.push(`  ${escapeSqlText(citeId)},`);
    lines.push(`  ${escapeSqlText(knowId)},`);
    lines.push(`  ${escapeSqlText(refId)},`);
    lines.push(`  ${escapeSqlText(fileId)},`);
    lines.push("  'source_file',");
    lines.push(`  ${escapeSqlText(storagePath)},`);
    lines.push(`  ${escapeSqlText(excerpt)},`);
    lines.push(`  ${escapeSqlJson(citeMeta)}`);
    lines.push(")");
    lines.push("on conflict (id) do update set");
    lines.push("  reference_file_id = excluded.reference_file_id,");
    lines.push("  locator = excluded.locator,");
    lines.push("  excerpt = excluded.excerpt,");
    lines.push("  metadata_json = excluded.metadata_json;");
    lines.push("");
    citeCount++;
  }

  lines.push("commit;");
  lines.push("");

  await fs.writeFile(sqlPath, lines.join("\n"), "utf8");

  console.log(`[batch3.fromfiles] generated reference documents: ${refCount}`);
  console.log(`[batch3.fromfiles] generated knowledge documents: ${knowCount}`);
  console.log(`[batch3.fromfiles] generated reference files: ${fileCount}`);
  console.log(`[batch3.fromfiles] generated citations: ${citeCount}`);
  console.log(`[batch3.fromfiles] sql file: ${sqlPath}`);

  if (missingFiles.length > 0) {
    console.log("[batch3.fromfiles] missing source files:");
    for (const missing of missingFiles) {
      console.log(` - ${missing}`);
    }
  }
}

main().catch((error) => {
  console.error("[batch3.fromfiles] failed");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
