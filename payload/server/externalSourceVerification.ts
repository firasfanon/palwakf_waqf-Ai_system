import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { getAutonomousProvenanceAudit } from './autonomousProvenanceAudit';

/**
 * Mega Batch C3 — autonomous external source verification and final release matrix.
 *
 * This service performs bounded, outbound, metadata-only reachability checks for
 * C2 candidate URLs. It never follows redirects, never reads or stores document
 * bodies, never writes to the database, and never changes source, rights,
 * lifecycle, publication, or Chat/RAG state.
 *
 * A reachable URL is not proof of publisher identity, licence, permission,
 * copyright status, suitability of full-text reuse, or Chat/RAG eligibility.
 */

const MAX_EXTERNAL_URLS = 32;
const MAX_CONCURRENCY = 4;
const REQUEST_TIMEOUT_MS = 8_000;
const ALLOWED_PORTS = new Set(['', '80', '443']);
const EXTERNAL_CANDIDATE_DISPOSITIONS = new Set([
  'OFFICIAL_SOURCE_CANDIDATE',
  'ACADEMIC_SOURCE_CANDIDATE',
  'SAFE_URL_CANDIDATE',
]);

type C2Cluster = {
  clusterKey: string;
  title: string | null;
  urls: string[];
  disposition: string;
  dispositionLabel: string;
  evidenceLevel: 'high' | 'medium' | 'low' | 'quarantine';
  rawRows: number;
  authors: string[];
  publishers: string[];
  finalOperationalDecision?: { requiredNextGate?: string };
};

type DnsSafety =
  | { ok: true; resolution: 'public_only'; addressCount: number }
  | { ok: false; reason: string; addressCount: number };

type Probe = {
  checkedAt: string;
  requestedUrl: string;
  hostname: string | null;
  dns: DnsSafety;
  method: 'HEAD' | 'GET_RANGE' | 'NONE';
  statusCode: number | null;
  contentType: string | null;
  redirectLocation: string | null;
  outcome:
    | 'reachable'
    | 'redirect'
    | 'restricted'
    | 'not_found_or_error'
    | 'network_failure'
    | 'safety_blocked';
  detail: string;
};

type MatrixDisposition =
  | 'OFFICIAL_URL_REACHABLE_METADATA_ONLY'
  | 'ACADEMIC_URL_REACHABLE_METADATA_ONLY'
  | 'REACHABLE_RIGHTS_UNKNOWN_HOLD'
  | 'RESTRICTED_OR_AUTH_REQUIRED_HOLD'
  | 'REDIRECT_OR_HOST_CHANGE_HOLD'
  | 'UNREACHABLE_OR_TIMEOUT_HOLD'
  | 'SAFETY_BLOCKED_HOLD'
  | 'NO_ELIGIBLE_EXTERNAL_URL';


/**
 * C4 consumes the latest C3 observation only from process memory. The snapshot
 * is intentionally ephemeral: it is not a database record, it is cleared on
 * restart, and it never contains retained document/page bodies.
 */
export type ExternalSourceVerificationResult = {
  contract: string;
  mode: string;
  safeguards: Record<string, unknown>;
  limitations: string[];
  summary: Record<string, unknown>;
  entries: Array<Record<string, any>>;
};

export type AutonomousExternalSourceVerificationEvidence = {
  status: 'available' | 'absent' | 'stale';
  capturedAt: string | null;
  expiresAt: string | null;
  data: ExternalSourceVerificationResult | null;
};

const C3_EVIDENCE_TTL_MS = 30 * 60 * 1_000;
let latestC3Evidence: { capturedAt: string; expiresAt: string; data: ExternalSourceVerificationResult } | null = null;

function rememberC3Evidence(data: ExternalSourceVerificationResult) {
  const capturedAt = new Date().toISOString();
  latestC3Evidence = {
    capturedAt,
    expiresAt: new Date(Date.now() + C3_EVIDENCE_TTL_MS).toISOString(),
    data,
  };
}

