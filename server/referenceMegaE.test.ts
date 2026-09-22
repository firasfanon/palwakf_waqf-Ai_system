import { describe, expect, it } from "vitest";
import {
  assessMegaEHistoricalArtifact,
  buildHasekiRealDeedBenchmark,
  buildMegaECorpusConvergence,
  megaESourceFamilies,
  type MegaEHistoricalArtifactManifest,
} from "./referenceMegaE";
import {
  buildMegaDAssetTitlePacket,
  buildMegaDConclusionGate,
  buildMegaDDeedPacket,
  buildMegaDJurisdictionPacket,
  buildMegaDStructuredRetrievalDocument,
} from "./referenceMegaD";
import {
  buildMegaENegativeAuthorizationMatrix,
  evaluateMegaEAccess,
  projectSensitiveDeedForRole,
} from "./preProductionAccessMegaE";
import {
  buildMegaESpecialistReadinessQueue,
  developerExperimentalBinding,
  validateBoundHumanExpertDecision,
  type ReviewerAuthorityBinding,
} from "./expertReviewMegaE";
import { routeReferenceIssue } from "./referenceIssueRouter";
import { hybridReferenceSearch } from "./referenceRetrieval";
import type { HumanExpertDecision } from "./expertReviewQueue";

const manifest: MegaEHistoricalArtifactManifest = {
  artifactId: "haseki-hurrem-sultan-kudus-vakfiyesi-vgm2017-public-mirror",
  documentIdentity: "Haseki Hürrem Sultan Kudüs Vakfiyesi",
  editionPublisher: "Vakıflar Genel Müdürlüğü",
  editionYear: 2017,
  editionSeries: "Vakıflar Genel Müdürlüğü Yayınları - 125",
  isbn: "978-975-19-6697-1",
  historicalDocumentDate: null,
  historicalDocumentDateLabel: "mid-Shaaban 964 AH",
  historicalDocumentGregorianRange: "1557-06-09/1557-06-18",
  historicalDateEvidenceStrength:
    "PRIMARY_TRANSLATION_LABEL_PLUS_SCHOLARLY_GREGORIAN_CORROBORATION",
  acquisitionUrl:
    "https://drive.google.com/file/d/17e-jsPPSweDmkRDsd1MSUJBiW25yBbmU/view?usp=sharing",
  acquisitionHostRole: "PUBLIC_MIRROR",
  officialOriginDownload: false,
  officialEditionIdentityVerified: true,
  identityEvidence: ["vgm-publication-record", "ttk-record-587932"],
  pdfSha256: "5e4e1b095c29810793d9bbaabf5c632ac8628617497125aaf78fd919c22687ef",
  pdfBytes: 4_456_626,
  pageCount: 120,
  pdfCreationDate: "2017-08-08T14:08:16+03:00",
  pdfCreator: "Adobe InDesign CC 2015 (Macintosh)",
  extractedTextFile:
    "haseki-hurrem-sultan-kudus-vakfiyesi-public-mirror.full.extract.txt",
  extractionTool: "pypdf temporary local parser outside repository",
  benchmarkLocators: {
    bethlehemShare: "translation-page-10:item-14",
    beitJalaShare: "translation-page-10:item-15",
  },
  normalizedClaims: {
    bethlehemShare: "18/24",
    beitJalaShare: "18/24",
  },
  rights: {
    privatePreservation: true,
    privateResearchBenchmark: true,
    publicDisplay: false,
    publicDownload: false,
    rightsReviewStatus: "PENDING",
  },
  canonicalAdmission: false,
  specialistReview: "PENDING",
  distinctEarlierWaqfiyya: {
    date: "1552-05-24",
    language: "Turkish",
    sameDocument: false,
    note: "Separate earlier waqfiyya.",
  },
  notes: [],
};

