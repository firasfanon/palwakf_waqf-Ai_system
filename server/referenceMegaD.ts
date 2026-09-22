import type {
  AlignedDeedTranscription,
  WaqfDeedRelation,
} from "./waqfDeedProcessing";
import { validateDeedRelation } from "./waqfDeedProcessing";
import {
  buildTitleChain,
  detectEvidenceConflicts,
  resolveJurisdiction,
  validateWaqfCondition,
  validateWaqfDeed,
  type EvidenceAssertion,
  type JurisdictionIssue,
  type JurisdictionRule,
  type TitleChainEvent,
  type WaqfAsset,
  type WaqfAssetRight,
  type WaqfCondition,
  type WaqfDeed,
} from "./waqfReferenceDomain";
import {
  evaluateParcelCrosswalk,
  type ParcelCandidate,
  type ParcelCrosswalkDecision,
} from "./parcelCrosswalk";
import type { LegalRegime, LegalTerritory } from "./legalReferenceModel";
import type { ReferenceRetrievalDocument } from "./referenceRetrieval";
export type MegaDGateState = "PASS" | "FAIL_CLOSED";

export type MegaDDeedPacket = {
  state: MegaDGateState;
  deed: WaqfDeed;
  transcriptionId: string;
  acceptedConditionIds: string[];
  relationCount: number;
  errors: string[];
  conclusionEligible: boolean;
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function buildMegaDDeedPacket(input: {
  deed: WaqfDeed;
  transcription: AlignedDeedTranscription;
  conditions: WaqfCondition[];
  relations?: WaqfDeedRelation[];
}): MegaDDeedPacket {
  const errors = [...validateWaqfDeed(input.deed)];
  if (
    input.transcription.artifactVersionId !==
    input.deed.preservedArtifactVersionId
  )
    errors.push("transcription_artifact_mismatch");
  if (
    input.deed.transcriptionReferenceId &&
    input.deed.transcriptionReferenceId !== input.transcription.transcriptionId
  )
    errors.push("transcription_reference_mismatch");
  if (input.transcription.requiresHumanReview)
    errors.push("transcription_human_review_required");

  const byId = new Map(input.conditions.map(row => [row.conditionId, row]));
  for (const conditionId of input.deed.conditionIds) {
    const condition = byId.get(conditionId);
    if (!condition) {
      errors.push("missing_condition:" + conditionId);
      continue;
    }
    for (const error of validateWaqfCondition(condition))
      errors.push(conditionId + ":" + error);
    if (condition.deedId !== input.deed.deedId)
      errors.push("condition_deed_mismatch:" + conditionId);
    if (
      condition.preservedArtifactVersionId !==
      input.deed.preservedArtifactVersionId
    )
      errors.push("condition_artifact_mismatch:" + conditionId);
    if (!condition.verified) errors.push("condition_unverified:" + conditionId);
  }

  for (const relation of input.relations || []) {
    for (const error of validateDeedRelation(relation))
      errors.push("relation:" + error);
    if (
      relation.sourceDeedId !== input.deed.deedId &&
      relation.targetDeedId !== input.deed.deedId
    )
      errors.push("relation_not_bound_to_deed");
  }
  const clean = unique(errors);
  return {
    state: clean.length ? "FAIL_CLOSED" : "PASS",
    deed: input.deed,
    transcriptionId: input.transcription.transcriptionId,
    acceptedConditionIds: input.deed.conditionIds.filter(id => {
      const row = byId.get(id);
      return Boolean(
        row &&
          row.verified &&
          row.deedId === input.deed.deedId &&
          row.preservedArtifactVersionId ===
            input.deed.preservedArtifactVersionId &&
          validateWaqfCondition(row).length === 0
      );
    }),
    relationCount: (input.relations || []).length,
    errors: clean,
    conclusionEligible: clean.length === 0,
  };
}

export type MegaDAssetTitlePacket = {
  state: MegaDGateState;
  assetId: string;
  titleEventIds: string[];
  unresolvedDateEventIds: string[];
  lowConfidenceEventIds: string[];
  crosswalks: ParcelCrosswalkDecision[];
  ownershipInferenceAllowed: false;
  errors: string[];
  conclusionEligible: boolean;
};
export function buildMegaDAssetTitlePacket(input: {
  asset: WaqfAsset;
  rights: WaqfAssetRight[];
  titleEvents: TitleChainEvent[];
  parcelCandidates: ParcelCandidate[];
}): MegaDAssetTitlePacket {
  const errors: string[] = [];
  if (!input.asset.assetId.trim()) errors.push("asset_id_required");
  if (!input.asset.preservedEvidenceVersionIds.length)
    errors.push("asset_preserved_evidence_required");

  if (!input.rights.length) errors.push("asset_right_required");
  if (!input.titleEvents.length) errors.push("title_event_required");

  for (const right of input.rights) {
    if (right.assetId !== input.asset.assetId)
      errors.push("right_asset_mismatch:" + right.rightId);
    if (!right.evidenceVersionIds.length)
      errors.push("right_evidence_required:" + right.rightId);
    if (!right.verified || right.confidence < 0.8)
      errors.push("right_unverified_or_low_confidence:" + right.rightId);
  }

  for (const event of input.titleEvents) {
    if (event.assetId !== input.asset.assetId)
      errors.push("title_event_asset_mismatch:" + event.eventId);
    if (!event.evidenceVersionIds.length)
      errors.push("title_event_evidence_required:" + event.eventId);
  }

  const chain = buildTitleChain(input.titleEvents);
  for (const id of chain.unresolvedDateEvents)
    errors.push("title_event_date_unresolved:" + id);
  for (const id of chain.lowConfidenceEvents)
    errors.push("title_event_low_confidence:" + id);
  const crosswalks = input.parcelCandidates.map(evaluateParcelCrosswalk);
  const crosswalkByRef = new Map(crosswalks.map(row => [row.parcelRef, row]));
  for (const parcelRef of input.asset.currentParcelRefs) {
    const decision = crosswalkByRef.get(parcelRef);
    if (!decision) errors.push("parcel_crosswalk_missing:" + parcelRef);
    else if (decision.unresolved)
      errors.push("parcel_crosswalk_unresolved:" + parcelRef);
    else {
      const candidate = input.parcelCandidates.find(
        row => row.parcelRef === parcelRef
      );
      const independentVersions = new Set(
        (candidate?.evidence || [])
          .filter(row => row.verified)
          .map(row => row.sourceArtifactVersionId)
          .filter(Boolean)
      );
      if (independentVersions.size < 2)
        errors.push("parcel_crosswalk_single_source_version:" + parcelRef);
    }
  }

  const clean = unique(errors);
  return {
    state: clean.length ? "FAIL_CLOSED" : "PASS",
    assetId: input.asset.assetId,
    titleEventIds: chain.events.map(row => row.eventId),
    unresolvedDateEventIds: chain.unresolvedDateEvents,
    lowConfidenceEventIds: chain.lowConfidenceEvents,
    crosswalks,
    ownershipInferenceAllowed: false,
    errors: clean,
    conclusionEligible: clean.length === 0,
  };
}

export type MegaDJurisdictionPacket = {
  state: MegaDGateState;
  territory: LegalTerritory;
  regime: LegalRegime;
  ruleId: string | null;
  competentAuthority: string | null;
  reasons: string[];
  conclusionEligible: boolean;
};
export function buildMegaDJurisdictionPacket(input: {
  issue: JurisdictionIssue;
  territory: LegalTerritory;
  regime: LegalRegime;
  onDate: string;
  rules: JurisdictionRule[];
  legalStatusGate: {
    verified: boolean;
    evidenceRefs: string[];
    deferred?: boolean;
  };
}): MegaDJurisdictionPacket {
  const reasons: string[] = [];
  if (input.legalStatusGate.deferred)
    reasons.push("territory_legal_status_deferred");
  if (!input.legalStatusGate.verified)
    reasons.push("legal_status_not_verified");
  if (!input.legalStatusGate.evidenceRefs.length)
    reasons.push("legal_status_evidence_required");

  const resolved = resolveJurisdiction({
    issue: input.issue,
    territory: input.territory,
    regime: input.regime,
    onDate: input.onDate,
    rules: input.rules,
  });
  if (resolved.state !== "resolved")
    reasons.push("jurisdiction_" + resolved.state + ":" + resolved.reason);

  const clean = unique(reasons);
  return {
    state: clean.length ? "FAIL_CLOSED" : "PASS",
    territory: input.territory,
    regime: input.regime,
    ruleId: resolved.rule?.ruleId || null,
    competentAuthority: resolved.rule?.competentAuthority || null,
    reasons: clean,
    conclusionEligible: clean.length === 0,
  };
}
export type MegaDConclusionGate = {
  state: MegaDGateState;
  conflictFactKeys: string[];
  reasons: string[];
  conclusionEligible: boolean;
};

export function buildMegaDConclusionGate(input: {
  deed: MegaDDeedPacket;
  assetTitle: MegaDAssetTitlePacket;
  jurisdiction: MegaDJurisdictionPacket;
  assertions: EvidenceAssertion[];
}): MegaDConclusionGate {
  const conflicts = detectEvidenceConflicts(input.assertions);
  const reasons: string[] = [];
  if (!input.deed.conclusionEligible) reasons.push("deed_gate_closed");
  if (!input.assetTitle.conclusionEligible)
    reasons.push("asset_title_gate_closed");
  if (!input.jurisdiction.conclusionEligible)
    reasons.push("jurisdiction_gate_closed");
  if (conflicts.length) reasons.push("evidence_conflict");

  return {
    state: reasons.length ? "FAIL_CLOSED" : "PASS",
    conflictFactKeys: conflicts.map(row => row.factKey),
    reasons,
    conclusionEligible: reasons.length === 0,
  };
}

export function buildMegaDStructuredRetrievalDocument(input: {
  deed: MegaDDeedPacket;
  assetTitle: MegaDAssetTitlePacket;
  jurisdiction: MegaDJurisdictionPacket;
  conclusionGate: MegaDConclusionGate;
  source: Omit<
    ReferenceRetrievalDocument,
    "documentId" | "title" | "content" | "conflictFlag" | "legalStatusVerified"
  >;
}): ReferenceRetrievalDocument {
  const deed = input.deed.deed;
  const content = [
    deed.title,
    "deed=" + deed.deedId,
    "asset=" + input.assetTitle.assetId,
    "conditions=" + input.deed.acceptedConditionIds.join(","),
    "title_events=" + input.assetTitle.titleEventIds.join(","),
    "jurisdiction=" + (input.jurisdiction.competentAuthority || "UNRESOLVED"),
  ].join("\n");
  return {
    ...input.source,
    documentId: "mega-d:" + deed.deedId + ":" + input.assetTitle.assetId,
    title: deed.title,
    content,
    conflictFlag: input.conclusionGate.conflictFactKeys.length > 0,
    structuredConclusionEligible: input.conclusionGate.conclusionEligible,
    legalStatusVerified: input.jurisdiction.conclusionEligible,
  };
}