/**
 * Read-only handoff for C4. This function never launches an external request.
 * C4 must explicitly hold when no fresh C3 evidence exists in this process.
 */
export function getLatestAutonomousExternalSourceVerificationEvidence(): AutonomousExternalSourceVerificationEvidence {
  if (!latestC3Evidence) {
    return { status: 'absent', capturedAt: null, expiresAt: null, data: null };
  }
  if (Date.now() > Date.parse(latestC3Evidence.expiresAt)) {
    return {
      status: 'stale',
      capturedAt: latestC3Evidence.capturedAt,
      expiresAt: latestC3Evidence.expiresAt,
      data: null,
    };
  }
  return {
    status: 'available',
    capturedAt: latestC3Evidence.capturedAt,
    expiresAt: latestC3Evidence.expiresAt,
    data: latestC3Evidence.data,
  };
}

function clean(value: unknown, max = 1_500): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, max) : null;
}

function canonicalHttpUrl(value: string | null | undefined): string | null {
  const input = clean(value, 2_000);
  if (!input) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (url.username || url.password) return null;
    if (!ALLOWED_PORTS.has(url.port)) return null;
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

function privateOrReservedIpv4(address: string): boolean {
  const octets = address.split('.').map((part) => Number(part));
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 2) ||
    (a === 198 && (b === 18 || b === 19 || b === 51)) ||
    (a === 203 && b === 0)
  );
}

function privateOrReservedIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) return true;
  if (normalized.startsWith('2001:db8')) return true;
  const mapped = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return Boolean(mapped && privateOrReservedIpv4(mapped[1]));
}

function publicAddress(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) return !privateOrReservedIpv4(address);
  if (kind === 6) return !privateOrReservedIpv6(address);
  return false;
}

async function validateDns(hostname: string): Promise<DnsSafety> {
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    return { ok: false, reason: 'local_or_empty_hostname', addressCount: 0 };
  }
  try {
    const addresses = await lookup(hostname, { all: true, verbatim: true });
    if (!addresses.length) return { ok: false, reason: 'dns_no_addresses', addressCount: 0 };
    if (addresses.some((record) => !publicAddress(record.address))) {
      return { ok: false, reason: 'dns_private_or_reserved_address', addressCount: addresses.length };
    }
    return { ok: true, resolution: 'public_only', addressCount: addresses.length };
  } catch {
    return { ok: false, reason: 'dns_lookup_failed', addressCount: 0 };
  }
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs).unref?.();
  return controller.signal;
}

function sanitizedLocation(value: string | null): string | null {
  if (!value) return null;
  const canonical = canonicalHttpUrl(value);
  return canonical ? canonical.slice(0, 1_500) : null;
}

