import { getAutonomousProvenanceAudit } from './autonomousProvenanceAudit';

/**
 * Mega Batch C4 — Controlled Source Registry and Rights Gate Design.
 *
 * This is a deterministic, read-only design surface. It transforms the C2
 * clustered provenance audit into proposed registry blueprints and staged
 * rights gates. It does not create registry rows, write links, assign rights,
 * modify lifecycle state, or authorize public display or Chat/RAG.
 *
 * C3 results are intentionally not replayed or persisted here: external
 * reachability is point-in-time evidence and must be re-run in a later
 * explicitly authorized controlled-apply phase.
 */

type C2Cluster = {
  clusterKey: string;
  title: string | null;
  authors: string[];
  publishers: string[];
  urls: string[];
  rawRows: number;
  disposition: string;
  dispositionLabel: string;
  evidenceLevel: 'high' | 'medium' | 'low' | 'quarantine';
  candidateMaterials?: Array<{ id: string; title: string | null; materialKind: string }>;
};

type RegistryDesignDisposition =
  | 'OFFICIAL_REGISTRY_HOLD'
  | 'ACADEMIC_REGISTRY_HOLD'
  | 'REFERENCE_REGISTRY_HOLD'
  | 'EVIDENCE_ONLY_NO_REGISTRY'
  | 'QUARANTINE_NO_REGISTRY';

const REGISTERABLE_C2_DISPOSITIONS = new Set([
  'OFFICIAL_SOURCE_CANDIDATE',
  'ACADEMIC_SOURCE_CANDIDATE',
  'SAFE_URL_CANDIDATE',
]);

function clean(value: unknown, max = 1_600): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
}

function unique(values: Array<string | null | undefined>, limit = 32): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const text = clean(value);
    if (!text) continue;
    const key = text.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= limit) break;
  }
  return output;
}

