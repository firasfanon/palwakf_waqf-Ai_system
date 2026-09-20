export const LEGACY_MANUS_FINAL_CONTENT_CLOSURE_BATCH =
  "legacy_manus_final_content_closure_v1";

const BLOCKED_PUBLIC_CONTENT_STATUSES = new Set([
  "test",
  "duplicate",
  "quarantined",
  "rejected",
  "archived",
]);

const TEST_TITLE_PATTERN =
  /(^|\s)(minimal\s+test|test\s+document|اختبار|تجريبي|demo|sample)(\s|$)/i;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function lower(value: unknown): string {
  return text(value).toLowerCase();
}

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

export function resolveAssistantSupabaseConfig(
  env: NodeJS.ProcessEnv = process.env,
) {
  const url =
    text(env.PWF_SUPABASE_URL) ||
    text(env.PLATFORM_SUPABASE_URL) ||
    text(env.SUPABASE_URL) ||
    text(env.VITE_SUPABASE_URL);

  const key =
    text(env.PWF_SUPABASE_SERVICE_ROLE_KEY) ||
    text(env.PLATFORM_SUPABASE_SERVICE_ROLE_KEY) ||
    text(env.SUPABASE_SERVICE_ROLE_KEY) ||
    text(env.PWF_SUPABASE_ANON_KEY) ||
    text(env.PLATFORM_SUPABASE_ANON_KEY) ||
    text(env.SUPABASE_ANON_KEY) ||
    text(env.VITE_SUPABASE_ANON_KEY);

  return url && key ? { url, key } : null;
}

export function isLegacyReviewContentUatEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  return ["1", "true", "yes", "on"].includes(
    lower(env.LEGACY_CONTENT_UAT_ENABLED),
  );
}

export function isPublicKnowledgeDocument(document: any): boolean {
  const metadata = asObject(document?.metadataJson ?? document?.metadata_json);
  const status = lower(document?.status);
  const visibilityScope = lower(
    metadata.visibility_scope ?? metadata.visibilityScope ?? "public",
  );
  const contentStatus = lower(
    metadata.content_status ?? metadata.contentStatus ?? "production",
  );
  const toolOrigin = lower(
    document?.toolOrigin ?? document?.tool_origin ?? metadata.tool_origin,
  );

  if (status !== "approved") return false;
  if (visibilityScope !== "public") return false;
  if (BLOCKED_PUBLIC_CONTENT_STATUSES.has(contentStatus)) return false;
  if (TEST_TITLE_PATTERN.test(text(document?.title))) return false;
  if (toolOrigin === "waqf_research_answer") return false;
  return true;
}

export function filterPublicKnowledgeDocuments(
  rows: any[],
  filters?: { category?: string; search?: string; limit?: number },
) {
  const category = text(filters?.category);
  const search = lower(filters?.search);
  const limit = Math.min(Math.max(Number(filters?.limit ?? 1000), 1), 1000);

  return (rows || [])
    .filter(isPublicKnowledgeDocument)
    .filter((doc) => (category ? text(doc?.category) === category : true))
    .filter((doc) =>
      search
        ? lower(
            [
              doc?.title,
              doc?.content,
              doc?.tags,
              doc?.source,
              doc?.sourceUrl,
            ].join(" "),
          ).includes(search)
        : true,
    )
    .slice(0, limit);
}

export function scorePublicKnowledgeSearch(query: string, document: any) {
  const q = lower(query);
  if (!q) return 1;

  const title = lower(document?.title);
  const tags = lower(document?.tags);
  const source = lower(document?.source);
  const content = lower(document?.content);

  let score = 0;
  if (title === q) score += 120;
  else if (title.includes(q)) score += 80;
  if (tags.includes(q)) score += 35;
  if (source.includes(q)) score += 20;
  if (content.includes(q)) score += 10;
  return Math.max(score, 1);
}

export function mapPublicKnowledgeRpcPayload(payload: any) {
  const metadata = asObject(payload?.metadataJson ?? payload?.metadata_json);
  const referenceDocument =
    payload?.referenceDocument ?? payload?.reference_document ?? null;
  const citations = Array.isArray(payload?.citations) ? payload.citations : [];

  return {
    ...payload,
    id: payload?.id ?? payload?.uuid,
    uuid: payload?.uuid ?? payload?.id,
    sourceUrl:
      payload?.sourceUrl ??
      payload?.source_url ??
      metadata.legacy_source_url ??
      metadata.source_url ??
      metadata?.original_payload?.row?.url ??
      null,
    isActive: 1,
    status: "approved",
    isChatEligible: payload?.isChatEligible ?? payload?.is_chat_eligible ?? 0,
    metadataJson: metadata,
    referenceDocument,
    citations,
    runtimeSource: "supabase_public_projection",
  };
}

export type LegacyReviewContentKind = "faqs" | "suggested_questions";

export function mapLegacyReviewContentPayload(
  kind: LegacyReviewContentKind,
  payload: any,
  ordinal = 0,
) {
  const row = asObject(payload);
  const displayOrder = Number(
    row.order ?? row.display_order ?? row.displayOrder ?? ordinal + 1,
  );
  const safeOrder = Number.isFinite(displayOrder) ? displayOrder : ordinal + 1;

  if (kind === "faqs") {
    return {
      id: -Math.max(1, safeOrder),
      question: text(row.question),
      answer: text(row.answer),
      category: text(row.category) || "general",
      order: safeOrder,
      viewCount: 0,
      isActive: true,
      reviewOnly: true,
      runtimeSource: "legacy_manus_review_staging",
    };
  }

  return {
    id: -Math.max(1, safeOrder),
    question: text(row.question),
    category: text(row.category) || "general",
    displayOrder: safeOrder,
    isActive: true,
    reviewOnly: true,
    runtimeSource: "legacy_manus_review_staging",
  };
}
