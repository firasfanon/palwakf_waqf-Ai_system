import type { SourceAuthorityClass } from "./referenceSourceCollections";
import type { LegalStatus } from "./legalReferenceModel";

export type ReferenceTrustLevel =
  | "R0_PRESERVED"
  | "R1_AUTHENTICATED_SOURCE"
  | "R2_VERIFIED_IDENTITY"
  | "R3_STATUS_VERIFIED"
  | "R4_CANONICAL_REFERENCE";

export type ReviewMode =
  | "AUTO_PRESERVE"
  | "BATCH_REVIEW"
  | "ITEM_REVIEW"
  | "BLOCKED";

export type RightsProfile = {
  preserveAllowed: boolean;
  fullTextRetentionAllowed: boolean;
  ragAllowed: boolean;
  publicDisplayAllowed: boolean;
  downloadAllowed: boolean;
  quoteAllowed: boolean;
  reviewStatus: "verified" | "pending" | "rejected";
};

export type ReferenceAdmissionInput = {
  authorityClass: SourceAuthorityClass;
  authorityVerified: boolean;
  identityVerified: boolean;
  legalStatus: LegalStatus | null;
  legalStatusVerified: boolean;
  rights: RightsProfile;
  extractionConfidence: number | null;
  hasEvidenceConflict: boolean;
  citationAlignmentVerified: boolean;
  sensitivePersonalData: boolean;
};

export type ReferenceAdmissionDecision = {
  trustLevel: ReferenceTrustLevel;
  reviewMode: ReviewMode;
  riskScore: number;
  preserved: boolean;
  structuredIndexCandidate: boolean;
  ragCandidate: boolean;
  canonicalReference: boolean;
  chatEligible: boolean;
  publicDisplayEligible: boolean;
  reasons: string[];
};

export type HumanReviewerRole =
  | "LEGAL_STATUS_REVIEWER"
  | "WAQF_DEED_REVIEWER"
  | "FIQH_SHARIA_REVIEWER"
  | "HISTORICAL_EVIDENCE_REVIEWER"
  | "RIGHTS_REVIEWER"
  | "SECURITY_PRIVACY_REVIEWER"
  | "PROGRAM_ACCEPTANCE_REVIEWER";

const OFFICIAL_OR_PRIMARY = new Set<SourceAuthorityClass>([
  "official_primary",
  "judicial_primary",
  "archival_primary",
]);

function clamp01(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(1, value));
}

export function evaluateReferenceAdmission(
  input: ReferenceAdmissionInput
): ReferenceAdmissionDecision {
  const reasons: string[] = [];
  let risk = 0;

  if (!input.rights.preserveAllowed) {
    return {
      trustLevel: "R0_PRESERVED",
      reviewMode: "BLOCKED",
      riskScore: 100,
      preserved: false,
      structuredIndexCandidate: false,
      ragCandidate: false,
      canonicalReference: false,
      chatEligible: false,
      publicDisplayEligible: false,
      reasons: ["preservation_not_authorized"],
    };
  }

  if (!input.authorityVerified) {
    risk += 25;
    reasons.push("source_authority_unverified");
  }
  if (!input.identityVerified) {
    risk += 20;
    reasons.push("document_identity_unverified");
  }
  if (!input.legalStatusVerified || input.legalStatus === "UNRESOLVED") {
    risk += 20;
    reasons.push("legal_status_unresolved");
  }
  if (input.legalStatus === "DISPUTED") {
    risk += 25;
    reasons.push("legal_status_disputed");
  }
  if (input.hasEvidenceConflict) {
    risk += 25;
    reasons.push("evidence_conflict");
  }
  const extractionConfidence = clamp01(input.extractionConfidence);
  if (extractionConfidence !== null && extractionConfidence < 0.85) {
    risk += 20;
    reasons.push("low_extraction_confidence");
  }
  if (!input.citationAlignmentVerified) {
    risk += 10;
    reasons.push("citation_alignment_unverified");
  }
  if (input.rights.reviewStatus !== "verified") {
    risk += 20;
    reasons.push("rights_review_pending");
  }
  if (input.sensitivePersonalData) {
    risk += 15;
    reasons.push("sensitive_personal_data");
  }
  if (!OFFICIAL_OR_PRIMARY.has(input.authorityClass)) {
    risk += 10;
    reasons.push("non_primary_authority");
  }

  risk = Math.min(100, risk);
  const trustLevel: ReferenceTrustLevel =
    input.authorityVerified &&
    input.identityVerified &&
    input.legalStatusVerified
      ? "R3_STATUS_VERIFIED"
      : input.authorityVerified && input.identityVerified
        ? "R2_VERIFIED_IDENTITY"
        : input.authorityVerified
          ? "R1_AUTHENTICATED_SOURCE"
          : "R0_PRESERVED";

  const reviewMode: ReviewMode =
    risk >= 55 ? "ITEM_REVIEW" : risk >= 20 ? "BATCH_REVIEW" : "AUTO_PRESERVE";

  const structuredIndexCandidate =
    input.rights.fullTextRetentionAllowed &&
    extractionConfidence !== null &&
    extractionConfidence >= 0.6;
  const ragCandidate =
    structuredIndexCandidate &&
    input.rights.ragAllowed &&
    input.rights.reviewStatus === "verified" &&
    input.identityVerified &&
    !input.hasEvidenceConflict;

  return {
    trustLevel,
    reviewMode,
    riskScore: risk,
    preserved: true,
    structuredIndexCandidate,
    ragCandidate,
    canonicalReference: false,
    chatEligible: false,
    publicDisplayEligible:
      input.rights.publicDisplayAllowed &&
      input.rights.reviewStatus === "verified" &&
      !input.sensitivePersonalData,
    reasons,
  };
}

export function reviewerRolesForDecision(
  input: ReferenceAdmissionInput
): HumanReviewerRole[] {
  const roles = new Set<HumanReviewerRole>();
  if (!input.legalStatusVerified || input.legalStatus === "DISPUTED")
    roles.add("LEGAL_STATUS_REVIEWER");
  if (input.rights.reviewStatus !== "verified") roles.add("RIGHTS_REVIEWER");
  if (input.sensitivePersonalData) roles.add("SECURITY_PRIVACY_REVIEWER");
  if ((input.extractionConfidence ?? 1) < 0.85)
    roles.add("HISTORICAL_EVIDENCE_REVIEWER");
  if (input.hasEvidenceConflict) {
    roles.add("LEGAL_STATUS_REVIEWER");
    roles.add("HISTORICAL_EVIDENCE_REVIEWER");
  }
  return [...roles];
}
