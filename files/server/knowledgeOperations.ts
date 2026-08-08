import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type JsonMap = Record<string, unknown>;
type RuntimeReadRow = Record<string, any>;
let clientSingleton: SupabaseClient<any, any, any, any, any> | null = null;

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function client(): SupabaseClient<any, any, any, any, any> {
  if (clientSingleton) return clientSingleton;
  const url = envValue('PWF_SUPABASE_URL') ?? envValue('PLATFORM_SUPABASE_URL') ?? envValue('SUPABASE_URL') ?? envValue('VITE_SUPABASE_URL');
  const key = envValue('PWF_SUPABASE_SERVICE_ROLE_KEY') ?? envValue('PLATFORM_SUPABASE_SERVICE_ROLE_KEY') ?? envValue('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('تعذر فتح عمليات المراجعة: إعدادات خدمة Supabase السيادية غير متاحة.');
  clientSingleton = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'assistant' },
    global: { headers: { 'x-assistant-runtime': 'palwakf-review-operations-v1' } },
  });
  return clientSingleton;
}

function reviewerId(value: string | null | undefined): string {
  const normalized = String(value || '').trim();
  if (!normalized) throw new Error('لا يمكن تنفيذ الإجراء من دون معرّف مستخدم Supabase صالح للمراجع.');
  return normalized;
}
function fail(prefix: string, error: any): never { throw new Error(`${prefix}: ${error?.message || 'خطأ غير معروف'}`); }
const OPEN_REVIEW_TASK_STATUSES = new Set(['open', 'assigned', 'in_progress', 'blocked']);

function metrics(rows: any[]) {
  return rows.reduce((out: Record<string, number>, row: any) => {
    const key = `${row.workflow_stage || 'unknown'}:${row.status || 'unknown'}`;
    out[key] = (out[key] || 0) + 1;
    return out;
  }, {});
}

function canonicalQueueMetrics(rows: any[], totalFromQuery: number | null) {
  const byStage: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const openByStage: Record<string, number> = {};
  for (const row of rows) {
    const stage = String(row.workflow_stage || 'unknown');
    const status = String(row.status || 'unknown');
    byStage[stage] = (byStage[stage] || 0) + 1;
    byStatus[status] = (byStatus[status] || 0) + 1;
    if (OPEN_REVIEW_TASK_STATUSES.has(status)) openByStage[stage] = (openByStage[stage] || 0) + 1;
  }
  const materializedRows = rows.length;
  const total = totalFromQuery ?? materializedRows;
  const isTruncated = total > materializedRows;
  return {
    contract: 'assistant_review_queue_metrics_v1',
    totalTasks: total,
    materializedRows,
    isTruncated,
    canonical: !isTruncated,
    openTasks: Object.values(openByStage).reduce((sum, value) => sum + value, 0),
    byStage,
    byStatus,
    openByStage,
    sourceVerificationOpen: openByStage.source_verification || 0,
    citationVerificationOpen: openByStage.citation_verification || 0,
    contentClassificationOpen: openByStage.content_classification || 0,
  };
}
async function countRows(table: string, filter?: (query: any) => any): Promise<number | null> {
  try {
    let query = client().from(table).select('*', { count: 'exact', head: true });
    if (filter) query = filter(query);
    const { count, error } = await query;
    return error ? null : count ?? 0;
  } catch { return null; }
}

type KnowledgeOperationAccessLevel = 'review' | 'publish';

type ScopeAssignmentRow = {
  scope_code: string;
  access_level: string;
  is_active: boolean;
  expires_at: string | null;
};

const ACCESS_RANK: Record<string, number> = {
  read: 1,
  review: 2,
  publish: 3,
  admin: 4,
};

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isAssignmentActive(row: ScopeAssignmentRow, nowMs: number): boolean {
  if (!row.is_active) return false;
  if (!row.expires_at) return true;
  const expiresMs = Date.parse(row.expires_at);
  return Number.isFinite(expiresMs) && expiresMs >= nowMs;
}

