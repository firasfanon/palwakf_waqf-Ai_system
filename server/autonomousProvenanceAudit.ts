import { getLegacyManusProvenanceReconciliation } from './legacyManusProvenance';

/**
 * Mega Batch C2 — autonomous, read-only provenance audit.
 *
 * This module never writes sources, rights, documents, lifecycle state, or
 * Chat/RAG eligibility. It converts C1 raw provenance evidence into clustered
 * operational dispositions so the operator does not need to review raw rows.
 *
 * Important: a disposition is an evidence-handling decision, not a legal
 * conclusion about copyright, licence, publisher identity, or permission.
 */

type AuditDisposition =
  | 'OFFICIAL_SOURCE_CANDIDATE'
  | 'ACADEMIC_SOURCE_CANDIDATE'
  | 'SAFE_URL_CANDIDATE'
  | 'AUTHOR_ONLY_RETAIN'
  | 'TITLE_ONLY_RETAIN'
  | 'TECHNICAL_MARKER_EXCLUDE'
  | 'TEST_OR_INVALID_URL_QUARANTINE'
  | 'AMBIGUOUS_NO_LINK'
  | 'MISSING_RAW_PROVENANCE';

type DomainKind = 'official_candidate' | 'academic_candidate' | 'reference_candidate' | 'community_or_social' | 'unknown';

type LegacyItem = any;

type AuditCluster = {
  clusterKey: string;
  title: string | null;
  authors: string[];
  publishers: string[];
  urls: string[];
  urlKinds: DomainKind[];
  rawSourceValues: string[];
  rawRows: number;
  legacyIds: string[];
  legacyTables: string[];
  legacyFiles: string[];
  candidateMaterials: Array<{ id: string; title: string | null; materialKind: string }>;
  mappingMethods: string[];
  sourceIsTechnicalOnly: boolean;
  hasAuthorEvidence: boolean;
  hasPublisherEvidence: boolean;
  hasTitleEvidence: boolean;
  hasTestOrInvalidUrl: boolean;
  hasConflictingUrlEvidence: boolean;
  disposition: AuditDisposition;
  dispositionLabel: string;
  evidenceLevel: 'high' | 'medium' | 'low' | 'quarantine';
  finalOperationalDecision: {
    preserveRawEvidence: true;
    sourceLinkWrite: 'blocked';
    rightsAssignment: 'blocked';
    internalUse: 'review_only' | 'retain_evidence_only' | 'quarantined';
    publicDisplay: 'metadata_only_or_blocked';
    chatRag: 'blocked_pending_separate_gate';
    requiredNextGate: string;
  };
  rationale: string[];
};

const TECHNICAL_MARKERS = [
  'legacy_source_file',
  'old_db_select_row',
  'old_db_success_insert_query',
  'old_db_extract',
  'db_query',
  'db-query',
  'knowledge_documents',
  'legacy_json_content',
  'source_provenance_supporting_read_failed',
  'null',
  'undefined',
];

const TEST_HOSTS = new Set([
  'example.com',
  'www.example.com',
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
]);

const ACADEMIC_OR_REPOSITORY_HOSTS = [
  'springer.com',
  'link.springer.com',
  'jstor.org',
  'brill.com',
  'tandfonline.com',
  'archive.org',
  'books.google.com',
  'palestine-studies.org',
  'palquest.org',
  'badil.org',
  'fada.birzeit.edu',
  'muqtafi.birzeit.edu',
  'maqam.najah.edu',
  'palarchive.org',
  'khair.ws',
  'shamela.ws',
];

const COMMUNITY_OR_SOCIAL_HOSTS = [
  'wikipedia.org',
  'facebook.com',
  'instagram.com',
  'youtube.com',
  'x.com',
  'twitter.com',
];

function clean(value: unknown, max = 1600): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
}

function normalizeText(value: string | null | undefined): string | null {
  const text = clean(value, 800);
  if (!text) return null;
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[\u0640]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim() || null;
}

function unique(values: Array<string | null | undefined>, limit = 24): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const text = clean(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(text);
    if (output.length >= limit) break;
  }
  return output;
}

function canonicalUrl(value: string | null | undefined): string | null {
  const text = clean(value, 2000);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    url.hash = '';
    url.hostname = url.hostname.toLowerCase();
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|mc_)/i.test(key)) url.searchParams.delete(key);
    }
    const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
    const query = url.searchParams.toString();
    return `${url.protocol}//${url.hostname}${normalizedPath}${query ? `?${query}` : ''}`;
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

