import { describe, expect, it } from "vitest";
import {
  buildMegaDAssetTitlePacket,
  buildMegaDConclusionGate,
  buildMegaDDeedPacket,
  buildMegaDJurisdictionPacket,
  buildMegaDStructuredRetrievalDocument,
} from "./referenceMegaD";
import { hybridReferenceSearch } from "./referenceRetrieval";
import { routeReferenceIssue } from "./referenceIssueRouter";
import {
  auditReferenceGradeCitations,
  buildReferenceGradeCitation,
} from "./referenceCitationEngine";

const hash = "a".repeat(64);

function validDeedPacket() {
  return buildMegaDDeedPacket({
    deed: {
      deedId: "deed-haseki-fixture",
      title: "حجة وقف تجريبية مضبوطة",
      deedDate: "1552-01-01",
      courtOrAuthority: "fixture-sharia-court",
      waqifEntityIds: ["waqif-1"],
      assetIds: ["asset-bethlehem-1"],
      beneficiaryIds: ["beneficiary-1"],
      nazirEntityIds: ["nazir-1"],
      witnessEntityIds: [],
      waqfType: "CHARITABLE",
      conditionIds: ["condition-1"],
      relatedDeedIds: [],
      preservedArtifactVersionId: "private-deed-version-1",
      transcriptionReferenceId: "transcription-private-1",
      registrationStatus: "UNRESOLVED",
      settlementStatus: "UNRESOLVED",
    },
    transcription: {
      transcriptionId: "transcription-private-1",
      artifactVersionId: "private-deed-version-1",
      pages: [],
      fullText: "وقف عقار معلوم الحدود",
      meanConfidence: 1,
      minimumConfidence: 1,
      requiresHumanReview: false,
      uncertainSegmentCount: 0,
    },
    conditions: [
      {
        conditionId: "condition-1",
        deedId: "deed-haseki-fixture",
        conditionType: "PURPOSE",
        text: "يصرف الريع في جهة البر",
        locator: "page-1:line-10",
        preservedArtifactVersionId: "private-deed-version-1",
        confidence: 1,
        verified: true,
      },
    ],
  });
}

function validAssetPacket() {
  return buildMegaDAssetTitlePacket({
    asset: {
      assetId: "asset-bethlehem-1",
      canonicalName: "أصل وقفي تجريبي",
      assetKind: "IMMOVABLE",
      waqfType: "CHARITABLE",
      landClass: "UNRESOLVED",
      historicalPlaceNames: ["بيت لحم"],
      currentParcelRefs: ["28038/1"],
      preservedEvidenceVersionIds: ["private-deed-version-1"],
    },
    rights: [
      {
        rightId: "right-1",
        assetId: "asset-bethlehem-1",
        rightType: "USUFRUCT",
        holderEntityId: "beneficiary-1",
        validFrom: "1552-01-01",
        validTo: null,
        evidenceVersionIds: ["private-deed-version-1"],
        confidence: 1,
        verified: true,
      },
    ],
    titleEvents: [
      {
        eventId: "event-1",
        assetId: "asset-bethlehem-1",
        eventType: "WAQF_DEED",
        occurredAt: "1552-01-01",
        sequenceHint: 1,
        evidenceVersionIds: ["private-deed-version-1"],
        factSummary: "waqf deed event",
        confidence: 1,
        verified: true,
      },
    ],
    parcelCandidates: [
      {
        parcelRef: "28038/1",
        candidateName: "بيت لحم",
        evidence: [
          {
            evidenceId: "title-1",
            type: "TITLE_RECORD",
            value: "28038/1",
            sourceArtifactVersionId: "title-version-1",
            verified: true,
            weight: 1,
          },
          {
            evidenceId: "survey-1",
            type: "SURVEY_MAP",
            value: "28038/1",
            sourceArtifactVersionId: "survey-version-1",
            verified: true,
            weight: 1,
          },
        ],
      },
    ],
  });
}

function validJurisdictionPacket() {
  return buildMegaDJurisdictionPacket({
    issue: "LAND_REGISTRATION",
    territory: "WEST_BANK",
    regime: "PALESTINIAN",
    onDate: "2026-09-22",
    rules: [
      {
        ruleId: "rule-wb-registration",
        issue: "LAND_REGISTRATION",
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        validFrom: "1994-01-01",
        validTo: null,
        authorityClass: "official_primary",
        competentAuthority: "Palestinian Land Authority",
        proceduralLawLegalId: "law-fixture",
        evidenceRefs: ["legal-status-evidence-1"],
        verified: true,
      },
    ],
    legalStatusGate: {
      verified: true,
      evidenceRefs: ["legal-status-evidence-1"],
    },
  });
}

