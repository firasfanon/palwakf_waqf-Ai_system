import {
  buildMegaESpecialistReadinessQueue,
  type ReviewerAuthorityBinding,
  validateBoundHumanExpertDecision,
} from "./expertReviewMegaE";
import type {
  ExpertReviewItem,
  HumanExpertDecision,
} from "./expertReviewQueue";

export function buildMegaFSpecialistReadinessQueue(): ExpertReviewItem[] {
  const items: ExpertReviewItem[] = [
    ...buildMegaESpecialistReadinessQueue().map(item => ({
      ...item,
      evidenceRefs: [...item.evidenceRefs],
      reasons: [...item.reasons],
    })),
    {
      reviewId: "review-mega-f-case-law-1383-2019",
      kind: "LEGAL_STATUS_EXCEPTION",
      role: "LEGAL_STATUS_REVIEWER",
      priority: "P0",
      subjectId: "ps-cassation-1383-2019",
      subjectTitle:
        "نقض 1383/2019 — appellate normalization and hukr/raqaba holding scope",
      territory: "WEST_BANK",
      evidenceRefs: [
        "maqam-cassation-1383-2019-hukr",
        "first-instance-27-2018",
        "jerusalem-appeal-341-2019",
      ],
      reasons: [
        "case_specific_holding_requires_legal_scope_review",
        "secondary_reference_copy_not_official_court_origin",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-f-sharia-primary",
      kind: "FIQH_SHARIA_SOURCE_ADMISSION",
      role: "FIQH_SHARIA_REVIEWER",
      priority: "P0",
      subjectId: "SHARIA_PRIMARY",
      subjectTitle:
        "Primary sharia source family — Qur'an infrastructure and waqf hadith identity",
      territory: null,
      evidenceRefs: [
        "quran-complex-developer-platform",
        "bukhari-2737-muslim-1632-waqf-hadith-dorar",
      ],
      reasons: [
        "primary_collection_bytes_not_fully_preserved",
        "sharia_interpretation_requires_human_specialist",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-f-fiqh-hanafi-hilal",
      kind: "FIQH_SHARIA_SOURCE_ADMISSION",
      role: "FIQH_SHARIA_REVIEWER",
      priority: "P0",
      subjectId: "fiqh-hanafi-hilal-ahkam-al-waqf",
      subjectTitle: "هلال الرأي — أحكام الوقف — Hanafi edition",
      territory: null,
      evidenceRefs: [
        "sha256:b6186e5d6e7378a944eadf8af876781ee1c7647337d2c143222a5eccffa4268d",
        "pages:348",
      ],
      reasons: [
        "edition_identity_ready",
        "substantive_page_locator_not_yet_governed",
        "fiqh_specialist_review_required",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-f-fiqh-hanbali-khallal",
      kind: "FIQH_SHARIA_SOURCE_ADMISSION",
      role: "FIQH_SHARIA_REVIEWER",
      priority: "P0",
      subjectId: "fiqh-hanbali-khallal-kitab-al-wuquf",
      subjectTitle: "الخلال — كتاب الوقوف — Hanbali edition",
      territory: null,
      evidenceRefs: [
        "sha256:e882bc8f2eacb167987c5b2e0daa72bded6f56938f068587d5f83a7d2f521037",
        "pages:881",
      ],
      reasons: [
        "edition_identity_ready",
        "substantive_page_locator_not_yet_governed",
        "fiqh_specialist_review_required",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-f-gaza-current-status",
      kind: "LEGAL_STATUS_EXCEPTION",
      role: "LEGAL_STATUS_REVIEWER",
      priority: "P0",
      subjectId: "LAND_GAZA_CURRENT",
      subjectTitle: "Gaza current land/waqf legal-status track",
      territory: "GAZA",
      evidenceRefs: [
        "gaza-land-authority-legal-library",
        "gaza-government-property-legal-guidance",
        "gaza-pla-land-specific-laws-2020",
      ],
      reasons: [
        "legal_lineage_evidence_expanded",
        "instrument_by_instrument_current_status_unresolved",
        "west_bank_status_inheritance_prohibited",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-f-jerusalem-track",
      kind: "LEGAL_STATUS_EXCEPTION",
      role: "LEGAL_STATUS_REVIEWER",
      priority: "P0",
      subjectId: "LAND_JERUSALEM_TRACK",
      subjectTitle:
        "Jerusalem land/waqf applicability and operational registry track",
      territory: "JERUSALEM",
      evidenceRefs: [
        "jerusalem-israel-land-registry-extract-service",
        "jerusalem-soi-unregulated-cadastre-service",
      ],
      reasons: [
        "operational_registry_evidence_present",
        "jurisdiction_and_applicability_unresolved",
        "no_sovereignty_inference_allowed",
      ],
      blocksAuthoritativeConclusion: true,
      status: "PENDING_HUMAN_REVIEW",
    },
    {
      reviewId: "review-mega-f-continuity-security",
      kind: "SECURITY_PRIVACY_EXCEPTION",
      role: "SECURITY_PRIVACY_REVIEWER",
      priority: "P1",
      subjectId: "MEGA_F_CONTINUITY_SECURITY",
      subjectTitle:
        "MEGA_F local restore, private evidence and RBAC/privacy controls",
      territory: null,
      evidenceRefs: [
        "MEGA_F_LOCAL_RESTORE_DRILL",
        "MEGA_F_SECURITY_NEGATIVE_MATRIX",
        "MEGA_F_LOCAL_PERFORMANCE_COST_BENCHMARK",
      ],
      reasons: [
        "local_private_operability_evidence_ready",
        "independent_provider_and_production_identity_enforcement_pending",
      ],
      blocksAuthoritativeConclusion: false,
      status: "PENDING_HUMAN_REVIEW",
    },
  ];
  const byId = new Map<string, ExpertReviewItem>();
  for (const item of items) byId.set(item.reviewId, item);
  return [...byId.values()];
}

export function megaFSpecialistReadinessSummary(): {
  total: number;
  blocking: number;
  p0: number;
  actualHumanDecisionsIncluded: false;
  productionExpertSignoffSatisfied: false;
} {
  const queue = buildMegaFSpecialistReadinessQueue();
  return {
    total: queue.length,
    blocking: queue.filter(item => item.blocksAuthoritativeConclusion).length,
    p0: queue.filter(item => item.priority === "P0").length,
    actualHumanDecisionsIncluded: false,
    productionExpertSignoffSatisfied: false,
  };
}

export function validateMegaFBoundHumanDecision(input: {
  decision: HumanExpertDecision;
  binding: ReviewerAuthorityBinding;
}): string[] {
  return validateBoundHumanExpertDecision({
    decision: input.decision,
    binding: input.binding,
    queue: buildMegaFSpecialistReadinessQueue(),
  });
}
