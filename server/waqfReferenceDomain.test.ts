import { describe, expect, it } from "vitest";
import {
  buildTitleChain,
  detectEvidenceConflicts,
  resolveJurisdiction,
  validateBeneficiaryGraph,
  validateWaqfCondition,
  validateWaqfDeed,
} from "./waqfReferenceDomain";

describe("waqf reference domain", () => {
  it("requires a preserved artifact and endowed asset for a waqf deed", () => {
    const errors = validateWaqfDeed({
      deedId: "deed-1",
      title: "حجة وقف",
      deedDate: null,
      courtOrAuthority: null,
      waqifEntityIds: [],
      assetIds: [],
      beneficiaryIds: [],
      nazirEntityIds: [],
      witnessEntityIds: [],
      waqfType: "UNRESOLVED",
      conditionIds: [],
      relatedDeedIds: [],
      preservedArtifactVersionId: "",
      transcriptionReferenceId: null,
      registrationStatus: "UNRESOLVED",
      settlementStatus: "UNRESOLVED",
    });
    expect(errors).toContain("preserved_artifact_required");
    expect(errors).toContain("endowed_asset_required");
  });

  it("requires exact locator/provenance for a waqf condition", () => {
    const errors = validateWaqfCondition({
      conditionId: "condition-1",
      deedId: "deed-1",
      conditionType: "LEASE",
      text: "لا يؤجر أكثر من مدة معينة",
      locator: "",
      preservedArtifactVersionId: "version-1",
      confidence: 0.9,
      verified: false,
    });
    expect(errors).toContain("condition_locator_required");
  });

  it("orders a title chain and exposes unresolved/low-confidence events", () => {
    const chain = buildTitleChain([
      {
        eventId: "later",
        assetId: "a",
        eventType: "TITLE_REGISTRATION",
        occurredAt: "1955-01-01",
        sequenceHint: null,
        evidenceVersionIds: ["v2"],
        factSummary: "registered",
        confidence: 1,
        verified: true,
      },
      {
        eventId: "undated",
        assetId: "a",
        eventType: "TAPU_RECORD",
        occurredAt: null,
        sequenceHint: 2,
        evidenceVersionIds: ["v3"],
        factSummary: "undated record",
        confidence: 0.6,
        verified: false,
      },
      {
        eventId: "deed",
        assetId: "a",
        eventType: "WAQF_DEED",
        occurredAt: "1890-01-01",
        sequenceHint: null,
        evidenceVersionIds: ["v1"],
        factSummary: "waqf established",
        confidence: 1,
        verified: true,
      },
    ]);
    expect(chain.events.map(event => event.eventId)).toEqual([
      "deed",
      "later",
      "undated",
    ]);
    expect(chain.unresolvedDateEvents).toEqual(["undated"]);
    expect(chain.lowConfidenceEvents).toEqual(["undated"]);
  });

  it("fails closed on jurisdiction until an externally verified rule exists", () => {
    const input = {
      issue: "LAND_REGISTRATION" as const,
      territory: "WEST_BANK" as const,
      regime: "JORDANIAN_WEST_BANK" as const,
      onDate: "1960-01-01",
    };
    expect(resolveJurisdiction({ ...input, rules: [] }).state).toBe(
      "unresolved"
    );
    const resolved = resolveJurisdiction({
      ...input,
      rules: [
        {
          ruleId: "rule-1",
          issue: "LAND_REGISTRATION",
          territory: "WEST_BANK",
          regime: "JORDANIAN_WEST_BANK",
          validFrom: "1952-01-01",
          validTo: null,
          authorityClass: "official_primary",
          competentAuthority: "verified-authority",
          proceduralLawLegalId: "waqf:legal:ps:law:1952:40:x",
          evidenceRefs: ["e1"],
          verified: true,
        },
      ],
    });
    expect(resolved.state).toBe("resolved");
    expect(resolved.rule?.competentAuthority).toBe("verified-authority");
  });

  it("surfaces contradictory evidence instead of silently choosing a winner", () => {
    const conflicts = detectEvidenceConflicts([
      {
        assertionId: "d1",
        factKey: "asset:a:waqf_status",
        normalizedValue: "waqf",
        sourceKind: "WAQF_DEED",
        sourceVersionId: "v1",
        observedAt: "1900-01-01",
        authorityRank: 1,
        verified: true,
      },
      {
        assertionId: "t1",
        factKey: "asset:a:waqf_status",
        normalizedValue: "private",
        sourceKind: "LAND_REGISTER",
        sourceVersionId: "v2",
        observedAt: "1950-01-01",
        authorityRank: 1,
        verified: true,
      },
    ]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].values).toEqual(["waqf", "private"]);
  });

  it("does not accept beneficiary graph nodes with missing parents or evidence", () => {
    expect(
      validateBeneficiaryGraph([
        {
          beneficiaryId: "child",
          personOrBranchEntityId: "e1",
          parentBeneficiaryId: "missing",
          generation: 1,
          shareExpression: null,
          eligibilityConditionId: null,
          excluded: false,
          extinctionStatus: "UNRESOLVED",
          evidenceVersionIds: [],
        },
      ])
    ).toEqual(["missing_parent:child", "missing_evidence:child"]);
  });
});
