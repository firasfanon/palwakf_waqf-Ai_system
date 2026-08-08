import { createHash, randomUUID } from 'node:crypto';
import { invokeLLM } from './_core/llm';
import {
  runtimeGetKnowledgeDocumentByExactUuid,
  runtimeGetKnowledgeDocumentById,
  runtimeGetKnowledgeDocuments,
} from './runtimeRepository';
import { getVerifiedSourceSelectionAndControlledReleasePlan } from './verifiedSourceSelection';
import { getAutonomousExternalSourceVerification } from './externalSourceVerification';

/**
 * MEGA_BATCH_AR1 — GOVERNED_AGENTIC_RAG_INTERNAL_PILOT_VERTICAL_SLICE
 *
 * Internal-only, ephemeral Agentic RAG pilot. This service never fetches from
 * the web, never writes sources/rights/documents/chunks/vectors, and never
 * releases Chat or public output. A pilot session is an explicit operator
 * attestation over an existing C4-selected knowledge_document association.
 *
 * Important: evidence tier values are session-scoped operator declarations;
 * AR1 does not promote source records or change durable rights state.
 */

const MAX_BINDINGS = 5;
const MAX_ACTIVE_SESSIONS = 8;
const SESSION_TTL_MS = 30 * 60 * 1_000;
const MAX_QUESTION_LENGTH = 1_600;
const MAX_CONTEXT_PER_DOCUMENT = 900;
const MAX_ANSWER_LENGTH = 7_000;

export type EvidenceTier = 'T3_CONTROLLED_INTERNAL_EVIDENCE' | 'T4_VERIFIED_CITATION_EVIDENCE';

type KnowledgeDocumentLike = {
  id: number | string;
  title: string;
  content: string;
  category?: string | null;
  source?: string | null;
  sourceUrl?: string | null;
  referenceDocumentId?: number | string | null;
  tags?: string | null;
  updatedAt?: string | null;
};

type CandidateResolutionMethod =
  | 'C4_DIRECT_MATERIAL_REFERENCE'
  | 'C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION'
  | 'DETERMINISTIC_TITLE_EXACT'
  | 'DETERMINISTIC_URL_EXACT'
  | 'DETERMINISTIC_TITLE_AND_URL_EXACT';

type CandidateRow = {
  clusterKey: string;
  clusterTitle: string | null;
  documentId: string;
  documentTitle: string;
  category: string | null;
  source: string | null;
  sourceUrl: string | null;
  c4CheckedAt: string | null;
  c4Disposition: string;
  c4DispositionLabel: string;
  resolutionMethod: CandidateResolutionMethod;
  resolutionLabel: string;
  resolutionEvidence: string[];
  operatorConfirmationRequired: true;
};

type CandidateCatalog = {
  status: string;
  reason: string | null;
  candidates: CandidateRow[];
  c3EvidenceExpiresAt: string | null;
  resolutionSummary: {
    directC4MaterialReferences: number;
    directReferenceDocumentAssociations: number;
    deterministicExactMatches: number;
    rejectedFuzzyOrAmbiguousMatches: number;
    rejectedAmbiguousDirectAssociations: number;
  };
};

type PilotBinding = {
  clusterKey: string;
  documentId: string;
  documentTitle: string;
  evidenceTier: EvidenceTier;
  internalUseApprovalRef: string;
  resolutionMethod: CandidateResolutionMethod;
  resolutionEvidence: string[];
};

type PilotEvent = {
  at: string;
  type: 'session_started' | 'question_received' | 'answer_returned' | 'abstained' | 'escalated' | 'session_rolled_back';
  details: Record<string, unknown>;
};

type PilotSession = {
  id: string;
  operatorId: string;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'rolled_back';
  rightsApprovalRef: string;
  reviewerNote: string | null;
  bindings: PilotBinding[];
  events: PilotEvent[];
};

type Citation = {
  citationId: string;
  documentId: string;
  title: string;
  source: string | null;
  sourceUrl: string | null;
  evidenceTier: EvidenceTier;
  clusterKey: string;
  excerpt: string;
  relevanceScore: number;
};

const sessions = new Map<string, PilotSession>();

function nowIso(): string {
  return new Date().toISOString();
}

function clean(value: unknown, max = 2_000): string | null {
  if (typeof value !== 'string') return null;
  const result = value.trim().replace(/\s+/g, ' ');
  return result ? result.slice(0, max) : null;
}