async function fetchMetadata(url: string): Promise<Probe> {
  const checkedAt = new Date().toISOString();
  const canonical = canonicalHttpUrl(url);
  if (!canonical) {
    return {
      checkedAt,
      requestedUrl: url,
      hostname: null,
      dns: { ok: false, reason: 'invalid_or_disallowed_url', addressCount: 0 },
      method: 'NONE',
      statusCode: null,
      contentType: null,
      redirectLocation: null,
      outcome: 'safety_blocked',
      detail: 'URL خارج سياسة HTTP(S) أو يتضمن بيانات اعتماد/منفذ غير مسموح.',
    };
  }

  const hostname = new URL(canonical).hostname;
  const dns = await validateDns(hostname);
  if (!dns.ok) {
    return {
      checkedAt,
      requestedUrl: canonical,
      hostname,
      dns,
      method: 'NONE',
      statusCode: null,
      contentType: null,
      redirectLocation: null,
      outcome: 'safety_blocked',
      detail: 'تم حجب الطلب قبل الشبكة بسبب سياسة سلامة DNS/SSRF.',
    };
  }

  const baseHeaders = {
    'accept': 'text/html,application/pdf;q=0.9,*/*;q=0.1',
    'user-agent': 'PalWakf-Provenance-Verifier-C3/1.0 (+metadata-only; no-content-retention)',
  };

  const request = async (method: 'HEAD' | 'GET_RANGE') => {
    return await fetch(canonical, {
      method: method === 'HEAD' ? 'HEAD' : 'GET',
      redirect: 'manual',
      signal: timeoutSignal(REQUEST_TIMEOUT_MS),
      headers: method === 'HEAD' ? baseHeaders : { ...baseHeaders, range: 'bytes=0-0' },
    });
  };

  try {
    let method: 'HEAD' | 'GET_RANGE' = 'HEAD';
    let response = await request(method);
    if ([405, 501].includes(response.status)) {
      response = await request('GET_RANGE');
      method = 'GET_RANGE';
    }
    if (response.body) {
      await response.body.cancel().catch(() => undefined);
    }
    const statusCode = response.status;
    const contentType = clean(response.headers.get('content-type'), 300);
    const redirectLocation = sanitizedLocation(response.headers.get('location'));
    const outcome: Probe['outcome'] = statusCode >= 300 && statusCode < 400
      ? 'redirect'
      : statusCode === 401 || statusCode === 403
        ? 'restricted'
        : statusCode >= 200 && statusCode < 300
          ? 'reachable'
          : 'not_found_or_error';
    return {
      checkedAt,
      requestedUrl: canonical,
      hostname,
      dns,
      method,
      statusCode,
      contentType,
      redirectLocation,
      outcome,
      detail: outcome === 'reachable'
        ? 'استجابة HTTP ناجحة؛ لم تُقرأ أو تُخزن أي مادة أو محتوى.'
        : outcome === 'redirect'
          ? 'تم رصد تحويل ولم تتم متابعته تلقائيًا.'
          : outcome === 'restricted'
            ? 'الخادم قابل للوصول لكنه يتطلب وصولًا أو يرفض الفحص الآلي.'
            : 'الخادم رد بحالة غير صالحة للاعتماد الخارجي في هذه المرحلة.',
    };
  } catch (error) {
    const name = error instanceof Error ? error.name : 'network_error';
    return {
      checkedAt,
      requestedUrl: canonical,
      hostname,
      dns,
      method: 'HEAD',
      statusCode: null,
      contentType: null,
      redirectLocation: null,
      outcome: 'network_failure',
      detail: name === 'AbortError' ? 'انتهت مهلة الفحص الخارجي دون استجابة.' : 'تعذر الوصول الخارجي أثناء الفحص دون تخزين أي محتوى.',
    };
  }
}

