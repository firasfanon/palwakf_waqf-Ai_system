import { describe, expect, it } from "vitest";
import {
  MEGA_B_REFERENCE_SEED,
  type ReferenceCorpusItem,
} from "./referenceCorpus";
import {
  MEGA_C_REFERENCE_CORPUS,
  MEGA_C_REFERENCE_EXPANSION,
  MEGA_C_SOURCE_FAMILIES,
  buildCorpusCoverageLedger,
  validateMegaCCorpusScaleUp,
} from "./referenceCorpusScaleUp";
import { buildLegalStatusMatrixMegaC } from "./legalStatusMatrixMegaC";
import {
  buildExpertReviewQueue,
  validateHumanExpertDecision,
} from "./expertReviewQueue";
import {
  InMemorySovereignArchiveStore,
  SovereignReferenceArchiveCoordinator,
} from "./sovereignReferenceArchive";
import { replayReferenceQuestionOffline } from "./referenceContinuity";
import { routeReferenceIssue } from "./referenceIssueRouter";
import {
  hybridReferenceSearch,
  selectReferenceEvidencePack,
  type ReferenceRetrievalDocument,
} from "./referenceRetrieval";

describe("WAQF_AI MEGA_C corpus scale-up and legal-status expansion", () => {
  it("materially expands the governed corpus without claiming completeness", () => {
    expect(MEGA_B_REFERENCE_SEED.length).toBeGreaterThanOrEqual(10);
    expect(MEGA_C_REFERENCE_EXPANSION.length).toBeGreaterThanOrEqual(15);
    expect(MEGA_C_REFERENCE_CORPUS.length).toBeGreaterThanOrEqual(25);
    expect(validateMegaCCorpusScaleUp()).toEqual([]);

    const ledger = buildCorpusCoverageLedger();
    expect(ledger.length).toBe(MEGA_C_SOURCE_FAMILIES.length);
    expect(ledger.some(row => row.coverageState === "COMPLETE")).toBe(false);
    expect(ledger.every(row => row.complete === false)).toBe(true);
  });

  it("keeps West Bank, Gaza and Jerusalem as independent status tracks", () => {
    const matrix = buildLegalStatusMatrixMegaC();
    expect(matrix.territoryCounts.WEST_BANK).toBeGreaterThan(0);
    expect(matrix.territoryCounts.GAZA).toBeGreaterThan(0);
    expect(matrix.territoryCounts.JERUSALEM).toBeGreaterThan(0);

    const westBank = matrix.rows.find(
      row => row.rowId === "land-authority-6-2010-west-bank"
    )!;
    const gaza = matrix.rows.find(
      row => row.rowId === "registration-transfer-fees-2-2012-gaza"
    )!;
    const jerusalem = matrix.rows.find(
      row => row.rowId === "jerusalem-current-land-waqf-track"
    )!;

    expect(westBank.conclusionEligible).toBe(true);
    expect(gaza.conclusionEligible).toBe(false);
    expect(jerusalem.conclusionEligible).toBe(false);
    expect(gaza.assertedStatus).toBe("UNRESOLVED");
    expect(jerusalem.assertedStatus).toBe("UNRESOLVED");
  });

  it("does not let a secondary in-force signal unlock an authoritative legal conclusion", () => {
    const matrix = buildLegalStatusMatrixMegaC();
    const waqfTenancy = matrix.rows.find(
      row => row.rowId === "waqf-tenancy-5-1964-west-bank"
    )!;
    expect(
      waqfTenancy.evidence.some(
        evidence => evidence.kind === "SECONDARY_STATUS_SIGNAL"
      )
    ).toBe(true);
    expect(waqfTenancy.legalStatusVerified).toBe(false);
    expect(waqfTenancy.conclusionEligible).toBe(false);
    expect(waqfTenancy.reviewRequired).toBe(true);
  });

  it("represents explicit repeal without pretending the territorial transition chain is complete", () => {
    const matrix = buildLegalStatusMatrixMegaC();
    const repealed = matrix.rows.find(
      row => row.rowId === "settlement-authority-7-2016-west-bank"
    )!;
    expect(repealed.assertedStatus).toBe("REPEALED");
    expect(repealed.explicitStatusVerified).toBe(true);
    expect(repealed.legalStatusVerified).toBe(true);
    expect(repealed.territoryScopeVerified).toBe(false);
    expect(repealed.conclusionEligible).toBe(false);
    expect(repealed.reviewRequired).toBe(true);
  });

  it("can verify historical identity/application context from archival-primary evidence without implying modern force", () => {
    const matrix = buildLegalStatusMatrixMegaC();
    const mandate = matrix.rows.find(
      row => row.rowId === "mandate-land-transfers-1940-historic-palestine"
    )!;
    expect(mandate.assertedStatus).toBe("HISTORICAL");
    expect(mandate.legalStatusVerified).toBe(true);
    expect(mandate.territoryScopeVerified).toBe(true);
    expect(mandate.conclusionEligible).toBe(true);
  });

  it("builds family-level rights/source review plus exception-only status review, not routine per-document approval", () => {
    const queue = buildExpertReviewQueue();
    expect(queue.itemCount).toBeGreaterThan(0);
    expect(queue.familyReviewCount).toBeLessThanOrEqual(
      MEGA_C_SOURCE_FAMILIES.length
    );
    expect(queue.legalStatusExceptionCount).toBeGreaterThan(0);
    expect(queue.perDocumentRoutineRightsReviewCount).toBe(0);
    expect(queue.pendingBlockingCount).toBeGreaterThan(0);
    expect(
      queue.items.every(item => item.status === "PENDING_HUMAN_REVIEW")
    ).toBe(true);
  });

  it("cannot fabricate an expert decision without human identity, rationale and evidence", () => {
    const queue = buildExpertReviewQueue();
    const target = queue.items[0];
    expect(target).toBeTruthy();
    const errors = validateHumanExpertDecision({
      decisionId: "fixture-decision",
      reviewId: target.reviewId,
      reviewerRole: target.role,
      reviewerIdentity: "",
      decidedAt: "",
      disposition: "APPROVED",
      evidenceRefs: [],
      rationale: "",
      humanAttested: true,
    });
    expect(errors).toContain("reviewer_identity_required");
    expect(errors).toContain("rationale_required");
    expect(errors).toContain("decision_timestamp_required");
    expect(errors).toContain("evidence_refs_required");
  });

  it("replays retrieval from immutable preserved bytes with zero network calls", async () => {
    const item = MEGA_C_REFERENCE_CORPUS.find(
      row => row.corpusId === "pla-new-registration-procedure"
    ) as ReferenceCorpusItem;
    expect(item).toBeTruthy();

    const store = new InMemorySovereignArchiveStore();
    const coordinator = new SovereignReferenceArchiveCoordinator(store);
    const bytes = Buffer.from(
      "<html><body>معاملة التسجيل الجديد للأموال غير المنقولة في الضفة ويحكمها قانون تسجيل الأموال غير المنقولة.</body></html>",
      "utf8"
    );
    const preserved = await coordinator.preserve({
      collectionId: "fixture-offline",
      sourceUrl: item.sourceUrl,
      retrievedAt: "2026-09-22T00:00:00+03:00",
      contentType: "text/html; charset=utf-8",
      bytes,
    });

    const replay = await replayReferenceQuestionOffline({
      question: "ما إجراءات التسجيل الجديد للأموال غير المنقولة في الضفة؟",
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
    expect(replay.topDocumentIds).toEqual(["pla-new-registration-procedure"]);
    expect(replay.disposition).toBe("OFFLINE_REPLAY_PASS_STATUS_GATE_CLOSED");
  });

  it("reuses extracted text by artifact SHA while still replaying from fixity-verified preserved bytes", async () => {
    const item = MEGA_C_REFERENCE_CORPUS.find(
      row => row.corpusId === "pla-new-registration-procedure"
    ) as ReferenceCorpusItem;
    const store = new InMemorySovereignArchiveStore();
    const coordinator = new SovereignReferenceArchiveCoordinator(store);
    const bytes = Buffer.from(
      "<html><body>معاملة التسجيل الجديد للأموال غير المنقولة.</body></html>",
      "utf8"
    );
    const preserved = await coordinator.preserve({
      collectionId: "fixture-text-cache",
      sourceUrl: item.sourceUrl,
      retrievedAt: "2026-09-22T00:00:00+03:00",
      contentType: "text/html; charset=utf-8",
      bytes,
    });
    const cache = new Map<string, string>();
    const extractedTextCache = {
      get: async (sha: string) => cache.get(sha) ?? null,
      put: async (sha: string, value: string) => {
        cache.set(sha, value);
      },
    };
    let extractorCalls = 0;
    const run = () =>
      replayReferenceQuestionOffline({
        question: "ما إجراءات التسجيل الجديد للأموال غير المنقولة في الضفة؟",
        preserved: [{ item, manifest: preserved.manifest }],
        store,
        extractedTextCache,
        extractText: async ({ bytes: value }) => {
          extractorCalls += 1;
          return value
            .toString("utf8")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
        },
      });

    const first = await run();
    const second = await run();
    expect(first.allFixityVerified).toBe(true);
    expect(second.allFixityVerified).toBe(true);
    expect(extractorCalls).toBe(1);
    expect(cache.has(preserved.manifest.sha256)).toBe(true);
  });

  it("builds a domain-diverse evidence pack for mixed waqf and property questions", () => {
    const fixture = (
      documentId: string,
      domain: ReferenceRetrievalDocument["domain"],
      title: string,
      legalStatusVerified = false
    ): ReferenceRetrievalDocument => ({
      documentId,
      title,
      content: title,
      domain,
      era: "CONTEMPORARY",
      territories: ["WEST_BANK"],
      authorityClass: "official_primary",
      sourceUrl: "https://official.example/" + documentId,
      publisher: "Official fixture",
      legalStatusVerified,
      artifactVersionId: "version-" + documentId,
      artifactSha256: "a".repeat(64),
      locator: "document-body",
    });

    const route = routeReferenceIssue(
      "ما المرجع القانوني للعقارات الوقفية المؤجرة في الضفة وما علاقتها بقانون المالكين والمستأجرين؟"
    );
    const hits = hybridReferenceSearch({
      query: "العقارات الوقفية المؤجرة قانون المالكين والمستأجرين في الضفة",
      route,
      documents: [
        fixture("waqf-law", "waqf_law", "قانون الأوقاف"),
        fixture(
          "waqf-tenancy",
          "lease_hukr",
          "قانون المالكين والمستأجرين للعقارات الوقفية"
        ),
        fixture("land-general", "land_law", "قانون الأراضي"),
      ],
    });
    const pack = selectReferenceEvidencePack(hits, 4, route.preferredDomains);
    expect(pack.map(hit => hit.domain)).toContain("waqf_law");
    expect(pack.map(hit => hit.domain)).toContain("lease_hukr");
    expect(pack.map(hit => hit.domain)).toContain("land_law");
  });

  it("keeps movable-property legislation behind the legal-status gate", () => {
    const route = routeReferenceIssue(
      "ما الفرق بين تنظيم الأموال المنقولة وغير المنقولة عند بحث حقوق الوقف؟"
    );
    const document: ReferenceRetrievalDocument = {
      documentId: "movable-rights",
      title: "قرار بقانون رقم 11 لسنة 2016 بشأن ضمان الحقوق في المال المنقول",
      content: "تنظيم ضمان الحقوق في المال المنقول والأموال المنقولة",
      domain: "finance_investment",
      era: "PALESTINIAN_AUTHORITY",
      territories: ["WEST_BANK"],
      authorityClass: "official_derivative",
      sourceUrl: "https://official.example/movable-rights",
      publisher: "Official fixture",
      legalStatusVerified: false,
      artifactVersionId: "version-movable",
      artifactSha256: "b".repeat(64),
      locator: "article-1",
    };
    const hits = hybridReferenceSearch({
      query: "الأموال المنقولة وغير المنقولة حقوق الوقف",
      route,
      documents: [document],
    });
    expect(hits).toHaveLength(1);
    expect(hits[0].reasons).toContain("legal_status_not_verified");
    expect(hits[0].usableForConclusion).toBe(false);
  });

  it("fails closed for Jerusalem when there is no admitted Jerusalem corpus evidence", async () => {
    const store = new InMemorySovereignArchiveStore();
    const replay = await replayReferenceQuestionOffline({
      question: "ما القانون النافذ على وقف في القدس؟",
      preserved: [],
      store,
      extractText: async () => "",
    });
    expect(replay.networkCalls).toBe(0);
    expect(replay.topDocumentIds).toEqual([]);
    expect(replay.conclusionEligible).toBe(false);
    expect(replay.disposition).toBe(
      "OFFLINE_REPLAY_FAIL_CLOSED_NO_DOMAIN_EVIDENCE"
    );
  });

  it("prioritizes an explicitly named waqf instrument before a related registration procedure", () => {
    const route = routeReferenceIssue(
      "ما أثر تعديل قانون الأوقاف سنة 2023 على تسجيل الحجج الوقفية للأموال غير المنقولة؟"
    );
    expect(route.priorityDomains[0]).toBe("waqf_law");
    expect(route.priorityDomains).toContain("registration_settlement");

    const base = {
      era: "CONTEMPORARY" as const,
      territories: ["WEST_BANK" as const],
      publisher: "fixture",
      legalStatusVerified: false,
      artifactSha256: "e".repeat(64),
      locator: "document-body",
    };
    const hits = hybridReferenceSearch({
      query: "تعديل قانون الأوقاف 2023 تسجيل الحجج الوقفية",
      route,
      documents: [
        {
          ...base,
          documentId: "waqf-2023",
          title: "قرار بقانون رقم 2 لسنة 2023 بتعديل قانون الأوقاف",
          content: "تعديل قانون الأوقاف سنة 2023",
          domain: "waqf_law",
          authorityClass: "official_derivative",
          sourceUrl: "https://official.example/waqf-2023",
          artifactVersionId: "v-waqf-2023",
        },
        {
          ...base,
          documentId: "registration",
          title: "معاملة التسجيل الجديد للأموال غير المنقولة",
          content: "التسجيل والحجج والأموال غير المنقولة",
          domain: "registration_settlement",
          authorityClass: "official_primary",
          sourceUrl: "https://official.example/registration",
          artifactVersionId: "v-registration",
        },
      ],
    });
    const pack = selectReferenceEvidencePack(hits, 4, [
      ...route.priorityDomains,
      ...route.preferredDomains,
    ]);
    expect(pack[0].documentId).toBe("waqf-2023");
    expect(pack.map(hit => hit.documentId)).toContain("registration");
  });

  it("does not confuse المالكين with the Maliki madhhab", () => {
    const route = routeReferenceIssue(
      "ما المرجع القانوني للعقارات الوقفية المؤجرة في الضفة وما علاقته بقانون المالكين والمستأجرين؟"
    );
    expect(route.preferredDomains).not.toContain("fiqh");
    expect(route.reasons).not.toContain("fiqh_terms");
    expect(route.priorityDomains).toContain("lease_hukr");
  });

  it("ranks the specific lease domain ahead of general waqf-law material", () => {
    const route = routeReferenceIssue(
      "ما المرجع القانوني للعقارات الوقفية المؤجرة في الضفة وما علاقته بقانون المالكين والمستأجرين؟"
    );
    const base = {
      era: "CONTEMPORARY" as const,
      territories: ["WEST_BANK" as const],
      publisher: "fixture",
      legalStatusVerified: false,
      artifactSha256: "c".repeat(64),
      locator: "document-body",
    };
    const hits = hybridReferenceSearch({
      query: "العقارات الوقفية المؤجرة قانون المالكين والمستأجرين",
      route,
      documents: [
        {
          ...base,
          documentId: "general-waqf",
          title: "قانون الأوقاف وتعديلاته",
          content: "الأوقاف العقارات الوقفية",
          domain: "waqf_law",
          authorityClass: "official_primary",
          sourceUrl: "https://official.example/waqf",
          artifactVersionId: "v-waqf",
        },
        {
          ...base,
          documentId: "waqf-tenancy",
          title: "قانون المالكين والمستأجرين للعقارات الوقفية",
          content: "العقارات الوقفية المؤجرة المالكين المستأجرين",
          domain: "lease_hukr",
          authorityClass: "reference_secondary",
          sourceUrl: "https://reference.example/waqf-tenancy",
          artifactVersionId: "v-tenancy",
        },
      ],
    });
    expect(hits[0].documentId).toBe("waqf-tenancy");
    const pack = selectReferenceEvidencePack(hits, 4, [
      ...route.priorityDomains,
      ...route.preferredDomains,
    ]);
    expect(pack[0].documentId).toBe("waqf-tenancy");
  });

  it("ranks movable-rights evidence ahead of generic land-law material for movable-property questions", () => {
    const route = routeReferenceIssue(
      "ما الفرق بين تنظيم الأموال المنقولة وغير المنقولة عند بحث حقوق الوقف؟"
    );
    const base = {
      era: "PALESTINIAN_AUTHORITY" as const,
      territories: ["WEST_BANK" as const],
      publisher: "fixture",
      legalStatusVerified: false,
      artifactSha256: "d".repeat(64),
      locator: "document-body",
    };
    const hits = hybridReferenceSearch({
      query: "الأموال المنقولة وغير المنقولة حقوق الوقف",
      route,
      documents: [
        {
          ...base,
          documentId: "generic-land",
          title: "الإطار القانوني لعمل سلطة الأراضي",
          content: "الأموال غير المنقولة والأراضي والحقوق",
          domain: "land_law",
          authorityClass: "official_primary",
          sourceUrl: "https://official.example/land",
          artifactVersionId: "v-land",
        },
        {
          ...base,
          documentId: "movable-rights",
          title: "قرار بقانون بشأن ضمان الحقوق في المال المنقول",
          content: "تنظيم ضمان الحقوق في الأموال المنقولة",
          domain: "finance_investment",
          authorityClass: "official_derivative",
          sourceUrl: "https://official.example/movable",
          artifactVersionId: "v-movable",
        },
      ],
    });
    expect(route.priorityDomains).toEqual(["finance_investment"]);
    expect(hits[0].documentId).toBe("movable-rights");
    const pack = selectReferenceEvidencePack(hits, 4, [
      ...route.priorityDomains,
      ...route.preferredDomains,
    ]);
    expect(pack[0].documentId).toBe("movable-rights");
  });
});