function digest(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

function normalizeArabicText(value: unknown): string {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeComparableUrl(value: unknown): string | null {
  const raw = clean(value, 2_000);
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    const path = parsed.pathname.replace(/\/+$/, '') || '/';
    return `${parsed.protocol.toLowerCase()}//${parsed.hostname.toLowerCase()}${path}`;
  } catch {
    return raw.toLowerCase().replace(/[#?].*$/, '').replace(/\/+$/, '');
  }
}

function normalizeStableDocumentId(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const stableId = clean(String(value), 160);
  if (!stableId || stableId === '0') return null;
  return stableId;
}

function readReferenceDocumentId(document: any): string | null {
  return normalizeStableDocumentId(
    document?.referenceDocumentId
    ?? document?.reference_document_id
    ?? document?.referenceDocumentID
    ?? document?.reference_document_uuid
    ?? null,
  );
}


function stableDocumentIds(document: any): string[] {
  const values = [
    document?.id,
    document?.uuid,
    document?.knowledgeDocumentUuid,
    document?.knowledge_document_uuid,
    document?.knowledgeDocumentId,
    document?.knowledge_document_id,
    document?.metadataJson?.assistant_knowledge_document_id,
    document?.metadata_json?.assistant_knowledge_document_id,
    document?.metadataJson?.uuid,
    document?.metadata_json?.uuid,
  ];
  const out: string[] = [];
  for (const value of values) {
    const normalized = normalizeStableDocumentId(value);
    if (normalized && !out.includes(normalized)) out.push(normalized);
  }
  return out;
}

function preferredKnowledgeDocumentId(document: any, fallback?: unknown): string {
  return stableDocumentIds(document)[0] || normalizeStableDocumentId(fallback) || String(document?.id || fallback || '');
}

function normalizeMaterialKind(material: any): string {
  return String(
    material?.materialKind
    ?? material?.material_kind
    ?? material?.kind
    ?? material?.type
    ?? '',
  ).trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function readKnowledgeDocumentIdFromCandidateMaterial(material: any): string | null {
  const kind = normalizeMaterialKind(material);
  if (kind !== 'knowledge_document' && kind !== 'knowledge' && !kind.includes('knowledge_document')) return null;
  return normalizeStableDocumentId(
    material?.knowledgeDocumentId
    ?? material?.knowledge_document_id
    ?? material?.knowledgeDocumentUuid
    ?? material?.knowledge_document_uuid
    ?? material?.documentId
    ?? material?.document_id
    ?? material?.materialId
    ?? material?.material_id
    ?? material?.uuid
    ?? material?.id
    ?? null,
  );
}

function readReferenceDocumentIdFromCandidateMaterial(material: any): string | null {
  const kind = normalizeMaterialKind(material);
  if (kind !== 'reference_document' && kind !== 'reference' && !kind.includes('reference_document')) return null;
  return normalizeStableDocumentId(
    material?.referenceDocumentId
    ?? material?.reference_document_id
    ?? material?.referenceDocumentUuid
    ?? material?.reference_document_uuid
    ?? material?.documentId
    ?? material?.document_id
    ?? material?.materialId
    ?? material?.material_id
    ?? material?.uuid
    ?? material?.id
    ?? null,
  );
}

function isPilotDocumentMetadataUsable(document: any): document is KnowledgeDocumentLike {
  const stableId = normalizeStableDocumentId(document?.id);
  const title = clean(document?.title, 800);
  const status = clean(document?.status, 120)?.toLowerCase() || '';
  const normalizedTitle = normalizeArabicText(title);
  // The canonical assistant runtime may expose either a legacy numeric id or a
  // sovereign UUID. Both are accepted only after the candidate is proven to be
  // in the current C4 cohort; no caller-supplied id is trusted by itself.
  if (!stableId || !title) return false;
  if (['rejected', 'archived', 'deleted'].includes(status)) return false;
  if (/\b(minimal test|test document|example document)\b/i.test(String(title))) return false;
  if (/^(اختبار|test|minimal)/i.test(String(title).trim())) return false;
  if (normalizedTitle.length < 4) return false;
  return true;
}

function isPilotDocumentUsable(document: any): document is KnowledgeDocumentLike {
  const content = clean(document?.content, 20_000);
  return isPilotDocumentMetadataUsable(document) && Boolean(content);
}

async function listPilotKnowledgeDocuments(): Promise<KnowledgeDocumentLike[]> {
  const listed = await runtimeGetKnowledgeDocuments({}).catch(() => []);
  return Array.isArray(listed)
    ? listed.filter(isPilotDocumentMetadataUsable).slice(0, 1_500) as KnowledgeDocumentLike[]
    : [];
}

async function getPilotKnowledgeDocumentById(
  id: unknown,
  alreadyListed?: KnowledgeDocumentLike[],
): Promise<KnowledgeDocumentLike | null> {
  const stableId = normalizeStableDocumentId(id);
  if (!stableId) return null;

  const fromExistingList = Array.isArray(alreadyListed)
    ? alreadyListed.find((document) => stableDocumentIds(document).includes(stableId)) || null
    : null;
  if (fromExistingList && isPilotDocumentMetadataUsable(fromExistingList)) return fromExistingList;

  // Current C4 materials carry the sovereign assistant.knowledge_documents UUID.
  // Resolve that row directly before the composite knowledge bundle so a
  // companion-table outage cannot hide an exact current-cohort material.
  const exactAssistantDocument = await runtimeGetKnowledgeDocumentByExactUuid(stableId).catch(() => undefined);
  if (isPilotDocumentMetadataUsable(exactAssistantDocument)) return exactAssistantDocument;

  // Legacy local runtimes sometimes resolve numeric ids only. Preserve that
  // bounded fallback without creating or inferring links.
  const direct = await (runtimeGetKnowledgeDocumentById as any)(stableId).catch(() => null) as KnowledgeDocumentLike | null;
  if (isPilotDocumentMetadataUsable(direct)) return direct;

  const numericId = Number(stableId);
  if (Number.isInteger(numericId) && numericId > 0) {
    const numeric = await (runtimeGetKnowledgeDocumentById as any)(numericId).catch(() => null) as KnowledgeDocumentLike | null;
    if (isPilotDocumentMetadataUsable(numeric)) return numeric;
  }

  const listed = alreadyListed || await listPilotKnowledgeDocuments();
  return listed.find((document) => stableDocumentIds(document).includes(stableId)) || null;
}
function resolutionLabelFor(method: CandidateResolutionMethod): string {
  switch (method) {
    case 'C4_DIRECT_MATERIAL_REFERENCE': return 'مرجع C4 مباشر للمعرفة';
    case 'C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION': return 'إحالة C4 مباشرة عبر الوثيقة المرجعية';
    case 'DETERMINISTIC_TITLE_AND_URL_EXACT': return 'مطابقة حتمية: عنوان ورابط';
    case 'DETERMINISTIC_URL_EXACT': return 'مطابقة حتمية: رابط';
    default: return 'مطابقة حتمية: عنوان';
  }
}

function resolutionPriority(method: CandidateResolutionMethod): number {
  switch (method) {
    case 'C4_DIRECT_MATERIAL_REFERENCE': return 100;
    case 'C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION': return 95;
    case 'DETERMINISTIC_TITLE_AND_URL_EXACT': return 90;
    case 'DETERMINISTIC_URL_EXACT': return 85;
    case 'DETERMINISTIC_TITLE_EXACT': return 80;
  }
}

function providerGenerationAllowed(): boolean {
  return String(process.env.AR1_INTERNAL_PILOT_LLM_ENABLED || '').trim() === '1';
}

function pruneExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (session.status !== 'active' || Date.parse(session.expiresAt) <= now) {
      sessions.delete(id);
    }
  }
}

function requireActiveSession(sessionId: string, operatorId: string): PilotSession {
  pruneExpiredSessions();
  const session = sessions.get(sessionId);
  if (!session || session.status !== 'active') {
    throw new Error('AR1_PILOT_SESSION_NOT_ACTIVE_OR_EXPIRED');
  }
  if (session.operatorId !== operatorId) {
    throw new Error('AR1_PILOT_SESSION_OPERATOR_MISMATCH');
  }
  return session;
}

function termsFor(text: string): string[] {
  const stop = new Set([
    'في', 'من', 'على', 'الى', 'إلى', 'عن', 'ما', 'ماذا', 'هل', 'كيف', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'التي', 'الذي', 'ثم', 'أو', 'و',
    'the', 'and', 'for', 'with', 'from', 'what', 'when', 'where', 'does', 'that',
  ]);
  return Array.from(new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}_]+/u)
      .map((term) => term.trim())
      .filter((term) => term.length >= 2 && !stop.has(term))
  )).slice(0, 18);
}

