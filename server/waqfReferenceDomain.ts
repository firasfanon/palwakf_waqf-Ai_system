import type { LegalRegime, LegalTerritory } from "./legalReferenceModel";

export type WaqfType =
  | "CHARITABLE"
  | "FAMILY"
  | "MIXED"
  | "SAHIH"
  | "IRSADI_ALLOCATION"
  | "MOSQUE"
  | "CEMETERY"
  | "INSTITUTION"
  | "UNRESOLVED";

export type LandClass =
  | "MULK"
  | "MIRI"
  | "WAQF"
  | "METRUK"
  | "MEVAT"
  | "MUSHA"
  | "UNRESOLVED";

export type PropertyRightType =
  | "RAQABA"
  | "USUFRUCT"
  | "LEASE"
  | "HUKR"
  | "IJARATAYN"
  | "EASEMENT"
  | "WATER"
  | "BUILDING"
  | "PLANTING"
  | "MORTGAGE"
  | "OTHER";

export type WaqfCondition = {
  conditionId: string;
  deedId: string;
  conditionType:
    | "BENEFICIARY"
    | "SUCCESSION"
    | "NAZIR"
    | "LEASE"
    | "ISTIBDAL"
    | "MAINTENANCE"
    | "PURPOSE"
    | "REMAINDER"
    | "OTHER";
  text: string;
  locator: string;
  preservedArtifactVersionId: string;
  confidence: number;
  verified: boolean;
};

export type WaqfDeed = {
  deedId: string;
  title: string;
  deedDate: string | null;
  courtOrAuthority: string | null;
  waqifEntityIds: string[];
  assetIds: string[];
  beneficiaryIds: string[];
  nazirEntityIds: string[];
  witnessEntityIds: string[];
  waqfType: WaqfType;
  conditionIds: string[];
  relatedDeedIds: string[];
  preservedArtifactVersionId: string;
  transcriptionReferenceId: string | null;
  registrationStatus: "REGISTERED" | "UNREGISTERED" | "PARTIAL" | "UNRESOLVED";
  settlementStatus: "SETTLED" | "UNSETTLED" | "PARTIAL" | "UNRESOLVED";
};

export type WaqfAsset = {
  assetId: string;
  canonicalName: string;
  assetKind: "IMMOVABLE" | "MOVABLE" | "FINANCIAL_RIGHT" | "OTHER";
  waqfType: WaqfType;
  landClass: LandClass;
  historicalPlaceNames: string[];
  currentParcelRefs: string[];
  preservedEvidenceVersionIds: string[];
};

export type WaqfAssetRight = {
  rightId: string;
  assetId: string;
  rightType: PropertyRightType;
  holderEntityId: string | null;
  validFrom: string | null;
  validTo: string | null;
  evidenceVersionIds: string[];
  confidence: number;
  verified: boolean;
};

export type TitleChainEvent = {
  eventId: string;
  assetId: string;
  eventType:
    | "WAQF_DEED"
    | "SHARIA_RECORD"
    | "TAPU_RECORD"
    | "SURVEY"
    | "SETTLEMENT_CLAIM"
    | "SETTLEMENT_RIGHTS"
    | "TITLE_REGISTRATION"
    | "TRANSACTION"
    | "JUDGMENT"
    | "EXPROPRIATION"
    | "OTHER";
  occurredAt: string | null;
  sequenceHint: number | null;
  evidenceVersionIds: string[];
  factSummary: string;
  confidence: number;
  verified: boolean;
};

export type BeneficiaryNode = {
  beneficiaryId: string;
  personOrBranchEntityId: string;
  parentBeneficiaryId: string | null;
  generation: number | null;
  shareExpression: string | null;
  eligibilityConditionId: string | null;
  excluded: boolean;
  extinctionStatus: "ACTIVE" | "EXTINCT" | "UNRESOLVED";
  evidenceVersionIds: string[];
};

export type JurisdictionIssue =
  | "WAQF_CREATION"
  | "WAQF_VALIDITY"
  | "WAQF_PROOF"
  | "PROPERTY_OWNERSHIP"
  | "LAND_REGISTRATION"
  | "SETTLEMENT"
  | "BENEFICIARY_ENTITLEMENT"
  | "NAZIR_APPOINTMENT"
  | "LEASE"
  | "HUKR"
  | "ISTIBDAL"
  | "EXPROPRIATION"
  | "OTHER";

export type JurisdictionRule = {
  ruleId: string;
  issue: JurisdictionIssue;
  territory: LegalTerritory;
  regime: LegalRegime;
  validFrom: string | null;
  validTo: string | null;
  authorityClass: string;
  competentAuthority: string;
  proceduralLawLegalId: string | null;
  evidenceRefs: string[];
  verified: boolean;
};

export type EvidenceAssertion = {
  assertionId: string;
  factKey: string;
  normalizedValue: string;
  sourceKind:
    | "WAQF_DEED"
    | "LAND_REGISTER"
    | "TAPU"
    | "SETTLEMENT"
    | "JUDGMENT"
    | "MAP"
    | "ARCHIVE"
    | "SCHOLARLY";
  sourceVersionId: string;
  observedAt: string | null;
  authorityRank: number;
  verified: boolean;
};

