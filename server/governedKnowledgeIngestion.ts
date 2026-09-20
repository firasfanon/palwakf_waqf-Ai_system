import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { load as loadHtml } from "cheerio";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import {
  DEFAULT_EMBEDDING_MODEL,
  generateLocalEmbeddings,
  toPgVectorLiteral,
} from "./knowledgeEmbeddings";

type JsonMap = Record<string, any>;

export type IngestionInputKind =
  | "upload"
  | "manual"
  | "url"
  | "learning_candidate"
  | "existing_reference";

export type RetentionBasis =
  | "user_provided"
  | "internal"
  | "verified_rights"
  | "metadata_only"
  | "review_required";

export type StructuredChunk = {
  index: number;
  sectionType:
    | "article"
    | "holding"
    | "reasoning"
    | "facts"
    | "waqf_clause"
    | "heading"
    | "paragraph"
    | "table"
    | "metadata"
    | "other";
  heading: string | null;
  locator: string;
  content: string;
  contentHash: string;
  tokenCount: number;
};

const SECTION_PATTERNS: Array<{
  type: StructuredChunk["sectionType"];
  pattern: RegExp;
}> = [
  { type: "article", pattern: /^\s*(?:المادة|مادة)\s*[\(\[]?\s*[\d٠-٩]+/u },
  { type: "holding", pattern: /^\s*(?:الحكم|القرار|لهذه الأسباب|المنطوق)(?:\s|:|$)/u },
  { type: "reasoning", pattern: /^\s*(?:الأسباب|التعليل|المحكمة|التسبيب)(?:\s|:|$)/u },
  { type: "facts", pattern: /^\s*(?:الوقائع|الطلبات|الادعاءات|الطعن)(?:\s|:|$)/u },
  {
    type: "waqf_clause",
    pattern:
      /^\s*(?:الواقف|الموقوف|الموقوف عليه|شرط الواقف|شروط الواقف|ريع الوقف|مصارف الوقف|حدود الوقف)(?:\s|:|$)/u,
  },
];

function normalizeWhitespace(value: string) {
  return value.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function normalizeEntityAlias(value: string): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function approxTokens(value: string) {
  return Math.max(1, Math.ceil(value.length / 4));
}

function classifySection(line: string): StructuredChunk["sectionType"] {
  for (const rule of SECTION_PATTERNS) {
    if (rule.pattern.test(line)) return rule.type;
  }
  if (/^\s*(?:#+\s+|\d+[.)-]\s+|[أ-ي][.)-]\s+)/u.test(line)) return "heading";
  return "paragraph";
}
function splitLongParagraph(text: string, targetChars: number): string[] {
  if (text.length <= targetChars) return [text];
  const sentences = text.split(/(?<=[.!؟؛])\s+/u).filter(Boolean);
  const out: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && current.length + sentence.length + 1 > targetChars) {
      out.push(current.trim());
      current = sentence;
    } else {
      current += (current ? " " : "") + sentence;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out.length ? out : [text.slice(0, targetChars), text.slice(targetChars)];
}

export function structuralChunkDocument(
  rawText: string,
  options?: { targetChars?: number; maxChars?: number },
): StructuredChunk[] {
  const targetChars = Math.max(500, options?.targetChars || 1400);
  const maxChars = Math.max(targetChars, options?.maxChars || 2200);
  const text = normalizeWhitespace(rawText);
  if (!text) return [];

  const lines = text.split("\n");
  const sections: Array<{ type: StructuredChunk["sectionType"]; heading: string | null; body: string[] }> = [];
  let current = { type: "paragraph" as StructuredChunk["sectionType"], heading: null as string | null, body: [] as string[] };

  const push = () => {
    const body = current.body.join("\n").trim();
    if (body) sections.push({ ...current, body: [body] });
  };

  for (const lineRaw of lines) {
    const line = lineRaw.trim();
    if (!line) {
      if (current.body.length) current.body.push("");
      continue;
    }
    const type = classifySection(line);
    const startsSection = type !== "paragraph";
    if (startsSection && current.body.some((part) => part.trim())) {
      push();
      current = { type, heading: line, body: [line] };
    } else if (startsSection) {
      current.type = type;
      current.heading = line;
      current.body.push(line);
    } else {
      current.body.push(line);
    }
  }
  push();

  const chunks: StructuredChunk[] = [];
  for (const section of sections) {
    const body = section.body.join("\n").trim();
    const pieces = splitLongParagraph(body, targetChars);
    for (const piece of pieces) {
      if (!piece.trim()) continue;
      const safePieces =
        piece.length > maxChars
          ? Array.from({ length: Math.ceil(piece.length / maxChars) }, (_, i) =>
              piece.slice(i * maxChars, (i + 1) * maxChars),
            )
          : [piece];
      for (const safe of safePieces) {
        const index = chunks.length;
        chunks.push({
          index,
          sectionType: section.type,
          heading: section.heading,
          locator: section.heading
            ? `${section.heading.slice(0, 180)} · جزء ${safePieces.indexOf(safe) + 1}`
            : `مقطع ${index + 1}`,
          content: safe.trim(),
          contentHash: sha256(safe.trim()),
          tokenCount: approxTokens(safe.trim()),
        });
      }
    }
  }
  return chunks;
}

export async function extractDocumentText(input: {
  buffer: Buffer;
  mimeType?: string | null;
  filename?: string | null;
}): Promise<string> {
  const mime = String(input.mimeType || "").toLowerCase();
  const filename = String(input.filename || "").toLowerCase();

  if (mime.includes("pdf") || filename.endsWith(".pdf")) {
    const parser = new PDFParse({ data: new Uint8Array(input.buffer) });
    try {
      const result = await parser.getText();
      return normalizeWhitespace(result.text || "");
    } finally {
      await parser.destroy();
    }
  }

  if (
    mime.includes("wordprocessingml") ||
    filename.endsWith(".docx")
  ) {
    const result = await mammoth.extractRawText({ buffer: input.buffer });
    return normalizeWhitespace(result.value || "");
  }

  const decoded = input.buffer.toString("utf8");
  if (mime.includes("html") || filename.endsWith(".html") || filename.endsWith(".htm")) {
    return normalizeWhitespace(loadHtml(decoded).text());
  }

  if (
    mime.startsWith("text/") ||
    /\.(txt|md|markdown|csv|json|xml|yaml|yml)$/i.test(filename)
  ) {
    return normalizeWhitespace(decoded);
  }

  throw new Error(
    "Unsupported document type for deterministic extraction. Images/scans require a separate reviewed OCR workflow.",
  );
}
function serviceClient(): SupabaseClient<any, any, any, any, any> {
  const url =
    process.env.PWF_SUPABASE_URL?.trim() ||
    process.env.PLATFORM_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key =
    process.env.PWF_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.PLATFORM_SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Governed ingestion requires server-only Supabase service credentials; no browser credential fallback is allowed.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "assistant" },
    global: { headers: { "x-assistant-runtime": "waqf-ai-governed-ingestion-v1" } },
  });
}

async function ensureRetentionAllowed(input: {
  client: SupabaseClient<any, any, any, any, any>;
  sourceId?: string | null;
  inputKind: IngestionInputKind;
  retentionBasis: RetentionBasis;
}) {
  if (input.retentionBasis === "metadata_only") return false;
  if (["upload", "manual"].includes(input.inputKind) &&
      ["user_provided", "internal"].includes(input.retentionBasis)) {
    return true;
  }
  if (input.retentionBasis !== "verified_rights" || !input.sourceId) {
    throw new Error(
      "External full-text ingestion requires verified_rights and an existing reviewed source.",
    );
  }
  const { data, error } = await input.client
    .from("source_rights_profiles")
    .select("review_status,full_text_retention_allowed,rights_status")
    .eq("source_id", input.sourceId)
    .maybeSingle();
  if (error) throw error;
  if (
    data?.review_status !== "verified" ||
    data?.full_text_retention_allowed !== true ||
    !["licensed", "permission_recorded", "public_domain", "official_publication"].includes(
      String(data?.rights_status || ""),
    )
  ) {
    throw new Error("Verified source rights do not permit full-text retention.");
  }
  return true;
}

async function loadVerifiedAliases(client: SupabaseClient<any, any, any, any, any>) {
  const { data, error } = await client
    .from("knowledge_entity_aliases")
    .select("entity_id,alias,normalized_alias,is_verified");
  if (error) throw error;
  return data || [];
}

export function matchEntityAliases(
  text: string,
  aliases: Array<{ entity_id: string; alias: string; normalized_alias: string; is_verified?: boolean }>,
) {
  const normalized = normalizeEntityAlias(text);
  const hits = new Map<string, { entityId: string; alias: string; verified: boolean }>();
  for (const alias of aliases) {
    if (!alias.normalized_alias || !normalized.includes(alias.normalized_alias)) continue;
    const existing = hits.get(alias.entity_id);
    if (!existing || alias.normalized_alias.length > normalizeEntityAlias(existing.alias).length) {
      hits.set(alias.entity_id, {
        entityId: alias.entity_id,
        alias: alias.alias,
        verified: Boolean(alias.is_verified),
      });
    }
  }
  return [...hits.values()];
}
export async function ingestGovernedKnowledge(input: {
  reviewerAuthUserId: string;
  inputKind: IngestionInputKind;
  retentionBasis: RetentionBasis;
  title: string;
  content: string;
  sourceId?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  documentType?: string | null;
  category?: string | null;
  domainScope?: string | null;
  language?: string | null;
  originalFilename?: string | null;
  mimeType?: string | null;
  metadataJson?: JsonMap;
}) {
  const c = serviceClient();
  const title = input.title.trim();
  const content = normalizeWhitespace(input.content);
  if (!title) throw new Error("Document title is required.");
  if (!content && input.retentionBasis !== "metadata_only") {
    throw new Error("Extracted document content is empty.");
  }

  let sourceId = input.sourceId || null;
  const fullTextAllowed = await ensureRetentionAllowed({
    client: c,
    sourceId,
    inputKind: input.inputKind,
    retentionBasis: input.retentionBasis,
  });

  if (!sourceId) {
    if (!input.sourceName?.trim()) throw new Error("Source name is required for a new source.");
    const { data, error } = await c
      .from("knowledge_sources")
      .insert({
        name: input.sourceName.trim(),
        type: input.inputKind === "url" ? "external_fetch" : "manual",
        base_url: input.sourceUrl?.trim() || null,
        authority_level: "unverified",
        verification_status: "pending",
        review_required: true,
        is_active: true,
        metadata_json: {
          ingestion_origin: "WAQF_AI_GOVERNED_KNOWLEDGE_INGESTION_AND_RAG_V1",
          automatic_authority_assignment: false,
        },
      })
      .select("id")
      .single();
    if (error) throw error;
    sourceId = data.id;

    await c.from("source_rights_profiles").upsert({
      source_id: sourceId,
      rights_status: "review_required",
      full_text_retention_allowed: fullTextAllowed,
      rag_eligibility: "review_only",
      public_display_eligibility: "metadata_only",
      review_status: "pending",
      notes: "Created by governed ingestion; no rights conclusion or public/RAG release implied.",
      metadata_json: {
        retention_basis: input.retentionBasis,
        automatic_rag_release: false,
      },
    });
  }

  const { data: job, error: jobError } = await c
    .from("knowledge_ingestion_jobs")
    .insert({
      source_id: sourceId,
      input_kind: input.inputKind,
      input_locator: input.sourceUrl?.trim() || null,
      original_filename: input.originalFilename || null,
      mime_type: input.mimeType || null,
      status: fullTextAllowed ? "extracted" : "review_pending",
      retention_basis: input.retentionBasis,
      full_text_allowed: fullTextAllowed,
      requested_by: input.reviewerAuthUserId,
      metadata_json: input.metadataJson || {},
    })
    .select("id")
    .single();
  if (jobError) throw jobError;

  if (!fullTextAllowed) {
    return {
      ingestionJobId: job.id,
      sourceId,
      status: "review_pending",
      fullTextRetained: false,
      chunks: 0,
      chatEligible: false,
    };
  }

  const { data: reference, error: referenceError } = await c
    .from("reference_documents")
    .insert({
      source_id: sourceId,
      title,
      document_type: input.documentType || "reference",
      language: input.language || "ar",
      status: "in_review",
      authority_level: "unverified",
      domain_scope: input.domainScope || "other",
      source_type: input.inputKind === "upload" ? "pdf_upload" : input.inputKind === "url" ? "external_fetch" : "manual",
      content_text: content,
      content_hash: sha256(content),
      verification_status: "pending",
      content_status: "review",
      visibility_scope: "internal",
      metadata_json: {
        ingestion_job_id: job.id,
        retention_basis: input.retentionBasis,
        full_text_retention_allowed: true,
        ...(input.metadataJson || {}),
      },
    })
    .select("id")
    .single();
  if (referenceError) throw referenceError;

  const { data: knowledge, error: knowledgeError } = await c
    .from("knowledge_documents")
    .insert({
      reference_document_id: reference.id,
      source_id: sourceId,
      title,
      category: input.category || "reference",
      status: "in_review",
      authority_level: "unverified",
      domain_scope: input.domainScope || "other",
      source_type: input.inputKind === "upload" ? "pdf_upload" : input.inputKind === "url" ? "external_fetch" : "manual",
      content,
      tags: [],
      is_chat_eligible: false,
      content_status: "review",
      visibility_scope: "internal",
      requires_human_review: true,
      review_decision: null,
      metadata_json: {
        ingestion_job_id: job.id,
        retention_basis: input.retentionBasis,
        source_verification_status: "pending",
        citation_verification_status: "linked",
        automatic_chat_release: false,
        ...(input.metadataJson || {}),
      },
    })
    .select("id")
    .single();
  if (knowledgeError) throw knowledgeError;

  const { data: citation, error: citationError } = await c
    .from("knowledge_citations")
    .insert({
      knowledge_document_id: knowledge.id,
      reference_document_id: reference.id,
      citation_type: "ingestion_reference",
      locator: "Full source document — locator requires human verification.",
      verification_status: "linked",
      metadata_json: {
        ingestion_job_id: job.id,
        citation_verification_status: "linked",
      },
    })
    .select("id")
    .single();
  if (citationError) throw citationError;
  const chunks = structuralChunkDocument(content);
  const aliases = await loadVerifiedAliases(c);
  const vectors: number[][] = [];
  const batchSize = 8;
  for (let i = 0; i < chunks.length; i += batchSize) {
    vectors.push(
      ...(await generateLocalEmbeddings(
        chunks.slice(i, i + batchSize).map((chunk) => chunk.content),
      )),
    );
  }

  const chunkRows = chunks.map((chunk, i) => ({
    ingestion_job_id: job.id,
    knowledge_document_id: knowledge.id,
    reference_document_id: reference.id,
    source_id: sourceId,
    chunk_index: chunk.index,
    section_type: chunk.sectionType,
    heading: chunk.heading,
    locator: chunk.locator,
    content: chunk.content,
    content_hash: chunk.contentHash,
    token_count: chunk.tokenCount,
    embedding: toPgVectorLiteral(vectors[i]),
    embedding_model: DEFAULT_EMBEDDING_MODEL,
    embedding_status: "ready",
    metadata_json: { structural_chunking: "v1" },
  }));

  const { data: insertedChunks, error: chunksError } = await c
    .from("knowledge_chunks")
    .insert(chunkRows)
    .select("id,content,chunk_index");
  if (chunksError) throw chunksError;

  for (const chunk of insertedChunks || []) {
    const entityHits = matchEntityAliases(chunk.content, aliases);
    if (entityHits.length) {
      const { error } = await c.from("knowledge_chunk_entities").upsert(
        entityHits.map((hit) => ({
          chunk_id: chunk.id,
          entity_id: hit.entityId,
          match_type: "alias",
          confidence: hit.verified ? 1 : 0.8,
          is_verified: hit.verified,
          metadata_json: { matched_alias: hit.alias },
        })),
      );
      if (error) throw error;
    }

    const { error: chunkCitationError } = await c.from("knowledge_chunk_citations").upsert({
      chunk_id: chunk.id,
      citation_id: citation.id,
      locator_snapshot: "Pending human locator verification.",
      excerpt_snapshot: chunk.content.slice(0, 1000),
    });
    if (chunkCitationError) throw chunkCitationError;
  }

  const reviewTasks = [
    {
      target_type: "reference_document",
      target_id: reference.id,
      workflow_stage: "source_verification",
      priority: "high",
      status: "open",
      dedupe_key: `ingestion_source_verification:${reference.id}`,
      notes: "Verify source identity, authority and canonical URL.",
    },
    {
      target_type: "knowledge_document",
      target_id: knowledge.id,
      workflow_stage: "citation_verification",
      priority: "high",
      status: "open",
      dedupe_key: `ingestion_citation_verification:${knowledge.id}`,
      notes: "Verify exact locator/excerpt against the retained reference.",
    },
    {
      target_type: "knowledge_document",
      target_id: knowledge.id,
      workflow_stage: "content_classification",
      priority: "normal",
      status: "open",
      dedupe_key: `ingestion_content_classification:${knowledge.id}`,
      notes: "Review classification, domain, entities and duplicate risk.",
    },
    {
      target_type: "knowledge_document",
      target_id: knowledge.id,
      workflow_stage: "human_approval",
      priority: "high",
      status: "blocked",
      dedupe_key: `ingestion_human_approval:${knowledge.id}`,
      notes: "Blocked until source, citation and rights gates are satisfied.",
    },
  ];
  const { error: taskError } = await c.from("knowledge_review_tasks").upsert(
    reviewTasks.map((task) => ({
      ...task,
      metadata_json: {
        ingestion_job_id: job.id,
        automatic_promotion: false,
      },
    })),
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (taskError) throw taskError;

  await c
    .from("knowledge_ingestion_jobs")
    .update({
      reference_document_id: reference.id,
      knowledge_document_id: knowledge.id,
      status: "review_pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", job.id);

  return {
    ingestionJobId: job.id,
    sourceId,
    referenceDocumentId: reference.id,
    knowledgeDocumentId: knowledge.id,
    citationId: citation.id,
    status: "review_pending",
    chunks: chunks.length,
    embeddingModel: DEFAULT_EMBEDDING_MODEL,
    chatEligible: false,
    automaticPromotion: false,
  };
}
