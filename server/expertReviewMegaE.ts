import {
  buildExpertReviewQueue,
  validateHumanExpertDecision,
  type ExpertReviewItem,
  type ExpertReviewRole,
  type HumanExpertDecision,
} from "./expertReviewQueue";

export type ReviewerAuthorityBinding = {
  reviewerId: string;
  realPersonVerified: boolean;
  applicationAccountBound: boolean;
  active: boolean;
  roles: ExpertReviewRole[];
  territories: string[];
  authorityRef: string | null;
  credentialEvidenceRefs: string[];
};

export function buildMegaESpecialistReadinessQueue(): ExpertReviewItem[] {
  const base = buildExpertReviewQueue().items.map(item => ({
    ...item,
    evidenceRefs: [...item.evidenceRefs],
    reasons: [...item.reasons],
  }));
  const extra: ExpertReviewItem[] = [
    {
      reviewId: "review-mega-e-haseki-artifact-identity",
      kind: "HISTORICAL_IDENTITY_EXCEPTION",
      role: "HISTORICAL_EVIDENCE_REVIEWER",
      priority: "P0",
      subjectId: "haseki-hurrem-kudus-waqfiyya-vgm-2017-public-mirror",
      subjectTitle:
        "Haseki Hürrem Sultan Kudüs Vakfiyesi — VGM 2017 edition public mirror",
      territory: "OTTOMAN_PALESTINE",
      evidenceRefs: [
        "private-manifest:haseki-hurrem-sultan-kudus-vakfiyesi",
        "vgm-publication-record",
        "ttk-bibliographic-record-587932",
      ],
      reasons: [
        "official_edition_identity_verified_but_origin_bytes_are_public_mirror",
        "historical_document_identity_requires_specialist_confirmation",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-e-haseki-deed-interpretation",
      kind: "WAQF_DEED_INTERPRETATION",
      role: "WAQF_DEED_REVIEWER",
      priority: "P0",
      subjectId: "waqf-deed-haseki-hurrem-kudus-arabic-964ah",
      subjectTitle:
        "Haseki Hürrem Sultan Jerusalem Arabic waqfiyya — Bethlehem and Beit Jala shares",
      territory: "OTTOMAN_PALESTINE",
      evidenceRefs: [
        "translation-page-10:item-14",
        "translation-page-10:item-15",
      ],
      reasons: [
        "18_of_24_share_language_requires_specialist_deed_interpretation",
        "no_modern_parcel_or_current_ownership_inference_allowed",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-e-haseki-rights",
      kind: "SOURCE_FAMILY_AUTHORITY_RIGHTS",
      role: "RIGHTS_REVIEWER",
      priority: "P0",
      subjectId: "haseki-hurrem-kudus-waqfiyya-vgm-2017-public-mirror",
      subjectTitle:
        "Private preservation and use rights for VGM 2017 public mirror",
      territory: null,
      evidenceRefs: ["private-manifest:haseki-hurrem-sultan-kudus-vakfiyesi"],
      reasons: [
        "private_research_use_allowed_under_current_governance",
        "public_display_and_download_remain_unreviewed",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-e-sensitive-deed-privacy",
      kind: "SECURITY_PRIVACY_EXCEPTION",
      role: "SECURITY_PRIVACY_REVIEWER",
      priority: "P0",
      subjectId: "waqf-sensitive-deed-access-policy",
      subjectTitle: "Sensitive deed, beneficiary and witness access policy",
      territory: null,
      evidenceRefs: ["MEGA_E_RBAC_NEGATIVE_AUTH_MATRIX"],
      reasons: [
        "production_identity_binding_not_yet_active",
        "sensitive_deed_access_requires_least_privilege_review",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
  ];
  const byId = new Map<string, ExpertReviewItem>();
  for (const item of [...base, ...extra]) byId.set(item.reviewId, item);
  return [...byId.values()];
}

export function validateBoundHumanExpertDecision(input: {
  decision: HumanExpertDecision;
  binding: ReviewerAuthorityBinding;
  queue?: ExpertReviewItem[];
}): string[] {
  const queueItems = input.queue || buildMegaESpecialistReadinessQueue();
  const errors: string[] = [];
  const review = queueItems.find(
    item => item.reviewId === input.decision.reviewId
  );

  errors.push(
    ...validateHumanExpertDecision(input.decision, {
      generatedForDate: "2026-09-22",
      itemCount: queueItems.length,
      familyReviewCount: queueItems.filter(item =>
        item.reviewId.startsWith("review-family-")
      ).length,
      legalStatusExceptionCount: queueItems.filter(item =>
        item.reviewId.startsWith("review-status-")
      ).length,
      perDocumentRoutineRightsReviewCount: 0,
      pendingBlockingCount: queueItems.filter(
        item => item.blocksAuthoritativeConclusion
      ).length,
      items: queueItems,
    })
  );

  if (input.binding.reviewerId !== input.decision.reviewerIdentity)
    errors.push("reviewer_identity_binding_mismatch");
  if (!input.binding.realPersonVerified)
    errors.push("real_person_verification_required");
  if (!input.binding.applicationAccountBound)
    errors.push("application_account_binding_required");
  if (!input.binding.active) errors.push("reviewer_binding_inactive");
  if (!input.binding.authorityRef?.trim())
    errors.push("authority_ref_required");
  if (!input.binding.credentialEvidenceRefs.length)
    errors.push("credential_evidence_required");
  if (!input.binding.roles.includes(input.decision.reviewerRole))
    errors.push("bound_role_missing");
  if (
    review?.territory &&
    !input.binding.territories.includes(review.territory)
  ) {
    errors.push("bound_territory_scope_mismatch");
  }
  return [...new Set(errors)];
}

export function developerExperimentalBinding(): ReviewerAuthorityBinding {
  return {
    reviewerId: "WAQF_AI_DEV_HUMAN_001",
    realPersonVerified: false,
    applicationAccountBound: false,
    active: true,
    roles: [],
    territories: [],
    authorityRef: "WAQF_AI_TEMP_HUMAN_APPROVER_AUTH_20260922",
    credentialEvidenceRefs: [],
  };
}

export function specialistReadinessSummary(): {
  total: number;
  blocking: number;
  p0: number;
  actualHumanDecisionsIncluded: false;
} {
  const queue = buildMegaESpecialistReadinessQueue();
  return {
    total: queue.length,
    blocking: queue.filter(item => item.blocksAuthoritativeConclusion).length,
    p0: queue.filter(item => item.priority === "P0").length,
    actualHumanDecisionsIncluded: false,
  };
}
