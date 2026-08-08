import { getAutonomousProvenanceAudit } from './autonomousProvenanceAudit';
import { getLatestAutonomousExternalSourceVerificationEvidence } from './externalSourceVerification';

/**
 * Mega Batch C4 — verified source selection and controlled knowledge release plan.
 *
 * C4 is a planning-only aggregation of C2 provenance clusters and the latest
 * operator-triggered C3 metadata observation. It never starts an external
 * request, never writes to a database, and never authorizes source linking,
 * rights assignment, public display, Chat/RAG, promotion, or production.
 *
 * "Verified" in the batch title is intentionally limited to a technical
 * evidence threshold: C2 official-domain candidate + fresh C3 2xx metadata
 * observation + public DNS safety. It is not publisher identity, legal rights,
 * licence, authorship, content correctness, or full-text reuse verification.
 */

const MAX_CONTROLLED_METADATA_PILOT_CANDIDATES = 5;

type C2Cluster = {
  clusterKey: string;
  title: string | null;
  authors: string[];
  publishers: string[];
  urls: string[];
  rawRows: number;
  legacyTables: string[];
  candidateMaterials: Array<{ id: string; title: string | null; materialKind: string }>;
  hasConflictingUrlEvidence?: boolean;
  disposition: string;
  dispositionLabel: string;
  evidenceLevel: string;
};

type C3Entry = {
  clusterKey: string;
  title: string | null;
  c2Disposition: string;
  c2DispositionLabel: string;
  requestedUrl: string | null;
  probe?: {
    outcome?: string;
    statusCode?: number | null;
    contentType?: string | null;
    dns?: { ok?: boolean; resolution?: string; reason?: string };
    checkedAt?: string;
  } | null;
  matrixDisposition: string;
  matrixLabel: string;
  rationale?: string[];
  finalReleaseMatrix?: { requiredNextGate?: string };
};

type C4Disposition =
  | 'CONTROLLED_METADATA_PILOT_CANDIDATE'
  | 'OFFICIAL_EVIDENCE_HOLD'
  | 'ACADEMIC_TERMS_HOLD'
  | 'EXTERNAL_MATRIX_HOLD'
  | 'C3_EVIDENCE_REQUIRED_HOLD'
  | 'EXCLUDED_FROM_RELEASE_PLAN'
  | 'RETAINED_NO_RELEASE_PATH';

function labelFor(disposition: C4Disposition): string {
  const labels: Record<C4Disposition, string> = {
    CONTROLLED_METADATA_PILOT_CANDIDATE: 'مرشح خطة إطلاق بيانات وصفية محكومة فقط',
    OFFICIAL_EVIDENCE_HOLD: 'مرشح رسمي — دليل إضافي أو نطاق إطلاق مطلوب',
    ACADEMIC_TERMS_HOLD: 'مرشح أكاديمي — شروط الناشر/الترخيص مطلوبة',
    EXTERNAL_MATRIX_HOLD: 'نتيجة C3 معلقة — لا مسار إطلاق',
    C3_EVIDENCE_REQUIRED_HOLD: 'يتطلب دليل C3 حديث قبل أي خطة إطلاق',
    EXCLUDED_FROM_RELEASE_PLAN: 'مستبعد من خطة الإطلاق',
    RETAINED_NO_RELEASE_PATH: 'يحفظ كدليل فقط — بلا مسار إطلاق',
  };
  return labels[disposition];
}

function isC3ReachableOfficial(entry: C3Entry | undefined): boolean {
  return Boolean(
    entry
    && entry.c2Disposition === 'OFFICIAL_SOURCE_CANDIDATE'
    && entry.matrixDisposition === 'OFFICIAL_URL_REACHABLE_METADATA_ONLY'
    && entry.probe?.outcome === 'reachable'
    && typeof entry.probe?.statusCode === 'number'
    && entry.probe.statusCode >= 200
    && entry.probe.statusCode < 300
    && entry.probe?.dns?.ok === true,
  );
}