function isTechnicalMarker(value: string | null | undefined): boolean {
  const text = normalizeText(value);
  if (!text) return false;
  return TECHNICAL_MARKERS.some((marker) => text === normalizeText(marker) || text.includes(normalizeText(marker) || marker));
}

function isTestOrInvalidUrl(value: string): boolean {
  const host = hostFor(value);
  if (!host) return true;
  return TEST_HOSTS.has(host) || host.endsWith('.example.com');
}

function hostMatches(host: string, candidate: string): boolean {
  return host === candidate || host.endsWith(`.${candidate}`);
}

function classifyUrl(url: string): DomainKind {
  const host = hostFor(url);
  if (!host) return 'unknown';
  if (host.endsWith('.gov') || host.endsWith('.gov.ps') || host.includes('.gov.')) return 'official_candidate';
  if (ACADEMIC_OR_REPOSITORY_HOSTS.some((candidate) => hostMatches(host, candidate)) || host.endsWith('.edu') || host.includes('.edu.')) return 'academic_candidate';
  if (COMMUNITY_OR_SOCIAL_HOSTS.some((candidate) => hostMatches(host, candidate))) return 'community_or_social';
  return 'reference_candidate';
}

function preferredTitle(items: LegacyItem[]): string | null {
  const values = unique(items.map((item) => item.title), 64);
  return values.sort((a, b) => b.length - a.length)[0] || null;
}

function clusterKeyFor(item: LegacyItem): string {
  const urls = unique((item.raw?.urls || []).map((url: string) => canonicalUrl(url)).filter(Boolean) as string[]);
  const title = normalizeText(item.title || item.legacyRecordKey);
  const author = normalizeText(item.raw?.author);
  if (urls.length === 1) return `url:${urls[0]}`;
  if (title && author) return `title-author:${title}|${author}`;
  if (title) return `title:${title}`;
  const source = normalizeText(item.raw?.source);
  if (source) return `source:${source}`;
  return `legacy:${item.legacyId}`;
}

