import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Mega Batch C1: read-only recovery of legacy Manus provenance evidence.
 * Invariants:
 * - Never writes legacy payloads, sources, rights, links, lifecycle state, or Chat/RAG eligibility.
 * - Never treats the KB08 migration container as the material publisher.
 * - Returns only provenance metadata, never legacy content/body text.
 */

type JsonMap = Record<string, unknown>;
type MaterialKind = 'reference_document' | 'knowledge_document';
type MatchConfidence = 'high' | 'medium' | 'ambiguous' | 'none';

let clientSingleton: SupabaseClient<any, any, any, any, any> | null = null;

function envValue(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function client(): SupabaseClient<any, any, any, any, any> {
  if (clientSingleton) return clientSingleton;
  const url = envValue('PWF_SUPABASE_URL') ?? envValue('PLATFORM_SUPABASE_URL') ?? envValue('SUPABASE_URL') ?? envValue('VITE_SUPABASE_URL');
  const key = envValue('PWF_SUPABASE_SERVICE_ROLE_KEY') ?? envValue('PLATFORM_SUPABASE_SERVICE_ROLE_KEY') ?? envValue('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('تعذر فتح سجل أدلة Manus القديمة: إعدادات Supabase السيادية غير متاحة.');
  clientSingleton = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'assistant' },
    global: { headers: { 'x-assistant-runtime': 'palwakf-legacy-manus-provenance-c1-read-only' } },
  });
  return clientSingleton;
}

function asJson(value: unknown): JsonMap {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonMap : {};
}