function releaseGuards(requiredNextGate: string) {
  return {
    preserveRawEvidence: true,
    sourceLinkWrite: 'blocked' as const,
    rightsAssignment: 'blocked' as const,
    legalRightsConclusion: 'not_inferred' as const,
    fullTextRetention: 'blocked' as const,
    publicDisplay: 'blocked_pending_rights_gate' as const,
    chatRag: 'blocked_pending_separate_gate' as const,
    promotion: 'blocked' as const,
    production: 'not_authorized' as const,
    finalRelease: 'not_authorized' as const,
    requiredNextGate,
  };
}

function c4Decision(cluster: C2Cluster, c3: C3Entry | undefined, c3Status: string): {
  disposition: C4Disposition;
  rationale: string[];
  requiredNextGate: string;
} {
  if (['TECHNICAL_MARKER_EXCLUDE', 'TEST_OR_INVALID_URL_QUARANTINE'].includes(cluster.disposition)) {
    return {
      disposition: 'EXCLUDED_FROM_RELEASE_PLAN',
      rationale: ['تم استبعاد عنقود C2 التقني أو التجريبي من أي خطة إطلاق.', 'يبقى الدليل الخام للتتبع فقط دون مصدر أو حق أو إتاحة.'],
      requiredNextGate: 'NONE — RETAIN_RAW_AUDIT_EVIDENCE_ONLY',
    };
  }

  if (['OFFICIAL_SOURCE_CANDIDATE', 'ACADEMIC_SOURCE_CANDIDATE', 'SAFE_URL_CANDIDATE'].includes(cluster.disposition) && c3Status !== 'available') {
    return {
      disposition: 'C3_EVIDENCE_REQUIRED_HOLD',
      rationale: ['لا توجد لقطة C3 حديثة متاحة في ذاكرة الخادم لهذه الخطة.', 'C4 لا يعيد تشغيل الفحص الخارجي ولا يستبدل غياب C3 بتخمين.'],
      requiredNextGate: 'RUN_C3_OPERATOR_TRIGGERED_EXTERNAL_METADATA_CHECK',
    };
  }

  if (isC3ReachableOfficial(c3) && !cluster.hasConflictingUrlEvidence && cluster.candidateMaterials.length > 0) {
    return {
      disposition: 'CONTROLLED_METADATA_PILOT_CANDIDATE',
      rationale: [
        'العنقود مرشح رسمي في C2 ولديه استجابة C3 ناجحة حديثة مع DNS عام فقط ودون تحويل متابع.',
        'توجد مادة حالية مرشحة مرتبطة بالدليل، لذا يمكن إدخاله فقط في خطة إطلاق بيانات وصفية/استشهادات محكومة.',
        'هذا ليس اعتماد مصدر ولا ترخيصًا ولا إذنًا بعرض النص أو Chat/RAG.',
      ],
      requiredNextGate: 'OFFICIAL_IDENTITY_TERMS_AND_CONTROLLED_SOURCE_LINK_APPLY_PLAN',
    };
  }

  if (cluster.disposition === 'OFFICIAL_SOURCE_CANDIDATE') {
    return {
      disposition: 'OFFICIAL_EVIDENCE_HOLD',
      rationale: [
        c3?.matrixLabel || 'المرشح الرسمي لم يحصل بعد على نتيجة C3 قابلة لخطة إطلاق.',
        'يلزم التحقق من هوية الجهة الرسمية وشروط الاستخدام ونطاق الإسناد قبل أي تطبيق.'],
      requiredNextGate: 'OFFICIAL_SOURCE_IDENTITY_AND_TERMS_VERIFICATION',
    };
  }

  if (cluster.disposition === 'ACADEMIC_SOURCE_CANDIDATE') {
    return {
      disposition: 'ACADEMIC_TERMS_HOLD',
      rationale: [
        c3?.matrixLabel || 'المرشح الأكاديمي لم يحصل بعد على نتيجة C3 قابلة لخطة إطلاق.',
        'قابلية الوصول أو اسم الناشر الأكاديمي لا يثبتان ترخيص النص الكامل أو نطاق الاقتباس.'],
      requiredNextGate: 'PUBLISHER_TERMS_METADATA_SCOPE_AND_RIGHTS_VERIFICATION',
    };
  }

  if (c3) {
    return {
      disposition: 'EXTERNAL_MATRIX_HOLD',
      rationale: [c3.matrixLabel, ...(c3.rationale || []), 'نتيجة C3 لا تحقق معيار خطة إطلاق البيانات الوصفية الرسمية.'],
      requiredNextGate: c3.finalReleaseMatrix?.requiredNextGate || 'C3_RESULT_REVIEW_ONLY',
    };
  }

  if (['OFFICIAL_SOURCE_CANDIDATE', 'ACADEMIC_SOURCE_CANDIDATE', 'SAFE_URL_CANDIDATE'].includes(cluster.disposition)) {
    return {
      disposition: 'C3_EVIDENCE_REQUIRED_HOLD',
      rationale: ['المرشح يملك URL في C2 لكنه بلا نتيجة C3 مرتبطة متاحة لهذه الجولة.'],
      requiredNextGate: 'RUN_C3_OPERATOR_TRIGGERED_EXTERNAL_METADATA_CHECK',
    };
  }

  return {
    disposition: 'RETAINED_NO_RELEASE_PATH',
    rationale: ['لا يحقق عنقود C2 شروط URL رسمي قابل للوصول ضمن خطة C4.', 'يبقى محفوظًا كدليل منشأ أو مرجع داخلي دون مسار إطلاق.'],
    requiredNextGate: 'NONE — RETAIN_EVIDENCE_ONLY',
  };
}

