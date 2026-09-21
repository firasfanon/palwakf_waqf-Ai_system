import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  MEGA_B_REFERENCE_SEED,
  corpusCoverageSummary,
  validateReferenceCorpusItem,
} from "./referenceCorpus";
import { routeReferenceIssue } from "./referenceIssueRouter";
import {
  hybridReferenceSearch,
  selectReferenceEvidencePack,
  type ReferenceRetrievalDocument,
} from "./referenceRetrieval";
import {
  auditReferenceGradeCitations,
  buildReferenceGradeCitation,
} from "./referenceCitationEngine";
import {
  acquireCorpusItemPrivate,
  corpusItemToCollectionPolicy,
  fetchWithResilience,
  FileSystemSovereignArchiveStore,
  isRetryableHttpStatus,
} from "./referenceCorpusAcquisition";
import {
  buildApplicabilityPacket,
  buildConflictSynthesisPacket,
  buildDomainSeparationPacket,
  compareTerritorialApplicability,
} from "./referenceAnswerPolicy";
import type { LegalInstrument } from "./legalReferenceModel";
import { buildLegalStatusMatrixPilot } from "./legalStatusMatrixPilot";

describe("MEGA_B comprehensive reference foundation", () => {
  it("keeps every seed item governed and explicitly non-exhaustive", () => {
    expect(MEGA_B_REFERENCE_SEED.length).toBeGreaterThanOrEqual(10);
    for (const item of MEGA_B_REFERENCE_SEED) {
      expect(validateReferenceCorpusItem(item)).toEqual([]);
      expect(item.rights.publicDisplayAllowed).toBe(false);
      expect(item.rights.reviewStatus).toBe("pending");
    }
    const coverage = corpusCoverageSummary(MEGA_B_REFERENCE_SEED);
    expect(coverage.complete).toBe(false);
    expect(coverage.territories).toContain("WEST_BANK");
    expect(coverage.territories).toContain("GAZA");
    expect(coverage.unresolvedStatusCorpusIds.length).toBeGreaterThan(0);
  });

  it("routes Gaza questions independently from West Bank assumptions", () => {
    const route = routeReferenceIssue(
      "ما القانون النافذ في قطاع غزة بشأن تسجيل الأراضي؟"
    );
    expect(route.territories).toEqual(["GAZA"]);
    expect(route.requiresLegalStatusVerification).toBe(true);
    expect(route.preferredDomains).toContain("registration_settlement");
  });

  it("separates fiqh and positive-law concerns in mixed questions", () => {
    const route = routeReferenceIssue(
      "ما حكم الحكر في المذهب الحنفي وما القانون النافذ بشأنه؟"
    );
    expect(route.issueClass).toBe("mixed");
    expect(route.preferredDomains).toContain("fiqh");
    expect(route.preferredDomains).toContain("waqf_law");
    expect(route.requiresHumanExpertReview).toBe(true);
  });

  it("does not treat secondary authority with unverified status as a legal conclusion", () => {
    const route = routeReferenceIssue("ما القانون النافذ في الضفة بشأن الوقف؟");
    const docs: ReferenceRetrievalDocument[] = [
      {
        documentId: "official",
        title: "Official law",
        content: "قانون الوقف النافذ وتعديلاته",
        domain: "waqf_law",
        territories: ["WEST_BANK"],
        authorityClass: "official_primary",
        sourceUrl: "https://official.example/law",
        publisher: "Official",
        legalStatusVerified: true,
        artifactVersionId: "v1",
        artifactSha256: "a".repeat(64),
        locator: "article-1",
      },
      {
        documentId: "secondary",
        title: "Secondary summary",
        content: "قانون الوقف النافذ وتعديلاته قانون الوقف",
        domain: "waqf_law",
        territories: ["WEST_BANK"],
        authorityClass: "reference_secondary",
        sourceUrl: "https://secondary.example/law",
        publisher: "Secondary",
        legalStatusVerified: false,
        artifactVersionId: "v2",
        artifactSha256: "b".repeat(64),
        locator: "article-1",
      },
    ];
    const hits = hybridReferenceSearch({
      query: "قانون الوقف النافذ",
      route,
      documents: docs,
    });
    expect(hits[0].documentId).toBe("official");
    expect(
      hits.find(hit => hit.documentId === "secondary")?.usableForConclusion
    ).toBe(false);
  });

  it("selects a primary source first when a primary source is available", () => {
    const route = routeReferenceIssue("قانون الأراضي");
    const base: ReferenceRetrievalDocument = {
      documentId: "x",
      title: "قانون الأراضي",
      content: "قانون الأراضي",
      domain: "land_law",
      territories: ["WEST_BANK"],
      authorityClass: "reference_secondary",
      sourceUrl: "https://secondary.example/a",
      publisher: "secondary",
      legalStatusVerified: false,
      artifactVersionId: "v",
      artifactSha256: "c".repeat(64),
      locator: "article-1",
    };
    const hits = hybridReferenceSearch({
      query: "قانون الأراضي",
      route,
      documents: [
        base,
        {
          ...base,
          documentId: "primary",
          authorityClass: "official_primary",
          legalStatusVerified: true,
          sourceUrl: "https://official.example/a",
        },
      ],
    });
    expect(selectReferenceEvidencePack(hits, 2)[0].documentId).toBe("primary");
  });

  it("requires hash, locator and alignment for reference-grade citations", () => {
    const citation = buildReferenceGradeCitation({
      claimId: "claim-1",
      sourceUrl: "https://official.example/law",
      sourceTitle: "Law",
      artifactVersionId: "version-1",
      artifactSha256: "d".repeat(64),
      locator: { type: "article", value: "المادة (7 مكرر 1)" },
      excerpt: "نص تجريبي",
      alignmentVerified: true,
      legalStatusEvidenceRefs: ["status-1"],
    });
    expect(auditReferenceGradeCitations([citation])).toEqual({
      valid: true,
      defects: [],
    });
    expect(() =>
      buildReferenceGradeCitation({
        claimId: "bad",
        sourceUrl: "https://official.example/law",
        sourceTitle: "Law",
        artifactVersionId: "v",
        artifactSha256: "bad",
        locator: { type: "article", value: "1" },
        alignmentVerified: true,
      })
    ).toThrow("artifact_sha256_required");
  });

  it("creates bounded collection policy from a corpus item", () => {
    const item = MEGA_B_REFERENCE_SEED.find(
      row => row.corpusId === "waqf-amendment-2023"
    )!;
    const policy = corpusItemToCollectionPolicy(item);
    expect(policy.maxDepth).toBe(0);
    expect(policy.maxDocuments).toBe(1);
    expect(policy.allowedHosts).toEqual(["mjr.ogb.gov.ps"]);
  });

  it("preserves pilot bytes to a private filesystem archive with fixity", async () => {
    const root = await mkdtemp(join(tmpdir(), "waqf-mega-b-"));
    try {
      const item = {
        ...MEGA_B_REFERENCE_SEED.find(
          row => row.corpusId === "waqf-amendment-2023"
        )!,
        sourceUrl: "https://mjr.ogb.gov.ps/pilot",
        acquisition: {
          kind: "html" as const,
          respectRobotsTxt: false,
          maxDepth: 0,
          maxDocuments: 1,
        },
      };
      const result = await acquireCorpusItemPrivate({
        item,
        privateArchiveRoot: root,
        fetcher: async url => ({
          url,
          status: 200,
          contentType: "text/html; charset=utf-8",
          body: Buffer.from(
            "<html><body>مادة (1) اختبار</body></html>",
            "utf8"
          ),
          retrievedAt: "2026-09-21T18:00:00Z",
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      });
      expect(result.records).toHaveLength(1);
      const store = new FileSystemSovereignArchiveStore(root);
      expect(await store.has(result.records[0].artifact.storageKey)).toBe(true);
      expect(result.records[0].artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("uses explicit era intent as a first-class retrieval constraint", () => {
    const route = routeReferenceIssue(
      "ما تصنيف الأراضي في قانون الأراضي العثماني؟"
    );
    expect(route.preferredEras).toEqual(["OTTOMAN"]);
    const base: ReferenceRetrievalDocument = {
      documentId: "modern",
      title: "قانون أراض معاصر",
      content: "قانون الأراضي",
      domain: "land_law",
      era: "CONTEMPORARY",
      territories: ["WEST_BANK"],
      authorityClass: "official_primary",
      sourceUrl: "https://official.example/modern",
      publisher: "Official",
      legalStatusVerified: true,
      artifactVersionId: "v-modern",
      artifactSha256: "2".repeat(64),
      locator: "article-1",
    };
    const hits = hybridReferenceSearch({
      query: "قانون الأراضي العثماني",
      route,
      documents: [
        base,
        {
          ...base,
          documentId: "ottoman",
          title: "قانون الأراضي العثماني",
          era: "OTTOMAN",
          authorityClass: "reference_secondary",
          sourceUrl: "https://reference.example/ottoman",
          legalStatusVerified: false,
          artifactVersionId: "v-ottoman",
          artifactSha256: "3".repeat(64),
        },
      ],
    });
    expect(hits.map(hit => hit.documentId)).toEqual(["ottoman"]);
  });

  it("fails closed instead of falling back to an unrelated legal domain", () => {
    const route = routeReferenceIssue("ما أثر تعديل قانون الأوقاف لسنة 2023؟");
    const hits = hybridReferenceSearch({
      query: "تعديل قانون الأوقاف 2023",
      route,
      documents: [
        {
          documentId: "settlement-only",
          title: "إجراءات تسوية الأراضي",
          content: "إجراءات تسوية الأراضي وجدول الحقوق",
          domain: "registration_settlement",
          territories: ["WEST_BANK"],
          authorityClass: "official_primary",
          sourceUrl: "https://official.example/settlement",
          publisher: "Official",
          legalStatusVerified: true,
          artifactVersionId: "v-settlement",
          artifactSha256: "e".repeat(64),
          locator: "section-1",
        },
      ],
    });
    expect(hits).toEqual([]);
  });

  it("resolves historical applicability by exact territory and date", () => {
    const instrument: LegalInstrument = {
      legalId: "ottoman-land-code",
      title: "قانون الأراضي العثماني",
      instrumentType: "code",
      jurisdictionCode: "OTTOMAN_PALESTINE",
      number: null,
      year: 1858,
      enactmentDate: "1858-01-01",
      publicationDate: null,
      preservedArtifactVersionIds: ["v-ottoman"],
      territoryStatuses: [
        {
          territory: "OTTOMAN_PALESTINE",
          regime: "OTTOMAN",
          status: "HISTORICAL",
          validFrom: "1858-01-01",
          validTo: "1917-12-31",
          evidenceRefs: ["gazette-ottoman"],
          lastVerifiedAt: "2026-09-21",
        },
      ],
    };
    const historical = buildApplicabilityPacket({
      instrument,
      territory: "OTTOMAN_PALESTINE",
      onDate: "1900-01-01",
    });
    const modern = buildApplicabilityPacket({
      instrument,
      territory: "OTTOMAN_PALESTINE",
      onDate: "2026-09-21",
    });
    expect(historical.state).toBe("applicable");
    expect(historical.conclusionEligible).toBe(true);
    expect(modern.state).toBe("not_applicable");
  });

  it("never copies a West Bank legal status into Gaza", () => {
    const instrument: LegalInstrument = {
      legalId: "territorial-fixture",
      title: "Territorial fixture",
      instrumentType: "law",
      jurisdictionCode: "PS",
      number: "1",
      year: 2023,
      enactmentDate: "2023-01-01",
      publicationDate: "2023-01-01",
      preservedArtifactVersionIds: ["v-territorial"],
      territoryStatuses: [
        {
          territory: "WEST_BANK",
          regime: "PALESTINIAN",
          status: "IN_FORCE",
          validFrom: "2023-01-01",
          validTo: null,
          evidenceRefs: ["wb-official"],
          lastVerifiedAt: "2026-09-21",
        },
        {
          territory: "GAZA",
          regime: "PALESTINIAN",
          status: "UNRESOLVED",
          validFrom: "2023-01-01",
          validTo: null,
          evidenceRefs: ["gaza-unresolved"],
          lastVerifiedAt: "2026-09-21",
        },
      ],
    };
    const comparison = compareTerritorialApplicability({
      instrument,
      leftTerritory: "WEST_BANK",
      rightTerritory: "GAZA",
      onDate: "2026-09-21",
    });
    expect(comparison.left.conclusionEligible).toBe(true);
    expect(comparison.right.conclusionEligible).toBe(false);
    expect(comparison.comparisonEligible).toBe(false);
    expect(comparison.crossTerritoryLeakageAllowed).toBe(false);
  });

  it("requires separately labeled fiqh and positive-law evidence for mixed answers", () => {
    const route = routeReferenceIssue(
      "ما حكم الحكر في المذهب الحنفي وما القانون النافذ بشأن الحكر؟"
    );
    const base: ReferenceRetrievalDocument = {
      documentId: "law",
      title: "قانون الحكر",
      content: "قانون الحكر النافذ",
      domain: "lease_hukr",
      territories: ["WEST_BANK"],
      authorityClass: "official_primary",
      sourceUrl: "https://official.example/hukr",
      publisher: "Official",
      legalStatusVerified: true,
      artifactVersionId: "v-law",
      artifactSha256: "f".repeat(64),
      locator: "article-1",
    };
    const hits = hybridReferenceSearch({
      query: "الحكر المذهب الحنفي القانون",
      route,
      documents: [
        base,
        {
          ...base,
          documentId: "fiqh",
          title: "مرجع فقهي حنفي",
          content: "الحكر في الفقه الحنفي",
          domain: "fiqh",
          authorityClass: "scholarly_authoritative",
          sourceUrl: "https://fiqh.example/hukr",
          publisher: "Fiqh Reference",
          legalStatusVerified: false,
          artifactVersionId: "v-fiqh",
          artifactSha256: "1".repeat(64),
        },
      ],
    });
    const packet = buildDomainSeparationPacket({ route, hits });
    expect(packet.requiredLabels).toContain("POSITIVE_LAW");
    expect(packet.requiredLabels).toContain("FIQH");
    expect(packet.positiveLawEvidenceIds).toContain("law");
    expect(packet.fiqhEvidenceIds).toContain("fiqh");
    expect(packet.mixedAnswerAllowed).toBe(true);

    const missingFiqh = buildDomainSeparationPacket({
      route,
      hits: hits.filter(hit => hit.domain !== "fiqh"),
    });
    expect(missingFiqh.mixedAnswerAllowed).toBe(false);
    expect(missingFiqh.reasons).toContain("missing_fiqh_evidence");
  });

  it("surfaces verified evidence conflicts instead of producing a clean conclusion", () => {
    const packet = buildConflictSynthesisPacket([
      {
        assertionId: "deed-1",
        factKey: "asset:22:right-holder",
        normalizedValue: "waqf",
        sourceKind: "WAQF_DEED",
        sourceVersionId: "v-deed",
        observedAt: "1900-01-01",
        authorityRank: 1,
        verified: true,
      },
      {
        assertionId: "title-1",
        factKey: "asset:22:right-holder",
        normalizedValue: "person-a",
        sourceKind: "LAND_REGISTER",
        sourceVersionId: "v-title",
        observedAt: "2020-01-01",
        authorityRank: 1,
        verified: true,
      },
    ]);
    expect(packet.mustSurfaceConflict).toBe(true);
    expect(packet.cleanConclusionAllowed).toBe(false);
    expect(packet.conflictFactKeys).toEqual(["asset:22:right-holder"]);
  });

  it("retries transient HTTP failures but does not retry permanent 403 responses", async () => {
    let calls = 0;
    const waits: number[] = [];
    const recovered = await fetchWithResilience(
      "https://official.example/source",
      {
        timeoutMs: 500,
        attempts: 3,
        wait: async ms => {
          waits.push(ms);
        },
        fetchImpl: (async () => {
          calls += 1;
          if (calls === 1) return new Response("busy", { status: 503 });
          return new Response("ok", { status: 200 });
        }) as typeof fetch,
      }
    );
    expect(recovered.status).toBe(200);
    expect(calls).toBe(2);
    expect(waits).toEqual([500]);

    calls = 0;
    const forbidden = await fetchWithResilience(
      "https://official.example/source",
      {
        timeoutMs: 500,
        attempts: 3,
        wait: async () => {
          throw new Error("403 must not back off/retry");
        },
        fetchImpl: (async () => {
          calls += 1;
          return new Response("forbidden", { status: 403 });
        }) as typeof fetch,
      }
    );
    expect(forbidden.status).toBe(403);
    expect(calls).toBe(1);
  });

  it("classifies the network statuses that are safe to retry", () => {
    expect(isRetryableHttpStatus(408)).toBe(true);
    expect(isRetryableHttpStatus(429)).toBe(true);
    expect(isRetryableHttpStatus(503)).toBe(true);
    expect(isRetryableHttpStatus(403)).toBe(false);
    expect(isRetryableHttpStatus(404)).toBe(false);
  });

  it("retries timeout-class network errors and succeeds without hanging", async () => {
    let calls = 0;
    const waits: number[] = [];
    const response = await fetchWithResilience(
      "https://official.example/source",
      {
        timeoutMs: 500,
        attempts: 2,
        wait: async ms => {
          waits.push(ms);
        },
        fetchImpl: (async () => {
          calls += 1;
          if (calls === 1) {
            const error = new Error("simulated timeout");
            error.name = "TimeoutError";
            throw error;
          }
          return new Response("ok", { status: 200 });
        }) as typeof fetch,
      }
    );
    expect(response.status).toBe(200);
    expect(calls).toBe(2);
    expect(waits).toEqual([500]);
  });

  it("builds a territory-aware legal-status matrix without importing West Bank conclusions into Gaza", () => {
    const matrix = buildLegalStatusMatrixPilot();
    expect(matrix.rowCount).toBeGreaterThanOrEqual(5);
    const waqfWestBank = matrix.rows.find(
      row => row.rowId === "waqf-2023-west-bank"
    )!;
    const waqfGaza = matrix.rows.find(row => row.rowId === "waqf-2023-gaza")!;
    const settlement = matrix.rows.find(
      row => row.rowId === "settlement-40-1952-west-bank"
    )!;
    const gazaLand = matrix.rows.find(row => row.rowId === "land-regime-gaza")!;

    expect(waqfWestBank.legalStatusVerified).toBe(true);
    expect(waqfWestBank.territoryScopeVerified).toBe(true);
    expect(waqfWestBank.conclusionEligible).toBe(true);

    expect(waqfGaza.assertedStatus).toBe("UNRESOLVED");
    expect(waqfGaza.conclusionEligible).toBe(false);
    expect(waqfGaza.reviewRequired).toBe(true);

    expect(settlement.currentOfficialApplicationVerified).toBe(true);
    expect(settlement.territoryScopeVerified).toBe(true);
    expect(settlement.legalStatusVerified).toBe(false);
    expect(settlement.conclusionEligible).toBe(false);
    expect(settlement.reasons).toContain(
      "current_application_does_not_replace_status_verification"
    );

    expect(gazaLand.territoryScopeVerified).toBe(true);
    expect(gazaLand.legalStatusVerified).toBe(false);
    expect(gazaLand.conclusionEligible).toBe(false);
    expect(matrix.unresolvedGazaRows).toBeGreaterThanOrEqual(2);
  });
});
