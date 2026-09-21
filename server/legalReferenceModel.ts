import { createHash } from "node:crypto";

export type LegalInstrumentType =
  | "law"
  | "regulation"
  | "decree"
  | "order"
  | "decision"
  | "instruction"
  | "circular"
  | "code"
  | "other";

export type LegalTerritory =
  | "WEST_BANK"
  | "GAZA"
  | "JERUSALEM"
  | "HISTORIC_PALESTINE"
  | "OTTOMAN_PALESTINE"
  | "UNKNOWN";

export type LegalRegime =
  | "OTTOMAN"
  | "BRITISH_MANDATE"
  | "JORDANIAN_WEST_BANK"
  | "EGYPTIAN_GAZA"
  | "ISRAELI_OCCUPATION"
  | "PALESTINIAN"
  | "MIXED"
  | "UNKNOWN";

export type LegalStatus =
  | "IN_FORCE"
  | "PARTIALLY_IN_FORCE"
  | "AMENDED"
  | "REPEALED"
  | "SUPERSEDED"
  | "HISTORICAL"
  | "DISPUTED"
  | "UNRESOLVED";

export type LegalRelationType =
  | "AMENDS"
  | "AMENDED_BY"
  | "REPEALS"
  | "REPEALED_BY"
  | "IMPLEMENTS"
  | "IMPLEMENTED_BY"
  | "REFERENCES"
  | "SUPERSEDES"
  | "SUPERSEDED_BY";

export type TerritoryStatus = {
  territory: LegalTerritory;
  regime: LegalRegime;
  status: LegalStatus;
  validFrom: string | null;
  validTo: string | null;
  evidenceRefs: string[];
  lastVerifiedAt: string | null;
};

export type LegalInstrument = {
  legalId: string;
  title: string;
  instrumentType: LegalInstrumentType;
  jurisdictionCode: string;
  number: string | null;
  year: number | null;
  enactmentDate: string | null;
  publicationDate: string | null;
  territoryStatuses: TerritoryStatus[];
  preservedArtifactVersionIds: string[];
};

export type StatusEvidence = {
  evidenceId: string;
  territory: LegalTerritory;
  assertedStatus: LegalStatus;
  validFrom?: string | null;
  validTo?: string | null;
  authority:
    | "official_gazette"
    | "issuing_authority"
    | "official_consolidation"
    | "judgment"
    | "trusted_legal_registry"
    | "scholarly_secondary";
  verified: boolean;
};

function slug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function buildWaqfLegalIdentifier(input: {
  jurisdictionCode: string;
  instrumentType: LegalInstrumentType;
  year?: number | null;
  number?: string | null;
  title?: string | null;
}): string {
  const jurisdiction = slug(input.jurisdictionCode || "unknown");
  const number = input.number ? slug(input.number) : "unnumbered";
  const year = input.year ? String(input.year) : "undated";
  const titleHash = createHash("sha256")
    .update(String(input.title || ""))
    .digest("hex")
    .slice(0, 10);
  return `waqf:legal:${jurisdiction}:${input.instrumentType}:${year}:${number}:${titleHash}`;
}