function excerptAround(text: string, terms: string[], max = MAX_CONTEXT_PER_DOCUMENT): string {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  const lower = normalized.toLowerCase();
  const hit = terms.map((term) => lower.indexOf(term.toLowerCase())).find((index) => index >= 0) ?? -1;
  if (hit < 0) return normalized.slice(0, max) + (normalized.length > max ? '…' : '');
  const start = Math.max(0, hit - Math.floor(max * 0.35));
  const end = Math.min(normalized.length, start + max);
  return `${start > 0 ? '…' : ''}${normalized.slice(start, end)}${end < normalized.length ? '…' : ''}`;
}

function scoreDocument(question: string, document: KnowledgeDocumentLike): number {
  const terms = termsFor(question);
  const title = String(document.title || '').toLowerCase();
  const tags = String(document.tags || '').toLowerCase();
  const body = String(document.content || '').toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 12;
    if (tags.includes(term)) score += 8;
    const count = body.split(term).length - 1;
    score += Math.min(count, 8) * 1.5;
  }
  const matched = terms.filter((term) => `${title} ${tags} ${body}`.includes(term)).length;
  if (matched >= 2) score *= 1 + Math.min(matched, 5) * 0.12;
  return Math.round(score * 10) / 10;
}

function hasUnsafeLegalConclusion(text: string): boolean {
  return /(أوصي|ننصحك|يجب عليك|يلزمك|من حقك|ستكسب|ستحصل حتمًا|حكم نهائي|نتيجة القضية ستكون|فتوى ملزمة)/i.test(text);
}

function evidenceOnlyAnswer(question: string, citations: Citation[], reason?: string): string {
  const header = reason
    ? `تم الامتناع عن توليد خلاصة تحليلية: ${reason}`
    : 'تم إعداد حزمة أدلة داخلية محدودة من corpus التجريبي.';
  const body = citations.map((citation, index) => {
    const reference = `[[${citation.citationId}]]`;
    return `${index + 1}. ${citation.title} ${reference}\n${citation.excerpt}`;
  }).join('\n\n');
  return [
    header,
    '',
    'هذه النتيجة ليست فتوى ولا رأيًا قانونيًا ولا توجيهًا إجرائيًا. يجب مراجعة النصوص الأصلية ومختص مختص قبل اتخاذ أي إجراء.',
    '',
    `السؤال: ${question.trim()}`,
    '',
    body || 'لا توجد مقتطفات كافية ضمن corpus الداخلي المختار.',
  ].join('\n');
}

function llmPrompt(question: string, citations: Citation[]): string {
  const evidence = citations.map((citation, index) => (
    `المصدر ${index + 1}: [[${citation.citationId}]]\nالعنوان: ${citation.title}\nالمقتطف: ${citation.excerpt}`
  )).join('\n\n');

  return [
    'أنت مساعد بحث قانوني/وقفي داخلي ومحكوم. استخدم الأدلة أدناه فقط.',
    'لا تستخدم معرفة خارجية، ولا تذكر أي مصدر غير معروض، ولا تفترض حقوقًا أو وقائع غير موجودة.',
    'لا تقدّم فتوى أو رأيًا قانونيًا أو توصية إجرائية أو توقعًا لنتيجة نزاع.',
    'اكتب ملخصًا بحثيًا محايدًا مع حدود واضحة للدليل، وضع رمز الاستشهاد [[AR1P:...]] بعد كل ادعاء واقعي مستند إلى مصدر.',
    'عند نقص الدليل، قل صراحة إن الدليل غير كافٍ واطلب مراجعة بشرية.',
    'اكتب بالعربية.',
    '',
    `السؤال: ${question}`,
    '',
    'الأدلة المسموح بها:',
    evidence,
  ].join('\n');
}

