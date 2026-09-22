import { describe, expect, it } from "vitest";
import {
  MEGA_G_CASE_NORMALIZATIONS,
  MEGA_G_PRIVATE_METADATA_EXPECTATIONS,
  MEGA_G_REFERENCE_EXPANSION,
  buildMegaGCorpusTerminalLedger,
  buildMegaGRightsLedger,
  buildMegaGTerritoryTerminalPackets,
  megaGAllMandatoryCorpusTracksTerminal,
  megaGCaseDecision,
  megaGDeferredTracks,
  megaGExpertReadyTracks,
  megaGNoPublicReleaseRights,
  megaGSourceFamilies,
} from "./referenceMegaG";
import {
  buildMegaGSpecialistEvidencePacks,
  buildMegaGSpecialistQueue,
  megaGNoAutoApproval,
  megaGSpecialistHandoffSummary,
} from "./expertReviewMegaG";

describe("WAQF_AI MEGA_G final corpus completion and specialist handoff", () => {
  it("terminates all 10 mandatory P0 corpus tracks without NOT_STARTED", () => {
    const ledger = buildMegaGCorpusTerminalLedger();
    expect(ledger).toHaveLength(10);
    expect(megaGAllMandatoryCorpusTracksTerminal()).toBe(true);
    expect(
      ledger.every(row =>
        [
          "EXPERT_REVIEW_READY",
          "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP",
        ].includes(row.terminalState)
      )
    ).toBe(true);
  });

  it("resolves every terminal-ledger family id and requires evidence on expert-ready tracks", () => {
    const validFamilyIds = new Set(
      megaGSourceFamilies().map(family => family.familyId)
    );
    const ledger = buildMegaGCorpusTerminalLedger();

    for (const track of ledger) {
      expect(track.familyIds.length).toBeGreaterThan(0);
      expect(
        track.familyIds.every(familyId => validFamilyIds.has(familyId))
      ).toBe(true);
      if (track.terminalState === "EXPERT_REVIEW_READY") {
        expect(track.evidenceRefs.length).toBeGreaterThan(0);
      } else {
        expect(track.evidenceGaps.length).toBeGreaterThan(0);
      }
    }

    expect(
      ledger.find(track => track.todoId === "CORP-WAQF-001")?.evidenceRefs
        .length
    ).toBeGreaterThan(0);
  });

  it("marks nine corpus tracks expert-ready and Gaza land status explicitly deferred", () => {
    expect(megaGExpertReadyTracks()).toHaveLength(9);
    expect(megaGDeferredTracks()).toHaveLength(1);
    expect(megaGDeferredTracks()[0]).toMatchObject({
      todoId: "CORP-LAND-004",
      terminalState: "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP",
    });
  });

  it("keeps Gaza and Jerusalem terminal packets fail-closed", () => {
    const packets = buildMegaGTerritoryTerminalPackets();
    expect(packets).toHaveLength(2);
    for (const packet of packets) {
      expect(packet.terminalState).toBe(
        "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP"
      );
      expect(packet.currentLegalStatusResolved).toBe(false);
      expect(packet.authoritativeConclusionEligible).toBe(false);
      expect(packet.sovereigntyInferenceAllowed).toBe(false);
      expect(packet.ownershipInferenceAllowed).toBe(false);
      expect(packet.evidenceGaps.length).toBeGreaterThan(0);
    }
  });

  it("adds Maliki and Shafii source-identity records without pretending PDF preservation", () => {
    const maliki = MEGA_G_REFERENCE_EXPANSION.find(row =>
      row.corpusId.includes("maliki-hattab")
    );
    const shafii = MEGA_G_REFERENCE_EXPANSION.find(row =>
      row.corpusId.includes("shafii-al-umm")
    );
    expect(maliki?.domain).toBe("fiqh");
    expect(shafii?.domain).toBe("fiqh");
    expect(maliki?.notes.join(" ")).toContain("PDF acquisition");
    expect(shafii?.notes.join(" ")).toContain("HTTP 403");
    expect(shafii?.notes.join(" ")).toContain("volume 5");
  });

  it("records exact private metadata fixity expectations", () => {
    expect(
      MEGA_G_PRIVATE_METADATA_EXPECTATIONS[
        "fiqh-maliki-hattab-ahkam-al-waqf-metadata"
      ]
    ).toEqual(
      expect.objectContaining({
        byteSize: 78679,
        sha256:
          "6a1fed9904a09c0c86cd76b054e60954f404ac8fcccf93233650f0284160cc0f",
      })
    );
    expect(
      MEGA_G_PRIVATE_METADATA_EXPECTATIONS[
        "fiqh-shafii-al-umm-vol5-ahbas-metadata"
      ]
    ).toEqual(
      expect.objectContaining({
        byteSize: 118910,
        sha256:
          "da49e6caedd90d3b18e12e5f70ccb78e09e2a907a85af67b028beb2704a921fd",
      })
    );
  });

  it("keeps FIQH_CLASSICAL PARTIAL while reaching four-madhhab handoff representation", () => {
    const family = megaGSourceFamilies().find(
      row => row.familyId === "FIQH_CLASSICAL"
    );
    expect(family?.coverageState).toBe("PARTIAL");
    expect(family?.seedCorpusIds).toEqual(
      expect.arrayContaining([
        "fiqh-hanafi-hilal-ahkam-al-waqf",
        "fiqh-hanbali-khallal-kitab-al-wuquf",
        "fiqh-maliki-hattab-ahkam-al-waqf-metadata",
        "fiqh-shafii-al-umm-vol5-ahbas-metadata",
      ])
    );
  });

  it("normalizes 397/2023 across first instance, appeal and cassation", () => {
    const row = MEGA_G_CASE_NORMALIZATIONS.find(
      item => item.caseNumber === "397/2023"
    );
    expect(row?.normalizationState).toBe("NORMALIZED");
    expect(row?.normalizedChain.map(item => item.caseNumber)).toEqual([
      "257/2006",
      "21/2022",
      "397/2023",
    ]);
    expect(row?.generalizationAllowed).toBe(false);
  });

  it("preserves the 1543/2016 first-instance identifier conflict instead of silently correcting it", () => {
    const row = MEGA_G_CASE_NORMALIZATIONS.find(
      item => item.caseNumber === "1543/2016"
    );
    expect(row?.normalizationState).toBe(
      "EXPERT_REVIEW_READY_WITH_SOURCE_CONFLICT"
    );
    expect(row?.normalizedChain[0].caseNumber).toBe("1025/2013");
    expect(row?.sourceConflictNotes.join(" ")).toContain("1053/2013");
    expect(row?.generalizationAllowed).toBe(false);
  });

  it("retains source and normalization objects separately for judicial review", () => {
    const result = megaGCaseDecision("1383/2019");
    expect(result.source?.caseNumber).toBe("1383/2019");
    expect(result.normalization?.normalizationState).toBe("NORMALIZED");
    expect(result.normalization?.generalizationAllowed).toBe(false);
  });

  it("builds a rights ledger that never grants public release", () => {
    const ledger = buildMegaGRightsLedger();
    expect(ledger.length).toBeGreaterThanOrEqual(9);
    expect(megaGNoPublicReleaseRights()).toBe(true);
    expect(
      ledger.find(row => row.sourceId.includes("maliki"))?.preservationMode
    ).toBe("PRESERVED_PRIVATE_METADATA_ONLY");
    expect(
      ledger.find(row => row.sourceId.includes("jerusalem"))?.preservationMode
    ).toBe("LIVE_READ_ONLY");
  });

  it("keeps preservation mode distinct from legal or specialist admission", () => {
    for (const row of buildMegaGRightsLedger()) {
      expect(row.publicReleaseAllowed).toBe(false);
      expect(row.evidenceRef.length).toBeGreaterThan(0);
    }
  });

  it("creates one specialist handoff pack for every corpus track plus Jerusalem", () => {
    const packs = buildMegaGSpecialistEvidencePacks();
    expect(packs).toHaveLength(11);
    expect(packs.map(pack => pack.todoId)).toEqual(
      expect.arrayContaining([
        "CORP-LAND-001",
        "CORP-LAND-004",
        "CORP-WAQF-001",
        "CORP-LEASE-001",
        "CORP-REG-001",
        "CORP-CASE-001",
        "CORP-SHARIA-001",
        "CORP-FIQH-001",
        "LAND-JERUSALEM-TRACK",
      ])
    );
  });

  it("puts every MEGA_G handoff pack into pending human review without auto-decisions", () => {
    const packs = buildMegaGSpecialistEvidencePacks();
    const queue = buildMegaGSpecialistQueue();
    expect(megaGNoAutoApproval()).toBe(true);
    expect(
      packs.every(pack => pack.actualHumanDecisionIncluded === false)
    ).toBe(true);
    for (const pack of packs) {
      const review = queue.find(item => item.subjectId === pack.todoId);
      expect(review?.status).toBe("PENDING_HUMAN_REVIEW");
      expect(review?.blocksAuthoritativeConclusion).toBe(true);
    }
  });

  it("reports handoff readiness without claiming expert signoff", () => {
    const summary = megaGSpecialistHandoffSummary();
    expect(summary.totalPacks).toBe(11);
    expect(summary.expertReviewReadyPacks).toBe(9);
    expect(summary.explicitlyDeferredPacks).toBe(2);
    expect(summary.p0QueueItems).toBeGreaterThanOrEqual(11);
    expect(summary.actualHumanDecisionsIncluded).toBe(false);
    expect(summary.productionExpertSignoffSatisfied).toBe(false);
  });

  it("keeps corpus completion semantics distinct from exhaustive web collection", () => {
    const land = buildMegaGCorpusTerminalLedger().find(
      row => row.todoId === "CORP-LAND-001"
    );
    const waqf = buildMegaGCorpusTerminalLedger().find(
      row => row.todoId === "CORP-WAQF-001"
    );
    expect(land?.completionMeaning).toContain("does not mean every possible");
    expect(waqf?.completionMeaning).toContain("ready for specialist");
  });

  it("requires explicit evidence gaps for every deferred terminal state", () => {
    for (const row of buildMegaGCorpusTerminalLedger().filter(
      item => item.terminalState === "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP"
    )) {
      expect(row.evidenceGaps.length).toBeGreaterThan(0);
      expect(row.unresolvedQuestions.length).toBeGreaterThan(0);
    }
    for (const row of buildMegaGTerritoryTerminalPackets()) {
      expect(row.evidenceGaps.length).toBeGreaterThan(0);
    }
  });
});
