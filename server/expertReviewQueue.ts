import {
  MEGA_C_SOURCE_FAMILIES,
  buildCorpusCoverageLedger,
  type ReferenceSourceFamily,
} from "./referenceCorpusScaleUp";
import { buildLegalStatusMatrixMegaC } from "./legalStatusMatrixMegaC";
import type { LegalStatusMatrixDecision } from "./legalStatusMatrixPilot";

export type ExpertReviewRole =
  | "LEGAL_STATUS_REVIEWER"
  | "FIQH_SHARIA_REVIEWER"
  | "HISTORICAL_EVIDENCE_REVIEWER"
  | "RIGHTS_REVIEWER"
  | "WAQF_DEED_REVIEWER"
  | "SECURITY_PRIVACY_REVIEWER"
  | "PROGRAM_ACCEPTANCE_REVIEWER";

export type ExpertReviewKind =
  | "SOURCE_FAMILY_AUTHORITY_RIGHTS"
  | "LEGAL_STATUS_EXCEPTION"
  | "HISTORICAL_IDENTITY_EXCEPTION"
  | "FIQH_SHARIA_SOURCE_ADMISSION"
  | "WAQF_DEED_INTERPRETATION"
  | "SECURITY_PRIVACY_EXCEPTION";

export type ExpertReviewPriority = "P0" | "P1" | "P2";

export type ExpertReviewItem = {
  reviewId: string;
  kind: ExpertReviewKind;
  role: ExpertReviewRole;
  priority: ExpertReviewPriority;
  subjectId: string;
  subjectTitle: string;
  territory: string | null;
  evidenceRefs: string[];
  reasons: string[];
  blocksAuthoritativeConclusion: boolean;
  status: "PENDING_HUMAN_REVIEW";
};

export type HumanExpertDecision = {
  decisionId: string;
  reviewId: string;
  reviewerRole: ExpertReviewRole;
  reviewerIdentity: string;
  decidedAt: string;
  disposition:
    | "APPROVED"
    | "APPROVED_WITH_LIMITS"
    | "REJECTED"
    | "NEEDS_MORE_EVIDENCE";
  evidenceRefs: string[];
  rationale: string;
  humanAttested: true;
};

function legalReviewRole(row: LegalStatusMatrixDecision): ExpertReviewRole {
  if (
    row.instrumentId.includes("OTTOMAN") ||
    row.instrumentId.includes("MANDATE")
  ) {
    return "HISTORICAL_EVIDENCE_REVIEWER";
  }
  return "LEGAL_STATUS_REVIEWER";
}

function legalReviewPriority(
  row: LegalStatusMatrixDecision
): ExpertReviewPriority {
  if (
    row.territory === "GAZA" ||
    row.territory === "JERUSALEM" ||
    row.assertedStatus === "DISPUTED"
  ) {
    return "P0";
  }
  return "P1";
}