async function c4CandidateCatalog(): Promise<CandidateCatalog> {
  const plan: any = await getVerifiedSourceSelectionAndControlledReleasePlan();
  const c3Status = String(plan?.c3Evidence?.status || 'absent');
  const c3EvidenceExpiresAt = plan?.c3Evidence?.expiresAt || null;
  const emptySummary = {
    directC4MaterialReferences: 0,
    directReferenceDocumentAssociations: 0,
    deterministicExactMatches: 0,
    rejectedFuzzyOrAmbiguousMatches: 0,
    rejectedAmbiguousDirectAssociations: 0,
  };

  if (c3Status !== 'available') {
    return {
      status: 'C3_C4_FRESH_EVIDENCE_REQUIRED_HOLD',
      reason: 'يتطلب AR1 تشغيل C3 ثم قراءة C4 في العملية الخادمية نفسها قبل إعداد جلسة pilot.',
      candidates: [],
      c3EvidenceExpiresAt,
      resolutionSummary: emptySummary,
    };
  }

  const selected = Array.isArray(plan?.selectedControlledMetadataPilot) ? plan.selectedControlledMetadataPilot : [];
  const documents = await listPilotKnowledgeDocuments();
  const directCandidates: CandidateRow[] = [];
  for (const entry of selected) {
    const materials = Array.isArray(entry?.candidateMaterials) ? entry.candidateMaterials : [];
    for (const material of materials) {
      const materialId = readKnowledgeDocumentIdFromCandidateMaterial(material);
      if (!materialId) continue;
      const doc = await getPilotKnowledgeDocumentById(materialId, documents);
      if (!isPilotDocumentMetadataUsable(doc)) continue;
      const resolvedDocumentId = preferredKnowledgeDocumentId(doc, materialId);
      directCandidates.push({
        clusterKey: String(entry.clusterKey),
        clusterTitle: clean(entry.title, 500),
        documentId: resolvedDocumentId,
        documentTitle: String(doc.title),
        category: clean(doc.category, 120),
        source: clean(doc.source, 500),
        sourceUrl: clean(doc.sourceUrl, 1_500),
        c4CheckedAt: clean(entry.checkedAt, 80),
        c4Disposition: String(entry.disposition || 'CONTROLLED_METADATA_PILOT_CANDIDATE'),
        c4DispositionLabel: String(entry.dispositionLabel || 'مرشح C4'),
        resolutionMethod: 'C4_DIRECT_MATERIAL_REFERENCE',
        resolutionLabel: resolutionLabelFor('C4_DIRECT_MATERIAL_REFERENCE'),
        resolutionEvidence: [
          'candidateMaterials.id_field_normalized_to_knowledge_document_uuid',
          'candidateMaterials.knowledge_document_id_exact',
          'runtimeRepository.assistant_knowledge_documents_uuid_exact_lookup',
          'runtimeRepository.uuid_or_numeric_id_resolution',
          'C4_SELECTED_COHORT_CURRENT_PROCESS_ONLY',
        ],
        operatorConfirmationRequired: true,
      });
    }
  }

  // This resolver reads only existing relationships. A C4 reference_document
  // can expose exactly one current knowledge_document when the latter already
  // carries the same reference_document_id. It does not create a source link,
  // a rights assignment, a copy, or a durable corpus association.
  const directReferenceDocumentCandidates: CandidateRow[] = [];
  let rejectedAmbiguousDirectAssociations = 0;
  for (const entry of selected) {
    const materials = Array.isArray(entry?.candidateMaterials) ? entry.candidateMaterials : [];
    for (const material of materials) {
      const referenceDocumentId = readReferenceDocumentIdFromCandidateMaterial(material);
      if (!referenceDocumentId) continue;
      const linkedDocuments = documents.filter((document) => readReferenceDocumentId(document) === referenceDocumentId);
      // Multiple knowledge rows under the same reference document are an
      // ambiguity for this first bounded pilot. Do not choose one implicitly.
      if (linkedDocuments.length !== 1) {
        if (linkedDocuments.length > 1) rejectedAmbiguousDirectAssociations += 1;
        continue;
      }
      const doc = linkedDocuments[0];
      const resolvedDocumentId = preferredKnowledgeDocumentId(doc, referenceDocumentId);
      directReferenceDocumentCandidates.push({
        clusterKey: String(entry.clusterKey),
        clusterTitle: clean(entry.title, 500),
        documentId: resolvedDocumentId,
        documentTitle: String(doc.title),
        category: clean(doc.category, 120),
        source: clean(doc.source, 500),
        sourceUrl: clean(doc.sourceUrl, 1_500),
        c4CheckedAt: clean(entry.checkedAt, 80),
        c4Disposition: String(entry.disposition || 'CONTROLLED_METADATA_PILOT_CANDIDATE'),
        c4DispositionLabel: String(entry.dispositionLabel || 'مرشح C4'),
        resolutionMethod: 'C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION',
        resolutionLabel: resolutionLabelFor('C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION'),
        resolutionEvidence: [
          'candidateMaterials.reference_document_id_exact',
          'knowledge_document.reference_document_id_exact',
          'C4_SELECTED_COHORT_CURRENT_PROCESS_ONLY',
          'EPHEMERAL_OPERATOR_CONFIRMED_SESSION_ONLY',
        ],
        operatorConfirmationRequired: true,
      });
    }
  }

  // This fallback does not create a durable link. It exposes only exact current
  // title/URL matches for an explicit operator session. Fuzzy, semantic, and
  // inferred matches are deliberately excluded.
  const deterministicCandidates: CandidateRow[] = [];
  for (const entry of selected) {
    const clusterTitle = normalizeArabicText(entry?.title);
    const requestedUrl = normalizeComparableUrl(entry?.requestedUrl);
    for (const doc of documents) {
      const titleMatch = Boolean(clusterTitle) && normalizeArabicText(doc.title) === clusterTitle;
      const docUrls = [doc.sourceUrl, doc.source]
        .map((value) => normalizeComparableUrl(value))
        .filter((value): value is string => Boolean(value));
      const urlMatch = Boolean(requestedUrl) && docUrls.some((value) => value === requestedUrl);
      if (!titleMatch && !urlMatch) continue;

      const method: CandidateResolutionMethod = titleMatch && urlMatch
        ? 'DETERMINISTIC_TITLE_AND_URL_EXACT'
        : urlMatch
          ? 'DETERMINISTIC_URL_EXACT'
          : 'DETERMINISTIC_TITLE_EXACT';
      const evidence = [
        titleMatch ? 'normalized_title_exact' : null,
        urlMatch ? 'canonical_url_exact' : null,
        'NO_FUZZY_OR_SEMANTIC_MATCHING',
        'EPHEMERAL_OPERATOR_CONFIRMED_SESSION_ONLY',
      ].filter((value): value is string => Boolean(value));
      const resolvedDocumentId = preferredKnowledgeDocumentId(doc);
      deterministicCandidates.push({
        clusterKey: String(entry.clusterKey),
        clusterTitle: clean(entry.title, 500),
        documentId: resolvedDocumentId,
        documentTitle: String(doc.title),
        category: clean(doc.category, 120),
        source: clean(doc.source, 500),
        sourceUrl: clean(doc.sourceUrl, 1_500),
        c4CheckedAt: clean(entry.checkedAt, 80),
        c4Disposition: String(entry.disposition || 'CONTROLLED_METADATA_PILOT_CANDIDATE'),
        c4DispositionLabel: String(entry.dispositionLabel || 'مرشح C4'),
        resolutionMethod: method,
        resolutionLabel: resolutionLabelFor(method),
        resolutionEvidence: evidence,
        operatorConfirmationRequired: true,
      });
    }
  }

  const unique = new Map<string, CandidateRow>();
  for (const candidate of [...directCandidates, ...directReferenceDocumentCandidates, ...deterministicCandidates]) {
    const key = `${candidate.clusterKey}:${candidate.documentId}`;
    const current = unique.get(key);
    if (!current || resolutionPriority(candidate.resolutionMethod) > resolutionPriority(current.resolutionMethod)) {
      unique.set(key, candidate);
    }
  }

  // A pilot uses one evidence item per C4 cluster unless the operator later
  // starts a separate bounded session. This keeps the internal slice narrow.
  const onePerCluster = new Map<string, CandidateRow>();
  for (const candidate of [...unique.values()].sort((left, right) => (
    resolutionPriority(right.resolutionMethod) - resolutionPriority(left.resolutionMethod)
      || left.documentTitle.localeCompare(right.documentTitle, 'ar')
  ))) {
    if (!onePerCluster.has(candidate.clusterKey)) onePerCluster.set(candidate.clusterKey, candidate);
  }
  const finalCandidates = [...onePerCluster.values()].slice(0, MAX_BINDINGS);
  const directC4MaterialReferences = finalCandidates.filter((candidate) => candidate.resolutionMethod === 'C4_DIRECT_MATERIAL_REFERENCE').length;
  const directReferenceDocumentAssociations = finalCandidates.filter((candidate) => candidate.resolutionMethod === 'C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION').length;
  const deterministicExactMatches = finalCandidates.length - directC4MaterialReferences - directReferenceDocumentAssociations;
  const resolutionSummary = {
    directC4MaterialReferences,
    directReferenceDocumentAssociations,
    deterministicExactMatches,
    rejectedFuzzyOrAmbiguousMatches: rejectedAmbiguousDirectAssociations,
    rejectedAmbiguousDirectAssociations,
  };

  return {
    status: finalCandidates.length ? 'READY_FOR_OPERATOR_BINDING' : 'C4_CANDIDATE_MATERIAL_NOT_FOUND_HOLD',
    reason: finalCandidates.length
      ? null
      : 'لا توجد مادة knowledge_document مرتبطة مباشرة بـ cohort C4، ولا إحالة مرجعية C4 فريدة إلى knowledge_document، ولا مطابقة حتمية بعنوان/رابط حالي. لا يستخدم AR1 المطابقة التقريبية أو الدلالية.',
    candidates: finalCandidates,
    c3EvidenceExpiresAt,
    resolutionSummary,
  };
}

