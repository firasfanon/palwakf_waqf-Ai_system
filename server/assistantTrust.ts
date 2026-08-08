import type { AuthenticatedUser } from './_core/types/authUser';

/**
 * Sovereign Assistant Trust Policy (v1A — strict public retrieval)
 *
 * A document being stored, approved, or marked chat-eligible does not itself
 * make it eligible for user-facing retrieval. The public retrieval gate now
 * requires a human-verified retained source and at least one verified citation.
 * Linked citations remain reviewable in administrative surfaces only.
 */

export type KnowledgeVisibilityScope = 'public' | 'internal' | 'restricted';
export type CitationVerificationStatus = 'missing' | 'linked' | 'verified' | 'rejected';
export type SourceVerificationStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'missing';

export type TrustAssessment = {
  allowForChat: boolean;
  visibilityScope: KnowledgeVisibilityScope;
  citationStatus: CitationVerificationStatus;
  sourceVerificationStatus: SourceVerificationStatus;
  authorityLevel: string;
  contentStatus: string;
  reasons: string[];
  qualityScore: number;
};

const TEST_TITLE_PATTERN = /(^|\s)(minimal\s+test|test\s+document|اختبار|تجريبي|demo|sample)(\s|$)/i;
const BLOCKED_CONTENT_STATUSES = new Set(['test', 'duplicate', 'quarantined', 'rejected', 'archived']);
const PRIVILEGED_ROLES = new Set([
  'admin',
  'super_admin',
  'superadmin',
  'platform_admin',
  'manager',
  'owner',
  'employee',
  'editor',
  'administrator',
]);

