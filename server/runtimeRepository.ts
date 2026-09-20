import {
  createConversation as createConversationDb,
  getUserConversations as getUserConversationsDb,
  getConversationById as getConversationByIdDb,
  updateConversation as updateConversationDb,
  createMessage as createMessageDb,
  getConversationMessages as getConversationMessagesDb,
  createKnowledgeDocument as createKnowledgeDocumentDb,
  getKnowledgeDocuments as getKnowledgeDocumentsDb,
  getKnowledgeDocumentById as getKnowledgeDocumentByIdDb,
  updateKnowledgeDocument as updateKnowledgeDocumentDb,
  deleteKnowledgeDocument as deleteKnowledgeDocumentDb,
  getKnowledgeSourceById as getKnowledgeSourceByIdDb,
  getKnowledgeSources as getKnowledgeSourcesDb,
  createKnowledgeSource as createKnowledgeSourceDb,
  updateKnowledgeSource as updateKnowledgeSourceDb,
  deleteKnowledgeSource as deleteKnowledgeSourceDb,
  getKnowledgeSourcesStats as getKnowledgeSourcesStatsDb,
  getTopActiveKnowledgeSources as getTopActiveKnowledgeSourcesDb,
  getFetchActivityLast7Days as getFetchActivityLast7DaysDb,
  createFetchedContent as createFetchedContentDb,
  listFetchedContent as listFetchedContentDb,
  countFetchedContent as countFetchedContentDb,
  getFetchedContentById as getFetchedContentByIdDb,
  deleteFetchedContent as deleteFetchedContentDb,
  createFetchLog as createFetchLogDb,
  getFetchLogs as getFetchLogsDb,
  updateFetchLog as updateFetchLogDb,
  approveFetchedContent as approveFetchedContentDb,
  rejectFetchedContent as rejectFetchedContentDb,
  bulkApproveFetchedContent as bulkApproveFetchedContentDb,
  bulkRejectFetchedContent as bulkRejectFetchedContentDb,
  updateFetchedContentProcessing as updateFetchedContentProcessingDb,
  listPendingUnprocessedFetchedContent as listPendingUnprocessedFetchedContentDb,
  updateFetchedContentExtraction as updateFetchedContentExtractionDb,
  createFetchedContentReviewEvent as createFetchedContentReviewEventDb,
  listFetchedContentReviewEvents as listFetchedContentReviewEventsDb,
  createClassificationRating as createClassificationRatingDb,
  getClassificationRatingsStats as getClassificationRatingsStatsDb,
  addDocumentFile as addDocumentFileDb,
  getDocumentFiles as getDocumentFilesDb,
  deleteDocumentFile as deleteDocumentFileDb,
  getDb,
} from './db';
import * as local from './localRuntimeStore';
import {
  buildLearningCandidateKey,
  buildLearningCandidateKnowledgeDraft,
  WAQF_RESEARCH_LEARNING_CANDIDATE_ORIGIN,
} from './learningCandidate';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  filterPublicKnowledgeDocuments,
  isLegacyReviewContentUatEnabled,
  mapLegacyReviewContentPayload,
  mapPublicKnowledgeRpcPayload,
  resolveAssistantSupabaseConfig,
  type LegacyReviewContentKind,
} from './canonicalRuntimeBinding';

let _assistantSupabaseClient: SupabaseClient<any, any, any, any, any> | null = null;

function getAssistantSupabaseClient() {
  const config = resolveAssistantSupabaseConfig(process.env);
  if (!config) return null;

  if (!_assistantSupabaseClient) {
    _assistantSupabaseClient = createClient(config.url, config.key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: { schema: 'assistant' },
      global: {
        headers: {
          'x-assistant-runtime': 'palwakf-local-assistant',
          ...(isLegacyReviewContentUatEnabled(process.env)
            ? { 'x-palwakf-legacy-content-uat': 'enabled' }
            : {}),
        },
      },
    });
  }

  return _assistantSupabaseClient;
}

type AssistantRuntimeReadComponent =
  | 'knowledge_documents'
  | 'knowledge_sources'
  | 'reference_documents'
  | 'reference_files'
  | 'knowledge_citations';

type AssistantRuntimeReadState = {
  status: 'unknown' | 'ready' | 'degraded';
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  retryAfter: string | null;
  failureClass: 'configuration' | 'network' | 'permission_or_schema' | 'unknown' | null;
  failureCount: number;
};

const ASSISTANT_BUNDLE_RETRY_MS = 30_000;
const assistantRuntimeReadStates: Record<AssistantRuntimeReadComponent, AssistantRuntimeReadState> = {
  knowledge_documents: { status: 'unknown', lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  knowledge_sources: { status: 'unknown', lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  reference_documents: { status: 'unknown', lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  reference_files: { status: 'unknown', lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
  knowledge_citations: { status: 'unknown', lastSuccessAt: null, lastFailureAt: null, retryAfter: null, failureClass: null, failureCount: 0 },
};

function classifyAssistantRuntimeReadFailure(error: any): AssistantRuntimeReadState['failureClass'] {
  const message = String(error?.message || error || '').toLowerCase();
  if (/missing|not available|not configured|service role|supabase/.test(message) && /key|url|config|available|configured/.test(message)) return 'configuration';
  if (/fetch failed|network|socket|timeout|econn|enotfound/.test(message)) return 'network';
  if (/permission|rls|does not exist|schema|column|relation|42501|42p01/.test(message)) return 'permission_or_schema';
  return 'unknown';
}

function recordAssistantRuntimeReadSuccess(component: AssistantRuntimeReadComponent): void {
  const state = assistantRuntimeReadStates[component];
  state.status = 'ready';
  state.lastSuccessAt = new Date().toISOString();
  state.retryAfter = null;
  state.failureClass = null;
  state.failureCount = 0;
}

function recordAssistantRuntimeReadFailure(component: AssistantRuntimeReadComponent, error: any): void {
  const state = assistantRuntimeReadStates[component];
  const now = Date.now();
  state.status = 'degraded';
  state.lastFailureAt = new Date(now).toISOString();
  state.retryAfter = new Date(now + ASSISTANT_BUNDLE_RETRY_MS).toISOString();
  state.failureClass = classifyAssistantRuntimeReadFailure(error);
  state.failureCount += 1;

  // Never print raw connection details, URLs or driver payloads in normal runtime logs.
  if (state.failureCount === 1) {
    console.warn(`[runtimeRepository] assistant knowledge bundle companion rejected: component=${component}; failure_class=${state.failureClass}; retry_backoff_seconds=30`);
  }
}

function assistantRuntimeBundleCircuitOpen(): boolean {
  const now = Date.now();
  return Object.values(assistantRuntimeReadStates).some((state) => {
    const retryMs = state.retryAfter ? Date.parse(state.retryAfter) : 0;
    return state.status === 'degraded' && Number.isFinite(retryMs) && retryMs > now;
  });
}

/** Safe diagnostics for authorized operations surfaces. Never exposes URLs, keys or raw driver errors. */
export function runtimeGetAssistantKnowledgeReadDiagnostics() {
  const configured = Boolean(getAssistantSupabaseClient());
  const components = Object.fromEntries(
    Object.entries(assistantRuntimeReadStates).map(([component, state]) => [
      component,
      {
        status: state.status,
        lastSuccessAt: state.lastSuccessAt,
        lastFailureAt: state.lastFailureAt,
        retryAfter: state.retryAfter,
        failureClass: state.failureClass,
        failureCount: state.failureCount,
      },
    ]),
  );
  const circuitOpen = assistantRuntimeBundleCircuitOpen();
  const degraded = Object.values(assistantRuntimeReadStates).some((state) => state.status === 'degraded');
  return {
    contract: 'assistant_runtime_read_diagnostics_v1',
    runtimeConfigured: configured,
    bundleGate: !configured ? 'not_configured' : circuitOpen ? 'cooldown_active' : degraded ? 'degraded_recovery_pending' : 'ready_or_not_yet_exercised',
    partialBundlePolicy: 'reject_partial_bundle_and_fall_back_to_existing_safe_store',
    retryBackoffSeconds: ASSISTANT_BUNDLE_RETRY_MS / 1000,
    components,
  };
}

function normalizeLegacyNumericId(value: any): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) return Number(value.trim());
  return null;
}

function mapAssistantKnowledgeSourceRow(row: any) {
  const metadata = row?.metadata_json && typeof row.metadata_json === 'object' ? row.metadata_json : {};
  const legacyId = normalizeLegacyNumericId(metadata.legacy_id);
  return {
    id: legacyId ?? row.id,
    uuid: row.id,
    name: row.name,
    type: row.type === 'external_fetch' ? 'pdf_url' : row.type,
    url: row.base_url || metadata.url || metadata.baseUrl || null,
    config: metadata.config ? JSON.stringify(metadata.config) : (metadata.original_record ? JSON.stringify(metadata.original_record) : null),
    isActive: row.is_active ? 1 : 0,
    authorityLevel: row.authority_level ?? null,
    description: row.description ?? null,
    fetchFrequency: metadata.fetchFrequency || 'manual',
    lastFetchAt: metadata.lastFetchAt || null,
    itemsCount: typeof metadata.itemsCount === 'number' ? metadata.itemsCount : 0,
    successCount: typeof metadata.successCount === 'number' ? metadata.successCount : 0,
    errorCount: typeof metadata.errorCount === 'number' ? metadata.errorCount : 0,
    createdBy: null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadataJson: metadata,
  };
}


function normalizeLegacyBooleanFlag(value: any) {
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value === 0 ? 0 : 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['0', 'false', 'no', 'off', 'inactive'].includes(normalized)) return 0;
    if (normalized.length > 0) return 1;
  }
  return 0;
}

