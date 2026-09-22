import { describe, expect, it } from "vitest";
import type { ReferenceCorpusItem } from "./referenceCorpus";
import {
  MEGA_F_REFERENCE_EXPANSION,
  MEGA_F_SOURCE_READINESS,
  buildMegaFCorpusConvergence,
  buildMegaFTerritoryEvidencePackets,
  canGeneralizeJudicialDecision,
  judicialDecisionByCaseNumber,
  megaFSourceFamilies,
} from "./referenceMegaF";
import {
  benchmarkMegaFRetrieval,
  buildMegaFContinuityReadiness,
  buildMegaFSecurityNegativeMatrix,
  evaluateMegaFGuard,
  summarizeMegaFRetrievalHitForEvidence,
} from "./preProductionMegaF";
import {
  buildMegaFSpecialistReadinessQueue,
  megaFSpecialistReadinessSummary,
} from "./expertReviewMegaF";
import {
  InMemorySovereignArchiveStore,
  SovereignReferenceArchiveCoordinator,
} from "./sovereignReferenceArchive";
import { replayReferenceQuestionOffline } from "./referenceContinuity";
import type { ReferenceRetrievalDocument } from "./referenceRetrieval";
import { routeReferenceIssue } from "./referenceIssueRouter";
import { hybridReferenceSearch } from "./referenceRetrieval";