function parseDate(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function dateWithin(
  onDate: string,
  validFrom: string | null,
  validTo: string | null
): boolean | null {
  const at = parseDate(onDate);
  if (at === null) return null;
  const from = parseDate(validFrom);
  const to = parseDate(validTo);
  if (from !== null && at < from) return false;
  if (to !== null && at > to) return false;
  return true;
}

export function evaluateLegalApplicability(input: {
  instrument: LegalInstrument;
  territory: LegalTerritory;
  onDate: string;
}): {
  state:
    | "applicable"
    | "applicable_with_caveat"
    | "not_applicable"
    | "unresolved";
  status: LegalStatus;
  reasons: string[];
  evidenceRefs: string[];
} {
  const candidates = input.instrument.territoryStatuses.filter(
    entry => entry.territory === input.territory
  );
  if (!candidates.length) {
    return {
      state: "unresolved",
      status: "UNRESOLVED",
      reasons: ["no_verified_territory_status"],
      evidenceRefs: [],
    };
  }

  const active = candidates.filter(
    entry => dateWithin(input.onDate, entry.validFrom, entry.validTo) === true
  );
  if (!active.length) {
    const dateUnknown = candidates.some(
      entry => dateWithin(input.onDate, entry.validFrom, entry.validTo) === null
    );
    return {
      state: dateUnknown ? "unresolved" : "not_applicable",
      status: dateUnknown ? "UNRESOLVED" : candidates[0].status,
      reasons: [
        dateUnknown
          ? "invalid_query_or_status_date"
          : "outside_validity_interval",
      ],
      evidenceRefs: candidates.flatMap(entry => entry.evidenceRefs),
    };
  }

  const statuses = new Set(active.map(entry => entry.status));
  const evidenceRefs = [
    ...new Set(active.flatMap(entry => entry.evidenceRefs)),
  ];
  if (active.some(entry => entry.evidenceRefs.length === 0)) {
    return {
      state: "unresolved",
      status: "UNRESOLVED",
      reasons: ["status_without_evidence"],
      evidenceRefs,
    };
  }
  if (statuses.has("DISPUTED") || statuses.size > 1) {
    return {
      state: "unresolved",
      status: "DISPUTED",
      reasons: ["conflicting_territory_status"],
      evidenceRefs,
    };
  }

  const status = active[0].status;
  if (status === "IN_FORCE") {
    return {
      state: "applicable",
      status,
      reasons: ["verified_in_force"],
      evidenceRefs,
    };
  }
  if (["PARTIALLY_IN_FORCE", "AMENDED"].includes(status)) {
    return {
      state: "applicable_with_caveat",
      status,
      reasons: ["requires_consolidated_text_or_amendment_chain"],
      evidenceRefs,
    };
  }
  if (status === "HISTORICAL") {
    return {
      state: "applicable",
      status,
      reasons: ["historical_law_applicable_for_requested_date"],
      evidenceRefs,
    };
  }
  if (["REPEALED", "SUPERSEDED"].includes(status)) {
    return {
      state: "not_applicable",
      status,
      reasons: ["repealed_or_superseded_for_interval"],
      evidenceRefs,
    };
  }
  return {
    state: "unresolved",
    status,
    reasons: ["legal_status_unresolved"],
    evidenceRefs,
  };
}

export function resolveTerritorialStatusFromEvidence(input: {
  territory: LegalTerritory;
  evidence: StatusEvidence[];
}): {
  status: LegalStatus;
  verified: boolean;
  evidenceRefs: string[];
  reason: string;
} {
  const relevant = input.evidence.filter(
    entry => entry.territory === input.territory && entry.verified
  );
  if (!relevant.length) {
    return {
      status: "UNRESOLVED",
      verified: false,
      evidenceRefs: [],
      reason: "no_verified_evidence",
    };
  }

  const primary = relevant.filter(entry =>
    [
      "official_gazette",
      "issuing_authority",
      "official_consolidation",
    ].includes(entry.authority)
  );
  if (!primary.length) {
    return {
      status: "UNRESOLVED",
      verified: false,
      evidenceRefs: relevant.map(entry => entry.evidenceId),
      reason: "no_primary_legal_status_evidence",
    };
  }

  const primaryStatuses = new Set(primary.map(entry => entry.assertedStatus));
  if (primaryStatuses.size !== 1) {
    return {
      status: "DISPUTED",
      verified: false,
      evidenceRefs: primary.map(entry => entry.evidenceId),
      reason: "conflicting_primary_status_evidence",
    };
  }

  return {
    status: primary[0].assertedStatus,
    verified: true,
    evidenceRefs: primary.map(entry => entry.evidenceId),
    reason: "consistent_primary_status_evidence",
  };
}