function scopeAllows(row: ScopeAssignmentRow, requirement: KnowledgeOperationAccessLevel): boolean {
  const scope = String(row.scope_code || '').trim().toLowerCase();
  const level = ACCESS_RANK[String(row.access_level || '').trim().toLowerCase()] || 0;
  const requiredRank = ACCESS_RANK[requirement];

  if (scope === 'assistant.all' || scope === 'assistant.admin') return level >= requiredRank;
  if (requirement === 'review') return scope === 'assistant.review' && level >= ACCESS_RANK.review;
  return scope === 'assistant.publish' && level >= ACCESS_RANK.publish;
}

/** Server-side capability snapshot. Direct browser reads of assignments remain revoked. */
export async function runtimeGetKnowledgeOperationAccess(authUserId: string) {
  const normalized = reviewerId(authUserId);
  if (!validUuid(normalized)) throw new Error('معرّف مستخدم المراجع ليس UUID صالحًا.');

  const { data, error } = await client()
    .from('knowledge_scope_assignments')
    .select('scope_code,access_level,is_active,expires_at')
    .eq('auth_user_id', normalized);
  if (error) fail('تعذر التحقق من نطاقات معرفة المراجع', error);

  const activeAssignments = ((data || []) as ScopeAssignmentRow[])
    .filter((row) => isAssignmentActive(row, Date.now()))
    .map((row) => ({
      scopeCode: row.scope_code,
      accessLevel: row.access_level,
      expiresAt: row.expires_at,
    }));
  const activeRows = (data || []).filter((row: ScopeAssignmentRow) => isAssignmentActive(row, Date.now()));

  return {
    authUserId: normalized,
    canReview: activeRows.some((row) => scopeAllows(row, 'review')),
    canPublish: activeRows.some((row) => scopeAllows(row, 'publish')),
    activeAssignments,
    mode: 'assistant_knowledge_scope_server_guard_v1',
  };
}

export async function runtimeAssertKnowledgeOperationAccess(
  authUserId: string,
  requirement: KnowledgeOperationAccessLevel,
) {
  const access = await runtimeGetKnowledgeOperationAccess(authUserId);
  const allowed = requirement === 'review' ? access.canReview : access.canPublish;
  if (!allowed) {
    throw new Error(
      requirement === 'publish'
        ? 'صلاحية assistant.publish مطلوبة لهذا الإجراء.'
        : 'صلاحية assistant.review مطلوبة لهذا المسار التشغيلي.',
    );
  }
  return access;
}

/** Best-effort durable audit for an application-layer denial; never changes the denial outcome. */
export async function runtimeRecordKnowledgeOperationDenied(input: {
  authUserId: string | null | undefined;
  requirement: KnowledgeOperationAccessLevel;
  operation: string;
}) {
  const normalized = String(input.authUserId || '').trim();
  if (!validUuid(normalized)) return;
  try {
    await client().from('knowledge_access_events').insert({
      auth_user_id: normalized,
      action: input.requirement === 'publish' ? 'publish' : 'review',
      result: 'denied',
      scope_code: `assistant.${input.requirement}`,
      reason_code: 'server_scope_guard_denied',
      metadata_json: {
        operation: input.operation,
        required_access: input.requirement,
        gate: 'assistant_knowledge_scope_server_guard_v1',
      },
    });
  } catch {
    // The caller must still receive the access denial even when audit persistence is unavailable.
  }
}

export async function runtimeGetKnowledgeReviewOperationsSnapshot() {
  const c = client();
  const [tasks, promoted, needsMapping, inReview, linked, verified, pendingRefs, activeBindings] = await Promise.all([
    c.from('knowledge_review_tasks').select('workflow_stage,status', { count: 'exact' }).order('created_at', { ascending: true }).limit(10_000),
    countRows('legacy_import_register', q => q.eq('migration_status', 'promoted')),
    countRows('legacy_import_register', q => q.eq('migration_status', 'needs_mapping')),
    countRows('knowledge_documents', q => q.eq('status', 'in_review')),
    countRows('knowledge_citations', q => q.eq('verification_status', 'linked')),
    countRows('knowledge_citations', q => q.eq('verification_status', 'verified')),
    countRows('reference_documents', q => q.eq('verification_status', 'pending')),
    countRows('page_operation_bindings', q => q.eq('binding_status', 'active')),
  ]);
  if (tasks.error) fail('تعذر قراءة قائمة مهام المراجعة', tasks.error);
  const rows = tasks.data || [];
  const queue = canonicalQueueMetrics(rows, tasks.count ?? null);
  return {
    reviewTasksTotal: queue.totalTasks,
    reviewTasksOpen: queue.openTasks,
    reviewTaskMetrics: metrics(rows),
    canonicalQueueMetrics: queue,
    sourceVerificationOpen: queue.sourceVerificationOpen,
    citationVerificationOpen: queue.citationVerificationOpen,
    contentClassificationOpen: queue.contentClassificationOpen,
    promotedRegisterRows: promoted,
    needsMappingRows: needsMapping,
    reviewOnlyKnowledgeDocuments: inReview,
    linkedCitationsPendingVerification: linked,
    verifiedCitations: verified,
    pendingReferenceDocuments: pendingRefs,
    activePageBindings: activeBindings,
    mode: 'human_review_operations_v2_canonical_server_read_contract',
  };
}