function canonicalHttpUrl(value: string | null | undefined): string | null {
  const input = clean(value, 2_000);
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_)/i.test(key)) url.searchParams.delete(key);
    }
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const query = url.searchParams.toString();
    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ''}${path}${query ? `?${query}` : ''}`;
  } catch {
    return null;
  }
}

function hostFor(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function labelFor(designation: RegistryDesignDisposition): string {
  const labels: Record<RegistryDesignDisposition, string> = {
    OFFICIAL_REGISTRY_HOLD: 'مخطط سجل رسمي — معلق حتى بوابات الهوية والحقوق',
    ACADEMIC_REGISTRY_HOLD: 'مخطط سجل أكاديمي — معلق حتى شروط الناشر والحقوق',
    REFERENCE_REGISTRY_HOLD: 'مخطط سجل مرجعي — معلق حتى تحقق الجودة والحقوق',
    EVIDENCE_ONLY_NO_REGISTRY: 'دليل منشأ فقط — لا سجل مصدر مقترح',
    QUARANTINE_NO_REGISTRY: 'حجر/استبعاد — لا سجل مصدر مقترح',
  };
  return labels[designation];
}

function designForCluster(cluster: C2Cluster): { disposition: RegistryDesignDisposition; nextGate: string; authorityCandidate: string } {
  if (cluster.disposition === 'OFFICIAL_SOURCE_CANDIDATE') {
    return {
      disposition: 'OFFICIAL_REGISTRY_HOLD',
      nextGate: 'G1_SOURCE_IDENTITY_AND_DOMAIN_VERIFICATION → G2_TERMS_RIGHTS_SCOPE_EVIDENCE → G3_CONTROLLED_REGISTRY_APPLY',
      authorityCandidate: 'official_candidate_not_verified',
    };
  }
  if (cluster.disposition === 'ACADEMIC_SOURCE_CANDIDATE') {
    return {
      disposition: 'ACADEMIC_REGISTRY_HOLD',
      nextGate: 'G1_SOURCE_IDENTITY_AND_DOMAIN_VERIFICATION → G2_PUBLISHER_TERMS_AND_METADATA_SCOPE → G3_CONTROLLED_REGISTRY_APPLY',
      authorityCandidate: 'academic_candidate_not_verified',
    };
  }
  if (cluster.disposition === 'SAFE_URL_CANDIDATE') {
    return {
      disposition: 'REFERENCE_REGISTRY_HOLD',
      nextGate: 'G1_SOURCE_QUALITY_VERIFICATION → G2_TERMS_RIGHTS_SCOPE_EVIDENCE → G3_CONTROLLED_REGISTRY_APPLY',
      authorityCandidate: 'reference_candidate_not_verified',
    };
  }
  if (cluster.evidenceLevel === 'quarantine' || cluster.disposition === 'TEST_OR_INVALID_URL_QUARANTINE' || cluster.disposition === 'TECHNICAL_MARKER_EXCLUDE') {
    return { disposition: 'QUARANTINE_NO_REGISTRY', nextGate: 'NONE — RETAIN_RAW_EVIDENCE_OR_QUARANTINE_ONLY', authorityCandidate: 'none' };
  }
  return { disposition: 'EVIDENCE_ONLY_NO_REGISTRY', nextGate: 'NONE — RETAIN_RAW_EVIDENCE_ONLY', authorityCandidate: 'none' };
}

type CandidateAccumulator = {
  canonicalUrl: string;
  host: string | null;
  clusters: C2Cluster[];
};

function titleFor(clusters: C2Cluster[]): string | null {
  const titles = unique(clusters.map((cluster) => cluster.title), 64);
  return titles.sort((left, right) => right.length - left.length)[0] || null;
}

function sourceKindRank(cluster: C2Cluster): number {
  if (cluster.disposition === 'OFFICIAL_SOURCE_CANDIDATE') return 0;
  if (cluster.disposition === 'ACADEMIC_SOURCE_CANDIDATE') return 1;
  return 2;
}

export async function getControlledSourceRegistryDesign() {
  const c2 = await getAutonomousProvenanceAudit();
  const clusters = (Array.isArray(c2.clusters) ? c2.clusters : []) as C2Cluster[];
  const byUrl = new Map<string, CandidateAccumulator>();

  for (const cluster of clusters) {
    if (!REGISTERABLE_C2_DISPOSITIONS.has(cluster.disposition)) continue;
    const urls = unique((cluster.urls || []).map(canonicalHttpUrl).filter(Boolean) as string[], 8);
    for (const canonicalUrl of urls) {
      const current = byUrl.get(canonicalUrl) || { canonicalUrl, host: hostFor(canonicalUrl), clusters: [] };
      current.clusters.push(cluster);
      byUrl.set(canonicalUrl, current);
    }
  }

  const registryBlueprints = [...byUrl.values()]
    .map((candidate) => {
      const ranked = [...candidate.clusters].sort((left, right) => sourceKindRank(left) - sourceKindRank(right) || right.rawRows - left.rawRows);
      const primary = ranked[0];
      const design = designForCluster(primary);
      const candidateMaterials = primary.candidateMaterials || [];
      return {
        candidateKey: `proposed:${candidate.canonicalUrl}`,
        proposedSourceName: titleFor(candidate.clusters),
        canonicalUrl: candidate.canonicalUrl,
        domain: candidate.host,
        clusters: unique(candidate.clusters.map((cluster) => cluster.clusterKey), 64),
        c2Dispositions: unique(candidate.clusters.map((cluster) => cluster.disposition), 8),
        rawRows: candidate.clusters.reduce((sum, cluster) => sum + Number(cluster.rawRows || 0), 0),
        candidateMaterials: candidateMaterials.slice(0, 24),
        authorEvidence: unique(candidate.clusters.flatMap((cluster) => cluster.authors || []), 24),
        publisherEvidence: unique(candidate.clusters.flatMap((cluster) => cluster.publishers || []), 24),
        designDisposition: design.disposition,
        designLabel: labelFor(design.disposition),
        proposedAuthorityClass: design.authorityCandidate,
        proposedDefaults: {
          verificationStatus: 'pending_identity_and_terms_review',
          rightsStatus: 'review_required',
          publicDisplayEligibility: 'metadata_only',
          fullTextRetentionAllowed: null,
          chatRagEligibility: 'blocked',
        },
        requiredNextGate: design.nextGate,
        controlledRegistryWrite: 'not_authorized' as const,
        sourceLinkWrite: 'blocked' as const,
        rightsAssignment: 'blocked' as const,
        publicDisplay: 'blocked_pending_rights_gate' as const,
        chatRag: 'blocked_pending_separate_gate' as const,
        finalRelease: 'not_authorized' as const,
        rationale: [
          'C4 يولد مخطط سجل مقترح من دليل C2 فقط؛ لا ينشئ صف مصدر ولا يربط مادة.',
          'هوية الناشر، شروط الاستخدام، الترخيص، وحق الاحتفاظ بالنص الكامل لا تُستنتج من الرابط أو C3 تلقائيًا.',
          'نتائج C3 إن وجدت هي دليل قابلية وصول لحظي؛ يجب تشغيلها ضمن بوابة تطبيق لاحقة ولا تحفظ هنا كاعتماد دائم.',
        ],
      };
    })
    .sort((left, right) => {
      const rank = (entry: { designDisposition: RegistryDesignDisposition }) => entry.designDisposition === 'OFFICIAL_REGISTRY_HOLD' ? 0 : entry.designDisposition === 'ACADEMIC_REGISTRY_HOLD' ? 1 : 2;
      return rank(left) - rank(right) || right.rawRows - left.rawRows || String(left.proposedSourceName || '').localeCompare(String(right.proposedSourceName || ''), 'ar');
    });

  const nonRegistryCounts = clusters.reduce<Record<string, number>>((acc, cluster) => {
    const design = designForCluster(cluster).disposition;
    if (design === 'EVIDENCE_ONLY_NO_REGISTRY' || design === 'QUARANTINE_NO_REGISTRY') {
      acc[design] = (acc[design] || 0) + 1;
    }
    return acc;
  }, {});

  const blueprintCounts = registryBlueprints.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.designDisposition] = (acc[entry.designDisposition] || 0) + 1;
    return acc;
  }, {});

  return {
    contract: 'assistant_controlled_source_registry_and_rights_gate_design_c4_read_only_v1',
    mode: 'deterministic_registry_blueprint_and_rights_gate_design_only',
    safeguards: {
      noSqlApply: true,
      noDatabaseWrite: true,
      noControlledRegistryCreate: true,
      noControlledRegistryUpdate: true,
      noSourceLinkWrite: true,
      noRightsAssignment: true,
      noExternalRequest: true,
      noAutomaticPromotion: true,
      noAutomaticChatRelease: true,
      noProduction: true,
    },
    plannedRegistryFields: [
      'source_identity_name', 'canonical_url', 'domain', 'authority_class', 'verification_status',
      'publisher_name', 'rights_holder_name', 'terms_url', 'license_type', 'license_url',
      'allowed_use_scope', 'full_text_retention_allowed', 'public_display_eligibility',
      'chat_rag_eligibility', 'raw_provenance_evidence', 'c3_metadata_check_reference',
      'review_decision', 'reviewed_by', 'reviewed_at', 'change_reason',
    ],
    rightsGates: [
      { code: 'G1_SOURCE_IDENTITY_AND_DOMAIN_VERIFICATION', purpose: 'إثبات هوية الجهة والنطاق والرابط المعتمد دون استنتاج تلقائي.', status: 'design_only_not_authorized' },
      { code: 'G2_TERMS_RIGHTS_SCOPE_EVIDENCE', purpose: 'تسجيل دليل شروط الاستخدام أو الترخيص أو الإذن ونطاقه؛ لا يكفي HTTP 200 أو اسم المجال.', status: 'design_only_not_authorized' },
      { code: 'G3_CONTROLLED_REGISTRY_APPLY', purpose: 'إنشاء سجل مصدر واحد من مخطط معتمد وبأثر تدقيق مستقل؛ لا ينفذ في C4.', status: 'not_included' },
      { code: 'G4_MATERIAL_LINKING_GATE', purpose: 'ربط مادة أو أكثر بسجل مصدر مع دليل مطابق ونطاق واضح؛ لا ينفذ في C4.', status: 'not_included' },
      { code: 'G5_PUBLIC_DISPLAY_GATE', purpose: 'قرار عرض البيانات الوصفية أو المقتطفات أو النص؛ لا ينفذ في C4.', status: 'not_included' },
      { code: 'G6_CHAT_RAG_GATE', purpose: 'قرار مستقل لأهلية الاسترجاع والمحادثة بعد المصدر والحقوق والمراجعة؛ لا ينفذ في C4.', status: 'not_included' },
    ],
    summary: {
      c2Clusters: clusters.length,
      proposedRegistryBlueprints: registryBlueprints.length,
      officialBlueprints: blueprintCounts.OFFICIAL_REGISTRY_HOLD || 0,
      academicBlueprints: blueprintCounts.ACADEMIC_REGISTRY_HOLD || 0,
      referenceBlueprints: blueprintCounts.REFERENCE_REGISTRY_HOLD || 0,
      evidenceOnlyClusters: nonRegistryCounts.EVIDENCE_ONLY_NO_REGISTRY || 0,
      quarantinedClusters: nonRegistryCounts.QUARANTINE_NO_REGISTRY || 0,
      authorizedRegistryWrites: 0,
      authorizedSourceLinks: 0,
      authorizedRightsAssignments: 0,
      authorizedPublicDisplay: 0,
      authorizedChatRag: 0,
    },
    registryBlueprints,
  };
}