export async function runGovernedAgenticRagPilotSingleFlowReadinessCycle(input?: { maxUrls?: number }) {
  const maxUrls = Math.max(1, Math.min(32, Math.floor(input?.maxUrls || 32)));
  const c3 = await getAutonomousExternalSourceVerification({ maxUrls });
  const catalog = await c4CandidateCatalog();
  const c3Summary = (c3.summary || {}) as Record<string, unknown>;
  const nextAction = catalog.status === 'READY_FOR_OPERATOR_BINDING'
    ? 'REVIEW_ONE_DETERMINISTIC_CANDIDATE'
    : catalog.status === 'C4_CANDIDATE_MATERIAL_NOT_FOUND_HOLD'
      ? 'NO_ELIGIBLE_MATERIAL_HOLD'
      : 'EVIDENCE_HOLD';

  return {
    contract: 'ar1_single_flow_operator_triggered_c3_to_c4_to_deterministic_eligibility_v1',
    mode: 'operator_triggered_single_flow_read_only_until_explicit_ephemeral_session',
    c3: {
      status: 'completed',
      requestedChecks: Number(c3Summary.requestedChecks || 0),
      externalCandidates: Number(c3Summary.c2ExternalCandidates || 0),
      capturedAt: nowIso(),
      noDatabaseWrite: true,
    },
    c4: {
      status: catalog.status,
      reason: catalog.reason,
      candidateCount: catalog.candidates.length,
      c3EvidenceExpiresAt: catalog.c3EvidenceExpiresAt,
      corpusResolution: catalog.resolutionSummary,
    },
    candidates: catalog.candidates,
    nextAction,
    invariants: [
      'NO_SOURCE_OR_RIGHTS_WRITE',
      'NO_DOCUMENT_CHUNK_EMBEDDING_OR_VECTOR_WRITE',
      'NO_FUZZY_OR_SEMANTIC_MATCHING',
      'NO_PUBLIC_CHAT_OR_RELEASE',
      'OPERATOR_CONFIRMATION_REQUIRED_BEFORE_SESSION',
    ],
  };
}