function matrixDecision(cluster: C2Cluster, probe: Probe | null): { disposition: MatrixDisposition; label: string; rationale: string[]; nextGate: string } {
  if (!probe) {
    return {
      disposition: 'NO_ELIGIBLE_EXTERNAL_URL',
      label: 'لا يوجد رابط مرشح للفحص الخارجي',
      rationale: ['عنقود C2 لا يملك رابط HTTP(S) مرشحًا ضمن فئات الفحص الخارجي.', 'لا يترتب أي ربط مصدر أو تغيير حقوق.'],
      nextGate: 'NONE — RETAIN_C2_DISPOSITION_ONLY',
    };
  }
  if (probe.outcome === 'safety_blocked') {
    return {
      disposition: 'SAFETY_BLOCKED_HOLD',
      label: 'موقوف بسياسة السلامة',
      rationale: [probe.detail, 'لم يتم إرسال طلب خارجي إلى عنوان غير آمن أو خاص.'],
      nextGate: 'MANUAL_SAFE_URL_REPLACEMENT_IF_EVER_NEEDED',
    };
  }
  if (probe.outcome === 'redirect') {
    return {
      disposition: 'REDIRECT_OR_HOST_CHANGE_HOLD',
      label: 'تحويل/تغير وجهة — تعليق',
      rationale: [probe.detail, 'التحويل لا يُتابع ولا يُعتمد تلقائيًا لتفادي تغيير النطاق أو المصدر.'],
      nextGate: 'TARGETED_REDIRECT_AND_SOURCE_SCOPE_REVIEW',
    };
  }
  if (probe.outcome === 'restricted') {
    return {
      disposition: 'RESTRICTED_OR_AUTH_REQUIRED_HOLD',
      label: 'وصول مقيد — تعليق',
      rationale: [probe.detail, 'قابلية الوصول المقيدة لا تثبت الإذن أو صلاحية إعادة الاستخدام.'],
      nextGate: 'ACCESS_SCOPE_AND_RIGHTS_REVIEW',
    };
  }
  if (probe.outcome === 'network_failure' || probe.outcome === 'not_found_or_error') {
    return {
      disposition: 'UNREACHABLE_OR_TIMEOUT_HOLD',
      label: 'غير قابل للوصول/مهلة — تعليق',
      rationale: [probe.detail, 'لا يُعتمد الرابط كمصدر قابل للتحقق في هذه الجولة.'],
      nextGate: 'URL_RECHECK_OR_REPLACEMENT_CANDIDATE',
    };
  }
  if (cluster.disposition === 'OFFICIAL_SOURCE_CANDIDATE') {
    return {
      disposition: 'OFFICIAL_URL_REACHABLE_METADATA_ONLY',
      label: 'رابط رسمي مرشح قابل للوصول — بيانات وصفية فقط',
      rationale: ['رابط مرشح رسمي أجاب باستجابة HTTP ناجحة.', 'ذلك لا يثبت صفة الجهة أو الترخيص أو الإتاحة الكاملة، ولا يسمح بالربط أو Chat/RAG.'],
      nextGate: 'OFFICIAL_SOURCE_IDENTITY_AND_TERMS_VERIFICATION',
    };
  }
  if (cluster.disposition === 'ACADEMIC_SOURCE_CANDIDATE') {
    return {
      disposition: 'ACADEMIC_URL_REACHABLE_METADATA_ONLY',
      label: 'رابط أكاديمي/مستودع قابل للوصول — بيانات وصفية فقط',
      rationale: ['رابط ناشر أكاديمي أو مستودع أجاب باستجابة HTTP ناجحة.', 'يبقى الترخيص، نطاق الاقتباس، والنص الكامل خارج أي قرار آلي.'],
      nextGate: 'PUBLISHER_TERMS_AND_METADATA_SCOPE_VERIFICATION',
    };
  }
  return {
    disposition: 'REACHABLE_RIGHTS_UNKNOWN_HOLD',
    label: 'رابط قابل للوصول — الحقوق غير محسومة',
    rationale: ['الرابط أجاب باستجابة HTTP ناجحة لكنه لا يحقق معيار رسمي/أكاديمي كافٍ للاعتماد.', 'لا يُنشأ مصدر ولا يُسند حق ولا تُفتح أهلية Chat/RAG.'],
    nextGate: 'SOURCE_QUALITY_AND_RIGHTS_VERIFICATION',
  };
}