export async function getVerifiedSourceSelectionAndControlledReleasePlan() {
  const c2 = await getAutonomousProvenanceAudit();
  const snapshot = getLatestAutonomousExternalSourceVerificationEvidence();
  const clusters = (Array.isArray(c2.clusters) ? c2.clusters : []) as C2Cluster[];
  const entries = (Array.isArray(snapshot.data?.entries) ? snapshot.data?.entries : []) as C3Entry[];
  const c3ByCluster = new Map(entries.map((entry) => [entry.clusterKey, entry]));

  const planned = clusters.map((cluster) => {
    const c3 = c3ByCluster.get(cluster.clusterKey);
    const decision = c4Decision(cluster, c3, snapshot.status);
    return {
      clusterKey: cluster.clusterKey,
      title: cluster.title,
      rawRows: cluster.rawRows,
      c2Disposition: cluster.disposition,
      c2DispositionLabel: cluster.dispositionLabel,
      c3MatrixDisposition: c3?.matrixDisposition || null,
      c3MatrixLabel: c3?.matrixLabel || null,
      requestedUrl: c3?.requestedUrl || cluster.urls?.[0] || null,
      checkedAt: c3?.probe?.checkedAt || null,
      authors: cluster.authors,
      publishers: cluster.publishers,
      candidateMaterials: cluster.candidateMaterials,
      disposition: decision.disposition,
      dispositionLabel: labelFor(decision.disposition),
      rationale: decision.rationale,
      controlledReleasePlan: releaseGuards(decision.requiredNextGate),
    };
  });

  const selected = planned
    .filter((entry) => entry.disposition === 'CONTROLLED_METADATA_PILOT_CANDIDATE')
    .sort((left, right) => right.rawRows - left.rawRows || String(left.title || '').localeCompare(String(right.title || ''), 'ar'))
    .slice(0, MAX_CONTROLLED_METADATA_PILOT_CANDIDATES);
  const selectedKeys = new Set(selected.map((entry) => entry.clusterKey));
  const finalEntries = planned.map((entry) => entry.disposition === 'CONTROLLED_METADATA_PILOT_CANDIDATE' && !selectedKeys.has(entry.clusterKey)
    ? {
      ...entry,
      disposition: 'OFFICIAL_EVIDENCE_HOLD' as const,
      dispositionLabel: labelFor('OFFICIAL_EVIDENCE_HOLD'),
      rationale: [...entry.rationale, `سقف cohort C4 هو ${MAX_CONTROLLED_METADATA_PILOT_CANDIDATES} مرشحين؛ يبقى هذا العنقود خارج cohort الحالية.`],
      controlledReleasePlan: releaseGuards('NEXT_CONTROLLED_METADATA_COHORT_REVIEW'),
    }
    : entry);

  const byDisposition = Object.entries(finalEntries.reduce((acc: Record<string, { groups: number; rows: number }>, entry) => {
    const value = acc[entry.disposition] || { groups: 0, rows: 0 };
    value.groups += 1;
    value.rows += entry.rawRows;
    acc[entry.disposition] = value;
    return acc;
  }, {})).map(([disposition, values]) => ({
    disposition,
    label: labelFor(disposition as C4Disposition),
    groups: values.groups,
    rows: values.rows,
  })).sort((left, right) => right.rows - left.rows);

  const selectedMaterialCount = selected.reduce((total, entry) => total + entry.candidateMaterials.length, 0);
  const summary = {
    c2Clusters: clusters.length,
    c3EvidenceStatus: snapshot.status,
    c3EvidenceCapturedAt: snapshot.capturedAt,
    c3EvidenceExpiresAt: snapshot.expiresAt,
    c3EvidenceEntries: entries.length,
    controlledMetadataPilotCandidates: selected.length,
    controlledMetadataCandidateMaterials: selectedMaterialCount,
    officialHolds: finalEntries.filter((entry) => entry.disposition === 'OFFICIAL_EVIDENCE_HOLD').length,
    academicTermsHolds: finalEntries.filter((entry) => entry.disposition === 'ACADEMIC_TERMS_HOLD').length,
    externalMatrixHolds: finalEntries.filter((entry) => entry.disposition === 'EXTERNAL_MATRIX_HOLD').length,
    c3EvidenceRequiredHolds: finalEntries.filter((entry) => entry.disposition === 'C3_EVIDENCE_REQUIRED_HOLD').length,
    excludedFromReleasePlan: finalEntries.filter((entry) => entry.disposition === 'EXCLUDED_FROM_RELEASE_PLAN').length,
    finalReleaseAuthorized: 0,
    sourceLinkWrites: 0,
    rightsAssignments: 0,
    publicDisplayReleases: 0,
    chatRagReleases: 0,
  };

  return {
    contract: 'assistant_verified_source_selection_and_controlled_knowledge_release_plan_c4_read_only_v1',
    mode: 'read_only_plan_from_c2_and_fresh_c3_ephemeral_evidence',
    c3Evidence: {
      status: snapshot.status,
      capturedAt: snapshot.capturedAt,
      expiresAt: snapshot.expiresAt,
      requirement: 'C4 requires a fresh operator-triggered C3 observation in this server process; C4 does not launch an external check.',
    },
    technicalVerificationMeaning: 'C4 technical verification means C2 candidate classification plus fresh C3 reachability metadata only. It is not legal, licensing, publisher-identity, authorship, content, or full-text-rights verification.',
    releasePolicy: {
      candidateScope: 'metadata_and_citation_plan_only',
      maxControlledMetadataPilotCandidates: MAX_CONTROLLED_METADATA_PILOT_CANDIDATES,
      noAutomaticSourceLinking: true,
      noAutomaticRightsAssignment: true,
      noFullTextRetention: true,
      noPublicDisplayRelease: true,
      noAutomaticPromotion: true,
      noAutomaticChatRelease: true,
      noProduction: true,
    },
    requiredGatesBeforeAnyFutureApply: [
      'OFFICIAL_SOURCE_IDENTITY_AND_TERMS_VERIFICATION',
      'CONTROLLED_SOURCE_LINK_APPLY_AUTHORIZATION',
      'RIGHTS_SCOPE_ATTRIBUTION_AND_RETENTION_DECISION',
      'CONTROLLED_KNOWLEDGE_RELEASE_UAT',
      'SEPARATE_CHAT_RAG_ELIGIBILITY_GATE',
      'SEPARATE_PRODUCTION_AUTHORIZATION',
    ],
    limitations: [
      'C4 does not re-run C3 and does not issue DNS or HTTP requests itself.',
      'No C4 outcome creates or updates knowledge_sources, reference_documents, knowledge_documents, citations, rights, review state, or Chat/RAG eligibility.',
      'The selected pilot cohort is a planning cohort for controlled metadata/citation verification only; it is not a released knowledge corpus.',
    ],
    summary,
    byDisposition,
    entries: finalEntries,
    selectedControlledMetadataPilot: selected,
  };
}