export async function getGovernedAgenticRagPilotStatus() {
  pruneExpiredSessions();
  const catalog = await c4CandidateCatalog();
  return {
    contract: 'governed_agentic_rag_internal_pilot_vertical_slice_v1',
    mode: 'internal_admin_only_ephemeral_session',
    status: catalog.status,
    reason: catalog.reason,
    c3EvidenceExpiresAt: catalog.c3EvidenceExpiresAt,
    availableCandidateDocuments: catalog.candidates.length,
    corpusResolution: catalog.resolutionSummary,
    activeSessions: sessions.size,
    maxBindings: MAX_BINDINGS,
    maxSessionMinutes: SESSION_TTL_MS / 60_000,
    llmGenerationEnabled: providerGenerationAllowed(),
    llmBoundary: providerGenerationAllowed()
      ? 'AR1_INTERNAL_PILOT_LLM_ENABLED=1; use only a local or explicitly approved internal provider.'
      : 'الجيل النصي معطل افتراضيًا؛ ستعمل الأداة في وضع evidence-only حتى تفعيل AR1_INTERNAL_PILOT_LLM_ENABLED=1 بعد اعتماد حدود مزود النموذج.',
    invariants: [
      'NO_EXTERNAL_WEB_AGENT',
      'NO_DATABASE_WRITE',
      'NO_SOURCE_LINK_WRITE',
      'NO_RIGHTS_ASSIGNMENT',
      'NO_DOCUMENT_COPY',
      'NO_CHUNK_OR_EMBEDDING_WRITE',
      'NO_VECTOR_INDEXING',
      'NO_FUZZY_OR_SEMANTIC_CORPUS_LINKING',
      'NO_PUBLIC_CHAT_RELEASE',
      'NO_PUBLIC_RELEASE',
      'NO_PRODUCTION',
    ],
  };
}

export async function getGovernedAgenticRagPilotCandidates() {
  const catalog = await c4CandidateCatalog();
  return {
    contract: 'ar1_candidate_catalog_from_c4_selected_cohort_only',
    ...catalog,
    evidenceTierPolicy: [
      'T3_CONTROLLED_INTERNAL_EVIDENCE',
      'T4_VERIFIED_CITATION_EVIDENCE',
    ],
    limitations: [
      'القائمة لا تمنح حق استخدام أو ترخيصًا أو ترقية دائمة لمستوى الثقة.',
      'اختيار المادة يتطلب مرجع اعتماد داخلي صريح لكل جلسة pilot.',
      'لا تعرض هذه القراءة نصوص الوثائق؛ النص لا يُقرأ إلا أثناء السؤال داخل جلسة مفعلة.',
      'يجوز فقط مرجع C4 المباشر أو تطابق حتمي حالي للعنوان أو الرابط؛ لا توجد مطابقة تقريبية أو دلالية أو إنشاء رابط مصدر دائم.',
    ],
  };
}