function normalizeLegacyDateString(value: any) {
  if (typeof value !== 'string' || value.trim().length === 0) return value ?? null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeLegacyTags(value: any): string | null {
  if (Array.isArray(value)) {
    const tags = value
      .map((item) => typeof item === 'string' ? item.trim() : '')
      .filter(Boolean);
    return tags.length > 0 ? tags.join(',') : null;
  }
  if (typeof value === 'string') return value.trim().length > 0 ? value.trim() : null;
  return null;
}

function escapeIlikeValue(value: string) {
  return value.replace(/[,%]/g, ' ').trim();
}

function mapAssistantReferenceFileRow(row: any, documentId: any) {
  const metadata = row?.metadata_json && typeof row.metadata_json === 'object' ? row.metadata_json : {};
  const legacyId = normalizeLegacyNumericId(metadata.legacy_file_id);
  return {
    id: legacyId ?? row.id,
    uuid: row.id,
    documentId,
    referenceDocumentId: row.reference_document_id,
    fileName: row.original_filename || metadata.originalFilename || metadata.fileName || null,
    fileUrl: row.storage_path,
    storagePath: row.storage_path,
    fileSize: typeof row.file_size_bytes === 'number' ? row.file_size_bytes : null,
    fileType: metadata.fileType || (row.is_primary ? 'original' : 'other'),
    mimeType: row.mime_type || null,
    language: metadata.language || null,
    extractedText: row.extracted_text || row.ocr_text || null,
    isOcr: row.ocr_text ? 1 : 0,
    isPrimary: row.is_primary ? 1 : 0,
    createdAt: normalizeLegacyDateString(row.created_at),
    updatedAt: normalizeLegacyDateString(row.created_at),
    metadataJson: metadata,
  };
}

function mapAssistantKnowledgeCitationRow(row: any) {
  const metadata = row?.metadata_json && typeof row.metadata_json === 'object' ? row.metadata_json : {};
  return {
    id: row.id,
    uuid: row.id,
    knowledgeDocumentUuid: row.knowledge_document_id,
    referenceDocumentId: row.reference_document_id,
    referenceFileId: row.reference_file_id ?? null,
    citationType: row.citation_type ?? null,
    locator: row.locator ?? null,
    excerpt: row.excerpt ?? null,
    metadataJson: metadata,
    createdAt: normalizeLegacyDateString(row.created_at),
  };
}

type AssistantKnowledgeDocumentMapContext = {
  sourceById: Map<string, any>;
  referenceDocumentById: Map<string, any>;
  filesByReferenceDocumentId: Map<string, any[]>;
  citationsByKnowledgeDocumentId: Map<string, any[]>;
};

const ASSISTANT_KNOWLEDGE_DOCUMENT_SELECT =
  'id, reference_document_id, source_id, title, category, status, authority_level, domain_scope, source_type, summary, content, tags, is_chat_eligible, chat_priority, grounding_weight, review_notes, review_decision, reviewed_by, reviewed_at, approval_version, metadata_json, created_by, created_at, updated_at';

function emptyAssistantKnowledgeDocumentMapContext(): AssistantKnowledgeDocumentMapContext {
  return {
    sourceById: new Map<string, any>(),
    referenceDocumentById: new Map<string, any>(),
    filesByReferenceDocumentId: new Map<string, any[]>(),
    citationsByKnowledgeDocumentId: new Map<string, any[]>(),
  };
}

function normalizeExactKnowledgeDocumentUuid(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)
    ? normalized
    : null;
}

function mapAssistantKnowledgeDocumentRow(
  row: any,
  context: AssistantKnowledgeDocumentMapContext,
) {
  const metadata = row?.metadata_json && typeof row.metadata_json === 'object' ? row.metadata_json : {};
  const source = row?.source_id ? context.sourceById.get(row.source_id) : undefined;
  const referenceDocument = row?.reference_document_id ? context.referenceDocumentById.get(row.reference_document_id) : undefined;
  const files = row?.reference_document_id ? (context.filesByReferenceDocumentId.get(row.reference_document_id) || []) : [];
  const citations = context.citationsByKnowledgeDocumentId.get(row.id) || [];
  const primaryFile = files.find((file: any) => file.isPrimary === 1) || files[0] || null;
  const legacyId = normalizeLegacyNumericId(metadata.legacy_id);
  const normalizedSourceUrl =
    metadata.legacy_source_url ||
    metadata.source_url ||
    metadata?.original_payload?.row?.url ||
    source?.base_url ||
    primaryFile?.fileUrl ||
    null;
  return {
    id: legacyId ?? row.id,
    uuid: row.id,
    referenceDocumentId: row.reference_document_id ?? null,
    sourceId: row.source_id ?? null,
    title: row.title,
    content: row.content || '',
    category: row.category || 'reference',
    source: metadata.legacy_source_name || source?.name || null,
    sourceUrl: normalizedSourceUrl,
    pdfUrl: primaryFile?.fileUrl || null,
    tags: normalizeLegacyTags(row.tags),
    isActive: row.status === 'approved' && row.is_chat_eligible ? 1 : normalizeLegacyBooleanFlag(row.is_chat_eligible),
    summary: row.summary || null,
    status: row.status,
    reviewDecision: row.review_decision ?? null,
    reviewNotes: row.review_notes ?? null,
    reviewedBy: row.reviewed_by ?? null,
    reviewedAt: normalizeLegacyDateString(row.reviewed_at),
    approvalVersion: row.approval_version ?? 0,
    isChatEligible: row.is_chat_eligible ? 1 : 0,
    authorityLevel: row.authority_level || null,
    domainScope: row.domain_scope || null,
    sourceType: row.source_type || null,
    chatPriority: row.chat_priority ?? null,
    groundingWeight: row.grounding_weight ?? null,
    embedding: metadata.embedding ?? null,
    createdBy: row.created_by ?? null,
    createdAt: normalizeLegacyDateString(row.created_at),
    updatedAt: normalizeLegacyDateString(row.updated_at),
    metadataJson: metadata,
    referenceDocument: referenceDocument || null,
    documentFiles: files,
    citations,
    reviewTrace: [
      {
        eventType: 'assistant_snapshot',
        status: row.status,
        decision: row.review_decision ?? null,
        notes: row.review_notes ?? null,
        actorUserId: row.reviewed_by ?? null,
        at: normalizeLegacyDateString(row.reviewed_at || row.updated_at || row.created_at),
        source: 'assistant_db',
      },
    ],
  };
}

async function tryGetAssistantPublicKnowledgeDocuments(filters?: any) {
  const client = getAssistantSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.rpc(
    'runtime_public_knowledge_documents_v1',
    {
      p_search:
        typeof filters?.search === 'string' && filters.search.trim()
          ? filters.search.trim()
          : null,
      p_category:
        typeof filters?.category === 'string' && filters.category.trim()
          ? filters.category.trim()
          : null,
      p_limit: Math.min(Math.max(Number(filters?.limit ?? 1000), 1), 1000),
    },
  );

  if (error) {
    recordAssistantRuntimeReadFailure('knowledge_documents', error);
    return null;
  }

  recordAssistantRuntimeReadSuccess('knowledge_documents');
  return (data || [])
    .map((row: any) => mapPublicKnowledgeRpcPayload(row?.payload ?? row))
    .filter(Boolean);
}