function parseDate(value: string | null): number | null {
  if (!value) return null;
  const n = Date.parse(value);
  return Number.isFinite(n) ? n : null;
}

function dateInRange(
  date: string,
  from: string | null,
  to: string | null
): boolean {
  const target = parseDate(date);
  if (target === null) return false;
  const start = parseDate(from);
  const end = parseDate(to);
  return (start === null || target >= start) && (end === null || target <= end);
}

export function validateWaqfDeed(deed: WaqfDeed): string[] {
  const errors: string[] = [];
  if (!deed.deedId.trim()) errors.push("deed_id_required");
  if (!deed.title.trim()) errors.push("deed_title_required");
  if (!deed.preservedArtifactVersionId.trim())
    errors.push("preserved_artifact_required");
  if (!deed.waqifEntityIds.length)
    errors.push("waqif_required_or_unresolved_placeholder");
  if (!deed.assetIds.length) errors.push("endowed_asset_required");
  return errors;
}

export function validateWaqfCondition(condition: WaqfCondition): string[] {
  const errors: string[] = [];
  if (!condition.text.trim()) errors.push("condition_text_required");
  if (!condition.locator.trim()) errors.push("condition_locator_required");
  if (!condition.preservedArtifactVersionId.trim())
    errors.push("condition_artifact_required");
  if (condition.confidence < 0 || condition.confidence > 1)
    errors.push("condition_confidence_out_of_range");
  return errors;
}

export function buildTitleChain(events: TitleChainEvent[]): {
  events: TitleChainEvent[];
  unresolvedDateEvents: string[];
  lowConfidenceEvents: string[];
} {
  const sorted = [...events].sort((a, b) => {
    const ad = parseDate(a.occurredAt);
    const bd = parseDate(b.occurredAt);
    if (ad !== null && bd !== null && ad !== bd) return ad - bd;
    if (ad !== null && bd === null) return -1;
    if (ad === null && bd !== null) return 1;
    return (
      (a.sequenceHint ?? Number.MAX_SAFE_INTEGER) -
      (b.sequenceHint ?? Number.MAX_SAFE_INTEGER)
    );
  });
  return {
    events: sorted,
    unresolvedDateEvents: sorted
      .filter(event => parseDate(event.occurredAt) === null)
      .map(event => event.eventId),
    lowConfidenceEvents: sorted
      .filter(event => !event.verified || event.confidence < 0.8)
      .map(event => event.eventId),
  };
}

export function resolveJurisdiction(input: {
  issue: JurisdictionIssue;
  territory: LegalTerritory;
  regime: LegalRegime;
  onDate: string;
  rules: JurisdictionRule[];
}): {
  state: "resolved" | "unresolved" | "conflict";
  rule: JurisdictionRule | null;
  candidateRuleIds: string[];
  reason: string;
} {
  const candidates = input.rules.filter(
    rule =>
      rule.verified &&
      rule.issue === input.issue &&
      rule.territory === input.territory &&
      rule.regime === input.regime &&
      dateInRange(input.onDate, rule.validFrom, rule.validTo) &&
      rule.evidenceRefs.length > 0
  );
  if (!candidates.length) {
    return {
      state: "unresolved",
      rule: null,
      candidateRuleIds: [],
      reason: "no_verified_jurisdiction_rule",
    };
  }
  const distinct = new Set(
    candidates.map(
      rule => `${rule.competentAuthority}|${rule.proceduralLawLegalId || ""}`
    )
  );
  if (distinct.size > 1) {
    return {
      state: "conflict",
      rule: null,
      candidateRuleIds: candidates.map(rule => rule.ruleId),
      reason: "conflicting_verified_jurisdiction_rules",
    };
  }
  return {
    state: "resolved",
    rule: candidates[0],
    candidateRuleIds: candidates.map(rule => rule.ruleId),
    reason: "single_verified_jurisdiction_outcome",
  };
}

export function detectEvidenceConflicts(
  assertions: EvidenceAssertion[]
): Array<{
  factKey: string;
  assertionIds: string[];
  values: string[];
  state: "conflict";
}> {
  const byFact = new Map<string, EvidenceAssertion[]>();
  for (const assertion of assertions) {
    if (!assertion.verified) continue;
    const current = byFact.get(assertion.factKey) || [];
    current.push(assertion);
    byFact.set(assertion.factKey, current);
  }
  const conflicts: Array<{
    factKey: string;
    assertionIds: string[];
    values: string[];
    state: "conflict";
  }> = [];
  for (const [factKey, rows] of byFact) {
    const values = [
      ...new Set(
        rows
          .map(row => row.normalizedValue.trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
    if (values.length <= 1) continue;
    conflicts.push({
      factKey,
      assertionIds: rows.map(row => row.assertionId),
      values,
      state: "conflict",
    });
  }
  return conflicts;
}

export function validateBeneficiaryGraph(nodes: BeneficiaryNode[]): string[] {
  const errors: string[] = [];
  const ids = new Set(nodes.map(node => node.beneficiaryId));
  for (const node of nodes) {
    if (node.parentBeneficiaryId && !ids.has(node.parentBeneficiaryId)) {
      errors.push(`missing_parent:${node.beneficiaryId}`);
    }
    if (!node.evidenceVersionIds.length)
      errors.push(`missing_evidence:${node.beneficiaryId}`);
  }
  return errors;
}