describe("WAQF_AI MEGA_E real evidence and pre-production governance", () => {
  it("admits the identity-verified mirror for private benchmark but not canonical/public use", () => {
    const decision = assessMegaEHistoricalArtifact(manifest);
    expect(decision.identityVerified).toBe(true);
    expect(decision.privateBenchmarkEligible).toBe(true);
    expect(decision.officialOriginDownload).toBe(false);
    expect(decision.canonicalAdmissionEligible).toBe(false);
    expect(decision.publicReleaseEligible).toBe(false);
    expect(decision.reasons).toContain("artifact_bytes_from_public_mirror");
    expect(decision.reasons).toContain("rights_review_pending");
    expect(decision.reasons).toContain("specialist_review_pending");
  });

  it("advances historical waqf coverage to PARTIAL without rewriting MEGA_C history", () => {
    const families = megaESourceFamilies();
    const historical = families.find(row => row.familyId === "HISTORICAL_WAQF");
    const sharia = families.find(row => row.familyId === "SHARIA_PRIMARY");
    const fiqh = families.find(row => row.familyId === "FIQH_CLASSICAL");
    expect(historical?.coverageState).toBe("PARTIAL");
    expect(historical?.seedCorpusIds).toContain(
      "haseki-hurrem-kudus-waqfiyya-vgm-2017-public-mirror"
    );
    expect(sharia?.coverageState).toBe("NOT_STARTED");
    expect(fiqh?.coverageState).toBe("NOT_STARTED");
  });

  it("keeps unresolved corpus debt explicit while advancing historical waqf evidence", () => {
    const ledger = buildMegaECorpusConvergence();
    expect(
      ledger.find(row => row.familyId === "HISTORICAL_WAQF")
    ).toMatchObject({
      state: "ADVANCED",
      coverageState: "PARTIAL",
    });
    expect(ledger.find(row => row.familyId === "SHARIA_PRIMARY")).toMatchObject(
      {
        state: "DEFERRED",
        coverageState: "NOT_STARTED",
      }
    );
    expect(ledger.find(row => row.familyId === "FIQH_CLASSICAL")).toMatchObject(
      {
        state: "DEFERRED",
        coverageState: "NOT_STARTED",
      }
    );
    expect(
      ledger.find(row => row.familyId === "LAND_GAZA_CURRENT")?.blocker
    ).toBe("territory_specific_status_evidence_unresolved");
  });

  it("keeps the 1552 Turkish deed distinct from the preserved 964 AH Arabic deed", () => {
    const benchmark = buildHasekiRealDeedBenchmark(manifest);
    expect(manifest.distinctEarlierWaqfiyya?.sameDocument).toBe(false);
    expect(benchmark.historicalDateLabel).toBe("mid-Shaaban 964 AH");
    expect(benchmark.historicalGregorianRange).toBe("1557-06-09/1557-06-18");
    expect(benchmark.exactGregorianDateResolved).toBe(false);
  });

  it("extracts Bethlehem and Beit Jala as separate historical 18/24 waqf shares", () => {
    const benchmark = buildHasekiRealDeedBenchmark(manifest);
    expect(benchmark.normalizedShares).toEqual({
      bethlehem: "18/24",
      beitJala: "18/24",
    });
    expect(benchmark.locators).toEqual({
      bethlehemShare: "translation-page-10:item-14",
      beitJalaShare: "translation-page-10:item-15",
    });
    expect(benchmark.assets).toHaveLength(2);
    expect(benchmark.assets[0].currentParcelRefs).toEqual([]);
    expect(benchmark.assets[1].currentParcelRefs).toEqual([]);
    expect(benchmark.modernParcelIdentityResolved).toBe(false);
    expect(benchmark.modernOwnershipInferenceAllowed).toBe(false);
  });

  it("passes deed identity/provenance while keeping historical title-date continuity fail-closed", () => {
    const benchmark = buildHasekiRealDeedBenchmark(manifest);
    const deed = buildMegaDDeedPacket({
      deed: benchmark.deed,
      transcription: benchmark.transcription,
      conditions: [],
    });
    expect(deed.state).toBe("PASS");
    for (const asset of benchmark.assets) {
      const packet = buildMegaDAssetTitlePacket({
        asset,
        rights: benchmark.rights.filter(row => row.assetId === asset.assetId),
        titleEvents: benchmark.titleEvents.filter(
          row => row.assetId === asset.assetId
        ),
        parcelCandidates: [],
      });
      expect(packet.state).toBe("FAIL_CLOSED");
      expect(packet.unresolvedDateEventIds).toHaveLength(1);
      expect(packet.ownershipInferenceAllowed).toBe(false);
    }
  });

  it("keeps historical jurisdiction fail-closed without a verified Ottoman rule", () => {
    const packet = buildMegaDJurisdictionPacket({
      issue: "WAQF_PROOF",
      territory: "OTTOMAN_PALESTINE",
      regime: "OTTOMAN",
      onDate: "1557-06-14",
      rules: [],
      legalStatusGate: {
        verified: false,
        evidenceRefs: [],
        deferred: true,
      },
    });
    expect(packet.state).toBe("FAIL_CLOSED");
    expect(packet.reasons).toContain("territory_legal_status_deferred");
    expect(packet.reasons.join("|")).toContain("no_verified_jurisdiction_rule");
  });

  it("does not make real historical evidence conclusion-usable when integrated gates remain closed", () => {
    const benchmark = buildHasekiRealDeedBenchmark(manifest);
    const deed = buildMegaDDeedPacket({
      deed: benchmark.deed,
      transcription: benchmark.transcription,
      conditions: [],
    });
    const assetTitle = buildMegaDAssetTitlePacket({
      asset: benchmark.assets[0],
      rights: benchmark.rights.filter(
        row => row.assetId === benchmark.assets[0].assetId
      ),
      titleEvents: benchmark.titleEvents.filter(
        row => row.assetId === benchmark.assets[0].assetId
      ),
      parcelCandidates: [],
    });
    const jurisdiction = buildMegaDJurisdictionPacket({
      issue: "WAQF_PROOF",
      territory: "OTTOMAN_PALESTINE",
      regime: "OTTOMAN",
      onDate: "1557-06-14",
      rules: [],
      legalStatusGate: { verified: false, evidenceRefs: [], deferred: true },
    });
    const gate = buildMegaDConclusionGate({
      deed,
      assetTitle,
      jurisdiction,
      assertions: [],
    });
    const document = buildMegaDStructuredRetrievalDocument({
      deed,
      assetTitle,
      jurisdiction,
      conclusionGate: gate,
      source: {
        domain: "historical",
        era: "OTTOMAN",
        territories: ["OTTOMAN_PALESTINE", "HISTORIC_PALESTINE"],
        authorityClass: "reference_secondary",
        sourceUrl: manifest.acquisitionUrl,
        publisher: manifest.editionPublisher,
        artifactVersionId: benchmark.deed.preservedArtifactVersionId,
        artifactSha256: manifest.pdfSha256,
        locator: manifest.benchmarkLocators.bethlehemShare,
      },
    });
    const route = routeReferenceIssue(
      "ما الذي تثبته وقفية هاسكي سلطان تاريخيًا عن بيت لحم؟"
    );
    const hits = hybridReferenceSearch({
      query: "وقفية هاسكي سلطان بيت لحم 18 قيراط",
      route,
      documents: [document],
    });
    expect(gate.state).toBe("FAIL_CLOSED");
    expect(document.structuredConclusionEligible).toBe(false);
    expect(hits).toHaveLength(1);
    expect(hits[0].usableForConclusion).toBe(false);
  });

  it("requires separate authority for live DB, main, baseline and production across every role", () => {
    const matrix = buildMegaENegativeAuthorizationMatrix();
    expect(matrix).toHaveLength(68);
    for (const row of matrix) {
      expect(
        evaluateMegaEAccess({ role: row.role, action: row.action }).disposition
      ).toBe("SEPARATE_AUTH_REQUIRED");
    }
  });

  it("does not grant developer or access admin specialist approval authority", () => {
    expect(
      evaluateMegaEAccess({
        role: "DEVELOPER_ENGINEER",
        action: "SPECIALIST_DECISION_APPROVE",
        requestedSpecialistRole: "WAQF_DEED_REVIEWER",
      }).disposition
    ).toBe("DENY");
    expect(
      evaluateMegaEAccess({
        role: "SYSTEM_ACCESS_ADMIN",
        action: "SPECIALIST_DECISION_APPROVE",
        requestedSpecialistRole: "LEGAL_STATUS_REVIEWER",
      }).disposition
    ).toBe("DENY");
  });

  it("enforces territory scope for legal-status reviewers", () => {
    const decision = evaluateMegaEAccess({
      role: "LEGAL_STATUS_REVIEWER",
      action: "SPECIALIST_DECISION_APPROVE",
      requestedSpecialistRole: "LEGAL_STATUS_REVIEWER",
      territory: "GAZA",
      reviewerTerritories: ["WEST_BANK"],
    });
    expect(decision.disposition).toBe("DENY");
    expect(decision.reasons).toContain("territory_scope_mismatch");
  });

  it("redacts sensitive deed parties from ordinary research access", () => {
    const deed = {
      deedId: "d1",
      title: "sensitive fixture",
      beneficiaryIds: ["beneficiary-secret"],
      witnessEntityIds: ["witness-secret"],
      nazirEntityIds: ["nazir-secret"],
    };
    const ordinary = projectSensitiveDeedForRole({
      role: "RESEARCH_USER",
      deed,
    });
    const specialist = projectSensitiveDeedForRole({
      role: "SECURITY_PRIVACY_REVIEWER",
      deed,
    });
    expect(ordinary.sensitiveFieldsRedacted).toBe(true);
    expect(ordinary.beneficiaryIds).toEqual([]);
    expect(specialist.sensitiveFieldsRedacted).toBe(false);
    expect(specialist.beneficiaryIds).toEqual(["beneficiary-secret"]);
  });

  it("rejects developer experimental authority as production specialist binding", () => {
    const queue = buildMegaESpecialistReadinessQueue();
    const review = queue.find(
      row => row.reviewId === "review-mega-e-haseki-deed-interpretation"
    );
    expect(review).toBeDefined();
    const decision: HumanExpertDecision = {
      decisionId: "decision-1",
      reviewId: review!.reviewId,
      reviewerRole: "WAQF_DEED_REVIEWER",
      reviewerIdentity: "WAQF_AI_DEV_HUMAN_001",
      decidedAt: "2026-09-22T22:00:00+03:00",
      disposition: "APPROVED",
      evidenceRefs: [...review!.evidenceRefs],
      rationale: "experimental developer approval must not satisfy this gate",
      humanAttested: true,
    };
    const errors = validateBoundHumanExpertDecision({
      decision,
      binding: developerExperimentalBinding(),
      queue,
    });
    expect(errors).toContain("real_person_verification_required");
    expect(errors).toContain("application_account_binding_required");
    expect(errors).toContain("credential_evidence_required");
    expect(errors).toContain("bound_role_missing");
  });

  it("accepts a fully bound specialist decision only when identity, account, role, territory and credentials match", () => {
    const queue = buildMegaESpecialistReadinessQueue();
    const review = queue.find(
      row => row.reviewId === "review-mega-e-haseki-deed-interpretation"
    )!;
    const decision: HumanExpertDecision = {
      decisionId: "decision-specialist-1",
      reviewId: review.reviewId,
      reviewerRole: "WAQF_DEED_REVIEWER",
      reviewerIdentity: "specialist-001",
      decidedAt: "2026-09-22T22:00:00+03:00",
      disposition: "APPROVED_WITH_LIMITS",
      evidenceRefs: [...review.evidenceRefs],
      rationale: "bounded specialist test decision",
      humanAttested: true,
    };
    const binding: ReviewerAuthorityBinding = {
      reviewerId: "specialist-001",
      realPersonVerified: true,
      applicationAccountBound: true,
      active: true,
      roles: ["WAQF_DEED_REVIEWER"],
      territories: ["OTTOMAN_PALESTINE"],
      authorityRef: "authority-test-001",
      credentialEvidenceRefs: ["credential-test-001"],
    };
    expect(
      validateBoundHumanExpertDecision({ decision, binding, queue })
    ).toEqual([]);
  });
});