export async function runtimeGetContentClassificationReconciliation() {
  const expectedHistoricalTaskCount = 6;
  const { data, error } = await client().from('knowledge_review_tasks')
    .select('id,target_type,target_id,workflow_stage,priority,status,assigned_to,completed_at,completed_by,dedupe_key,notes,metadata_json,created_at,updated_at')
    .eq('workflow_stage', 'content_classification')
    .order('created_at', { ascending: true });
  if (error) fail('تعذر تنفيذ تسوية مهام content_classification', error);
  const rows = data || [];
  const unresolved = rows.filter((row: any) => !['completed', 'cancelled'].includes(row.status));
  return {
    expectedHistoricalTaskCount,
    observedTaskCount: rows.length,
    reconciliationStatus: rows.length === expectedHistoricalTaskCount
      ? 'reconciled_count_match'
      : rows.length === 0
        ? 'reconciliation_required_no_current_rows'
        : 'reconciliation_required_count_mismatch',
    unresolvedCount: unresolved.length,
    completedCount: rows.filter((row: any) => row.status === 'completed').length,
    cancelledCount: rows.filter((row: any) => row.status === 'cancelled').length,
    decisionRule: 'لا إنشاء أو إلغاء أو حذف بديل قبل مطابقة كل مهمة مع سجلها ونتيجة apply السابقة.',
    results: rows,
    mode: 'read_only_content_classification_reconciliation_v1',
  };
}

export async function runtimeListKnowledgeReviewTasks(input?: { workflowStage?: string; status?: string; limit?: number; offset?: number; }) {
  const limit = Math.max(1, Math.min(input?.limit || 100, 500));
  const offset = Math.max(0, input?.offset || 0);
  let query = client().from('knowledge_review_tasks')
    .select('id,target_type,target_id,workflow_stage,priority,status,assigned_to,assigned_by,due_at,completed_at,completed_by,dedupe_key,notes,metadata_json,created_at,updated_at', { count: 'exact' })
    .order('priority', { ascending: false }).order('created_at', { ascending: true }).range(offset, offset + limit - 1);
  if (input?.workflowStage && input.workflowStage !== 'all') query = query.eq('workflow_stage', input.workflowStage);
  if (input?.status && input.status !== 'all') query = query.eq('status', input.status);
  const { data, error, count } = await query;
  if (error) fail('تعذر قراءة مهام المراجعة', error);
  return { total: count ?? (data || []).length, results: data || [], mode: 'human_review_operations_v1_task_queue' };
}