export async function startGovernedAgenticRagPilotSession(input: {
  operatorId: string | number;
  bindings: Array<{ clusterKey: string; documentId: string | number; evidenceTier: EvidenceTier; internalUseApprovalRef: string }>;
  rightsApprovalRef: string;
  reviewerNote?: string | null;
  acknowledgeInternalOnly: boolean;
  acknowledgeModelBoundary: boolean;
}) {
  pruneExpiredSessions();
  if (!input.acknowledgeInternalOnly || !input.acknowledgeModelBoundary) {
    throw new Error('AR1_OPERATOR_ACKNOWLEDGEMENTS_REQUIRED');
  }
  const rightsApprovalRef = clean(input.rightsApprovalRef, 240);
  if (!rightsApprovalRef) throw new Error('AR1_RIGHTS_APPROVAL_REFERENCE_REQUIRED');
  if (!Array.isArray(input.bindings) || !input.bindings.length || input.bindings.length > MAX_BINDINGS) {
    throw new Error('AR1_BINDING_COUNT_MUST_BE_1_TO_5');
  }
  if (sessions.size >= MAX_ACTIVE_SESSIONS) throw new Error('AR1_ACTIVE_SESSION_CAP_REACHED');

  const catalog = await c4CandidateCatalog();
  if (catalog.status !== 'READY_FOR_OPERATOR_BINDING') {
    throw new Error(catalog.status);
  }

  const candidateByKey = new Map(catalog.candidates.map((candidate) => [`${candidate.clusterKey}:${String(candidate.documentId)}`, candidate]));
  const seenDocuments = new Set<string>();
  const bindings: PilotBinding[] = [];
  for (const binding of input.bindings) {
    const documentId = clean(String(binding.documentId), 160);
    if (!documentId) throw new Error('AR1_BINDING_DOCUMENT_ID_REQUIRED');
    if (seenDocuments.has(documentId)) throw new Error('AR1_DUPLICATE_DOCUMENT_BINDING');
    seenDocuments.add(documentId);
    if (binding.evidenceTier !== 'T3_CONTROLLED_INTERNAL_EVIDENCE' && binding.evidenceTier !== 'T4_VERIFIED_CITATION_EVIDENCE') {
      throw new Error('AR1_T3_OR_T4_REQUIRED');
    }
    const candidate = candidateByKey.get(`${binding.clusterKey}:${documentId}`);
    if (!candidate) throw new Error('AR1_BINDING_NOT_IN_CURRENT_C4_SELECTED_COHORT');
    const approvalRef = clean(binding.internalUseApprovalRef, 240);
    if (!approvalRef) throw new Error('AR1_BINDING_INTERNAL_USE_APPROVAL_REFERENCE_REQUIRED');
    bindings.push({
      clusterKey: candidate.clusterKey,
      documentId: candidate.documentId,
      documentTitle: candidate.documentTitle,
      evidenceTier: binding.evidenceTier,
      internalUseApprovalRef: approvalRef,
      resolutionMethod: candidate.resolutionMethod,
      resolutionEvidence: candidate.resolutionEvidence,
    });
  }

  const id = `AR1P-${randomUUID()}`;
  const createdAt = nowIso();
  const session: PilotSession = {
    id,
    operatorId: String(input.operatorId),
    createdAt,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    status: 'active',
    rightsApprovalRef,
    reviewerNote: clean(input.reviewerNote, 1_000),
    bindings,
    events: [{
      at: createdAt,
      type: 'session_started',
      details: {
        bindingCount: bindings.length,
        tiers: Array.from(new Set(bindings.map((binding) => binding.evidenceTier))),
        resolutionMethods: Array.from(new Set(bindings.map((binding) => binding.resolutionMethod))),
        rightsApprovalRef,
        c3EvidenceExpiresAt: catalog.c3EvidenceExpiresAt,
        databaseWrites: 0,
        externalWebRequests: 0,
      },
    }],
  };
  sessions.set(id, session);
  return sessionSummary(session);
}

function sessionSummary(session: PilotSession) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    status: session.status,
    bindingCount: session.bindings.length,
    bindings: session.bindings.map((binding) => ({
      documentId: binding.documentId,
      documentTitle: binding.documentTitle,
      clusterKey: binding.clusterKey,
      evidenceTier: binding.evidenceTier,
      internalUseApprovalRef: binding.internalUseApprovalRef,
      resolutionMethod: binding.resolutionMethod,
      resolutionEvidence: binding.resolutionEvidence,
    })),
    rightsApprovalRef: session.rightsApprovalRef,
    reviewerNote: session.reviewerNote,
    sessionStorage: 'process_memory_only',
    rollback: 'clears the in-memory binding and trace; no database rollback is needed because AR1 writes no database state.',
  };
}

export function getGovernedAgenticRagPilotEvents(sessionId: string, operatorId: string | number) {
  const session = requireActiveSession(sessionId, String(operatorId));
  return {
    ...sessionSummary(session),
    events: session.events,
  };
}