function cleanText(value: unknown, max = 2000): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeTitle(value: string | null | undefined): string | null {
  const text = cleanText(value, 800);
  if (!text) return null;
  return text.toLowerCase().replace(/[\u064B-\u065F\u0670]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim() || null;
}

function isSafeHttpUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

type Leaf = { path: string; key: string; value: string };

/** Collect only scalar metadata leaves with bounded traversal; body/content fields are excluded by design. */
function collectMetadataLeaves(payload: unknown): Leaf[] {
  const leaves: Leaf[] = [];
  const stack: Array<{ value: unknown; path: string[]; depth: number }> = [{ value: payload, path: [], depth: 0 }];
  const blockedKeys = new Set(['content', 'contenttext', 'body', 'rawcontent', 'html', 'text', 'excerpt']);
  const maxDepth = 8;
  const maxNodes = 800;
  let nodes = 0;

  while (stack.length && nodes < maxNodes) {
    const current = stack.pop()!;
    nodes += 1;
    if (current.depth > maxDepth) continue;
    if (typeof current.value === 'string' || typeof current.value === 'number' || typeof current.value === 'boolean') {
      const key = current.path[current.path.length - 1] || '';
      if (!blockedKeys.has(normalizeKey(key))) {
        const text = cleanText(String(current.value));
        if (text) leaves.push({ path: current.path.join('.'), key, value: text });
      }
      continue;
    }
    if (Array.isArray(current.value)) {
      current.value.slice(0, 60).forEach((item, index) => stack.push({ value: item, path: [...current.path, String(index)], depth: current.depth + 1 }));
      continue;
    }
    if (current.value && typeof current.value === 'object') {
      for (const [key, value] of Object.entries(current.value as JsonMap)) {
        stack.push({ value, path: [...current.path, key], depth: current.depth + 1 });
      }
    }
  }
  return leaves;
}

const fieldAliases: Record<string, string[]> = {
  title: ['title', 'documenttitle', 'name', 'question', 'subject'],
  source: ['source', 'sourcename', 'reference', 'origin', 'publicationtitle'],
  sourceUrl: ['sourceurl', 'canonicalurl', 'originurl', 'originalurl', 'referenceurl', 'websiteurl'],
  url: ['url', 'link', 'website'],
  pdfUrl: ['pdfurl', 'pdf', 'documenturl', 'fileurl'],
  author: ['author', 'authorname', 'creator', 'writer'],
  publisher: ['publisher', 'publishername', 'issuer', 'organization', 'organisation'],
  legacyId: ['id', 'uuid', 'knowledgedocumentid', 'referencedocumentid'],
  fetchSourceId: ['sourceid', 'fetchsourceid'],
};

function firstForAliases(leaves: Leaf[], aliases: string[]): string | null {
  const normalized = new Set(aliases);
  const match = leaves.find((leaf) => normalized.has(normalizeKey(leaf.key)) && cleanText(leaf.value));
  return match ? match.value : null;
}

function pathsForAliases(leaves: Leaf[], aliases: string[]): string[] {
  const normalized = new Set(aliases);
  return leaves
    .filter((leaf) => normalized.has(normalizeKey(leaf.key)))
    .map((leaf) => leaf.path)
    .filter((path, index, all) => Boolean(path) && all.indexOf(path) === index)
    .slice(0, 12);
}

function collectAllForAliases(leaves: Leaf[], aliases: string[]): string[] {
  const normalized = new Set(aliases);
  return leaves
    .filter((leaf) => normalized.has(normalizeKey(leaf.key)))
    .map((leaf) => leaf.value)
    .filter((value, index, all) => Boolean(value) && all.indexOf(value) === index)
    .slice(0, 12);
}

function candidateUrls(values: Array<string | null | undefined>): string[] {
  return values
    .map((value) => cleanText(value))
    .filter((value): value is string => Boolean(value && isSafeHttpUrl(value)))
    .filter((value, index, all) => all.indexOf(value) === index)
    .slice(0, 8);
}

type CurrentMaterial = {
  id: string;
  title: string | null;
  materialKind: MaterialKind;
  sourceId?: string | null;
  referenceDocumentId?: string | null;
};

function buildCurrentMaterialIndex(rows: any[], materialKind: MaterialKind) {
  const byId = new Map<string, CurrentMaterial>();
  const byNormalizedTitle = new Map<string, CurrentMaterial[]>();
  for (const row of rows || []) {
    if (!row?.id) continue;
    const item: CurrentMaterial = {
      id: String(row.id),
      title: cleanText(row.title, 800),
      materialKind,
      sourceId: row.source_id || null,
      referenceDocumentId: row.reference_document_id || null,
    };
    byId.set(item.id, item);
    const normalized = normalizeTitle(item.title);
    if (normalized) {
      const existing = byNormalizedTitle.get(normalized) || [];
      existing.push(item);
      byNormalizedTitle.set(normalized, existing);
    }
  }
  return { byId, byNormalizedTitle };
}

function mergeIndex<T>(left: Map<string, T>, right: Map<string, T>) {
  const result = new Map<string, T>(left);
  right.forEach((value, key) => result.set(key, value));
  return result;
}

function matchMaterial(params: {
  legacyRecordKey: string | null;
  legacyIds: string[];
  title: string | null;
  byId: Map<string, CurrentMaterial>;
  byTitle: Map<string, CurrentMaterial[]>;
}) {
  const idCandidates = [params.legacyRecordKey, ...params.legacyIds]
    .map((value) => cleanText(value, 200))
    .filter((value): value is string => Boolean(value));
  const direct = idCandidates
    .map((id) => params.byId.get(id))
    .filter((value): value is CurrentMaterial => Boolean(value));
  const uniqueDirect = [...new Map(direct.map((item) => [item.id, item])).values()];
  if (uniqueDirect.length === 1) {
    return { confidence: 'high' as MatchConfidence, method: 'direct_legacy_identifier', matches: uniqueDirect };
  }
  if (uniqueDirect.length > 1) {
    return { confidence: 'ambiguous' as MatchConfidence, method: 'multiple_direct_identifiers', matches: uniqueDirect };
  }
  const normalized = normalizeTitle(params.title);
  const titleMatches = normalized ? params.byTitle.get(normalized) || [] : [];
  if (titleMatches.length === 1) {
    return { confidence: 'medium' as MatchConfidence, method: 'normalized_title_exact', matches: titleMatches };
  }
  if (titleMatches.length > 1) {
    return { confidence: 'ambiguous' as MatchConfidence, method: 'normalized_title_ambiguous', matches: titleMatches.slice(0, 8) };
  }
  return { confidence: 'none' as MatchConfidence, method: 'no_safe_match', matches: [] as CurrentMaterial[] };
}

export async function getLegacyManusProvenanceReconciliation() {
  const c = client();
  const [legacyResponse, referenceResponse, knowledgeResponse] = await Promise.all([
    c.from('legacy_import_register')
      .select('id,legacy_batch,legacy_source_file,legacy_table_name,legacy_record_key,legacy_dedupe_key,target_schema,target_table,migration_priority,migration_status,payload_json,notes,created_at')
      .order('created_at', { ascending: false })
      .limit(5000),
    c.from('reference_documents')
      .select('id,title,source_id')
      .order('updated_at', { ascending: false })
      .limit(5000),
    c.from('knowledge_documents')
      .select('id,title,source_id,reference_document_id')
      .order('updated_at', { ascending: false })
      .limit(5000),
  ]);

  if (legacyResponse.error) throw new Error(`تعذر قراءة سجل Manus القديم: ${legacyResponse.error.message}`);
  if (referenceResponse.error) throw new Error(`تعذر قراءة المراجع الحالية لمطابقة Manus: ${referenceResponse.error.message}`);
  if (knowledgeResponse.error) throw new Error(`تعذر قراءة المعرفة الحالية لمطابقة Manus: ${knowledgeResponse.error.message}`);

  const references = buildCurrentMaterialIndex(referenceResponse.data || [], 'reference_document');
  const knowledge = buildCurrentMaterialIndex(knowledgeResponse.data || [], 'knowledge_document');
  const byId = mergeIndex(references.byId, knowledge.byId);
  const byTitle = new Map<string, CurrentMaterial[]>();
  for (const [title, rows] of [...references.byNormalizedTitle, ...knowledge.byNormalizedTitle]) {
    byTitle.set(title, [...(byTitle.get(title) || []), ...rows]);
  }

  const items = (legacyResponse.data || []).map((row: any) => {
    const leaves = collectMetadataLeaves(row.payload_json);
    const title = firstForAliases(leaves, fieldAliases.title) || cleanText(row.legacy_record_key, 800);
    const rawSource = firstForAliases(leaves, fieldAliases.source);
    const rawSourceUrl = firstForAliases(leaves, fieldAliases.sourceUrl);
    const rawUrl = firstForAliases(leaves, fieldAliases.url);
    const rawPdfUrl = firstForAliases(leaves, fieldAliases.pdfUrl);
    const rawAuthor = firstForAliases(leaves, fieldAliases.author);
    const rawPublisher = firstForAliases(leaves, fieldAliases.publisher);
    const legacyIds = collectAllForAliases(leaves, fieldAliases.legacyId);
    const fetchSourceIds = collectAllForAliases(leaves, fieldAliases.fetchSourceId);
    const urls = candidateUrls([rawSourceUrl, rawUrl, rawPdfUrl, rawSource]);
    const match = matchMaterial({
      legacyRecordKey: cleanText(row.legacy_record_key, 200),
      legacyIds,
      title,
      byId,
      byTitle,
    });
    const hasEvidence = Boolean(rawSource || rawSourceUrl || rawUrl || rawPdfUrl || rawAuthor || rawPublisher);
    return {
      legacyId: row.id,
      legacyBatch: row.legacy_batch,
      legacySourceFile: row.legacy_source_file,
      legacyTableName: row.legacy_table_name,
      legacyRecordKey: row.legacy_record_key || null,
      targetSchema: row.target_schema || null,
      targetTable: row.target_table || null,
      migrationPriority: row.migration_priority || null,
      migrationStatus: row.migration_status || null,
      createdAt: row.created_at || null,
      title,
      raw: {
        source: rawSource,
        sourceUrl: rawSourceUrl,
        url: rawUrl,
        pdfUrl: rawPdfUrl,
        author: rawAuthor,
        publisher: rawPublisher,
        fetchSourceIds,
        urls,
        evidencePaths: {
          source: pathsForAliases(leaves, fieldAliases.source),
          sourceUrl: pathsForAliases(leaves, fieldAliases.sourceUrl),
          url: pathsForAliases(leaves, fieldAliases.url),
          pdfUrl: pathsForAliases(leaves, fieldAliases.pdfUrl),
          author: pathsForAliases(leaves, fieldAliases.author),
          publisher: pathsForAliases(leaves, fieldAliases.publisher),
        },
      },
      hasEvidence,
      candidateProvenanceKind: rawPdfUrl ? 'document_or_pdf_origin' : urls.length ? 'web_origin' : rawPublisher || rawAuthor || rawSource ? 'bibliographic_origin' : 'no_recoverable_metadata',
      mapping: {
        confidence: match.confidence,
        method: match.method,
        materials: match.matches.map((material) => ({ id: material.id, title: material.title, materialKind: material.materialKind, sourceId: material.sourceId || null, referenceDocumentId: material.referenceDocumentId || null })),
      },
      reviewRequired: true,
      notes: cleanText(row.notes, 1000),
    };
  }).sort((a: any, b: any) => Number(b.hasEvidence) - Number(a.hasEvidence) || String(a.title || '').localeCompare(String(b.title || ''), 'ar'));

  const summary = {
    legacyRows: items.length,
    rowsWithRecoverableEvidence: items.filter((item: any) => item.hasEvidence).length,
    rawHttpUrls: items.reduce((total: number, item: any) => total + item.raw.urls.length, 0),
    matchedHigh: items.filter((item: any) => item.mapping.confidence === 'high').length,
    matchedMedium: items.filter((item: any) => item.mapping.confidence === 'medium').length,
    matchedAmbiguous: items.filter((item: any) => item.mapping.confidence === 'ambiguous').length,
    unmatched: items.filter((item: any) => item.mapping.confidence === 'none').length,
    byLegacyTable: Object.entries(items.reduce((acc: Record<string, number>, item: any) => {
      const key = item.legacyTableName || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})).map(([table, count]) => ({ table, count })).sort((a, b) => b.count - a.count),
  };

  return {
    contract: 'assistant_legacy_manus_provenance_reconciliation_c1_read_only_v1',
    mode: 'read_only',
    noAutomaticProvenanceInference: true,
    noRightsConclusionFromMigrationContainer: true,
    noLifecycleMutation: true,
    summary,
    items,
  };
}
