import {
  evaluateLegalApplicability,
  type LegalInstrument,
  type LegalTerritory,
} from "./legalReferenceModel";
import {
  detectEvidenceConflicts,
  type EvidenceAssertion,
} from "./waqfReferenceDomain";
import type { ReferenceIssueRoute } from "./referenceIssueRouter";
import type { ReferenceRetrievalHit } from "./referenceRetrieval";

export type ApplicabilityPacket = {
  legalId: string;
  territory: LegalTerritory;
  onDate: string;
  state:
    | "applicable"
    | "applicable_with_caveat"
    | "not_applicable"
    | "unresolved";
  status: string;
  evidenceRefs: string[];
  conclusionEligible: boolean;
  uncertaintyLabels: string[];
};

export function buildApplicabilityPacket(input: {
  instrument: LegalInstrument;
  territory: LegalTerritory;
  onDate: string;
}): ApplicabilityPacket {
  const result = evaluateLegalApplicability(input);
  const uncertaintyLabels = [...result.reasons];
  const conclusionEligible =
    ["applicable", "applicable_with_caveat", "not_applicable"].includes(
      result.state
    ) &&
    result.evidenceRefs.length > 0 &&
    result.status !== "DISPUTED" &&
    result.status !== "UNRESOLVED";
  return {
    legalId: input.instrument.legalId,
    territory: input.territory,
    onDate: input.onDate,
    state: result.state,
    status: result.status,
    evidenceRefs: result.evidenceRefs,
    conclusionEligible,
    uncertaintyLabels,
  };
}

export type TerritoryComparisonPacket = {
  left: ApplicabilityPacket;
  right: ApplicabilityPacket;
  crossTerritoryLeakageAllowed: false;
  comparisonEligible: boolean;
  reasons: string[];
};

export function compareTerritorialApplicability(input: {
  instrument: LegalInstrument;
  leftTerritory: LegalTerritory;
  rightTerritory: LegalTerritory;
  onDate: string;
}): TerritoryComparisonPacket {
  const left = buildApplicabilityPacket({
    instrument: input.instrument,
    territory: input.leftTerritory,
    onDate: input.onDate,
  });
  const right = buildApplicabilityPacket({
    instrument: input.instrument,
    territory: input.rightTerritory,
    onDate: input.onDate,
  });
  const reasons: string[] = [];
  if (!left.conclusionEligible) reasons.push("left_territory_unresolved");
  if (!right.conclusionEligible) reasons.push("right_territory_unresolved");
  if (left.status !== right.status) reasons.push("territory_statuses_differ");
  return {
    left,
    right,
    crossTerritoryLeakageAllowed: false,
    comparisonEligible: left.conclusionEligible && right.conclusionEligible,
    reasons,
  };
}

export type DomainSeparationPacket = {
  positiveLawEvidenceIds: string[];
  fiqhEvidenceIds: string[];
  shariaEvidenceIds: string[];
  mixedAnswerAllowed: boolean;
  requiredLabels: Array<"POSITIVE_LAW" | "FIQH" | "SHARIA">;
  reasons: string[];
};

export function buildDomainSeparationPacket(input: {
  route: ReferenceIssueRoute;
  hits: ReferenceRetrievalHit[];
}): DomainSeparationPacket {
  const positiveLawEvidenceIds = input.hits
    .filter(hit =>
      [
        "land_law",
        "waqf_law",
        "lease_hukr",
        "registration_settlement",
        "case_law",
        "administrative",
      ].includes(hit.domain)
    )
    .map(hit => hit.documentId);
  const fiqhEvidenceIds = input.hits
    .filter(hit => hit.domain === "fiqh")
    .map(hit => hit.documentId);
  const shariaEvidenceIds = input.hits
    .filter(hit => hit.domain === "sharia")
    .map(hit => hit.documentId);
  const requiredLabels: DomainSeparationPacket["requiredLabels"] = [];
  if (
    input.route.preferredDomains.some(domain =>
      [
        "land_law",
        "waqf_law",
        "lease_hukr",
        "registration_settlement",
        "case_law",
        "administrative",
      ].includes(domain)
    )
  )
    requiredLabels.push("POSITIVE_LAW");
  if (input.route.preferredDomains.includes("fiqh"))
    requiredLabels.push("FIQH");
  if (input.route.preferredDomains.includes("sharia"))
    requiredLabels.push("SHARIA");

  const reasons: string[] = [];
  if (requiredLabels.includes("POSITIVE_LAW") && !positiveLawEvidenceIds.length)
    reasons.push("missing_positive_law_evidence");
  if (requiredLabels.includes("FIQH") && !fiqhEvidenceIds.length)
    reasons.push("missing_fiqh_evidence");
  if (requiredLabels.includes("SHARIA") && !shariaEvidenceIds.length)
    reasons.push("missing_sharia_evidence");
  return {
    positiveLawEvidenceIds,
    fiqhEvidenceIds,
    shariaEvidenceIds,
    mixedAnswerAllowed: reasons.length === 0,
    requiredLabels,
    reasons,
  };
}

export type ConflictSynthesisPacket = {
  conflictFactKeys: string[];
  conflictAssertionIds: string[];
  mustSurfaceConflict: boolean;
  cleanConclusionAllowed: boolean;
  reasons: string[];
};

export function buildConflictSynthesisPacket(
  assertions: EvidenceAssertion[]
): ConflictSynthesisPacket {
  const conflicts = detectEvidenceConflicts(assertions);
  return {
    conflictFactKeys: conflicts.map(conflict => conflict.factKey),
    conflictAssertionIds: conflicts.flatMap(conflict => conflict.assertionIds),
    mustSurfaceConflict: conflicts.length > 0,
    cleanConclusionAllowed: conflicts.length === 0,
    reasons: conflicts.length
      ? ["verified_evidence_conflict_must_be_surfaced"]
      : [],
  };
}