describe("WAQF_AI MEGA_D integrated deed/asset/title/jurisdiction flow", () => {
  it("passes a fully traceable deed packet", () => {
    const packet = validDeedPacket();
    expect(packet.state).toBe("PASS");
    expect(packet.acceptedConditionIds).toEqual(["condition-1"]);
    expect(packet.conclusionEligible).toBe(true);
  });

  it("fails closed on transcription or condition provenance mismatch", () => {
    const packet = buildMegaDDeedPacket({
      deed: { ...validDeedPacket().deed, transcriptionReferenceId: "wrong" },
      transcription: {
        transcriptionId: "actual",
        artifactVersionId: "other-artifact",
        pages: [],
        fullText: "",
        meanConfidence: 0.5,
        minimumConfidence: 0.5,
        requiresHumanReview: true,
        uncertainSegmentCount: 1,
      },
      conditions: [],
    });
    expect(packet.state).toBe("FAIL_CLOSED");
    expect(packet.errors).toContain("transcription_artifact_mismatch");
    expect(packet.errors).toContain("transcription_reference_mismatch");
    expect(packet.errors).toContain("transcription_human_review_required");
    expect(packet.errors).toContain("missing_condition:condition-1");
  });

  it("keeps document identity, asset identity and ownership inference separate", () => {
    const packet = validAssetPacket();
    expect(packet.state).toBe("PASS");
    expect(packet.assetId).toBe("asset-bethlehem-1");
    expect(packet.ownershipInferenceAllowed).toBe(false);
    expect(packet.crosswalks[0].ownershipInferenceAllowed).toBe(false);
  });
  it("surfaces title-chain gaps rather than smoothing them", () => {
    const packet = buildMegaDAssetTitlePacket({
      asset: {
        assetId: "a",
        canonicalName: "fixture",
        assetKind: "IMMOVABLE",
        waqfType: "UNRESOLVED",
        landClass: "UNRESOLVED",
        historicalPlaceNames: [],
        currentParcelRefs: [],
        preservedEvidenceVersionIds: ["v1"],
      },
      rights: [],
      titleEvents: [
        {
          eventId: "gap",
          assetId: "a",
          eventType: "TAPU_RECORD",
          occurredAt: null,
          sequenceHint: 1,
          evidenceVersionIds: [],
          factSummary: "undated low confidence",
          confidence: 0.4,
          verified: false,
        },
      ],
      parcelCandidates: [],
    });
    expect(packet.state).toBe("FAIL_CLOSED");
    expect(packet.unresolvedDateEventIds).toEqual(["gap"]);
    expect(packet.lowConfidenceEventIds).toEqual(["gap"]);
    expect(packet.errors).toContain("asset_right_required");
    expect(packet.errors).toContain("title_event_evidence_required:gap");
  });

  it("requires parcel corroboration from independent preserved source versions", () => {
    const packet = buildMegaDAssetTitlePacket({
      asset: {
        assetId: "a",
        canonicalName: "fixture",
        assetKind: "IMMOVABLE",
        waqfType: "CHARITABLE",
        landClass: "UNRESOLVED",
        historicalPlaceNames: ["بيت لحم"],
        currentParcelRefs: ["28038/1"],
        preservedEvidenceVersionIds: ["deed-v1"],
      },
      rights: [
        {
          rightId: "right-1",
          assetId: "a",
          rightType: "USUFRUCT",
          holderEntityId: null,
          validFrom: null,
          validTo: null,
          evidenceVersionIds: ["deed-v1"],
          confidence: 1,
          verified: true,
        },
      ],
      titleEvents: [
        {
          eventId: "event-1",
          assetId: "a",
          eventType: "WAQF_DEED",
          occurredAt: "1900-01-01",
          sequenceHint: 1,
          evidenceVersionIds: ["deed-v1"],
          factSummary: "fixture",
          confidence: 1,
          verified: true,
        },
      ],
      parcelCandidates: [
        {
          parcelRef: "28038/1",
          candidateName: "بيت لحم",
          evidence: [
            {
              evidenceId: "title-1",
              type: "TITLE_RECORD",
              value: "28038/1",
              sourceArtifactVersionId: "same-source-v1",
              verified: true,
              weight: 1,
            },
            {
              evidenceId: "survey-1",
              type: "SURVEY_MAP",
              value: "28038/1",
              sourceArtifactVersionId: "same-source-v1",
              verified: true,
              weight: 1,
            },
          ],
        },
      ],
    });
    expect(packet.state).toBe("FAIL_CLOSED");
    expect(packet.errors).toContain(
      "parcel_crosswalk_single_source_version:28038/1"
    );
  });

  it("fails closed on territory-specific legal-status debt", () => {
    const packet = buildMegaDJurisdictionPacket({
      issue: "LAND_REGISTRATION",
      territory: "GAZA",
      regime: "PALESTINIAN",
      onDate: "2026-09-22",
      rules: [],
      legalStatusGate: { verified: false, evidenceRefs: [], deferred: true },
    });
    expect(packet.state).toBe("FAIL_CLOSED");
    expect(packet.reasons).toContain("territory_legal_status_deferred");
    expect(packet.reasons).toContain("legal_status_not_verified");
  });

  it("propagates evidence conflicts into conclusion eligibility", () => {
    const gate = buildMegaDConclusionGate({
      deed: validDeedPacket(),
      assetTitle: validAssetPacket(),
      jurisdiction: validJurisdictionPacket(),
      assertions: [
        {
          assertionId: "a1",
          factKey: "asset:1:status",
          normalizedValue: "waqf",
          sourceKind: "WAQF_DEED",
          sourceVersionId: "v1",
          observedAt: null,
          authorityRank: 1,
          verified: true,
        },
        {
          assertionId: "a2",
          factKey: "asset:1:status",
          normalizedValue: "private",
          sourceKind: "LAND_REGISTER",
          sourceVersionId: "v2",
          observedAt: null,
          authorityRank: 1,
          verified: true,
        },
      ],
    });
    expect(gate.state).toBe("FAIL_CLOSED");
    expect(gate.conflictFactKeys).toEqual(["asset:1:status"]);
    expect(gate.reasons).toContain("evidence_conflict");
  });
  it("integrates structured MEGA_D evidence into governed RAG eligibility", () => {
    const deed = validDeedPacket();
    const asset = validAssetPacket();
    const jurisdiction = validJurisdictionPacket();
    const gate = buildMegaDConclusionGate({
      deed,
      assetTitle: asset,
      jurisdiction,
      assertions: [],
    });
    const document = buildMegaDStructuredRetrievalDocument({
      deed,
      assetTitle: asset,
      jurisdiction,
      conclusionGate: gate,
      source: {
        domain: "registration_settlement",
        era: "CONTEMPORARY",
        territories: ["WEST_BANK"],
        authorityClass: "official_primary",
        sourceUrl: "https://official.example/mega-d",
        publisher: "Private governed pilot",
        artifactVersionId: "private-deed-version-1",
        artifactSha256: hash,
        locator: "page-1:line-10",
      },
    });
    const route = routeReferenceIssue("ما وضع تسجيل أصل وقفي في الضفة؟");
    const hits = hybridReferenceSearch({
      query: "تسجيل أصل وقفي الضفة",
      route,
      documents: [document],
    });
    expect(gate.conclusionEligible).toBe(true);
    expect(document.conflictFlag).toBe(false);
    expect(document.legalStatusVerified).toBe(true);
    expect(hits[0]?.usableForConclusion).toBe(true);
  });
  it("produces auditable reference-grade citations for structured evidence", () => {
    const citation = buildReferenceGradeCitation({
      claimId: "claim-mega-d-1",
      sourceUrl: "https://official.example/mega-d",
      sourceTitle: "حجة وقف تجريبية مضبوطة",
      artifactVersionId: "private-deed-version-1",
      artifactSha256: hash,
      locator: { type: "page", value: "1" },
      excerpt: "وقف عقار معلوم الحدود",
      alignmentVerified: true,
      legalStatusEvidenceRefs: ["legal-status-evidence-1"],
    });
    expect(auditReferenceGradeCitations([citation])).toEqual({
      valid: true,
      defects: [],
    });
  });

  it("does not unlock conclusion eligibility when any integrated gate is closed", () => {
    const jurisdiction = validJurisdictionPacket();
    const closedAsset = {
      ...validAssetPacket(),
      state: "FAIL_CLOSED" as const,
      conclusionEligible: false,
      errors: ["parcel_crosswalk_unresolved:28038/1"],
    };
    const gate = buildMegaDConclusionGate({
      deed: validDeedPacket(),
      assetTitle: closedAsset,
      jurisdiction,
      assertions: [],
    });
    expect(gate.state).toBe("FAIL_CLOSED");
    expect(gate.reasons).toContain("asset_title_gate_closed");

    const document = buildMegaDStructuredRetrievalDocument({
      deed: validDeedPacket(),
      assetTitle: closedAsset,
      jurisdiction,
      conclusionGate: gate,
      source: {
        domain: "registration_settlement",
        era: "CONTEMPORARY",
        territories: ["WEST_BANK"],
        authorityClass: "official_primary",
        sourceUrl: "https://official.example/mega-d-closed",
        publisher: "Private governed pilot",
        artifactVersionId: "private-deed-version-1",
        artifactSha256: hash,
        locator: "page-1:line-10",
      },
    });
    const route = routeReferenceIssue("ما وضع تسجيل أصل وقفي في الضفة؟");
    const hits = hybridReferenceSearch({
      query: "تسجيل أصل وقفي الضفة",
      route,
      documents: [document],
    });
    expect(document.structuredConclusionEligible).toBe(false);
    expect(hits).toHaveLength(1);
    expect(hits[0].usableForConclusion).toBe(false);
    expect(hits[0].reasons).toContain("structured_conclusion_gate_closed");
  });
});