describe("WAQF_AI MEGA_F pre-production evidence and operability convergence", () => {
  it("advances case-law, sharia and fiqh coverage while keeping Gaza and Jerusalem unresolved", () => {
    const families = megaFSourceFamilies();
    expect(
      families.find(row => row.familyId === "CASE_LAW")?.coverageState
    ).toBe("PARTIAL");
    expect(
      families.find(row => row.familyId === "SHARIA_PRIMARY")?.coverageState
    ).toBe("PARTIAL");
    expect(
      families.find(row => row.familyId === "FIQH_CLASSICAL")?.coverageState
    ).toBe("PARTIAL");
    expect(
      families.find(row => row.familyId === "LAND_GAZA_CURRENT")?.coverageState
    ).toBe("UNRESOLVED");
    expect(
      families.find(row => row.familyId === "LAND_JERUSALEM_TRACK")
        ?.coverageState
    ).toBe("UNRESOLVED");
  });

  it("records explicit convergence debt instead of claiming complete corpora", () => {
    const ledger = buildMegaFCorpusConvergence();
    expect(ledger.find(row => row.familyId === "CASE_LAW")).toMatchObject({
      state: "ADVANCED",
      coverageState: "PARTIAL",
    });
    expect(ledger.find(row => row.familyId === "SHARIA_PRIMARY")).toMatchObject(
      {
        state: "ADVANCED",
        coverageState: "PARTIAL",
      }
    );
    expect(ledger.find(row => row.familyId === "FIQH_CLASSICAL")).toMatchObject(
      {
        state: "ADVANCED",
        coverageState: "PARTIAL",
      }
    );
    expect(
      ledger.find(row => row.familyId === "LAND_GAZA_CURRENT")
    ).toMatchObject({ state: "UNCHANGED_OPEN", coverageState: "UNRESOLVED" });
  });

  it("normalizes the 1383/2019 appellate chain and forbids generalization", () => {
    const decision = judicialDecisionByCaseNumber("1383/2019");
    expect(decision).toBeTruthy();
    expect(decision?.decisionDate).toBe("2021-01-25");
    expect(decision?.appellateNormalizationComplete).toBe(true);
    expect(decision?.appellateRelations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          court: "Hebron Court of First Instance",
          caseNumber: "27/2018",
        }),
        expect.objectContaining({
          court: "Jerusalem Court of Appeal",
          caseNumber: "341/2019",
        }),
      ])
    );
    expect(decision?.holdingSummary).toContain("raqaba");
    expect(canGeneralizeJudicialDecision(decision!)).toBe(false);
  });

  it("keeps other representative judgments case-specific until fuller normalization", () => {
    for (const caseNumber of ["1543/2016", "397/2023"]) {
      const decision = judicialDecisionByCaseNumber(caseNumber);
      expect(decision).toBeTruthy();
      expect(decision?.caseSpecificOnly).toBe(true);
      expect(decision?.generalizationAllowed).toBe(false);
      expect(decision?.specialistReview).toBe("PENDING");
    }
  });

  it("keeps Gaza and Jerusalem conclusions fail-closed despite evidence advancement", () => {
    const packets = buildMegaFTerritoryEvidencePackets();
    for (const packet of packets) {
      expect(packet.evidenceCoverageAdvanced).toBe(true);
      expect(packet.currentLegalStatusResolved).toBe(false);
      expect(packet.conclusionEligible).toBe(false);
      expect(packet.sovereigntyInferenceAllowed).toBe(false);
      expect(packet.ownershipInferenceAllowed).toBe(false);
    }
    expect(packets.find(row => row.territory === "GAZA")?.evidenceMode).toBe(
      "PRESERVED_PRIVATE"
    );
    expect(
      packets.find(row => row.territory === "JERUSALEM")?.evidenceMode
    ).toBe("LIVE_READ_ONLY");
  });

  it("admits fiqh source identity for private research but not substantive fiqh conclusions", () => {
    const fiqh = MEGA_F_SOURCE_READINESS.filter(row =>
      row.corpusId.startsWith("fiqh-")
    );
    expect(fiqh).toHaveLength(2);
    for (const source of fiqh) {
      expect(source.sourceIdentityVerified).toBe(true);
      expect(source.preservedBytes).toBe(true);
      expect(source.privateRetrievalEligible).toBe(true);
      expect(source.exactPageOrHoldingLocatorVerified).toBe(false);
      expect(source.substantiveConclusionEligible).toBe(false);
      expect(source.specialistReview).toBe("PENDING");
    }
  });

  it("represents primary sharia identity without fabricating preserved primary bytes", () => {
    const hadith = MEGA_F_SOURCE_READINESS.find(row =>
      row.corpusId.includes("bukhari-2737")
    );
    expect(hadith).toBeTruthy();
    expect(hadith?.sourceIdentityVerified).toBe(true);
    expect(hadith?.preservedBytes).toBe(false);
    expect(hadith?.privateRetrievalEligible).toBe(false);
    expect(hadith?.substantiveConclusionEligible).toBe(false);
  });

  it("enforces 119 staged negative authorization cases", () => {
    const matrix = buildMegaFSecurityNegativeMatrix();
    expect(matrix).toHaveLength(119);
    for (const item of matrix) {
      expect(
        evaluateMegaFGuard({ role: item.role, action: item.action }).disposition
      ).toBe(item.expected);
    }
  });

  it("forbids specialist self-approval and fail-closed override", () => {
    expect(
      evaluateMegaFGuard({
        role: "LEGAL_STATUS_REVIEWER",
        action: "APPROVE_SPECIALIST_DECISION",
        actorId: "reviewer-1",
        reviewerId: "reviewer-1",
        requestedSpecialistRole: "LEGAL_STATUS_REVIEWER",
        territory: "WEST_BANK",
        reviewerTerritories: ["WEST_BANK"],
      })
    ).toEqual({
      disposition: "DENY",
      reasons: ["self_approval_prohibited"],
    });
    expect(
      evaluateMegaFGuard({
        role: "PROGRAM_OWNER",
        action: "FAIL_CLOSED_OVERRIDE",
      }).disposition
    ).toBe("DENY");
  });

  it("limits specialist credential evidence to access/security roles", () => {
    expect(
      evaluateMegaFGuard({
        role: "SYSTEM_ACCESS_ADMIN",
        action: "VIEW_SPECIALIST_CREDENTIAL_EVIDENCE",
      }).disposition
    ).toBe("ALLOW");
    expect(
      evaluateMegaFGuard({
        role: "SECURITY_PRIVACY_REVIEWER",
        action: "VIEW_SPECIALIST_CREDENTIAL_EVIDENCE",
      }).disposition
    ).toBe("ALLOW");
    expect(
      evaluateMegaFGuard({
        role: "DEVELOPER_ENGINEER",
        action: "VIEW_SPECIALIST_CREDENTIAL_EVIDENCE",
      }).disposition
    ).toBe("DENY");
  });

  it("keeps specialist decisions pending human acts only", () => {
    const queue = buildMegaFSpecialistReadinessQueue();
    const summary = megaFSpecialistReadinessSummary();
    expect(queue.length).toBeGreaterThan(29);
    expect(summary.total).toBe(queue.length);
    expect(summary.blocking).toBeGreaterThan(0);
    expect(summary.p0).toBeGreaterThan(0);
    expect(summary.actualHumanDecisionsIncluded).toBe(false);
    expect(summary.productionExpertSignoffSatisfied).toBe(false);
    expect(
      queue.find(row => row.reviewId === "review-mega-f-gaza-current-status")
        ?.status
    ).toBe("PENDING_HUMAN_REVIEW");
  });

  it("replays a preserved real-family source offline with fixity and zero network calls", async () => {
    const item = MEGA_F_REFERENCE_EXPANSION.find(
      row => row.corpusId === "maqam-cassation-1383-2019-hukr"
    ) as ReferenceCorpusItem;
    const store = new InMemorySovereignArchiveStore();
    const coordinator = new SovereignReferenceArchiveCoordinator(store);
    const bytes = Buffer.from(
      "<html><body>نقض 1383/2019 الحكر حق المنفعة رقبة العقار الوقفي</body></html>",
      "utf8"
    );
    const preserved = await coordinator.preserve({
      collectionId: "mega-f-continuity-fixture",
      sourceUrl: item.sourceUrl,
      retrievedAt: "2026-09-23T00:00:00+03:00",
      contentType: "text/html; charset=utf-8",
      bytes,
    });
    const replay = await replayReferenceQuestionOffline({
      question: "ما أثر الحكر على رقبة العقار الوقفي في حكم نقض 1383/2019؟",
      preserved: [{ item, manifest: preserved.manifest }],
      store,
      extractText: async ({ bytes: value }) =>
        value
          .toString("utf8")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
    });
    expect(replay.networkCalls).toBe(0);
    expect(replay.allFixityVerified).toBe(true);
    expect(replay.rehydratedCount).toBe(1);
    expect(replay.topDocumentIds).toEqual(["maqam-cassation-1383-2019-hukr"]);
    expect(replay.disposition).toBe("OFFLINE_REPLAY_PASS_STATUS_GATE_CLOSED");
  });

  it("keeps production continuity externally un-certified after local restore readiness", () => {
    expect(buildMegaFContinuityReadiness()).toEqual(
      expect.objectContaining({
        localImmutableRestoreDrillRequired: true,
        localOfflineReplayRequired: true,
        fixityRequired: true,
        independentProviderCertified: false,
        productionContinuityCertified: false,
      })
    );
  });

  it("benchmarks local retrieval with zero provider cost and no production SLO claim", () => {
    const documents: ReferenceRetrievalDocument[] = [
      {
        documentId: "case-1383",
        title: "نقض 1383/2019 الحكر",
        content: "الحكر وحق المنفعة ورقبة العقار الوقفي",
        domain: "case_law",
        era: "CONTEMPORARY",
        territories: ["WEST_BANK"],
        authorityClass: "reference_secondary",
        sourceUrl: "https://maqam.najah.edu/judgments/7576/",
        publisher: "مقام",
        legalStatusVerified: true,
        artifactVersionId: "version-case",
        artifactSha256: "a".repeat(64),
        locator: "holding",
        semanticScore: 0.9,
        graphScore: 0.5,
      },
      {
        documentId: "gaza-law",
        title: "قوانين الأراضي في غزة",
        content: "القوانين الخاصة بالأراضي في قطاع غزة",
        domain: "land_law",
        era: "CONTEMPORARY",
        territories: ["GAZA"],
        authorityClass: "official_derivative",
        sourceUrl: "https://www.pla.gov.ps/",
        publisher: "سلطة الأراضي",
        legalStatusVerified: false,
        artifactVersionId: "version-gaza",
        artifactSha256: "b".repeat(64),
        locator: null,
      },
    ];
    const result = benchmarkMegaFRetrieval({
      documents,
      queries: [
        "ما أثر الحكر في حكم نقض 1383/2019؟",
        "ما القوانين الحالية للأراضي في غزة؟",
      ],
      iterations: 50,
    });
    expect(result.iterations).toBe(50);
    expect(result.p50Ms).toBeGreaterThanOrEqual(0);
    expect(result.p95Ms).toBeGreaterThanOrEqual(result.p50Ms);
    expect(result.providerCostUsd).toBe(0);
    expect(result.paidProviderCalls).toBe(0);
    expect(result.externalNetworkCalls).toBe(0);
    expect(result.productionSloCertified).toBe(false);
  });

  it("routes case law, fiqh and sharia independently and preserves expert gates", () => {
    const judicial = routeReferenceIssue("ما حكم نقض 1383/2019 بشأن الحكر؟");
    const fiqh = routeReferenceIssue("ما قول الفقه الحنفي في الوقف؟");
    const sharia = routeReferenceIssue("ما الحديث الشرعي في أصل الوقف؟");
    expect(judicial.priorityDomains).toContain("case_law");
    expect(fiqh.priorityDomains).toContain("fiqh");
    expect(sharia.priorityDomains).toContain("sharia");
    expect(fiqh.requiresHumanExpertReview).toBe(true);
    expect(sharia.requiresHumanExpertReview).toBe(true);
  });

  it("allows a case-specific retrieval hit but keeps Gaza current-law evidence fail-closed", () => {
    const docs: ReferenceRetrievalDocument[] = [
      {
        documentId: "case-1383",
        title: "نقض 1383/2019 — الحكر",
        content:
          "الحكر يكسب حق منفعة مع بقاء رقبة العقار للوقف في النزاع الممثل.",
        domain: "case_law",
        era: "CONTEMPORARY",
        territories: ["WEST_BANK"],
        authorityClass: "reference_secondary",
        sourceUrl: "https://maqam.najah.edu/judgments/7576/",
        publisher: "مقام",
        legalStatusVerified: true,
        artifactVersionId: "case-version",
        artifactSha256: "c".repeat(64),
        locator: "case-specific-holding",
        structuredConclusionEligible: true,
        conclusionScope: "CASE_SPECIFIC",
        conclusionScopeTokens: ["1383/2019"],
        semanticScore: 0.9,
      },
      {
        documentId: "gaza-inventory",
        title: "قوانين خاصة بالأراضي غزة",
        content: "جرد قانوني لمسار قوانين الأراضي في غزة",
        domain: "land_law",
        era: "CONTEMPORARY",
        territories: ["GAZA"],
        authorityClass: "official_derivative",
        sourceUrl: "https://www.pla.gov.ps/",
        publisher: "سلطة الأراضي",
        legalStatusVerified: false,
        artifactVersionId: "gaza-version",
        artifactSha256: "d".repeat(64),
        locator: "inventory",
        structuredConclusionEligible: false,
        semanticScore: 0.9,
      },
    ];
    const caseHits = hybridReferenceSearch({
      query: "نقض 1383/2019 الحكر",
      route: routeReferenceIssue("ما حكم نقض 1383/2019 بشأن الحكر؟"),
      documents: docs,
    });
    expect(caseHits[0].usableForConclusion).toBe(true);

    const generalCaseHits = hybridReferenceSearch({
      query: "ما الذي تقرره أحكام النقض عن الحكر بوجه عام؟",
      route: routeReferenceIssue(
        "ما الذي تقرره أحكام النقض عن الحكر بوجه عام؟"
      ),
      documents: docs,
    });
    expect(generalCaseHits).toHaveLength(1);
    expect(generalCaseHits[0].usableForConclusion).toBe(false);
    expect(generalCaseHits[0].reasons).toContain(
      "case_specific_scope_mismatch"
    );

    const summary = summarizeMegaFRetrievalHitForEvidence(caseHits[0]);
    expect("content" in summary).toBe(false);
    expect(JSON.stringify(summary)).not.toContain(
      "الحكر يكسب حق منفعة مع بقاء رقبة العقار للوقف"
    );

    const gazaHits = hybridReferenceSearch({
      query: "قوانين الأراضي غزة",
      route: routeReferenceIssue("ما القوانين الحالية للأراضي في غزة؟"),
      documents: docs,
    });
    expect(gazaHits[0].usableForConclusion).toBe(false);
    expect(gazaHits[0].reasons).toEqual(
      expect.arrayContaining([
        "legal_status_not_verified",
        "structured_conclusion_gate_closed",
      ])
    );
  });
});
