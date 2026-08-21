import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { AuthenticatedUser } from './_core/types/authUser';

// Governing invariant: no_automatic_chat_release; provenance changes never alter content lifecycle.

type JsonMap = Record<string, any>;

let clientSingleton: SupabaseClient<any, any, any, any, any> | null = null;

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function client(): SupabaseClient<any, any, any, any, any> {
  if (clientSingleton) return clientSingleton;
  const url = envValue('PWF_SUPABASE_URL') ?? envValue('PLATFORM_SUPABASE_URL') ?? envValue('SUPABASE_URL') ?? envValue('VITE_SUPABASE_URL');
  const key = envValue('PWF_SUPABASE_SERVICE_ROLE_KEY') ?? envValue('PLATFORM_SUPABASE_SERVICE_ROLE_KEY') ?? envValue('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('تعذر فتح سجل المصدر والحقوق: إعدادات Supabase السيادية غير متاحة.');
  clientSingleton = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'assistant' },
    global: { headers: { 'x-assistant-runtime': 'palwakf-source-provenance-rights-v1' } },
  });
  return clientSingleton;
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function asJson(value: unknown): JsonMap {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonMap : {};
}

function sourceUrl(source: any): string | null {
  const metadata = asJson(source?.metadata_json);
  const candidate = source?.base_url ?? metadata.url ?? metadata.baseUrl ?? null;
  return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
}

