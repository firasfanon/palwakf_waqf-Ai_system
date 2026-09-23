import { describe, expect, it } from "vitest";
import {
  buildGate06JurisdictionTerminalization,
  buildGate07ConflictRevalidation,
  buildGate10RetrievalCitationTerminalization,
  buildPilot006CaseLawSynthesis,
  buildPilot007EvidenceBoundedTitleChain,
  buildPilot008RightsAccessBenchmark,
  buildPostGDev002GateTerminalization,
  buildPostGDev002Summary,
  buildQa002RealEvidenceTerminalization,
  buildStaleTodoReconciliation,
  evaluateRightsAction,
  evaluateTranscriptionGroundTruth,
} from "./finalEngineeringGapClosure";

describe("POST-G-DEV-002 final engineering evidence gap closure", () => {
  it("defers QA-002 honestly when verified page-aligned OCR ground truth is unavailable", () => {
    const result = buildQa002RealEvidenceTerminalization();
    expect(result).toMatchObject({
      terminalState: "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP",
      benchmarkExecuted: false,
      sourceTextAvailable: true,
      pageAlignedHumanGroundTruthAvailable: false,
    });
    expect(result.evidenceGaps).toContain(
      "verified_page_aligned_ground_truth_unavailable"
    );
  });

  it("computes bounded transcription metrics when verified ground truth exists", () => {
    const result = evaluateTranscriptionGroundTruth([
      {
        sampleId: "TEST_GT_001",
        artifactVersionId: "TEST_ARTIFACT",
        pageNumber: 1,
        groundTruth: "وقف خاسكي سلطان",
        observedText: "وقف خاسكي سلطام",
        groundTruthVerified: true,
        groundTruthProvenance: "TEST_ONLY_HUMAN_GROUND_TRUTH",
        observedTextProvenance: "TEST_ONLY_OCR",
        correctionProvenance: ["TEST_CORRECTION_1"],
        uncertainSegments: ["سلطام"],
        confidence: 0.88,
      },
    ]);
    expect(result.terminalState).toBe("PASS");
    expect(result.benchmarkExecuted).toBe(true);
    expect(result.sampleCount).toBe(1);
    expect(result.meanCharacterErrorRate).toBeGreaterThan(0);
    expect(result.meanWordErrorRate).toBeGreaterThan(0);
    expect(result.uncertainSegmentCount).toBe(1);
    expect(result.correctionProvenanceCount).toBe(1);
  });

  it("synthesizes all representative judgments descriptively without doctrinal generalization", () => {
    const result = buildPilot006CaseLawSynthesis();
    expect(result.terminalState).toBe("PASS");
    expect(result.representativeCaseCount).toBe(3);
    expect(result.caseNumbers).toEqual(
      expect.arrayContaining(["1383/2019", "1543/2016", "397/2023"])
    );
    expect(result.sharedIssueTags).toContain("waqf");
    expect(result.cases.every(row => row.caseSpecificOnly)).toBe(true);
    expect(result.cases.every(row => !row.generalizationAllowed)).toBe(true);
    expect(result.doctrinalGeneralizationAllowed).toBe(false);
    expect(result.humanSpecialistAcceptanceIncluded).toBe(false);
  });

  it("preserves the 1543/2016 appellate identifier conflict in synthesis", () => {
    const result = buildPilot006CaseLawSynthesis();
    const row = result.cases.find(item => item.caseNumber === "1543/2016");
    expect(row?.normalizationState).toBe(
      "EXPERT_REVIEW_READY_WITH_SOURCE_CONFLICT"
    );
    expect(row?.sourceConflictNotes.join(" ")).toContain("1053/2013");
    expect(row?.appellateChain).toEqual(
      expect.arrayContaining([
        "FIRST_INSTANCE:1025/2013",
        "APPEAL:455/2015",
        "CASSATION:1543/2016",
      ])
    );
  });

  it("terminates the real Haseki historical title-chain benchmark with an explicit modern evidence gap", () => {
    const result = buildPilot007EvidenceBoundedTitleChain();
    expect(result.terminalState).toBe("DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP");
    expect(result.historicalEventCount).toBe(2);
    expect(result.historicalFactsVerified).toBe(true);
    expect(result.currentParcelIdentityResolved).toBe(false);
    expect(result.currentTitleResolved).toBe(false);
    expect(result.currentOwnershipInferenceAllowed).toBe(false);
    expect(result.evidenceGaps).toContain(
      "no_governed_settlement_or_title_record_links_historical_share_to_current_parcel"
    );
  });

  it("keeps private preservation independent from public display/download/release", () => {
    const result = buildPilot008RightsAccessBenchmark();
    const privateRow = result.classes.find(
      row => row.classId === "PRIVATE_PENDING"
    )!;
    expect(privateRow.realSource).toBe(true);
    expect(privateRow.decisions.PRESERVE).toBe("ALLOW");
    expect(privateRow.decisions.DISPLAY).toBe("DENY");
    expect(privateRow.decisions.DOWNLOAD).toBe("DENY");
    expect(privateRow.decisions.PUBLIC_RELEASE).toBe("DENY");
    expect(result.publicReleaseFromPrivatePreservation).toBe(false);
    expect(result.actualRightsMutated).toBe(false);
  });

  it("keeps live-read-only sources non-preservable and non-public-release", () => {
    const result = buildPilot008RightsAccessBenchmark();
    const live = result.classes.find(row => row.classId === "LIVE_READ_ONLY")!;
    expect(live.realSource).toBe(true);
    expect(live.decisions.PRESERVE).toBe("DENY");
    expect(live.decisions.RAG).toBe("DENY");
    expect(live.decisions.PUBLIC_RELEASE).toBe("DENY");
  });

  it("covers internal and public policy branches only with explicit test fixtures", () => {
    const result = buildPilot008RightsAccessBenchmark();
    const internal = result.classes.find(
      row => row.classId === "INTERNAL_VERIFIED_TEST_FIXTURE"
    )!;
    const publicRow = result.classes.find(
      row => row.classId === "PUBLIC_VERIFIED_TEST_FIXTURE"
    )!;
    expect(internal.realSource).toBe(false);
    expect(internal.decisions.RAG).toBe("ALLOW");
    expect(internal.decisions.PUBLIC_RELEASE).toBe("DENY");
    expect(publicRow.realSource).toBe(false);
    expect(publicRow.decisions.PUBLIC_RELEASE).toBe("ALLOW");
  });

  it("fails closed on rejected rights regardless of an allowed flag", () => {
    expect(
      evaluateRightsAction(
        {
          preserveAllowed: true,
          fullTextRetentionAllowed: true,
          ragAllowed: true,
          publicDisplayAllowed: true,
          downloadAllowed: true,
          quoteAllowed: true,
          reviewStatus: "rejected",
        },
        "PUBLIC_RELEASE"
      )
    ).toBe("DENY");
  });

  it("terminalizes unresolved Jerusalem jurisdiction without inference", () => {
    expect(buildGate06JurisdictionTerminalization()).toMatchObject({
      terminalState: "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP",
      resolverState: "unresolved",
      competentAuthority: null,
      inferenceAllowed: false,
    });
  });

  it("revalidates conflict detection without silent resolution", () => {
    expect(buildGate07ConflictRevalidation()).toEqual({
      terminalState: "PASS",
      conflictCount: 1,
      silentResolutionAllowed: false,
      authoritativeConclusionEligible: false,
    });
  });

  it("passes exact case retrieval/citation while blocking broad case generalization", () => {
    const result = buildGate10RetrievalCitationTerminalization();
    expect(result.terminalState).toBe("PASS");
    expect(result.exactCaseUsable).toBe(true);
    expect(result.broadCaseGeneralizationBlocked).toBe(true);
    expect(result.citationAuditValid).toBe(true);
    expect(result.citationDefects).toEqual([]);
  });

  it("terminalizes every in-scope engineering gate with no ambiguous IN_PROGRESS", () => {
    const gates = buildPostGDev002GateTerminalization();
    expect(gates.map(row => row.gateId)).toEqual([
      "GATE-04",
      "GATE-05",
      "GATE-06",
      "GATE-07",
      "GATE-08",
      "GATE-10",
    ]);
    expect(
      gates.every(row =>
        ["PASS", "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP"].includes(
          row.terminalState
        )
      )
    ).toBe(true);
    for (const row of gates.filter(
      item => item.terminalState === "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP"
    )) {
      expect(row.evidenceGaps.length).toBeGreaterThan(0);
    }
  });

  it("reconciles stale pilots without reopening completed engineering", () => {
    const rows = buildStaleTodoReconciliation();
    expect(rows.find(row => row.todoId === "PILOT-001")?.terminalStatus).toBe(
      "DONE"
    );
    expect(rows.find(row => row.todoId === "PILOT-002")?.terminalStatus).toBe(
      "DEFERRED"
    );
    expect(rows.find(row => row.todoId === "PILOT-003")?.terminalStatus).toBe(
      "DONE"
    );
    expect(rows.find(row => row.todoId === "PILOT-004")?.terminalStatus).toBe(
      "DONE"
    );
    expect(rows.find(row => row.todoId === "PILOT-005")?.terminalStatus).toBe(
      "DEFERRED"
    );
  });

  it("declares engineering preproduction entry eligible without production or human authority", () => {
    const result = buildPostGDev002Summary();
    expect(result.finalEngineeringBatch).toBe(true);
    expect(result.allInScopeEngineeringGatesTerminal).toBe(true);
    expect(result.ambiguousInProgressEngineeringGates).toBe(0);
    expect(result.realSpecialistDecisionsIncluded).toBe(false);
    expect(result.productionEffect).toBe("NONE");
    expect(result.megaGRightsPublicReleaseAllowed).toBe(false);
    expect(result.preproductionEngineeringEntryEligible).toBe(true);
  });
});