async function callRpc(name: string, payload: JsonMap, message: string) {
  const { data, error } = await client().rpc(name, payload);
  if (error) fail(message, error);
  return data;
}
export const runtimeClaimKnowledgeReviewTask = (input: { taskId: string; reviewerAuthUserId: string; }) => callRpc('rpc_claim_knowledge_review_task_v1', { p_task_id: input.taskId, p_reviewer_auth_user_id: reviewerId(input.reviewerAuthUserId) }, 'تعذر إسناد مهمة المراجعة');
export const runtimeVerifyReferenceSource = (input: { referenceDocumentId: string; reviewerAuthUserId: string; canonicalSourceUrl: string; issuerName: string; evidenceJson?: JsonMap; }) => callRpc('rpc_verify_official_reference_source_v1', { p_reference_document_id: input.referenceDocumentId, p_reviewer_auth_user_id: reviewerId(input.reviewerAuthUserId), p_canonical_source_url: input.canonicalSourceUrl, p_issuer_name: input.issuerName, p_evidence_json: input.evidenceJson || {} }, 'تعذر توثيق المصدر الرسمي');
export const runtimeVerifyKnowledgeCitation = (input: { knowledgeDocumentId: string; citationId?: string | null; reviewerAuthUserId: string; locator: string; excerpt?: string | null; evidenceJson?: JsonMap; }) => callRpc('rpc_verify_knowledge_citation_v1', { p_knowledge_document_id: input.knowledgeDocumentId, p_citation_id: input.citationId || null, p_reviewer_auth_user_id: reviewerId(input.reviewerAuthUserId), p_locator: input.locator, p_excerpt: input.excerpt || null, p_evidence_json: input.evidenceJson || {} }, 'تعذر توثيق الاستشهاد');
export const runtimeReleaseOfficialKnowledgeDocument = (input: { knowledgeDocumentId: string; reviewerAuthUserId: string; releaseNotes: string; }) => callRpc('rpc_release_official_knowledge_document_v1', { p_knowledge_document_id: input.knowledgeDocumentId, p_reviewer_auth_user_id: reviewerId(input.reviewerAuthUserId), p_release_notes: input.releaseNotes }, 'تعذر تحرير وثيقة المعرفة');

type ReviewTaskCaseInput = { taskId: string; reviewerAuthUserId: string };

async function readOne(table: string, id: string, columns: string): Promise<RuntimeReadRow | null> {
  const { data, error } = await client().from(table).select(columns).eq('id', id).maybeSingle();
  if (error) fail(`تعذر قراءة سياق ${table}`, error);
  return (data as unknown as RuntimeReadRow | null) ?? null;
}

