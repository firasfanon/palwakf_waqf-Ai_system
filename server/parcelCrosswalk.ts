export type ParcelIdentityEvidenceType =
  | "HISTORICAL_NAME"
  | "BOUNDARY_DESCRIPTION"
  | "BASIN_NUMBER"
  | "PARCEL_NUMBER"
  | "SURVEY_MAP"
  | "SETTLEMENT_RECORD"
  | "TITLE_RECORD"
  | "COORDINATE"
  | "OTHER";

export type ParcelIdentityEvidence = {
  evidenceId: string;
  type: ParcelIdentityEvidenceType;
  value: string;
  sourceArtifactVersionId: string;
  verified: boolean;
  weight: number;
};

export type ParcelCandidate = {
  parcelRef: string;
  candidateName: string | null;
  evidence: ParcelIdentityEvidence[];
};

export type ParcelCrosswalkDecision = {
  parcelRef: string;
  confidence: number;
  verifiedEvidenceIds: string[];
  unresolved: boolean;
  ownershipInferenceAllowed: false;
  reasons: string[];
};

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function evidenceScore(evidence: ParcelIdentityEvidence): number {
  if (!evidence.verified) return 0;
  const baseWeight = Math.max(0, Math.min(1, evidence.weight));
  const typeFactor: Record<ParcelIdentityEvidenceType, number> = {
    TITLE_RECORD: 1,
    SETTLEMENT_RECORD: 0.95,
    SURVEY_MAP: 0.9,
    BASIN_NUMBER: 0.85,
    PARCEL_NUMBER: 0.85,
    BOUNDARY_DESCRIPTION: 0.7,
    HISTORICAL_NAME: 0.55,
    COORDINATE: 0.55,
    OTHER: 0.4,
  };
  return baseWeight * typeFactor[evidence.type];
}

export function evaluateParcelCrosswalk(
  candidate: ParcelCandidate
): ParcelCrosswalkDecision {
  const verified = candidate.evidence.filter(item => item.verified);
  const reasons: string[] = [];
  if (!candidate.parcelRef.trim()) {
    return {
      parcelRef: candidate.parcelRef,
      confidence: 0,
      verifiedEvidenceIds: [],
      unresolved: true,
      ownershipInferenceAllowed: false,
      reasons: ["parcel_reference_missing"],
    };
  }
  if (!verified.length) {
    return {
      parcelRef: candidate.parcelRef,
      confidence: 0,
      verifiedEvidenceIds: [],
      unresolved: true,
      ownershipInferenceAllowed: false,
      reasons: ["no_verified_crosswalk_evidence"],
    };
  }

  const scores = verified.map(evidenceScore);
  const strongest = Math.max(...scores);
  const independentTypes = new Set(verified.map(item => item.type));
  const corroborationBonus = Math.min(
    0.15,
    Math.max(0, independentTypes.size - 1) * 0.05
  );
  const confidence = Math.min(1, strongest + corroborationBonus);

  if (
    !verified.some(item =>
      ["TITLE_RECORD", "SETTLEMENT_RECORD", "SURVEY_MAP"].includes(item.type)
    )
  ) {
    reasons.push("no_title_settlement_or_survey_anchor");
  }
  if (independentTypes.size < 2) reasons.push("single_evidence_family_only");
  if (confidence < 0.8)
    reasons.push("confidence_below_verified_crosswalk_threshold");

  return {
    parcelRef: candidate.parcelRef,
    confidence,
    verifiedEvidenceIds: verified.map(item => item.evidenceId),
    unresolved: reasons.length > 0,
    ownershipInferenceAllowed: false,
    reasons,
  };
}

export function matchHistoricalPlaceName(
  historicalName: string,
  modernCandidateNames: string[]
): Array<{ name: string; normalizedMatch: boolean }> {
  const source = normalize(historicalName);
  return modernCandidateNames.map(name => ({
    name,
    normalizedMatch: source.length > 0 && normalize(name) === source,
  }));
}