export async function runGovernedAgenticRagPilotQuestion(input: {
  sessionId: string;
  operatorId: string | number;
  question: string;
}) {
  const session = requireActiveSession(input.sessionId, String(input.operatorId));
  const question = clean(input.question, MAX_QUESTION_LENGTH);
  if (!question) throw new Error('AR1_QUESTION_REQUIRED');

  session.events.push({
    at: nowIso(),
    type: 'question_received',
    details: { questionDigest: digest(question), questionLength: question.length },
  });

  const docs = await Promise.all(session.bindings.map(async (binding) => {
    const document = await getPilotKnowledgeDocumentById(binding.documentId);
    return isPilotDocumentUsable(document) ? { binding, document } : null;
  }));

  const terms = termsFor(question);
  const citations = docs
    .filter((row): row is { binding: PilotBinding; document: KnowledgeDocumentLike } => Boolean(row))
    .map(({ binding, document }) => {
      const relevanceScore = scoreDocument(question, document);
      return {
        citationId: `AR1P:${session.id.slice(-12)}:${binding.documentId}`,
        documentId: binding.documentId,
        title: document.title,
        source: clean(document.source, 500),
        sourceUrl: clean(document.sourceUrl, 1_500),
        evidenceTier: binding.evidenceTier,
        clusterKey: binding.clusterKey,
        excerpt: excerptAround(document.content, terms),
        relevanceScore,
      } satisfies Citation;
    })
    .filter((citation) => citation.relevanceScore > 0)
    .sort((left, right) => right.relevanceScore - left.relevanceScore)
    .slice(0, MAX_BINDINGS);

  const hasSufficientEvidence = citations.length > 0;
  if (!hasSufficientEvidence) {
    const answer = evidenceOnlyAnswer(question, [], 'لم تُظهر المواد المرتبطة في الجلسة دليلاً نصيًا كافيًا للسؤال.');
    session.events.push({ at: nowIso(), type: 'abstained', details: { reason: 'INSUFFICIENT_EVIDENCE', citations: 0 } });
    return {
      action: 'abstain' as const,
      confidence: 'low' as const,
      answer,
      citations: [],
      reasonCodes: ['INSUFFICIENT_EVIDENCE', 'HUMAN_REVIEW_RECOMMENDED'],
      toolTrace: ['C4_SELECTED_COHORT_BINDING', 'SCOPED_KEYWORD_RETRIEVAL', 'ABSTENTION_GATE'],
      publicRelease: 'blocked',
      chatRelease: 'blocked',
    };
  }

  let answer = evidenceOnlyAnswer(question, citations);
  let action: 'answer' | 'abstain' | 'escalate' = 'answer';
  let confidence: 'low' | 'medium' | 'high' = citations.length >= 2 ? 'medium' : 'low';
  const reasonCodes = ['INTERNAL_PILOT_ONLY', 'CITATION_BOUND', 'NO_EXTERNAL_WEB_AGENT'];

  if (providerGenerationAllowed()) {
    try {
      const response: any = await invokeLLM({
        messages: [
          { role: 'system', content: llmPrompt(question, citations) },
          { role: 'user', content: question },
        ],
      });
      const generated = typeof response?.choices?.[0]?.message?.content === 'string'
        ? response.choices[0].message.content
        : Array.isArray(response?.choices?.[0]?.message?.content)
          ? response.choices[0].message.content.map((part: any) => typeof part === 'string' ? part : part?.text || '').join('\n')
          : '';
      const bounded = clean(generated, MAX_ANSWER_LENGTH) || '';
      const citationTokens = citations.map((citation) => `[[${citation.citationId}]]`);
      const hasCitationToken = citationTokens.some((token) => bounded.includes(token));
      if (!bounded || !hasCitationToken || hasUnsafeLegalConclusion(bounded)) {
        action = 'escalate';
        confidence = 'low';
        reasonCodes.push('GENERATION_GUARD_TRIGGERED', 'HUMAN_REVIEW_RECOMMENDED');
        answer = evidenceOnlyAnswer(question, citations, 'تعذر اعتماد النص المولّد لأنه يفتقر إلى الاستشهادات الكافية أو تجاوز حدود البحث المحكوم.');
      } else {
        answer = `${bounded}\n\nتنبيه: هذه خلاصة بحثية داخلية مقيدة بالمراجع الظاهرة وليست فتوى أو رأيًا قانونيًا أو توجيهًا إجرائيًا.`;
        confidence = citations.length >= 2 ? 'high' : 'medium';
        reasonCodes.push('LOCAL_OR_APPROVED_INTERNAL_LLM_PATH');
      }
    } catch {
      action = 'escalate';
      confidence = 'low';
      reasonCodes.push('LLM_UNAVAILABLE_OR_REJECTED', 'EVIDENCE_ONLY_FALLBACK');
      answer = evidenceOnlyAnswer(question, citations, 'لم يتوفر مزود النموذج الداخلي أو لم يُقبل الناتج؛ تم الرجوع إلى حزمة أدلة فقط.');
    }
  } else {
    reasonCodes.push('LLM_GENERATION_DISABLED_EVIDENCE_ONLY');
  }

  session.events.push({
    at: nowIso(),
    type: action === 'escalate' ? 'escalated' : 'answer_returned',
    details: {
      action,
      confidence,
      citationCount: citations.length,
      documentIds: citations.map((citation) => citation.documentId),
      databaseWrites: 0,
      externalWebRequests: 0,
      vectorWrites: 0,
    },
  });

  return {
    action,
    confidence,
    answer,
    citations,
    reasonCodes,
    toolTrace: [
      'C4_SELECTED_COHORT_BINDING',
      'T3_T4_OPERATOR_DECLARED_SESSION_SCOPE',
      'SCOPED_KEYWORD_RETRIEVAL',
      providerGenerationAllowed() ? 'GOVERNED_INTERNAL_LLM_SYNTHESIS' : 'EVIDENCE_ONLY_OUTPUT',
      'CITATION_AND_ABSTENTION_GATE',
    ],
    publicRelease: 'blocked',
    chatRelease: 'blocked',
    production: 'not_authorized',
  };
}

export function rollbackGovernedAgenticRagPilotSession(sessionId: string, operatorId: string | number) {
  const session = requireActiveSession(sessionId, String(operatorId));
  session.events.push({ at: nowIso(), type: 'session_rolled_back', details: { databaseWrites: 0, clearedFromMemory: true } });
  session.status = 'rolled_back';
  const summary = sessionSummary(session);
  sessions.delete(sessionId);
  return { ...summary, rollbackApplied: true, activeSessions: sessions.size };
}