export async function runtimeGetKnowledgeReviewTaskCase(input: ReviewTaskCaseInput) {
  const reviewerAuthUserId = reviewerId(input.reviewerAuthUserId);
  await runtimeAssertKnowledgeOperationAccess(reviewerAuthUserId, 'review');
  const task = await readOne(
    'knowledge_review_tasks',
    input.taskId,
    'id,target_type,target_id,workflow_stage,priority,status,assigned_to,assigned_by,due_at,notes,metadata_json,created_at,updated_at',
  );
  if (!task) throw new Error('لم يتم العثور على مهمة المراجعة المطلوبة.');

  const targetType = String(task.target_type || '');
  let knowledgeDocument: any = null;
  let referenceDocument: any = null;
  let selectedCitation: any = null;

  if (targetType === 'knowledge_document' || ['citation_verification', 'content_classification'].includes(String(task.workflow_stage))) {
    knowledgeDocument = await readOne(
      'knowledge_documents',
      String(task.target_id),
      'id,reference_document_id,source_id,title,category,status,authority_level,domain_scope,source_type,summary,content,tags,is_chat_eligible,requires_human_review,review_notes,review_decision,metadata_json,created_at,updated_at',
    );
  } else if (targetType === 'reference_document' || String(task.workflow_stage) === 'source_verification') {
    referenceDocument = await readOne(
      'reference_documents',
      String(task.target_id),
      'id,source_id,title,document_type,language,status,authority_level,domain_scope,source_type,summary,verification_status,review_notes,metadata_json,created_at,updated_at',
    );
    const { data, error } = await client()
      .from('knowledge_documents')
      .select('id,reference_document_id,source_id,title,category,status,authority_level,domain_scope,source_type,summary,content,tags,is_chat_eligible,requires_human_review,review_notes,review_decision,metadata_json,created_at,updated_at')
      .eq('reference_document_id', String(task.target_id))
      .order('updated_at', { ascending: false })
      .limit(1);
    if (error) fail('تعذر قراءة وثيقة المعرفة المرتبطة بالمصدر', error);
    knowledgeDocument = (data || [])[0] || null;
  } else if (targetType === 'knowledge_citation') {
    selectedCitation = await readOne(
      'knowledge_citations',
      String(task.target_id),
      'id,knowledge_document_id,reference_document_id,reference_file_id,citation_type,verification_status,locator,excerpt,metadata_json,created_at,verified_at,verified_by',
    );
    if (selectedCitation?.knowledge_document_id) {
      knowledgeDocument = await readOne(
        'knowledge_documents',
        String(selectedCitation.knowledge_document_id),
        'id,reference_document_id,source_id,title,category,status,authority_level,domain_scope,source_type,summary,content,tags,is_chat_eligible,requires_human_review,review_notes,review_decision,metadata_json,created_at,updated_at',
      );
    }
  }

  const referenceDocumentId = referenceDocument?.id || knowledgeDocument?.reference_document_id || selectedCitation?.reference_document_id || null;
  if (!referenceDocument && referenceDocumentId) {
    referenceDocument = await readOne(
      'reference_documents',
      String(referenceDocumentId),
      'id,source_id,title,document_type,language,status,authority_level,domain_scope,source_type,summary,verification_status,review_notes,metadata_json,created_at,updated_at',
    );
  }

  const sourceId = knowledgeDocument?.source_id || referenceDocument?.source_id || null;
  const source = sourceId
    ? await readOne('knowledge_sources', String(sourceId), 'id,name,type,base_url,description,authority_level,is_active,verification_status,metadata_json,created_at,updated_at')
    : null;

  const { data: citations, error: citationsError } = knowledgeDocument?.id
    ? await client().from('knowledge_citations')
      .select('id,knowledge_document_id,reference_document_id,reference_file_id,citation_type,verification_status,locator,excerpt,metadata_json,created_at,verified_at,verified_by')
      .eq('knowledge_document_id', knowledgeDocument.id)
      .order('created_at', { ascending: true })
    : { data: [], error: null as any };
  if (citationsError) fail('تعذر قراءة الاستشهادات المرتبطة', citationsError);

  const { data: files, error: filesError } = referenceDocumentId
    ? await client().from('reference_files')
      .select('id,reference_document_id,storage_path,original_filename,mime_type,file_size_bytes,file_hash,is_primary,ocr_text,extracted_text,metadata_json,created_at')
      .eq('reference_document_id', String(referenceDocumentId))
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })
    : { data: [], error: null as any };
  if (filesError) fail('تعذر قراءة الملفات المرتبطة', filesError);

  const assignedToCurrentReviewer = String(task.assigned_to || '') === reviewerAuthUserId;
  const taskClaimedByCurrentReviewer = assignedToCurrentReviewer && ['assigned', 'in_progress'].includes(String(task.status));

  return {
    contract: 'assistant_review_task_case_context_v1',
    task: {
      ...task,
      taskClaimedByCurrentReviewer,
      decisionBoundary: 'review_only_no_mapping_no_release',
    },
    knowledgeDocument,
    referenceDocument,
    source,
    selectedCitation,
    citations: citations || [],
    files: files || [],
    integrity: {
      contextAvailable: Boolean(knowledgeDocument || referenceDocument || selectedCitation),
      sourceAvailable: Boolean(source),
      citationCount: (citations || []).length,
      fileCount: (files || []).length,
      releaseEligible: false,
      mappingEligible: false,
    },
  };
}

export async function runtimeAssertKnowledgeReviewTaskClaim(input: {
  taskId: string;
  reviewerAuthUserId: string;
  workflowStage: 'source_verification' | 'citation_verification' | 'content_classification';
  targetId?: string;
}) {
  const reviewerAuthUserId = reviewerId(input.reviewerAuthUserId);
  const task = await readOne('knowledge_review_tasks', input.taskId, 'id,target_id,workflow_stage,status,assigned_to');
  if (!task) throw new Error('مهمة المراجعة غير موجودة.');
  if (String(task.workflow_stage) !== input.workflowStage) throw new Error('مرحلة المهمة لا تطابق الإجراء المطلوب.');
  if (input.targetId && String(task.target_id) !== String(input.targetId)) throw new Error('الهدف المرتبط بالمهمة لا يطابق الإجراء المطلوب.');
  if (!['assigned', 'in_progress'].includes(String(task.status)) || String(task.assigned_to || '') !== reviewerAuthUserId) {
    throw new Error('يجب استلام المهمة صراحةً من قبل المراجع الحالي قبل حفظ القرار.');
  }
  return task;
}