async function tryGetAssistantLegacyReviewContent(
  kind: LegacyReviewContentKind,
) {
  if (!isLegacyReviewContentUatEnabled(process.env)) return null;

  const client = getAssistantSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.rpc(
    'runtime_legacy_review_content_v1',
    { p_source_table: kind },
  );

  if (error) {
    console.warn(
      `[runtimeRepository] legacy review content UAT read failed: kind=${kind}`,
    );
    return null;
  }

  return (data || [])
    .map((row: any, index: number) =>
      mapLegacyReviewContentPayload(kind, row?.payload ?? row, index),
    )
    .filter((row: any) => row.question);
}

/**
 * Exact, read-only assistant.knowledge_documents UUID lookup for the current
 * C4/AR1 cohort. This deliberately bypasses the composite bundle gate because
 * a companion-table outage must not hide an existing knowledge_document row.
 * It never infers a link and never falls back to title, URL, semantic or vector
 * matching. Invalid/non-UUID input is rejected before any remote request.
 */
export async function runtimeGetKnowledgeDocumentByExactUuid(id: unknown) {
  const exactUuid = normalizeExactKnowledgeDocumentUuid(id);
  if (!exactUuid) return undefined;

  const client = getAssistantSupabaseClient();
  if (!client) return undefined;

  const { data, error } = await client
    .from('knowledge_documents')
    .select(ASSISTANT_KNOWLEDGE_DOCUMENT_SELECT)
    .eq('id', exactUuid)
    .maybeSingle();

  if (error) {
    recordAssistantRuntimeReadFailure('knowledge_documents', error);
    return undefined;
  }

  recordAssistantRuntimeReadSuccess('knowledge_documents');
  if (!data) return undefined;

  const mapped = mapAssistantKnowledgeDocumentRow(
    data,
    emptyAssistantKnowledgeDocumentMapContext(),
  );

  // This resolver is entered with a sovereign C4 UUID. Keep that UUID as the
  // primary runtime id even when legacy metadata contains a numeric legacy_id,
  // so the later AR1 session read remains on the same exact, bounded path.
  return { ...mapped, id: data.id, uuid: data.id };
}

async function tryGetAssistantKnowledgeDocumentBundle(filters?: any) {
  const client = getAssistantSupabaseClient();
  if (!client) return null;

  // A recent companion failure means a document bundle might be incomplete. Avoid repeated reads and
  // reject the entire bundle rather than returning a deceptively complete-looking partial result.
  if (assistantRuntimeBundleCircuitOpen()) return null;

  let query = client
    .from('knowledge_documents')
    .select(ASSISTANT_KNOWLEDGE_DOCUMENT_SELECT)
    .order('updated_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.isActive !== undefined && Number(filters.isActive) === 1) {
    query = query.eq('status', 'approved').eq('is_chat_eligible', true);
  }

  const requestedSearch = typeof filters?.search === 'string' ? escapeIlikeValue(filters.search) : '';
  if (requestedSearch) query = query.or(`title.ilike.%${requestedSearch}%,content.ilike.%${requestedSearch}%`);

  const { data, error } = await query;
  if (error) {
    recordAssistantRuntimeReadFailure('knowledge_documents', error);
    return null;
  }
  recordAssistantRuntimeReadSuccess('knowledge_documents');

  const documentRows = data || [];
  if (documentRows.length === 0) return [];

  const sourceIds = Array.from(new Set(documentRows.map((row: any) => row.source_id).filter(Boolean)));
  const referenceDocumentIds = Array.from(new Set(documentRows.map((row: any) => row.reference_document_id).filter(Boolean)));
  const documentIds = documentRows.map((row: any) => row.id).filter(Boolean);
  let bundleRejected = false;

  const sourceById = new Map<string, any>();
  if (sourceIds.length > 0) {
    const { data: sourceRows, error: sourceError } = await client
      .from('knowledge_sources')
      .select('id, name, type, base_url, description, authority_level, is_active, metadata_json, created_at, updated_at')
      .in('id', sourceIds);
    if (sourceError) {
      recordAssistantRuntimeReadFailure('knowledge_sources', sourceError);
      bundleRejected = true;
    } else {
      recordAssistantRuntimeReadSuccess('knowledge_sources');
      for (const sourceRow of sourceRows || []) sourceById.set(sourceRow.id, mapAssistantKnowledgeSourceRow(sourceRow));
    }
  }

  const referenceDocumentById = new Map<string, any>();
  if (referenceDocumentIds.length > 0) {
    const { data: referenceRows, error: referenceError } = await client
      .from('reference_documents')
      .select('id, source_id, title, document_type, language, status, authority_level, domain_scope, source_type, summary, metadata_json, created_at, updated_at')
      .in('id', referenceDocumentIds);
    if (referenceError) {
      recordAssistantRuntimeReadFailure('reference_documents', referenceError);
      bundleRejected = true;
    } else {
      recordAssistantRuntimeReadSuccess('reference_documents');
      for (const referenceRow of referenceRows || []) {
        const metadata = referenceRow?.metadata_json && typeof referenceRow.metadata_json === 'object' ? referenceRow.metadata_json : {};
        referenceDocumentById.set(referenceRow.id, {
          ...referenceRow,
          metadataJson: metadata,
          createdAt: normalizeLegacyDateString(referenceRow.created_at),
          updatedAt: normalizeLegacyDateString(referenceRow.updated_at),
        });
      }
    }
  }

  const filesByReferenceDocumentId = new Map<string, any[]>();
  if (referenceDocumentIds.length > 0) {
    const { data: fileRows, error: fileError } = await client
      .from('reference_files')
      .select('id, reference_document_id, storage_path, original_filename, mime_type, file_size_bytes, file_hash, is_primary, ocr_text, extracted_text, metadata_json, created_at')
      .in('reference_document_id', referenceDocumentIds)
      .order('created_at', { ascending: false });
    if (fileError) {
      recordAssistantRuntimeReadFailure('reference_files', fileError);
      bundleRejected = true;
    } else {
      recordAssistantRuntimeReadSuccess('reference_files');
      for (const fileRow of fileRows || []) {
        const mapped = mapAssistantReferenceFileRow(fileRow, null);
        const bucket = filesByReferenceDocumentId.get(fileRow.reference_document_id) || [];
        bucket.push(mapped);
        filesByReferenceDocumentId.set(fileRow.reference_document_id, bucket);
      }
    }
  }

  const citationsByKnowledgeDocumentId = new Map<string, any[]>();
  if (documentIds.length > 0) {
    const { data: citationRows, error: citationError } = await client
      .from('knowledge_citations')
      .select('id, knowledge_document_id, reference_document_id, reference_file_id, citation_type, locator, excerpt, metadata_json, created_at')
      .in('knowledge_document_id', documentIds)
      .order('created_at', { ascending: false });
    if (citationError) {
      recordAssistantRuntimeReadFailure('knowledge_citations', citationError);
      bundleRejected = true;
    } else {
      recordAssistantRuntimeReadSuccess('knowledge_citations');
      for (const citationRow of citationRows || []) {
        const mapped = mapAssistantKnowledgeCitationRow(citationRow);
        const bucket = citationsByKnowledgeDocumentId.get(citationRow.knowledge_document_id) || [];
        bucket.push(mapped);
        citationsByKnowledgeDocumentId.set(citationRow.knowledge_document_id, bucket);
      }
    }
  }

  if (bundleRejected) return null;

  const bundleContext = { sourceById, referenceDocumentById, filesByReferenceDocumentId, citationsByKnowledgeDocumentId };
  const mappedDocs = documentRows.map((row: any) => mapAssistantKnowledgeDocumentRow(row, bundleContext));
  for (const doc of mappedDocs) {
    if (Array.isArray(doc.documentFiles)) doc.documentFiles = doc.documentFiles.map((file: any) => ({ ...file, documentId: doc.id }));
  }

  return mappedDocs;
}

