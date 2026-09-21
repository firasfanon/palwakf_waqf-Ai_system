import { describe, expect, it } from "vitest";
import {
  buildWaqfLegalIdentifier,
  evaluateLegalApplicability,
  resolveTerritorialStatusFromEvidence,
  type LegalInstrument,
} from "./legalReferenceModel";

function instrument(
  statuses: LegalInstrument["territoryStatuses"]
): LegalInstrument {
  return {
    legalId: "waqf:legal:ps:law:1952:40:test",
    title: "قانون اختبار",
    instrumentType: "law",
    jurisdictionCode: "ps",
    number: "40",
    year: 1952,
    enactmentDate: "1952-01-01",
    publicationDate: null,
    territoryStatuses: statuses,
    preservedArtifactVersionIds: ["version-1"],
  };
}

describe("legal reference model", () => {
  it("builds a stable legal identifier independent of URL", () => {
    expect(
      buildWaqfLegalIdentifier({
        jurisdictionCode: "PS",
        instrumentType: "law",
        year: 1952,
        number: "40",
        title: "قانون تسوية الأرض والمياه",
      })
    ).toMatch(/^waqf:legal:ps:law:1952:40:/);
  });

  it("applies verified West Bank law without leaking to Gaza", () => {
    const law = instrument([
      {
        territory: "WEST_BANK",
        regime: "JORDANIAN_WEST_BANK",
        status: "IN_FORCE",
        validFrom: "1952-01-01",
        validTo: null,
        evidenceRefs: ["gazette-1"],
        lastVerifiedAt: "2026-09-21",
      },
    ]);
    expect(
      evaluateLegalApplicability({
        instrument: law,
        territory: "WEST_BANK",
        onDate: "2026-09-21",
      }).state
    ).toBe("applicable");
    expect(
      evaluateLegalApplicability({
        instrument: law,
        territory: "GAZA",
        onDate: "2026-09-21",
      }).state
    ).toBe("unresolved");
  });

  it("treats amended law as applicable only with a consolidation caveat", () => {
    const law = instrument([
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "AMENDED",
        validFrom: "2000-01-01",
        validTo: null,
        evidenceRefs: ["gazette-2"],
        lastVerifiedAt: "2026-09-21",
      },
    ]);
    const result = evaluateLegalApplicability({
      instrument: law,
      territory: "WEST_BANK",
      onDate: "2026-09-21",
    });
    expect(result.state).toBe("applicable_with_caveat");
    expect(result.reasons).toContain(
      "requires_consolidated_text_or_amendment_chain"
    );
  });

  it("can apply historical law for a date inside its verified interval", () => {
    const law = instrument([
      {
        territory: "OTTOMAN_PALESTINE",
        regime: "OTTOMAN",
        status: "HISTORICAL",
        validFrom: "1858-01-01",
        validTo: "1917-12-31",
        evidenceRefs: ["official-historical-1"],
        lastVerifiedAt: "2026-09-21",
      },
    ]);
    expect(
      evaluateLegalApplicability({
        instrument: law,
        territory: "OTTOMAN_PALESTINE",
        onDate: "1900-01-01",
      }).state
    ).toBe("applicable");
  });

  it("fails closed when primary legal-status evidence conflicts or is absent", () => {
    const conflict = resolveTerritorialStatusFromEvidence({
      territory: "GAZA",
      evidence: [
        {
          evidenceId: "g1",
          territory: "GAZA",
          assertedStatus: "IN_FORCE",
          authority: "official_gazette",
          verified: true,
        },
        {
          evidenceId: "g2",
          territory: "GAZA",
          assertedStatus: "REPEALED",
          authority: "issuing_authority",
          verified: true,
        },
      ],
    });
    expect(conflict.status).toBe("DISPUTED");
    expect(conflict.verified).toBe(false);

    const secondaryOnly = resolveTerritorialStatusFromEvidence({
      territory: "GAZA",
      evidence: [
        {
          evidenceId: "s1",
          territory: "GAZA",
          assertedStatus: "IN_FORCE",
          authority: "scholarly_secondary",
          verified: true,
        },
      ],
    });
    expect(secondaryOnly.status).toBe("UNRESOLVED");
    expect(secondaryOnly.reason).toBe("no_primary_legal_status_evidence");
  });
});