function sourceFamilyReview(
  family: ReferenceSourceFamily
): ExpertReviewItem | null {
  const ledger = buildCorpusCoverageLedger(undefined, [family])[0];
  if (!ledger) return null;
  if (
    family.reviewPolicy === "POLICY_AUTO_LOW_RISK" &&
    ledger.rightsPendingCorpusIds.length === 0
  ) {
    return null;
  }

  const isFiqhSharia =
    family.domains.includes("fiqh") || family.domains.includes("sharia");
  const isHistorical =
    family.domains.includes("historical") ||
    family.eras.includes("OTTOMAN") ||
    family.eras.includes("BRITISH_MANDATE");
  const role: ExpertReviewRole = isFiqhSharia
    ? "FIQH_SHARIA_REVIEWER"
    : isHistorical
      ? "HISTORICAL_EVIDENCE_REVIEWER"
      : "RIGHTS_REVIEWER";
  const kind: ExpertReviewKind = isFiqhSharia
    ? "FIQH_SHARIA_SOURCE_ADMISSION"
    : "SOURCE_FAMILY_AUTHORITY_RIGHTS";

  const reasons = [
    ...(ledger.rightsPendingCorpusIds.length
      ? ["source_family_rights_policy_pending"]
      : []),
    ...(family.reviewPolicy === "EXPERT_REQUIRED"
      ? ["source_family_requires_expert_admission"]
      : []),
    ...(family.coverageState === "UNRESOLVED"
      ? ["source_family_coverage_unresolved"]
      : []),
  ];
  if (!reasons.length) return null;

  return {
    reviewId: `review-family-${family.familyId.toLowerCase()}`,
    kind,
    role,
    priority: family.priority,
    subjectId: family.familyId,
    subjectTitle: family.title,
    territory: family.territories.length === 1 ? family.territories[0] : null,
    evidenceRefs: [...family.seedCorpusIds],
    reasons,
    blocksAuthoritativeConclusion:
      family.reviewPolicy === "EXPERT_REQUIRED" ||
      family.coverageState === "UNRESOLVED",
    status: "PENDING_HUMAN_REVIEW",
  };
}

export function buildExpertReviewQueue(): {
  generatedForDate: string;
  itemCount: number;
  familyReviewCount: number;
  legalStatusExceptionCount: number;
  perDocumentRoutineRightsReviewCount: 0;
  pendingBlockingCount: number;
  items: ExpertReviewItem[];
} {
  const items: ExpertReviewItem[] = [];

  for (const family of MEGA_C_SOURCE_FAMILIES) {
    const review = sourceFamilyReview(family);
    if (review) items.push(review);
  }

  const matrix = buildLegalStatusMatrixMegaC();
  for (const row of matrix.rows.filter(row => row.reviewRequired)) {
    items.push({
      reviewId: `review-status-${row.rowId}`,
      kind:
        row.assertedStatus === "HISTORICAL"
          ? "HISTORICAL_IDENTITY_EXCEPTION"
          : "LEGAL_STATUS_EXCEPTION",
      role: legalReviewRole(row),
      priority: legalReviewPriority(row),
      subjectId: row.rowId,
      subjectTitle: row.instrumentTitle,
      territory: row.territory,
      evidenceRefs: row.evidence.map(evidence => evidence.evidenceId),
      reasons: [...row.reasons],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    });
  }

  const priorityRank: Record<ExpertReviewPriority, number> = {
    P0: 0,
    P1: 1,
    P2: 2,
  };
  items.sort(
    (a, b) =>
      priorityRank[a.priority] - priorityRank[b.priority] ||
      a.reviewId.localeCompare(b.reviewId)
  );

  return {
    generatedForDate: "2026-09-22",
    itemCount: items.length,
    familyReviewCount: items.filter(item =>
      item.reviewId.startsWith("review-family-")
    ).length,
    legalStatusExceptionCount: items.filter(item =>
      item.reviewId.startsWith("review-status-")
    ).length,
    perDocumentRoutineRightsReviewCount: 0,
    pendingBlockingCount: items.filter(
      item => item.blocksAuthoritativeConclusion
    ).length,
    items,
  };
}

export function validateHumanExpertDecision(
  decision: HumanExpertDecision,
  queue = buildExpertReviewQueue()
): string[] {
  const errors: string[] = [];
  const review = queue.items.find(item => item.reviewId === decision.reviewId);
  if (!review) errors.push("review_item_not_found");
  if (!decision.reviewerIdentity.trim())
    errors.push("reviewer_identity_required");
  if (!decision.rationale.trim()) errors.push("rationale_required");
  if (!decision.decidedAt.trim()) errors.push("decision_timestamp_required");
  if (!decision.evidenceRefs.length) errors.push("evidence_refs_required");
  if (!decision.humanAttested) errors.push("human_attestation_required");
  if (review && review.role !== decision.reviewerRole) {
    errors.push("reviewer_role_mismatch");
  }
  return [...new Set(errors)];
}