async function tryGetAssistantSystemSettings() {
  const client = getAssistantSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from('system_settings')
    .select('key, value_json')
    .limit(500);

  if (error) {
    console.warn('[runtimeRepository] assistant.system_settings read failed, falling back to local store', error.message);
    return null;
  }

  if (!data || data.length === 0) return null;

  const patch: Record<string, any> = {};
  for (const row of data) {
    patch[row.key] = row.value_json;
  }
  return patch;
}

async function tryGetAssistantKnowledgeSources(filters?: any) {
  const client = getAssistantSupabaseClient();
  if (!client) return null;

  let query = client
    .from('knowledge_sources')
    .select('id, name, type, base_url, description, authority_level, is_active, metadata_json, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', Number(filters.isActive) === 1);
  }

  const requestedType = typeof filters?.type === 'string' ? filters.type.trim() : '';
  if (requestedType) {
    const normalizedType = ['wikipedia', 'rss', 'scraper', 'pdf_url', 'api'].includes(requestedType)
      ? 'external_fetch'
      : requestedType;
    query = query.eq('type', normalizedType);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('[runtimeRepository] assistant.knowledge_sources read failed, falling back to local store', error.message);
    return null;
  }

  return (data || []).map(mapAssistantKnowledgeSourceRow);
}

async function hasDb() {
  return !!(await getDb());
}

function normalizeMergedKnowledgeDocument(doc: any) {
  const status = doc?.status || (Number(doc?.isActive) === 1 ? 'approved' : 'draft');
  const isApproved = status === 'approved';
  return {
    ...doc,
    status,
    reviewDecision: doc?.reviewDecision ?? (isApproved ? 'approve' : status === 'rejected' ? 'reject' : status === 'review_only' ? 'review_only' : null),
    reviewNotes: doc?.reviewNotes ?? null,
    reviewedBy: doc?.reviewedBy ?? null,
    reviewedAt: doc?.reviewedAt ?? null,
    approvalVersion: typeof doc?.approvalVersion === 'number' ? doc.approvalVersion : (isApproved ? 1 : 0),
    isChatEligible: doc?.isChatEligible ?? (isApproved ? 1 : 0),
    reviewTrace: Array.isArray(doc?.reviewTrace) ? doc.reviewTrace : [],
  };
}

async function getFallbackKnowledgeDocuments(filters?: any) {
  const dbRows = (await hasDb()) ? await getKnowledgeDocumentsDb(filters) : [];
  const localRows = await local.listKnowledgeDocuments(filters);
  const normalized = [
    ...(dbRows || []).map((row: any) => normalizeMergedKnowledgeDocument(row)),
    ...(localRows || []).map((row: any) => normalizeMergedKnowledgeDocument(row)),
  ];
  return dedupeKnowledgeDocuments(normalized);
}

function dedupeKnowledgeDocuments(rows: any[]) {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const row of rows || []) {
    const key = `${row?.uuid || row?.id || ''}|${row?.title || ''}|${row?.sourceUrl || ''}|${row?.category || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out.sort((a: any, b: any) => `${b.updatedAt || b.createdAt || ''}`.localeCompare(`${a.updatedAt || a.createdAt || ''}`));
}

async function tryGetLocalKnowledgeDocument(id: any) {
  const numericId = normalizeLegacyNumericId(id);
  if (numericId === null) return undefined;
  return await local.getKnowledgeDocument(numericId);
}

async function hasLocalKnowledgeDocument(id: any) {
  const doc = await tryGetLocalKnowledgeDocument(id);
  return !!doc;
}

function requireAssistantSupabaseClient() {
  const client = getAssistantSupabaseClient();
  if (!client) {
    throw new Error('Assistant Supabase client is not configured');
  }
  return client;
}

export async function runtimeCaptureLocalLearningCandidate(input: {
  question: string;
  answer: string;
  references: any[];
  synthesisMode?: string | null;
  skillRuntime?: any;
  citationAudit?: any;
  semanticAudit?: any;
  legalSkillAudit?: any;
  createdBy?: number | null;
}) {
  if (getAssistantSupabaseClient()) {
    return {
      captured: false,
      storage: "shared_runtime",
      reason: "shared_runtime_configured_use_governed_ai_tool_run_path",
    } as const;
  }

  const draft = buildLearningCandidateKnowledgeDraft(input);
  const candidateKey = buildLearningCandidateKey(input.question);
  const existing = (await local.listKnowledgeDocuments()).find((document: any) => {
    const metadata = document?.metadataJson && typeof document.metadataJson === "object"
      ? document.metadataJson
      : {};
    return (
      document?.toolOrigin === WAQF_RESEARCH_LEARNING_CANDIDATE_ORIGIN &&
      metadata.candidate_key === candidateKey &&
      (document?.status === "review_only" || document?.status === "draft")
    );
  });

  const document = existing
    ? await local.updateKnowledgeDocument(existing.id, draft)
    : await local.createKnowledgeDocument(draft);

  return {
    captured: true,
    storage: "local_review_only",
    documentId: document?.id ?? null,
    status: document?.status ?? "review_only",
    isChatEligible: Number(document?.isChatEligible ?? 0),
    sourceVerificationStatus: document?.metadataJson?.source_verification_status ?? "pending",
    citationVerificationStatus: document?.metadataJson?.citation_verification_status ?? "linked",
    reusedExistingCandidate: Boolean(existing),
    promotionPolicy: "human_verified_only",
  } as const;
}

export async function runtimeCreateAiToolRun(input: any) {
  const client = requireAssistantSupabaseClient();
  const insertPayload = {
    tool_key: input.toolKey,
    run_status: input.runStatus ?? 'completed',
    approval_status: input.approvalStatus ?? 'pending',
    title: input.title ?? null,
    input_text: input.inputText ?? null,
    input_json: input.inputJson ?? {},
    output_text: input.outputText ?? null,
    output_json: input.outputJson ?? {},
    error_message: input.errorMessage ?? null,
    source_context_json: input.sourceContextJson ?? {},
    created_by_admin_user_id: input.createdByAdminUserId ?? null,
    approved_by_admin_user_id: input.approvedByAdminUserId ?? null,
    approved_at: input.approvedAt ?? null,
    notes: input.notes ?? null,
  };

  const { data, error } = await client
    .from('ai_tool_runs')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create ai_tool_run: ${error.message}`);
  }

  await runtimeCreateAiToolRunEvent({
    toolRunId: data.id,
    eventType: 'created',
    eventPayload: {
      toolKey: insertPayload.tool_key,
      runStatus: insertPayload.run_status,
      approvalStatus: insertPayload.approval_status,
    },
    createdByAdminUserId: input.createdByAdminUserId ?? null,
  });

  if (insertPayload.run_status === 'completed') {
    await runtimeCreateAiToolRunEvent({
      toolRunId: data.id,
      eventType: 'completed',
      eventPayload: {
        toolKey: insertPayload.tool_key,
      },
      createdByAdminUserId: input.createdByAdminUserId ?? null,
    });
  }

  if (insertPayload.run_status === 'failed') {
    await runtimeCreateAiToolRunEvent({
      toolRunId: data.id,
      eventType: 'failed',
      eventPayload: {
        toolKey: insertPayload.tool_key,
        errorMessage: insertPayload.error_message,
      },
      createdByAdminUserId: input.createdByAdminUserId ?? null,
    });
  }

  return data;
}



export async function runtimeListAiToolRuns(input: any = {}) {
  const client = requireAssistantSupabaseClient();
  const limit = Math.min(Math.max(Number(input.limit ?? 50), 1), 200);
  let query = client
    .from('ai_tool_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (input.toolKey) {
    query = query.eq('tool_key', input.toolKey);
  }
  if (input.approvalStatus) {
    query = query.eq('approval_status', input.approvalStatus);
  }
  if (input.runStatus) {
    query = query.eq('run_status', input.runStatus);
  }
  if (input.searchText) {
    const term = String(input.searchText).trim();
    if (term) {
      query = query.or(`title.ilike.%${term}%,input_text.ilike.%${term}%`);
    }
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to list ai_tool_runs: ${error.message}`);
  }
  return data || [];
}

export async function runtimeGetAiToolRunMetrics() {
  const client = requireAssistantSupabaseClient();
  const { data, error } = await client
    .from('ai_tool_runs')
    .select('tool_key, approval_status, run_status, created_at')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Failed to load ai_tool_run metrics: ${error.message}`);
  }

  const rows = data || [];
  const metrics = {
    total: rows.length,
    byTool: {} as Record<string, number>,
    byApproval: { pending: 0, approved: 0, rejected: 0 } as Record<string, number>,
    byRunStatus: { completed: 0, failed: 0, draft: 0, archived: 0 } as Record<string, number>,
  };

  for (const row of rows as any[]) {
    metrics.byTool[row.tool_key] = (metrics.byTool[row.tool_key] || 0) + 1;
    if (row.approval_status) metrics.byApproval[row.approval_status] = (metrics.byApproval[row.approval_status] || 0) + 1;
    if (row.run_status) metrics.byRunStatus[row.run_status] = (metrics.byRunStatus[row.run_status] || 0) + 1;
  }

  return metrics;
}