export const runtimeResolveContentClassificationContainment = async (input: {
  taskId: string;
  reviewerAuthUserId: string;
  decision: 'confirm_test' | 'confirm_duplicate' | 'confirm_quarantine' | 'defer';
  evidenceNote: string;
  evidenceJson?: JsonMap;
}) => {
  await runtimeAssertKnowledgeReviewTaskClaim({
    taskId: input.taskId,
    reviewerAuthUserId: input.reviewerAuthUserId,
    workflowStage: 'content_classification',
  });
  return callRpc('rpc_resolve_content_classification_containment_v1', {
    p_task_id: input.taskId,
    p_reviewer_auth_user_id: reviewerId(input.reviewerAuthUserId),
    p_decision: input.decision,
    p_evidence_note: input.evidenceNote,
    p_evidence_json: input.evidenceJson || {},
  }, 'تعذر حفظ قرار الاحتواء لتصنيف المحتوى');
};

export async function runtimeListKb08bMappingQueue(input?: { limit?: number; offset?: number; }) {
  const limit = Math.max(1, Math.min(input?.limit || 100, 500));
  const offset = Math.max(0, input?.offset || 0);
  const rpc = await client().rpc('rpc_kb08b_mapping_queue_v1', { p_limit: limit, p_offset: offset });
  if (!rpc.error) return { total: Array.isArray(rpc.data) ? rpc.data.length : 0, results: rpc.data || [], mode: 'kb08b_mapping_queue_rpc' };
  const fallback = await client().from('legacy_import_register')
    .select('id,legacy_batch,legacy_source_file,legacy_table_name,legacy_record_key,legacy_dedupe_key,migration_status,payload_json,notes,created_at', { count: 'exact' })
    .eq('migration_status', 'needs_mapping').order('created_at', { ascending: true }).range(offset, offset + limit - 1);
  if (fallback.error) fail('تعذر قراءة طابور مطابقة KB08B', fallback.error);
  return {
    total: fallback.count ?? (fallback.data || []).length,
    results: (fallback.data || []).map((row: any) => ({ ...row, title_candidate: row?.payload_json?.row?.title || row?.payload_json?.row?.question || row?.legacy_record_key || null, content_available: Boolean(row?.payload_json?.row?.content || row?.payload_json?.row?.content_text || row?.payload_json?.row?.description), resolution_state: 'sql_apply_pending' })),
    mode: 'kb08b_mapping_queue_fallback_read_only',
  };
}
export const runtimeResolveKb08bMapping = (input: { legacyImportId: string; reviewerAuthUserId: string; action: 'map_existing' | 'promote_review' | 'defer' | 'quarantine'; targetReferenceDocumentId?: string | null; targetKnowledgeDocumentId?: string | null; sourceId?: string | null; category?: string | null; domainScope?: string | null; notes?: string | null; evidenceJson?: JsonMap; }) => callRpc('rpc_kb08b_resolve_mapping_v1', { p_legacy_import_id: input.legacyImportId, p_reviewer_auth_user_id: reviewerId(input.reviewerAuthUserId), p_resolution_action: input.action, p_target_reference_document_id: input.targetReferenceDocumentId || null, p_target_knowledge_document_id: input.targetKnowledgeDocumentId || null, p_source_id: input.sourceId || null, p_category: input.category || null, p_domain_scope: input.domainScope || null, p_notes: input.notes || null, p_evidence_json: input.evidenceJson || {} }, 'تعذر حفظ قرار مطابقة KB08B');

export async function runtimeListPageOperationBindings() {
  const { data, error } = await client().from('page_operation_bindings').select('id,page_key,operation_domain,read_contract,write_contract,binding_status,notes,metadata_json,created_at,updated_at').order('page_key', { ascending: true });
  if (error) fail('تعذر قراءة ربط عمليات الصفحات', error);
  return data || [];
}
export const runtimeSetPageOperationBinding = (input: { pageKey: string; reviewerAuthUserId: string; bindingStatus: 'prepared' | 'active' | 'blocked'; readContract?: string | null; writeContract?: string | null; notes?: string | null; }) => callRpc('rpc_kb09_set_page_operation_binding_v1', { p_page_key: input.pageKey, p_reviewer_auth_user_id: reviewerId(input.reviewerAuthUserId), p_binding_status: input.bindingStatus, p_read_contract: input.readContract || null, p_write_contract: input.writeContract || null, p_notes: input.notes || null }, 'تعذر تحديث ربط عمليات الصفحة');
