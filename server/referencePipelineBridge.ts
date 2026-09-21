import type { CollectionCrawlRecord } from "./comprehensiveReferenceOrchestrator";

export type ReferenceLifecycleState = {
  preserved: boolean;
  trusted: boolean;
  currentStatusVerified: boolean;
  canonical: boolean;
  chatEligible: boolean;
};

export type GovernedIngestionCandidate = {
  sourceUrl: string;
  artifactVersionId: string;
  artifactSha256: string;
  titleHint: string | null;
  retentionBasis: "verified_rights" | "review_required";
  lifecycle: ReferenceLifecycleState;
  reviewMode: string;
  reviewerRoles: string[];
  metadataJson: Record<string, unknown>;
};

export type ReferenceGovernanceEvent = {
  eventType:
    | "PRESERVATION_COMPLETED"
    | "ADMISSION_EVALUATED"
    | "REVIEW_REQUIRED"
    | "CANONICAL_PROMOTION"
    | "CHAT_RELEASE"
    | "REJECTION"
    | "SUPERSESSION";
  artifactVersionId: string;
  actorType: "system" | "human";
  actorRef: string | null;
  reason: string;
  evidenceRefs: string[];
  at: string;
};

export function buildGovernedIngestionCandidate(input: {
  record: CollectionCrawlRecord;
  titleHint?: string | null;
}): GovernedIngestionCandidate {
  const { record } = input;
  const lifecycle: ReferenceLifecycleState = {
    preserved: true,
    trusted: [
      "R1_AUTHENTICATED_SOURCE",
      "R2_VERIFIED_IDENTITY",
      "R3_STATUS_VERIFIED",
      "R4_CANONICAL_REFERENCE",
    ].includes(record.admission.trustLevel),
    currentStatusVerified: [
      "R3_STATUS_VERIFIED",
      "R4_CANONICAL_REFERENCE",
    ].includes(record.admission.trustLevel),
    canonical: record.admission.canonicalReference,
    chatEligible: record.admission.chatEligible,
  };
  return {
    sourceUrl: record.url,
    artifactVersionId: record.artifact.versionId,
    artifactSha256: record.artifact.sha256,
    titleHint: input.titleHint || null,
    retentionBasis: record.admission.ragCandidate
      ? "verified_rights"
      : "review_required",
    lifecycle,
    reviewMode: record.admission.reviewMode,
    reviewerRoles: [...record.reviewerRoles],
    metadataJson: {
      comprehensive_reference_program:
        "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
      collection_id: record.artifact.collectionId,
      preserved_artifact_id: record.artifact.artifactId,
      preserved_version_id: record.artifact.versionId,
      preservation_sha256: record.artifact.sha256,
      trust_level: record.admission.trustLevel,
      canonical_reference: record.admission.canonicalReference,
      chat_eligible: record.admission.chatEligible,
      admission_reasons: record.admission.reasons,
    },
  };
}

export function assertLifecycleMonotonicity(
  before: ReferenceLifecycleState,
  after: ReferenceLifecycleState
): string[] {
  const errors: string[] = [];
  if (after.trusted && !after.preserved)
    errors.push("trusted_requires_preserved");
  if (after.currentStatusVerified && !after.trusted)
    errors.push("current_requires_trusted");
  if (after.canonical && !after.currentStatusVerified)
    errors.push("canonical_requires_current_status_verification");
  if (after.chatEligible && !after.canonical)
    errors.push("chat_requires_canonical");
  if (before.chatEligible && !after.chatEligible) {
    // Demotion is allowed, but it must be an explicit governed event rather than a silent state rewrite.
  }
  return errors;
}

export function createGovernanceEvent(input: {
  eventType: ReferenceGovernanceEvent["eventType"];
  artifactVersionId: string;
  actorType: ReferenceGovernanceEvent["actorType"];
  actorRef?: string | null;
  reason: string;
  evidenceRefs?: string[];
  at: string;
}): ReferenceGovernanceEvent {
  if (!input.artifactVersionId.trim())
    throw new Error("artifact_version_required");
  if (!input.reason.trim()) throw new Error("governance_event_reason_required");
  if (input.actorType === "human" && !input.actorRef?.trim()) {
    throw new Error("human_actor_ref_required");
  }
  return {
    eventType: input.eventType,
    artifactVersionId: input.artifactVersionId,
    actorType: input.actorType,
    actorRef: input.actorRef?.trim() || null,
    reason: input.reason.trim(),
    evidenceRefs: [...(input.evidenceRefs || [])],
    at: input.at,
  };
}