const sovereignAiToolKeys = ['classify', 'extract', 'summarize', 'compare', 'precedents', 'predict'] as const;

function countArabicCharacters(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return (text.match(/[\u0600-\u06FF]/g) || []).length;
}

function normalizeToolLabel(toolKey: string) {
  const labels: Record<string, string> = {
    classify: 'التصنيف التلقائي',
    extract: 'استخراج المعلومات',
    summarize: 'التلخيص الذكي',
    compare: 'مقارنة الأحكام',
    precedents: 'تحليل السوابق',
    predict: 'توقع النتائج',
  };
  return labels[toolKey] || toolKey;
}

function buildBackendActivationDecision(stats: {
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  createdEvents: number;
  completedEvents: number;
  failedEvents: number;
  linkedToKnowledgeEvents: number;
  knowledgeLinks: number;
  pendingReviewRuns: number;
}) {
  if (stats.totalRuns === 0) {
    return {
      backendStatus: 'pending_evidence' as const,
      backendStatusLabel: 'بانتظار دليل تشغيل',
      nextAction: 'تشغيل الأداة مرة واحدة من الواجهة ثم التحقق من ai_tool_runs وai_tool_run_events.',
    };
  }

  if (stats.completedRuns === 0 && stats.failedRuns > 0) {
    return {
      backendStatus: 'degraded' as const,
      backendStatusLabel: 'متعطل أو غير مستقر',
      nextAction: 'فتح آخر خطأ وربطه بسجل Error Record قبل أي اعتماد وظيفي.',
    };
  }

  if (stats.completedRuns > 0 && (stats.createdEvents === 0 || stats.completedEvents === 0)) {
    return {
      backendStatus: 'active_with_warnings' as const,
      backendStatusLabel: 'يعمل مع نقص أثر',
      nextAction: 'مراجعة تسجيل أحداث created/completed لأن التشغيلات لا تكفي دون أثر سيادي.',
    };
  }

  if (stats.completedRuns > 0 && stats.knowledgeLinks === 0 && stats.linkedToKnowledgeEvents === 0) {
    return {
      backendStatus: 'active_with_warnings' as const,
      backendStatusLabel: 'يعمل دون ربط معرفة مثبت',
      nextAction: 'اختبار حفظ الناتج كمسودة معرفة للتأكد من ai_tool_run_links وحدث linked_to_knowledge.',
    };
  }

  if (stats.failedRuns > 0 || stats.pendingReviewRuns > 0) {
    return {
      backendStatus: 'active_with_warnings' as const,
      backendStatusLabel: 'مفعل مع ملاحظات مراجعة',
      nextAction: 'إغلاق التشغيلات الفاشلة أو المعلقة من سجل التشغيل والاعتماد.',
    };
  }

  return {
    backendStatus: 'active' as const,
    backendStatusLabel: 'مفعل سياديًا',
    nextAction: 'المسار جاهز للاستعمال التشغيلي مع استمرار المراجعة الدورية.',
  };
}

function analyzeAiToolRunQuality(run: any, links: any[] = [], events: any[] = []) {
  const warnings: string[] = [];
  const outputText = [run?.output_text, run?.output_json ? JSON.stringify(run.output_json) : '']
    .filter(Boolean)
    .join('\n');
  const arabicChars = countArabicCharacters(outputText);
  const hasOutput = outputText.trim().length > 0;
  const eventTypes = new Set((events || []).map((event: any) => event.event_type));
  const hasCreatedEvent = eventTypes.has('created');
  const hasTerminalEvent = eventTypes.has('completed') || eventTypes.has('failed');
  const hasKnowledgeLink = (links || []).some((link: any) => link.link_type === 'generated_knowledge_draft' && link.knowledge_document_id);

  if (run?.run_status === 'failed') warnings.push('التشغيل فاشل ويحتاج Error Record قبل الاعتماد.');
  if (run?.run_status === 'completed' && !hasOutput) warnings.push('التشغيل مكتمل لكن لا يوجد ناتج محفوظ.');
  if (hasOutput && arabicChars < 12) warnings.push('الناتج يبدو غير عربي أو غير كافٍ لغويًا؛ يلزم مراجعة جودة المخرجات.');
  if (!hasCreatedEvent) warnings.push('حدث created غير موجود في سجل الأحداث.');
  if (!hasTerminalEvent) warnings.push('لا يوجد حدث نهائي completed/failed في سجل الأحداث.');
  if (run?.approval_status === 'pending') warnings.push('التشغيل بانتظار الاعتماد الإداري.');

  let score = 100;
  if (run?.run_status === 'failed') score -= 35;
  if (!hasOutput && run?.run_status === 'completed') score -= 25;
  if (hasOutput && arabicChars < 12) score -= 20;
  if (!hasCreatedEvent) score -= 10;
  if (!hasTerminalEvent) score -= 10;
  if (run?.approval_status === 'pending') score -= 10;
  if (hasKnowledgeLink) score += 5;

  const normalizedScore = Math.max(0, Math.min(100, score));
  return {
    score: normalizedScore,
    grade: normalizedScore >= 85 ? 'جاهز' : normalizedScore >= 65 ? 'يحتاج مراجعة' : 'غير جاهز',
    hasArabicOutput: !hasOutput ? null : arabicChars >= 12,
    hasOutput,
    hasCreatedEvent,
    hasTerminalEvent,
    hasKnowledgeLink,
    warnings,
  };
}