function normalizeRole(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

export function isDirectSuperAdmin(user?: Partial<AuthenticatedUser> | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  const platformRole = normalizeRole(user.platformRole);
  return ['super_admin', 'superadmin', 'super_user', 'superuser', 'owner'].includes(role)
    || ['super_admin', 'superadmin', 'super_user', 'superuser', 'owner'].includes(platformRole);
}

export function resolveSourceProvenanceActor(user?: Partial<AuthenticatedUser> | null) {
  const authUserId = String(user?.authUserId || user?.platformUserId || '').trim();
  if (!isUuid(authUserId)) {
    throw new Error('لا توجد هوية Supabase UUID صالحة لإجراء مصدر/حقوق محكوم.');
  }
  return { authUserId, isSuperAdmin: isDirectSuperAdmin(user) };
}

async function schemaCapability() {
  try {
    const { error } = await client().from('source_rights_profiles').select('source_id', { count: 'exact', head: true }).limit(1);
    if (error) {
      return {
        schemaReady: false,
        reason: error.code === '42P01' ? 'source_provenance_schema_not_applied' : `source_provenance_schema_unavailable:${error.code || 'unknown'}`,
      };
    }
    return { schemaReady: true, reason: null as string | null };
  } catch (error: any) {
    return { schemaReady: false, reason: `source_provenance_schema_unavailable:${error?.message || 'unknown'}` };
  }
}

export async function getSourceProvenanceRegistry() {
  const c = client();
  const capability = await schemaCapability();

  const [sourcesResponse, referenceResponse, knowledgeResponse] = await Promise.all([
    c.from('knowledge_sources')
      .select('id,name,type,base_url,description,authority_level,is_active,verification_status,review_required,metadata_json,created_at,updated_at')
      .order('created_at', { ascending: false }),
    c.from('reference_documents')
      .select('id,source_id,title,document_type,status,authority_level,verification_status,content_status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(5000),
    c.from('knowledge_documents')
      .select('id,source_id,reference_document_id,title,category,status,is_chat_eligible,content_status,updated_at')
      .order('updated_at', { ascending: false })
      .limit(5000),
  ]);

  if (sourcesResponse.error) throw new Error(`تعذر قراءة سجل مصادر المعرفة: ${sourcesResponse.error.message}`);
  if (referenceResponse.error) throw new Error(`تعذر قراءة المراجع المرتبطة بالمصادر: ${referenceResponse.error.message}`);
  if (knowledgeResponse.error) throw new Error(`تعذر قراءة المعرفة المرتبطة بالمصادر: ${knowledgeResponse.error.message}`);

  let rightsRows: any[] = [];
  let historyRows: any[] = [];
  if (capability.schemaReady) {
    const [rightsResponse, historyResponse] = await Promise.all([
      c.from('source_rights_profiles')
        .select('source_id,rights_status,license_type,license_url,publisher_name,rights_holder_name,attribution_text,permission_reference,terms_url,allowed_use_scope,full_text_retention_allowed,rag_eligibility,public_display_eligibility,review_status,reviewed_at,notes,updated_at'),
      c.from('source_url_history')
        .select('id,source_id,url,url_role,url_status,is_current,change_reason,observed_at,created_at')
        .order('created_at', { ascending: false })
        .limit(10000),
    ]);
    if (rightsResponse.error || historyResponse.error) {
      capability.schemaReady = false;
      capability.reason = `source_provenance_supporting_read_failed:${rightsResponse.error?.code || historyResponse.error?.code || 'unknown'}`;
    } else {
      rightsRows = rightsResponse.data || [];
      historyRows = historyResponse.data || [];
    }
  }

  const rightsBySource = new Map(rightsRows.map((row) => [row.source_id, row]));
  const historyBySource = new Map<string, any[]>();
  for (const row of historyRows) {
    const current = historyBySource.get(row.source_id) || [];
    current.push(row);
    historyBySource.set(row.source_id, current);
  }

  const referencesBySource = new Map<string, any[]>();
  for (const row of referenceResponse.data || []) {
    if (!row.source_id) continue;
    const current = referencesBySource.get(row.source_id) || [];
    current.push({ ...row, materialType: 'reference_document' });
    referencesBySource.set(row.source_id, current);
  }
  const knowledgeBySource = new Map<string, any[]>();
  for (const row of knowledgeResponse.data || []) {
    if (!row.source_id) continue;
    const current = knowledgeBySource.get(row.source_id) || [];
    current.push({ ...row, materialType: 'knowledge_document' });
    knowledgeBySource.set(row.source_id, current);
  }

  const sources = (sourcesResponse.data || []).map((source: any) => {
    const references = referencesBySource.get(source.id) || [];
    const knowledge = knowledgeBySource.get(source.id) || [];
    return {
      id: source.id,
      name: source.name,
      type: source.type,
      baseUrl: sourceUrl(source),
      description: source.description || null,
      authorityLevel: source.authority_level || 'unverified',
      isActive: source.is_active === true,
      verificationStatus: source.verification_status || 'pending',
      reviewRequired: source.review_required !== false,
      metadataJson: asJson(source.metadata_json),
      createdAt: source.created_at,
      updatedAt: source.updated_at,
      rights: rightsBySource.get(source.id) || null,
      urlHistory: historyBySource.get(source.id) || [],
      materials: [...references, ...knowledge]
        .sort((a, b) => String(b.updated_at || '').localeCompare(String(a.updated_at || '')))
        .slice(0, 500),
      materialCounts: {
        referenceDocuments: references.length,
        knowledgeDocuments: knowledge.length,
        total: references.length + knowledge.length,
      },
    };
  });

  const rightsRiskSources = sources.filter((source) => {
    const status = source.rights?.rights_status || 'unknown';
    return ['unknown', 'review_required', 'restricted', 'prohibited'].includes(status);
  }).length;

  return {
    contract: 'assistant_source_provenance_rights_registry_v1',
    capability,
    summary: {
      totalSources: sources.length,
      activeSources: sources.filter((source) => source.isActive).length,
      sourcesWithRightsProfiles: sources.filter((source) => Boolean(source.rights)).length,
      sourcesWithRightsRisk: rightsRiskSources,
      linkedMaterials: sources.reduce((total, source) => total + source.materialCounts.total, 0),
    },
    sources,
  };
}

function throwRpc(prefix: string, error: any): never {
  throw new Error(`${prefix}: ${error?.message || 'خطأ غير معروف'}`);
}

export async function upsertSourceProvenance(input: {
  actorAuthUserId: string;
  actorIsSuperAdmin: boolean;
  sourceId?: string | null;
  name: string;
  baseUrl: string;
  description?: string | null;
  authorityLevel?: string | null;
  isActive?: boolean;
  changeReason?: string | null;
  rights: JsonMap;
}) {
  const { data, error } = await client().rpc('rpc_source_provenance_upsert_source_v1', {
    p_actor_auth_user_id: input.actorAuthUserId,
    p_actor_is_super_admin: input.actorIsSuperAdmin,
    p_source_id: input.sourceId || null,
    p_name: input.name,
    p_base_url: input.baseUrl,
    p_description: input.description || null,
    p_authority_level: input.authorityLevel || 'unverified',
    p_is_active: input.isActive ?? true,
    p_change_reason: input.changeReason || null,
    p_rights_json: input.rights || {},
  });
  if (error) throwRpc('تعذر حفظ سجل المصدر والحقوق', error);
  return data;
}

export async function archiveSourceProvenance(input: {
  actorAuthUserId: string;
  actorIsSuperAdmin: boolean;
  sourceId: string;
  reason: string;
}) {
  const { data, error } = await client().rpc('rpc_source_provenance_archive_source_v1', {
    p_actor_auth_user_id: input.actorAuthUserId,
    p_actor_is_super_admin: input.actorIsSuperAdmin,
    p_source_id: input.sourceId,
    p_reason: input.reason,
  });
  if (error) throwRpc('تعذر أرشفة المصدر', error);
  return data;
}

export async function reviewSourceRightsProfile(input: {
  actorAuthUserId: string;
  actorIsSuperAdmin: boolean;
  sourceId: string;
  decision: 'verified' | 'rejected';
  reviewNotes: string;
}) {
  const { data, error } = await client().rpc('rpc_source_rights_review_v1', {
    p_actor_auth_user_id: input.actorAuthUserId,
    p_actor_is_super_admin: input.actorIsSuperAdmin,
    p_source_id: input.sourceId,
    p_decision: input.decision,
    p_review_notes: input.reviewNotes,
  });
  if (error) throwRpc('تعذر حفظ قرار المراجعة البشرية للحقوق', error);
  return data;
}
export async function getSourceProvenanceAccess(user?: Partial<AuthenticatedUser> | null) {
  const isSuperAdmin = isDirectSuperAdmin(user);
  const actorAuthUserId = String(user?.authUserId || user?.platformUserId || '').trim();
  if (!isUuid(actorAuthUserId)) {
    return { canManage: false, isSuperAdmin, authUserId: null, reason: 'supabase_identity_missing' };
  }
  if (isSuperAdmin) {
    return { canManage: true, isSuperAdmin: true, authUserId: actorAuthUserId, reason: null };
  }
  try {
    const { data, error } = await client()
      .from('knowledge_scope_assignments')
      .select('scope_code,access_level,is_active,expires_at')
      .eq('auth_user_id', actorAuthUserId);
    if (error) return { canManage: false, isSuperAdmin: false, authUserId: actorAuthUserId, reason: 'scope_read_failed' };
    const canManage = (data || []).some((row: any) => {
      if (!row.is_active) return false;
      if (row.expires_at && Date.parse(row.expires_at) < Date.now()) return false;
      const scope = String(row.scope_code || '').trim().toLowerCase();
      const level = String(row.access_level || '').trim().toLowerCase();
      return ['assistant.all', 'assistant.admin', 'assistant.source.manage'].includes(scope)
        && ['admin', 'publish'].includes(level);
    });
    return { canManage, isSuperAdmin: false, authUserId: actorAuthUserId, reason: canManage ? null : 'assistant_source_manage_scope_required' };
  } catch {
    return { canManage: false, isSuperAdmin: false, authUserId: actorAuthUserId, reason: 'scope_read_unavailable' };
  }
}