function asObject(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : {};
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeScope(value: unknown, doc: any): KnowledgeVisibilityScope {
  const candidate = normalizeText(value);
  if (candidate === 'restricted' || candidate === 'sovereign') return 'restricted';
  if (candidate === 'internal' || candidate === 'internal_only') return 'internal';

  const domain = normalizeText(doc?.domainScope ?? doc?.domain_scope);
  if (domain === 'internal_procedure') return 'internal';
  return 'public';
}

function normalizeContentStatus(value: unknown, title: unknown): string {
  const candidate = normalizeText(value);
  if (candidate) return candidate;
  return TEST_TITLE_PATTERN.test(String(title ?? '')) ? 'test' : 'production';
}

function normalizeSourceVerification(document: any, metadata: Record<string, any>, referenceMetadata: Record<string, any>): SourceVerificationStatus {
  const reference = document?.referenceDocument ?? document?.reference_document ?? {};
  const raw = normalizeText(
    reference?.verificationStatus ??
    reference?.verification_status ??
    document?.referenceVerificationStatus ??
    document?.reference_verification_status ??
    metadata.reference_verification_status ??
    metadata.source_verification_status ??
    referenceMetadata.verification_status ??
    referenceMetadata.source_verification_status,
  );
  if (raw === 'verified') return 'verified';
  if (raw === 'rejected') return 'rejected';
  if (raw === 'expired') return 'expired';
  if (raw === 'pending' || raw === 'linked' || raw === 'review') return 'pending';
  return 'missing';
}

function isPrivilegedActor(actor?: Partial<AuthenticatedUser> | null): boolean {
  if (!actor) return false;
  const role = normalizeText(actor.role);
  const platformRole = normalizeText(actor.platformRole);
  return PRIVILEGED_ROLES.has(role) || PRIVILEGED_ROLES.has(platformRole);
}

function hasScopeAccess(scope: KnowledgeVisibilityScope, actor?: Partial<AuthenticatedUser> | null, scopeCodes: string[] = []): boolean {
  if (scope === 'public') return true;
  if (isPrivilegedActor(actor)) return true;
  const allowed = new Set(scopeCodes.map((item) => normalizeText(item)));
  return allowed.has(`assistant.${scope}`) || allowed.has(scope) || allowed.has('assistant.all');
}

function normalizeCitationVerification(citations: any[]): CitationVerificationStatus {
  if (!citations.length) return 'missing';
  const statuses = citations.map((citation) => {
    const metadata = asObject(citation?.metadataJson ?? citation?.metadata_json);
    return normalizeText(
      citation?.verificationStatus ??
      citation?.verification_status ??
      metadata.verification_status ??
      metadata.citation_verification_status,
    );
  });

  if (statuses.some((status) => status === 'verified')) return 'verified';
  if (statuses.some((status) => status === 'rejected')) return 'rejected';
  return 'linked';
}

/**
 * Strict public retrieval baseline:
 * - approved and explicitly chat eligible
 * - retained source has human verification status = verified
 * - at least one citation has human verification status = verified
 * - no test / duplicate / quarantined state
 * - actor must satisfy document scope
 *
 * This deliberately fails closed. A linked citation is useful for review and
 * ranking but is never sufficient for user-facing chat until verified.
 */
export function assessKnowledgeTrust(document: any, actor?: Partial<AuthenticatedUser> | null, scopeCodes: string[] = []): TrustAssessment {
  const metadata = asObject(document?.metadataJson ?? document?.metadata_json);
  const referenceMetadata = asObject(document?.referenceDocument?.metadataJson ?? document?.referenceDocument?.metadata_json);
  const authorityLevel = normalizeText(document?.authorityLevel ?? document?.authority_level ?? metadata.authority_level) || 'unverified';
  const contentStatus = normalizeContentStatus(metadata.content_status ?? metadata.contentStatus, document?.title);
  const visibilityScope = normalizeScope(metadata.visibility_scope ?? metadata.visibilityScope ?? referenceMetadata.visibility_scope, document);
  const citations = Array.isArray(document?.citations) ? document.citations : [];
  const citationStatus = normalizeCitationVerification(citations);
  const sourceVerificationStatus = normalizeSourceVerification(document, metadata, referenceMetadata);
  const approved = normalizeText(document?.status) === 'approved';
  const isChatEligible = Boolean(document?.isChatEligible ?? document?.is_chat_eligible ?? document?.isActive);
  const reasons: string[] = [];

  if (!approved) reasons.push('knowledge_document_not_approved');
  if (!isChatEligible) reasons.push('knowledge_document_not_chat_eligible');
  if (BLOCKED_CONTENT_STATUSES.has(contentStatus) || TEST_TITLE_PATTERN.test(String(document?.title ?? ''))) {
    reasons.push('legacy_test_or_quarantined_content');
  }
  if (authorityLevel === 'unverified') reasons.push('source_authority_unverified');
  if (sourceVerificationStatus !== 'verified') reasons.push('source_not_human_verified');
  if (citationStatus !== 'verified') reasons.push('citation_not_human_verified');
  if (!hasScopeAccess(visibilityScope, actor, scopeCodes)) reasons.push('actor_scope_denied');

  let qualityScore = 0;
  if (approved) qualityScore += 20;
  if (isChatEligible) qualityScore += 15;
  if (citationStatus === 'linked') qualityScore += 5;
  if (citationStatus === 'verified') qualityScore += 30;
  if (sourceVerificationStatus === 'verified') qualityScore += 25;
  if (authorityLevel === 'official') qualityScore += 30;
  else if (authorityLevel === 'semi_official') qualityScore += 20;
  else if (authorityLevel === 'reference') qualityScore += 10;
  if (visibilityScope === 'restricted') qualityScore += 5;

  return {
    allowForChat: reasons.length === 0,
    visibilityScope,
    citationStatus,
    sourceVerificationStatus,
    authorityLevel,
    contentStatus,
    reasons,
    qualityScore,
  };
}

export function applyTrustMetadata(document: any, actor?: Partial<AuthenticatedUser> | null, scopeCodes: string[] = []) {
  const assessment = assessKnowledgeTrust(document, actor, scopeCodes);
  return {
    ...document,
    trust: assessment,
    citationVerificationStatus: assessment.citationStatus,
    sourceVerificationStatus: assessment.sourceVerificationStatus,
    visibilityScope: assessment.visibilityScope,
    contentStatus: assessment.contentStatus,
    isTrustEligible: assessment.allowForChat,
  };
}

export function getTrustMetrics(documents: any[], actor?: Partial<AuthenticatedUser> | null, scopeCodes: string[] = []) {
  const assessed = documents.map((document) => applyTrustMetadata(document, actor, scopeCodes));
  const count = (predicate: (doc: any) => boolean) => assessed.filter(predicate).length;
  return {
    total: assessed.length,
    chatEligible: count((doc) => Boolean(doc.isTrustEligible)),
    officialSources: count((doc) => doc.trust.authorityLevel === 'official'),
    verifiedSources: count((doc) => doc.trust.sourceVerificationStatus === 'verified'),
    verifiedCitations: count((doc) => doc.trust.citationStatus === 'verified'),
    linkedCitationsPendingVerification: count((doc) => doc.trust.citationStatus === 'linked'),
    missingOrRejectedCitations: count((doc) => ['missing', 'rejected'].includes(doc.trust.citationStatus)),
    testOrQuarantined: count((doc) => ['test', 'duplicate', 'quarantined'].includes(doc.trust.contentStatus)),
    internalOrRestricted: count((doc) => ['internal', 'restricted'].includes(doc.trust.visibilityScope)),
    reviewRequired: count((doc) => !doc.isTrustEligible),
  };
}