export async function runtimeGetAiToolBackendActivationSnapshot() {
  const client = requireAssistantSupabaseClient();
  const [{ data: runs, error: runsError }, { data: links, error: linksError }, { data: events, error: eventsError }] = await Promise.all([
    client
      .from('ai_tool_runs')
      .select('id, tool_key, run_status, approval_status, created_at, error_message')
      .order('created_at', { ascending: false })
      .limit(1000),
    client
      .from('ai_tool_run_links')
      .select('tool_run_id, link_type, knowledge_document_id, created_at')
      .order('created_at', { ascending: false })
      .limit(2000),
    client
      .from('ai_tool_run_events')
      .select('tool_run_id, event_type, created_at')
      .order('created_at', { ascending: false })
      .limit(5000),
  ]);

  if (runsError) throw new Error(`Failed to load ai_tool backend activation runs: ${runsError.message}`);
  if (linksError) throw new Error(`Failed to load ai_tool backend activation links: ${linksError.message}`);
  if (eventsError) throw new Error(`Failed to load ai_tool backend activation events: ${eventsError.message}`);

  const runsByTool = new Map<string, any[]>();
  for (const run of runs || []) {
    const key = String((run as any).tool_key || 'unknown');
    runsByTool.set(key, [...(runsByTool.get(key) || []), run]);
  }

  const eventsByRun = new Map<string, any[]>();
  for (const event of events || []) {
    const runId = String((event as any).tool_run_id || '');
    eventsByRun.set(runId, [...(eventsByRun.get(runId) || []), event]);
  }

  const linksByRun = new Map<string, any[]>();
  for (const link of links || []) {
    const runId = String((link as any).tool_run_id || '');
    linksByRun.set(runId, [...(linksByRun.get(runId) || []), link]);
  }

  const records = sovereignAiToolKeys.map((toolKey) => {
    const toolRuns = runsByTool.get(toolKey) || [];
    const toolRunIds = new Set(toolRuns.map((run: any) => String(run.id)));
    const toolEvents = (events || []).filter((event: any) => toolRunIds.has(String(event.tool_run_id)));
    const toolLinks = (links || []).filter((link: any) => toolRunIds.has(String(link.tool_run_id)));
    const latestRun = toolRuns[0] || null;
    const stats = {
      totalRuns: toolRuns.length,
      completedRuns: toolRuns.filter((run: any) => run.run_status === 'completed').length,
      failedRuns: toolRuns.filter((run: any) => run.run_status === 'failed').length,
      pendingReviewRuns: toolRuns.filter((run: any) => run.approval_status === 'pending').length,
      approvedRuns: toolRuns.filter((run: any) => run.approval_status === 'approved').length,
      rejectedRuns: toolRuns.filter((run: any) => run.approval_status === 'rejected').length,
      createdEvents: toolEvents.filter((event: any) => event.event_type === 'created').length,
      completedEvents: toolEvents.filter((event: any) => event.event_type === 'completed').length,
      failedEvents: toolEvents.filter((event: any) => event.event_type === 'failed').length,
      linkedToKnowledgeEvents: toolEvents.filter((event: any) => event.event_type === 'linked_to_knowledge').length,
      knowledgeLinks: toolLinks.filter((link: any) => link.link_type === 'generated_knowledge_draft' && link.knowledge_document_id).length,
    };
    const decision = buildBackendActivationDecision(stats);
    return {
      toolKey,
      toolLabel: normalizeToolLabel(toolKey),
      latestRunAt: latestRun?.created_at ?? null,
      latestRunStatus: latestRun?.run_status ?? null,
      latestApprovalStatus: latestRun?.approval_status ?? null,
      latestErrorMessage: latestRun?.error_message ?? null,
      ...stats,
      ...decision,
    };
  });

  const statusTotals = records.reduce<Record<string, number>>((acc, record) => {
    acc[record.backendStatus] = (acc[record.backendStatus] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    records,
    totals: {
      tools: records.length,
      active: statusTotals.active || 0,
      activeWithWarnings: statusTotals.active_with_warnings || 0,
      degraded: statusTotals.degraded || 0,
      pendingEvidence: statusTotals.pending_evidence || 0,
    },
  };
}

export async function runtimeGetAiToolRunDetails(toolRunId: string) {
  const client = requireAssistantSupabaseClient();
  const { data: run, error: runError } = await client
    .from('ai_tool_runs')
    .select('*')
    .eq('id', toolRunId)
    .maybeSingle();

  if (runError) {
    throw new Error(`Failed to load ai_tool_run: ${runError.message}`);
  }
  if (!run) return null;

  const [{ data: links, error: linksError }, { data: events, error: eventsError }] = await Promise.all([
    client
      .from('ai_tool_run_links')
      .select('*')
      .eq('tool_run_id', toolRunId)
      .order('created_at', { ascending: false }),
    client
      .from('ai_tool_run_events')
      .select('*')
      .eq('tool_run_id', toolRunId)
      .order('created_at', { ascending: false }),
  ]);

  if (linksError) {
    throw new Error(`Failed to load ai_tool_run_links: ${linksError.message}`);
  }
  if (eventsError) {
    throw new Error(`Failed to load ai_tool_run_events: ${eventsError.message}`);
  }

  const normalizedLinks = links || [];
  const normalizedEvents = events || [];

  return {
    run,
    links: normalizedLinks,
    events: normalizedEvents,
    quality: analyzeAiToolRunQuality(run, normalizedLinks, normalizedEvents),
  };
}

export async function runtimeUpdateAiToolRunReview(input: any) {
  const client = requireAssistantSupabaseClient();
  const updatePayload: any = {
    approval_status: input.approvalStatus,
    notes: input.notes ?? null,
  };

  if (input.approvalStatus === 'approved') {
    updatePayload.approved_at = input.approvedAt ?? new Date().toISOString();
    updatePayload.approved_by_admin_user_id = input.approvedByAdminUserId ?? null;
  }

  const { data, error } = await client
    .from('ai_tool_runs')
    .update(updatePayload)
    .eq('id', input.toolRunId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to update ai_tool_run review: ${error.message}`);
  }

  await runtimeCreateAiToolRunEvent({
    toolRunId: input.toolRunId,
    eventType: input.approvalStatus === 'approved' ? 'approved' : 'rejected',
    eventPayload: {
      approvalStatus: input.approvalStatus,
      notes: input.notes ?? null,
    },
    createdByAdminUserId: input.approvedByAdminUserId ?? null,
  });

  return data;
}

export async function runtimeReopenAiToolRun(input: any) {
  const client = requireAssistantSupabaseClient();
  const { data, error } = await client
    .from('ai_tool_runs')
    .update({
      approval_status: 'pending',
      approved_at: null,
      approved_by_admin_user_id: null,
      notes: input.notes ?? null,
    })
    .eq('id', input.toolRunId)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to reopen ai_tool_run: ${error.message}`);
  }

  await runtimeCreateAiToolRunEvent({
    toolRunId: input.toolRunId,
    eventType: 'reopened',
    eventPayload: {
      notes: input.notes ?? null,
    },
    createdByAdminUserId: input.createdByAdminUserId ?? null,
  });

  return data;
}

export async function runtimeCreateAiToolRunLink(input: any) {
  const client = requireAssistantSupabaseClient();
  const { data, error } = await client
    .from('ai_tool_run_links')
    .insert({
      tool_run_id: input.toolRunId,
      link_type: input.linkType,
      knowledge_document_id: input.knowledgeDocumentId ?? null,
      reference_document_id: input.referenceDocumentId ?? null,
      reference_file_id: input.referenceFileId ?? null,
      conversation_id: input.conversationId ?? null,
      message_id: input.messageId ?? null,
      created_by_admin_user_id: input.createdByAdminUserId ?? null,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create ai_tool_run_link: ${error.message}`);
  }

  return data;
}

export async function runtimeCreateAiToolRunEvent(input: any) {
  const client = requireAssistantSupabaseClient();
  const { data, error } = await client
    .from('ai_tool_run_events')
    .insert({
      tool_run_id: input.toolRunId,
      event_type: input.eventType,
      event_payload: input.eventPayload ?? {},
      created_by_admin_user_id: input.createdByAdminUserId ?? null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create ai_tool_run_event: ${error.message}`);
  }

  return data;
}

export async function runtimeCreateKnowledgeDocumentFromTool(input: any) {
  const client = requireAssistantSupabaseClient();
  const metadata = {
    tool: input.tool,
    sourceText: input.sourceText ?? null,
    toolResult: input.metadata ?? {},
    createdVia: 'ai_tool',
    toolRunId: input.toolRunId ?? null,
  };

  const insertPayload = {
    title: input.title,
    content: input.content,
    category: input.category ?? 'reference',
    status: 'draft',
    summary: input.metadata?.summary ?? null,
    tags: Array.isArray(input.tags) ? input.tags : [],
    is_chat_eligible: false,
    metadata_json: metadata,
    created_by: input.createdByAdminUserId ?? null,
  };

  const { data, error } = await client
    .from('knowledge_documents')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to create knowledge document from tool: ${error.message}`);
  }

  if (input.toolRunId) {
    await runtimeCreateAiToolRunLink({
      toolRunId: input.toolRunId,
      linkType: 'generated_knowledge_draft',
      knowledgeDocumentId: data.id,
      createdByAdminUserId: input.createdByAdminUserId ?? null,
      notes: 'Knowledge draft generated from AI tool run',
    });

    await runtimeCreateAiToolRunEvent({
      toolRunId: input.toolRunId,
      eventType: 'linked_to_knowledge',
      eventPayload: {
        knowledgeDocumentId: data.id,
        knowledgeDocumentTitle: data.title,
      },
      createdByAdminUserId: input.createdByAdminUserId ?? null,
    });
  }

  return data;
}


export async function runtimeCreateConversation(input: any) {
  return (await hasDb()) ? createConversationDb(input) : local.createConversation(input);
}
export async function runtimeGetUserConversations(userId: number) {
  return (await hasDb()) ? getUserConversationsDb(userId) : local.listUserConversations(userId);
}
export async function runtimeGetConversationById(id: number) {
  return (await hasDb()) ? getConversationByIdDb(id) : local.getConversation(id);
}
export async function runtimeUpdateConversation(id: number, updates: any) {
  return (await hasDb()) ? updateConversationDb(id, updates) : local.updateConversation(id, updates);
}
export async function runtimeCreateMessage(input: any) {
  return (await hasDb()) ? createMessageDb(input) : local.createMessage(input);
}
export async function runtimeGetConversationMessages(conversationId: number) {
  return (await hasDb()) ? getConversationMessagesDb(conversationId) : local.listConversationMessages(conversationId);
}

export async function runtimeGetKnowledgeScopeCodes(actor?: { authUserId?: string | null; platformUserId?: string | null } | null): Promise<string[]> {
  const client = getAssistantSupabaseClient();
  const authUserId = actor?.authUserId || actor?.platformUserId || null;
  if (!client || !authUserId) return [];

  const { data, error } = await client
    .from('knowledge_scope_assignments')
    .select('scope_code, expires_at')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true);

  if (error) {
    // KB58 schema may not be applied yet. Keep the runtime fail-closed for non-public scopes.
    console.warn('[runtimeRepository] assistant.knowledge_scope_assignments unavailable; non-public knowledge remains denied for non-privileged actors', error.message);
    return [];
  }

  const now = Date.now();
  return (data || [])
    .filter((row: any) => !row.expires_at || new Date(row.expires_at).getTime() >= now)
    .map((row: any) => String(row.scope_code || '').trim())
    .filter(Boolean);
}

export async function runtimeCreateKnowledgeDocument(input: any) {
  return await local.createKnowledgeDocument(input);
}
export async function runtimeGetPublicKnowledgeDocuments(filters?: any) {
  const assistantRows = await tryGetAssistantPublicKnowledgeDocuments(filters);
  if (assistantRows !== null) return assistantRows;

  const fallbackRows = await getFallbackKnowledgeDocuments({
    category: filters?.category,
    search: filters?.search,
    isActive: 1,
  });
  return filterPublicKnowledgeDocuments(fallbackRows, filters);
}

export async function runtimeGetPublicKnowledgeDocumentById(id: any) {
  const rows = await runtimeGetPublicKnowledgeDocuments({ limit: 1000 });
  return (rows || []).find(
    (row: any) =>
      String(row?.id) === String(id) || String(row?.uuid) === String(id),
  );
}

export async function runtimeGetLegacyReviewContent(
  kind: LegacyReviewContentKind,
) {
  return await tryGetAssistantLegacyReviewContent(kind);
}

export async function runtimeGetKnowledgeDocuments(filters?: any) {
  const assistantRows = await tryGetAssistantKnowledgeDocumentBundle(filters);
  const fallbackRows = await getFallbackKnowledgeDocuments(filters);
  if (assistantRows) return dedupeKnowledgeDocuments([...(assistantRows || []), ...(fallbackRows || [])]);
  return fallbackRows;
}
export async function runtimeGetKnowledgeDocumentById(id: any) {
  const allRows = await runtimeGetKnowledgeDocuments();
  const matched = (allRows || []).find((row: any) => String(row.id) === String(id) || String(row.uuid) === String(id));
  if (matched) return matched;
  const localDoc = await tryGetLocalKnowledgeDocument(id);
  if (localDoc) return normalizeMergedKnowledgeDocument(localDoc);
  if (typeof id === 'number') {
    return (await hasDb()) ? getKnowledgeDocumentByIdDb(id) : local.getKnowledgeDocument(id);
  }
  return undefined;
}
export async function runtimeUpdateKnowledgeDocument(id: any, updates: any) {
  const localDoc = await tryGetLocalKnowledgeDocument(id);
  if (localDoc) {
    const numericId = normalizeLegacyNumericId(id);
    const result = await local.updateKnowledgeDocument(numericId as number, updates);
    return result ? normalizeMergedKnowledgeDocument(result) : result;
  }
  if (typeof id !== 'number') throw new Error('الوثيقة المقروءة من assistant.* للقراءة فقط حاليًا.');
  const result = (await hasDb()) ? await updateKnowledgeDocumentDb(id, updates) : await local.updateKnowledgeDocument(id, updates);
  return result ? normalizeMergedKnowledgeDocument(result) : result;
}
export async function runtimeReviewKnowledgeDocument(id: any, input: any) {
  const localDoc = await tryGetLocalKnowledgeDocument(id);
  if (localDoc) {
    const numericId = normalizeLegacyNumericId(id);
    return await local.reviewKnowledgeDocument(numericId as number, input);
  }
  if (typeof id !== 'number') throw new Error('الوثيقة المقروءة من assistant.* للقراءة فقط حاليًا.');
  if (await hasDb()) {
    const isApproved = input?.status === 'approved';
    const updated = await updateKnowledgeDocumentDb(id, { isActive: isApproved ? 1 : 0 } as any);
    return normalizeMergedKnowledgeDocument({ ...updated, status: input?.status, reviewDecision: input?.status === 'approved' ? 'approve' : input?.status === 'rejected' ? 'reject' : input?.status === 'review_only' ? 'review_only' : null, reviewNotes: input?.notes ?? null, reviewedBy: input?.reviewedBy ?? null, reviewedAt: local.nowString(), approvalVersion: isApproved ? 1 : 0, isChatEligible: isApproved ? 1 : 0, reviewTrace: [{ eventType: 'review_status_changed', status: input?.status, decision: input?.status, notes: input?.notes ?? null, actorUserId: input?.reviewedBy ?? null, at: local.nowString(), source: 'runtime_db_overlay' }] });
  }
  return await local.reviewKnowledgeDocument(id, input);
}
export async function runtimeGetKnowledgeReviewTrace(id: any) {
  const doc = await runtimeGetKnowledgeDocumentById(id);
  return Array.isArray(doc?.reviewTrace) ? doc.reviewTrace : [];
}
export async function runtimeDeleteKnowledgeDocument(id: any) {
  const localDoc = await tryGetLocalKnowledgeDocument(id);
  if (localDoc) {
    const numericId = normalizeLegacyNumericId(id);
    return await local.deleteKnowledgeDocument(numericId as number);
  }
  if (typeof id !== 'number') throw new Error('الوثيقة المقروءة من assistant.* للقراءة فقط حاليًا.');
  return (await hasDb()) ? deleteKnowledgeDocumentDb(id) : local.deleteKnowledgeDocument(id);
}

export async function runtimeGetKnowledgeSources(filters?: any) {

  const assistantRows = await tryGetAssistantKnowledgeSources(filters);
  if (assistantRows) return assistantRows;
  return (await hasDb()) ? getKnowledgeSourcesDb(filters) : local.listKnowledgeSources(filters);
}
export async function runtimeGetKnowledgeSourceById(id: number) {
  const assistantRows = await tryGetAssistantKnowledgeSources();
  if (assistantRows) {
    return assistantRows.find((row: any) => row.id === id || row.uuid === id) ?? undefined;
  }
  return (await hasDb()) ? getKnowledgeSourceByIdDb(id) : local.getKnowledgeSource(id);
}
export async function runtimeCreateKnowledgeSource(input: any) {
  return (await hasDb()) ? createKnowledgeSourceDb(input) : local.createKnowledgeSource(input);
}
export async function runtimeUpdateKnowledgeSource(id: number, updates: any) {
  return (await hasDb()) ? updateKnowledgeSourceDb(id, updates) : local.updateKnowledgeSource(id, updates);
}
export async function runtimeDeleteKnowledgeSource(id: number) {
  return (await hasDb()) ? deleteKnowledgeSourceDb(id) : local.deleteKnowledgeSource(id);
}
export async function runtimeGetKnowledgeSourcesStats() {
  const assistantRows = await tryGetAssistantKnowledgeSources();
  if (assistantRows) {
    const totalSources = assistantRows.length;
    const activeSources = assistantRows.filter((s: any) => s.isActive === 1).length;
    const inactiveSources = totalSources - activeSources;
    const totalItems = assistantRows.reduce((sum: number, s: any) => sum + (s.itemsCount || 0), 0);
    const totalSuccess = assistantRows.reduce((sum: number, s: any) => sum + (s.successCount || 0), 0);
    const totalErrors = assistantRows.reduce((sum: number, s: any) => sum + (s.errorCount || 0), 0);
    const successRate = totalSuccess + totalErrors > 0 ? Math.round((totalSuccess / (totalSuccess + totalErrors)) * 100) : 100;
    const typeMap = new Map<string, number>();
    for (const source of assistantRows) {
      typeMap.set(source.type, (typeMap.get(source.type) || 0) + 1);
    }
    const sourcesByType = Array.from(typeMap.entries()).map(([type, count]) => ({ type, count }));
    const lastFetchDate = assistantRows
      .map((s: any) => s.lastFetchAt)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null;
    return {
      totalSources,
      activeSources,
      inactiveSources,
      totalItems,
      successRate,
      totalSuccess,
      totalErrors,
      recentFetches: 0,
      sourcesByType,
      lastFetchDate,
    };
  }
  return (await hasDb()) ? getKnowledgeSourcesStatsDb() : local.getKnowledgeSourcesStats();
}
export async function runtimeGetTopActiveKnowledgeSources(limit = 5) {
  const assistantRows = await tryGetAssistantKnowledgeSources({ isActive: 1 });
  if (assistantRows) {
    return assistantRows
      .sort((a: any, b: any) => (b.itemsCount || 0) - (a.itemsCount || 0) || (b.successCount || 0) - (a.successCount || 0))
      .slice(0, limit)
      .map((source: any) => ({
        id: source.id,
        name: source.name,
        type: source.type,
        itemsCount: source.itemsCount || 0,
        successCount: source.successCount || 0,
        errorCount: source.errorCount || 0,
        lastFetchAt: source.lastFetchAt || null,
      }));
  }
  return (await hasDb()) ? getTopActiveKnowledgeSourcesDb(limit) : local.getTopActiveKnowledgeSources(limit);
}
export async function runtimeGetFetchActivityLast7Days() {
  return (await hasDb()) ? getFetchActivityLast7DaysDb() : local.getFetchActivityLast7Days();
}

export async function runtimeCreateFetchedContent(input: any) {
  return (await hasDb()) ? createFetchedContentDb(input) : local.createFetchedContent(input);
}
export async function runtimeListFetchedContent(filters?: any) {
  return (await hasDb()) ? listFetchedContentDb(filters) : local.listFetchedContent(filters);
}
export async function runtimeCountFetchedContent(filters?: any) {
  return (await hasDb()) ? countFetchedContentDb(filters) : local.countFetchedContent(filters);
}
export async function runtimeGetFetchedContentById(id: number) {
  return (await hasDb()) ? getFetchedContentByIdDb(id) : local.getFetchedContent(id);
}
export async function runtimeApproveFetchedContent(id: number, reviewedBy: number) {
  if (await hasDb()) return approveFetchedContentDb(id, reviewedBy);
  const item = await local.getFetchedContent(id);
  if (!item) throw new Error('Fetched content not found');
  const doc = await local.createKnowledgeDocument({
    title: item.title,
    content: item.content,
    category: item.category || item.aiCategory || 'reference',
    source: item.author || undefined,
    sourceUrl: item.url || undefined,
    pdfUrl: item.pdfUrl || undefined,
    tags: item.tags,
    createdBy: reviewedBy,
    status: 'approved',
    reviewDecision: 'approve',
    reviewNotes: 'تمت ترقية الوثيقة من مسار المراجعة واعتمادها للاستخدام داخل الشات.',
    reviewedAt: local.nowString(),
    reviewedBy,
    approvalVersion: 1,
    isChatEligible: 1,
    isActive: 1,
    reviewTrace: [{ eventType: 'approval', status: 'approved', decision: 'approve', notes: 'تمت ترقية الوثيقة من fetched content.', actorUserId: reviewedBy, at: local.nowString(), source: 'fetched_content' }],
  });
  await local.updateFetchedContent(id, { status: 'approved', reviewedAt: local.nowString(), reviewedBy });
  return doc;
}
export async function runtimeRejectFetchedContent(id: number, reviewedBy: number) {
  return (await hasDb()) ? rejectFetchedContentDb(id, reviewedBy) : local.updateFetchedContent(id, { status: 'rejected', reviewedAt: local.nowString(), reviewedBy });
}
export async function runtimeBulkApproveFetchedContent(ids: number[], reviewedBy: number) {
  if (await hasDb()) return bulkApproveFetchedContentDb(ids, reviewedBy);
  let count = 0;
  for (const id of ids) {
    try { await runtimeApproveFetchedContent(id, reviewedBy); count++; } catch {}
  }
  return count;
}
export async function runtimeBulkRejectFetchedContent(ids: number[], reviewedBy: number) {
  if (await hasDb()) return bulkRejectFetchedContentDb(ids, reviewedBy);
  let count = 0;
  for (const id of ids) {
    try { await runtimeRejectFetchedContent(id, reviewedBy); count++; } catch {}
  }
  return count;
}
export async function runtimeUpdateFetchedContentProcessing(id: number, updates: any) {
  return (await hasDb()) ? updateFetchedContentProcessingDb(id, updates) : local.updateFetchedContent(id, { ...updates, processedAt: local.nowString(), processingVersion: updates.processingVersion || 'smart-processing-v1', processingError: updates.processingError || null });
}
export async function runtimeListPendingUnprocessedFetchedContent(limit = 20) {
  return (await hasDb()) ? listPendingUnprocessedFetchedContentDb(limit) : local.listPendingUnprocessedFetchedContent(limit);
}
export async function runtimeUpdateFetchedContentExtraction(id: number, patch: any) {
  return (await hasDb()) ? updateFetchedContentExtractionDb(id, patch) : local.updateFetchedContent(id, patch);
}
export async function runtimeCreateFetchedContentReviewEvent(input: any) {
  return (await hasDb()) ? createFetchedContentReviewEventDb(input) : local.createFetchedContentReviewEvent(input);
}
export async function runtimeListFetchedContentReviewEvents(fetchedContentId: number) {
  return (await hasDb()) ? listFetchedContentReviewEventsDb(fetchedContentId) : local.listFetchedContentReviewEvents(fetchedContentId);
}
export async function runtimeCreateClassificationRating(input: any) {
  return (await hasDb()) ? createClassificationRatingDb(input) : local.createClassificationRating(input);
}
export async function runtimeGetClassificationRatingsStats() {
  return (await hasDb()) ? getClassificationRatingsStatsDb() : local.getClassificationRatingsStats();
}

export async function runtimeDeleteFetchedContent(id: number) {
  return (await hasDb()) ? deleteFetchedContentDb(id) : local.deleteFetchedContent(id);
}
export async function runtimeCreateFetchLog(input: any) {
  return (await hasDb()) ? createFetchLogDb(input) : local.createFetchLog(input);
}
export async function runtimeGetFetchLogs(filters?: any) {
  return (await hasDb()) ? getFetchLogsDb(filters) : local.listFetchLogs(filters);
}
export async function runtimeUpdateFetchLog(id: number, updates: any) {
  return (await hasDb()) ? updateFetchLogDb(id, updates) : local.updateFetchLog(id, updates);
}

export async function runtimeGetDocumentFiles(documentId: any) {
  const assistantRows = await tryGetAssistantKnowledgeDocumentBundle();
  if (assistantRows) {
    const doc = assistantRows.find((row: any) => String(row.id) === String(documentId) || String(row.uuid) === String(documentId));
    if (doc) return doc.documentFiles || [];
  }
  const numericId = normalizeLegacyNumericId(documentId);
  if (numericId !== null) {
    const localDoc = await local.getKnowledgeDocument(numericId);
    if (localDoc) {
      return await local.listDocumentFiles(numericId);
    }
    return (await hasDb()) ? getDocumentFilesDb(numericId) : local.listDocumentFiles(numericId);
  }
  return [];
}
export async function runtimeAddDocumentFile(input: any) {
  const numericId = normalizeLegacyNumericId(input?.documentId);
  if (numericId !== null) {
    const localDoc = await local.getKnowledgeDocument(numericId);
    if (localDoc) {
      return await local.addDocumentFile({ ...input, documentId: numericId });
    }
  }
  return (await hasDb()) ? addDocumentFileDb(input) : local.addDocumentFile(input);
}
export async function runtimeDeleteDocumentFile(id: number) {
  await local.deleteDocumentFile(id).catch(() => null);
  if (await hasDb()) {
    try {
      return await deleteDocumentFileDb(id);
    } catch {
      return undefined;
    }
  }
  return undefined;
}


export async function runtimeGetSystemSettings() {
  const localSettings = await local.getSystemSettings();
  const assistantPatch = await tryGetAssistantSystemSettings();
  return assistantPatch ? { ...localSettings, ...assistantPatch } : localSettings;
}

export async function runtimeUpdateSystemSettings(updates: any) {
  return local.updateSystemSettings(updates);
}