function uniqueCandidateClusters(clusters: C2Cluster[]): C2Cluster[] {
  const seen = new Set<string>();
  return clusters
    .filter((cluster) => EXTERNAL_CANDIDATE_DISPOSITIONS.has(cluster.disposition))
    .filter((cluster) => {
      const url = (cluster.urls || []).map(canonicalHttpUrl).find(Boolean);
      if (!url || seen.has(url)) return false;
      seen.add(url);
      return true;
    })
    .sort((left, right) => {
      const rank = (cluster: C2Cluster) => cluster.disposition === 'OFFICIAL_SOURCE_CANDIDATE' ? 0 : cluster.disposition === 'ACADEMIC_SOURCE_CANDIDATE' ? 1 : 2;
      return rank(left) - rank(right) || right.rawRows - left.rawRows || String(left.title || '').localeCompare(String(right.title || ''), 'ar');
    });
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const worker = async () => {
    while (true) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await mapper(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

export async function getAutonomousExternalSourceVerification(input?: { maxUrls?: number }) {
  const c2 = await getAutonomousProvenanceAudit();
  const maxUrls = Math.max(1, Math.min(MAX_EXTERNAL_URLS, Math.floor(input?.maxUrls || MAX_EXTERNAL_URLS)));
  const allClusters = (Array.isArray(c2.clusters) ? c2.clusters : []) as C2Cluster[];
  const candidateClusters = uniqueCandidateClusters(allClusters);
  const selected = candidateClusters.slice(0, maxUrls);
  const omittedByLimit = Math.max(0, candidateClusters.length - selected.length);

  const entries = await mapWithConcurrency(selected, MAX_CONCURRENCY, async (cluster) => {
    const selectedUrl = (cluster.urls || []).map(canonicalHttpUrl).find(Boolean) || null;
    const probe = selectedUrl ? await fetchMetadata(selectedUrl) : null;
    const decision = matrixDecision(cluster, probe);
    return {
      clusterKey: cluster.clusterKey,
      title: cluster.title,
      rawRows: cluster.rawRows,
      c2Disposition: cluster.disposition,
      c2DispositionLabel: cluster.dispositionLabel,
      authors: cluster.authors,
      publishers: cluster.publishers,
      requestedUrl: selectedUrl,
      probe,
      matrixDisposition: decision.disposition,
      matrixLabel: decision.label,
      rationale: decision.rationale,
      finalReleaseMatrix: {
        preserveRawEvidence: true,
        sourceLinkWrite: 'blocked' as const,
        rightsAssignment: 'blocked' as const,
        legalRightsConclusion: 'not_inferred' as const,
        publicDisplay: 'blocked_pending_rights_gate' as const,
        chatRag: 'blocked_pending_separate_gate' as const,
        finalRelease: 'not_authorized' as const,
        requiredNextGate: decision.nextGate,
      },
    };
  });

  const counts = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.matrixDisposition] = (acc[entry.matrixDisposition] || 0) + 1;
    return acc;
  }, {});

  const result: ExternalSourceVerificationResult = {
    contract: 'assistant_autonomous_external_source_verification_c3_read_only_v1',
    mode: 'operator_triggered_bounded_external_metadata_check',
    safeguards: {
      operatorTriggered: true,
      boundedExternalUrls: maxUrls,
      concurrencyLimit: MAX_CONCURRENCY,
      timeoutMs: REQUEST_TIMEOUT_MS,
      noRedirectFollow: true,
      noDocumentBodyRetention: true,
      dnsPublicAddressGuard: true,
      noDatabaseWrite: true,
      noSourceLinkWrite: true,
      noRightsAssignment: true,
      noAutomaticPromotion: true,
      noAutomaticChatRelease: true,
    },
    limitations: [
      'نجاح HTTP يثبت قابلية الوصول الخارجية في وقت الفحص فقط؛ لا يثبت الملكية الفكرية أو الترخيص أو هوية الناشر أو صحة المحتوى.',
      'لا تُقرأ أو تُخزن نصوص الصفحات أو ملفات PDF؛ الفحص يقتصر على DNS وHTTP headers/status والتحويل غير المتابع.',
      'جميع نتائج C3 تحفظ المصدر والحقوق والعرض وChat/RAG في وضع محجوب إلى بوابة مستقلة لاحقة.',
    ],
    summary: {
      c2Clusters: allClusters.length,
      c2ExternalCandidates: candidateClusters.length,
      requestedChecks: selected.length,
      omittedByLimit,
      matrixCounts: counts,
      finalReleaseAuthorized: 0,
      sourceLinkWrites: 0,
      rightsAssignments: 0,
      chatRagReleases: 0,
    },
    entries,
  };
  rememberC3Evidence(result);
  return result;
}