function materialRows(items: LegacyItem[]): Array<{ id: string; title: string | null; materialKind: string }> {
  const source: Array<{ id: string; title: string | null; materialKind: string }> = [];
  for (const item of items) {
    for (const material of item.mapping?.materials || []) {
      if (!material?.id) continue;
      source.push({ id: String(material.id), title: clean(material.title, 800), materialKind: String(material.materialKind || 'unknown') });
    }
  }
  const seen = new Set<string>();
  return source.filter((item) => {
    const key = `${item.materialKind}:${item.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 24);
}

function dispositionFor(cluster: Omit<AuditCluster, 'disposition' | 'dispositionLabel' | 'evidenceLevel' | 'finalOperationalDecision' | 'rationale'>): {
  disposition: AuditDisposition;
  label: string;
  evidenceLevel: AuditCluster['evidenceLevel'];
  rationale: string[];
  internalUse: AuditCluster['finalOperationalDecision']['internalUse'];
  requiredNextGate: string;
} {
  const urlKinds = new Set(cluster.urlKinds);
  const hasOfficial = urlKinds.has('official_candidate');
  const hasAcademic = urlKinds.has('academic_candidate');
  const hasReference = urlKinds.has('reference_candidate');
  const hasCommunity = urlKinds.has('community_or_social');

  if (cluster.hasTestOrInvalidUrl) {
    return {
      disposition: 'TEST_OR_INVALID_URL_QUARANTINE',
      label: 'رابط تجريبي/غير صالح — حجر',
      evidenceLevel: 'quarantine',
      rationale: ['تم رصد رابط نطاقه تجريبي أو محلي؛ لا يصلح كدليل مصدر أو ربط.', 'يُحتفظ بالدليل الخام فقط لأغراض التتبع.'],
      internalUse: 'quarantined',
      requiredNextGate: 'NONE — KEEP_RAW_EVIDENCE_ONLY',
    };
  }

  if (cluster.sourceIsTechnicalOnly && !cluster.hasAuthorEvidence && !cluster.hasPublisherEvidence && !cluster.urls.length) {
    return {
      disposition: 'TECHNICAL_MARKER_EXCLUDE',
      label: 'أثر استيراد تقني — مستبعد',
      evidenceLevel: 'quarantine',
      rationale: ['القيمة المتاحة هي أثر تقني لمسار الاستيراد وليست ناشرًا أو مصدرًا أصليًا.', 'لا تُحوّل إلى مصدر أو حق أو رابط.'],
      internalUse: 'retain_evidence_only',
      requiredNextGate: 'NONE — TECHNICAL_MARKER_EXCLUDED',
    };
  }

  if (cluster.hasConflictingUrlEvidence) {
    return {
      disposition: 'AMBIGUOUS_NO_LINK',
      label: 'أدلة روابط متعارضة — لا ربط',
      evidenceLevel: 'low',
      rationale: ['العنوان أو المادة الواحدة يحمل أكثر من رابط مرشح غير متطابق.', 'يُمنع اختيار رابط تلقائيًا أو دمج المصادر.'],
      internalUse: 'review_only',
      requiredNextGate: 'TARGETED_URL_VERIFICATION_BEFORE_ANY_LINK',
    };
  }

  if (hasOfficial) {
    return {
      disposition: 'OFFICIAL_SOURCE_CANDIDATE',
      label: 'مرشح مصدر رسمي',
      evidenceLevel: 'high',
      rationale: ['يوجد رابط HTTP(S) على نطاق حكومي/رسمي مرشح.', 'هذا يثبت مرشح الإسناد فقط ولا يثبت الترخيص أو إعادة الاستخدام الكامل.'],
      internalUse: 'review_only',
      requiredNextGate: 'URL_REACHABILITY_AND_SCOPE_VERIFICATION',
    };
  }

  if (hasAcademic) {
    return {
      disposition: 'ACADEMIC_SOURCE_CANDIDATE',
      label: 'مرشح مصدر أكاديمي/مستودع',
      evidenceLevel: 'medium',
      rationale: ['يوجد رابط إلى ناشر أكاديمي أو مستودع بحثي مرشح.', 'تبقى الحقوق ونطاق الاقتباس غير محسومة تلقائيًا.'],
      internalUse: 'review_only',
      requiredNextGate: 'PUBLISHER_TERMS_AND_URL_VERIFICATION',
    };
  }

  if (hasReference && !hasCommunity) {
    return {
      disposition: 'SAFE_URL_CANDIDATE',
      label: 'رابط مرشح محفوظ',
      evidenceLevel: 'medium',
      rationale: ['يوجد رابط HTTP(S) غير تجريبي يمكن الاحتفاظ به كمرشح إسناد.', 'لا يترتب على ذلك اعتماد الناشر أو الحقوق أو أهلية Chat/RAG.'],
      internalUse: 'review_only',
      requiredNextGate: 'URL_VERIFICATION_BEFORE_ANY_LINK',
    };
  }

  if (cluster.urls.length && hasCommunity) {
    return {
      disposition: 'AMBIGUOUS_NO_LINK',
      label: 'رابط مجتمع/منصة عامة — لا ربط تلقائي',
      evidenceLevel: 'low',
      rationale: ['الرابط موجود لكنه من منصة عامة أو اجتماعية ولا يكفي لإثبات ناشر أو حق أو مصدر أولي.', 'يُحتفظ به كدليل منشأ خام فقط.'],
      internalUse: 'retain_evidence_only',
      requiredNextGate: 'SOURCE_QUALITY_AND_RIGHTS_REVIEW_IF_NEEDED',
    };
  }

  if (cluster.hasAuthorEvidence) {
    return {
      disposition: 'AUTHOR_ONLY_RETAIN',
      label: 'مؤلف محفوظ — بلا رابط مصدر',
      evidenceLevel: 'low',
      rationale: ['يوجد مؤلف أو منشئ محفوظ، لكن لا يوجد رابط مصدر قابل للتحقق.', 'تُحفظ النسبة فقط ولا تنشأ علاقة مصدر.'],
      internalUse: 'retain_evidence_only',
      requiredNextGate: 'NONE — AUTHORSHIP_EVIDENCE_ONLY',
    };
  }

  if (cluster.hasTitleEvidence || cluster.hasPublisherEvidence || cluster.rawSourceValues.length) {
    return {
      disposition: 'TITLE_ONLY_RETAIN',
      label: 'عنوان/مرجع محفوظ — بلا رابط صالح',
      evidenceLevel: 'low',
      rationale: ['توجد بيانات ببليوغرافية جزئية لا تكفي لبناء مصدر أو حقوق.', 'يُحفظ العنوان والدليل الخام فقط.'],
      internalUse: 'retain_evidence_only',
      requiredNextGate: 'NONE — BIBLIOGRAPHIC_EVIDENCE_ONLY',
    };
  }

  return {
    disposition: 'MISSING_RAW_PROVENANCE',
    label: 'لا يوجد دليل منشأ قابل للاستعادة',
    evidenceLevel: 'low',
    rationale: ['لا يظهر عنوان أو رابط أو مؤلف أو ناشر قابل للاستعادة من السجل الخام.'],
    internalUse: 'retain_evidence_only',
    requiredNextGate: 'NONE — NO_PROVENANCE_WRITE_ALLOWED',
  };
}

function labelForDisposition(disposition: AuditDisposition): string {
  const labels: Record<AuditDisposition, string> = {
    OFFICIAL_SOURCE_CANDIDATE: 'مرشح مصدر رسمي',
    ACADEMIC_SOURCE_CANDIDATE: 'مرشح مصدر أكاديمي/مستودع',
    SAFE_URL_CANDIDATE: 'رابط مرشح محفوظ',
    AUTHOR_ONLY_RETAIN: 'مؤلف محفوظ — بلا رابط مصدر',
    TITLE_ONLY_RETAIN: 'عنوان/مرجع محفوظ — بلا رابط صالح',
    TECHNICAL_MARKER_EXCLUDE: 'أثر استيراد تقني — مستبعد',
    TEST_OR_INVALID_URL_QUARANTINE: 'رابط تجريبي/غير صالح — حجر',
    AMBIGUOUS_NO_LINK: 'أدلة متعارضة — لا ربط',
    MISSING_RAW_PROVENANCE: 'لا يوجد دليل منشأ قابل للاستعادة',
  };
  return labels[disposition];
}

function clusterItems(items: LegacyItem[]): AuditCluster[] {
  const groups = new Map<string, LegacyItem[]>();
  for (const item of items) {
    const key = clusterKeyFor(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  }

  const clusters: AuditCluster[] = [];
  for (const [clusterKey, groupedItems] of groups) {
    const urls = unique(groupedItems.flatMap((item) => (item.raw?.urls || []).map((url: string) => canonicalUrl(url))).filter(Boolean) as string[], 24);
    const rawSources = unique(groupedItems.map((item) => item.raw?.source), 24);
    const authors = unique(groupedItems.map((item) => item.raw?.author), 24);
    const publishers = unique(groupedItems.map((item) => item.raw?.publisher), 24);
    const title = preferredTitle(groupedItems);
    const urlKinds = unique(urls.map(classifyUrl), 8) as DomainKind[];
    const nonTechnicalRawSources = rawSources.filter((value) => !isTechnicalMarker(value) && !canonicalUrl(value));
    const distinctHosts = unique(urls.map((url) => hostFor(url)).filter(Boolean) as string[], 24);
    const base = {
      clusterKey,
      title,
      authors,
      publishers,
      urls,
      urlKinds,
      rawSourceValues: rawSources,
      rawRows: groupedItems.length,
      legacyIds: groupedItems.map((item) => String(item.legacyId)).filter(Boolean).slice(0, 64),
      legacyTables: unique(groupedItems.map((item) => item.legacyTableName), 16),
      legacyFiles: unique(groupedItems.map((item) => item.legacySourceFile), 16),
      candidateMaterials: materialRows(groupedItems),
      mappingMethods: unique(groupedItems.map((item) => item.mapping?.method), 16),
      sourceIsTechnicalOnly: Boolean(rawSources.length) && rawSources.every((value) => isTechnicalMarker(value)),
      hasAuthorEvidence: authors.length > 0,
      hasPublisherEvidence: publishers.length > 0,
      hasTitleEvidence: Boolean(title),
      hasTestOrInvalidUrl: urls.some(isTestOrInvalidUrl),
      hasConflictingUrlEvidence: distinctHosts.length > 1,
    };
    const decision = dispositionFor(base);
    clusters.push({
      ...base,
      disposition: decision.disposition,
      dispositionLabel: decision.label || labelForDisposition(decision.disposition),
      evidenceLevel: decision.evidenceLevel,
      finalOperationalDecision: {
        preserveRawEvidence: true,
        sourceLinkWrite: 'blocked',
        rightsAssignment: 'blocked',
        internalUse: decision.internalUse,
        publicDisplay: 'metadata_only_or_blocked',
        chatRag: 'blocked_pending_separate_gate',
        requiredNextGate: decision.requiredNextGate,
      },
      rationale: decision.rationale,
    });
  }

  return clusters.sort((left, right) => {
    const risk = (cluster: AuditCluster) => ['TEST_OR_INVALID_URL_QUARANTINE', 'AMBIGUOUS_NO_LINK', 'TECHNICAL_MARKER_EXCLUDE'].includes(cluster.disposition) ? 0 : 1;
    return risk(left) - risk(right) || right.rawRows - left.rawRows || String(left.title || '').localeCompare(String(right.title || ''), 'ar');
  });
}

export async function getAutonomousProvenanceAudit() {
  const reconciliation = await getLegacyManusProvenanceReconciliation();
  const rawItems: LegacyItem[] = Array.isArray(reconciliation.items) ? reconciliation.items : [];
  const clusters = clusterItems(rawItems);
  const byDisposition = Object.entries(clusters.reduce((acc: Record<string, { groups: number; rows: number }>, cluster) => {
    const entry = acc[cluster.disposition] || { groups: 0, rows: 0 };
    entry.groups += 1;
    entry.rows += cluster.rawRows;
    acc[cluster.disposition] = entry;
    return acc;
  }, {})).map(([disposition, values]) => ({
    disposition,
    label: labelForDisposition(disposition as AuditDisposition),
    groups: values.groups,
    rows: values.rows,
  })).sort((a, b) => b.rows - a.rows);

  const operationalSummary = {
    rawLegacyRows: rawItems.length,
    clusteredGroups: clusters.length,
    rowReduction: Math.max(0, rawItems.length - clusters.length),
    noRowByRowReview: true,
    officialCandidates: clusters.filter((cluster) => cluster.disposition === 'OFFICIAL_SOURCE_CANDIDATE').length,
    academicCandidates: clusters.filter((cluster) => cluster.disposition === 'ACADEMIC_SOURCE_CANDIDATE').length,
    safeUrlCandidates: clusters.filter((cluster) => cluster.disposition === 'SAFE_URL_CANDIDATE').length,
    authorOnlyGroups: clusters.filter((cluster) => cluster.disposition === 'AUTHOR_ONLY_RETAIN').length,
    titleOnlyGroups: clusters.filter((cluster) => cluster.disposition === 'TITLE_ONLY_RETAIN').length,
    technicalExcludedGroups: clusters.filter((cluster) => cluster.disposition === 'TECHNICAL_MARKER_EXCLUDE').length,
    quarantinedGroups: clusters.filter((cluster) => cluster.disposition === 'TEST_OR_INVALID_URL_QUARANTINE').length,
    ambiguousGroups: clusters.filter((cluster) => cluster.disposition === 'AMBIGUOUS_NO_LINK').length,
    noAutomaticLinkWrite: true,
    noAutomaticRightsAssignment: true,
    noAutomaticChatRelease: true,
  };

  return {
    contract: 'assistant_autonomous_provenance_audit_c2_read_only_v1',
    mode: 'read_only_deterministic_cluster_audit',
    auditLimitations: [
      'التصنيف قائم على الدليل الخام وبنية النطاق فقط؛ لا يثبت الترخيص أو الحقوق أو صحة الرابط في الزمن الحقيقي.',
      'لا يتم إنشاء أو تعديل أي source_id أو rights profile أو أهلية Chat/RAG.',
      'القرار النهائي هنا قرار تشغيلي لإدارة الدليل، وليس رأيًا قانونيًا أو إقرارًا تلقائيًا بإتاحة النص الكامل.',
    ],
    finalDispositionPolicy: {
      noRowByRowHumanReview: true,
      noAutomaticSourceLinking: true,
      noAutomaticRightsInference: true,
      noAutomaticPromotion: true,
      noAutomaticChatRelease: true,
    },
    sourceSnapshot: reconciliation.summary,
    summary: operationalSummary,
    byDisposition,
    clusters,
  };
}
