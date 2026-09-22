import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import {
  buildMegaDAssetTitlePacket,
  buildMegaDConclusionGate,
  buildMegaDDeedPacket,
  buildMegaDJurisdictionPacket,
  buildMegaDStructuredRetrievalDocument,
} from "../server/referenceMegaD";
import { routeReferenceIssue } from "../server/referenceIssueRouter";
import { hybridReferenceSearch } from "../server/referenceRetrieval";
import {
  auditReferenceGradeCitations,
  buildReferenceGradeCitation,
} from "../server/referenceCitationEngine";

const privateRoot = resolve(
  homedir(),
  ".palwakf",
  "private_reference_cache",
  "waqf-ai-mega-d"
);
const fixturePath = resolve(
  privateRoot,
  "controlled-private-deed-fixture.json"
);
const evidencePath = resolve(
  "evidence",
  "WAQF_AI_COMPREHENSIVE_REFERENCE_MEGA_D_PRIVATE_PILOT_20260922.json"
);
const realOttomanPath = resolve(
  homedir(),
  ".palwakf",
  "private_reference_cache",
  "waqf-ai-mega-c",
  "waqf-reference-ottoman-land-code-1858-registry",
  "objects",
  "artifact-ca0885c20565314b78ae7bbc8a2fc382",
  "sha256-bd4c856c808762a0ae805124203a343e6b2f7d3ca8a09445cae45a636979b15f"
);

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const fixture = {
  fixtureKind: "CONTROLLED_PRIVATE_DEED_FIXTURE",
  title: "حجة وقف تجريبية خاصة لا تمثل وثيقة تاريخية أصلية",
  deedId: "mega-d-private-fixture-deed-1",
  assetId: "mega-d-private-fixture-asset-1",
  text: "وقف عقار معلوم الحدود على جهة بر وفق شروط مضبوطة للاختبار.",
  locator: "fixture-page-1:line-1",
};

await mkdir(privateRoot, { recursive: true });
const fixtureBytes = Buffer.from(
  JSON.stringify(fixture, null, 2) + "\n",
  "utf8"
);
await writeFile(fixturePath, fixtureBytes);
const fixtureSha = sha256(fixtureBytes);
const fixtureVersion = "version-" + fixtureSha.slice(0, 32);
let realReferenceEvidenceVerified = false;
let realReferenceSha: string | null = null;
try {
  const bytes = await readFile(realOttomanPath);
  realReferenceSha = sha256(bytes);
  realReferenceEvidenceVerified =
    realReferenceSha ===
    "bd4c856c808762a0ae805124203a343e6b2f7d3ca8a09445cae45a636979b15f";
} catch {
  realReferenceEvidenceVerified = false;
}

const deed = buildMegaDDeedPacket({
  deed: {
    deedId: fixture.deedId,
    title: fixture.title,
    deedDate: "1552-01-01",
    courtOrAuthority: "CONTROLLED_PRIVATE_FIXTURE",
    waqifEntityIds: ["fixture-waqif"],
    assetIds: [fixture.assetId],
    beneficiaryIds: ["fixture-beneficiary"],
    nazirEntityIds: ["fixture-nazir"],
    witnessEntityIds: [],
    waqfType: "CHARITABLE",
    conditionIds: ["fixture-condition-1"],
    relatedDeedIds: [],
    preservedArtifactVersionId: fixtureVersion,
    transcriptionReferenceId: "fixture-transcription-1",
    registrationStatus: "UNRESOLVED",
    settlementStatus: "UNRESOLVED",
  },
  transcription: {
    transcriptionId: "fixture-transcription-1",
    artifactVersionId: fixtureVersion,
    pages: [],
    fullText: fixture.text,
    meanConfidence: 1,
    minimumConfidence: 1,
    requiresHumanReview: false,
    uncertainSegmentCount: 0,
  },
  conditions: [
    {
      conditionId: "fixture-condition-1",
      deedId: fixture.deedId,
      conditionType: "PURPOSE",
      text: "جهة بر",
      locator: fixture.locator,
      preservedArtifactVersionId: fixtureVersion,
      confidence: 1,
      verified: true,
    },
  ],
});

const assetTitle = buildMegaDAssetTitlePacket({
  asset: {
    assetId: fixture.assetId,
    canonicalName: "أصل عقاري تجريبي خاص",
    assetKind: "IMMOVABLE",
    waqfType: "CHARITABLE",
    landClass: "UNRESOLVED",
    historicalPlaceNames: ["بيت لحم"],
    currentParcelRefs: ["fixture-28038/1"],
    preservedEvidenceVersionIds: [fixtureVersion],
  },
  rights: [
    {
      rightId: "fixture-right-1",
      assetId: fixture.assetId,
      rightType: "USUFRUCT",
      holderEntityId: "fixture-beneficiary",
      validFrom: "1552-01-01",
      validTo: null,
      evidenceVersionIds: [fixtureVersion],
      confidence: 1,
      verified: true,
    },
  ],
  titleEvents: [
    {
      eventId: "fixture-title-event-1",
      assetId: fixture.assetId,
      eventType: "WAQF_DEED",
      occurredAt: "1552-01-01",
      sequenceHint: 1,
      evidenceVersionIds: [fixtureVersion],
      factSummary: "Controlled private deed event",
      confidence: 1,
      verified: true,
    },
  ],
  parcelCandidates: [
    {
      parcelRef: "fixture-28038/1",
      candidateName: "بيت لحم",
      evidence: [
        {
          evidenceId: "fixture-title-anchor",
          type: "TITLE_RECORD",
          value: "fixture-28038/1",
          sourceArtifactVersionId: fixtureVersion,
          verified: true,
          weight: 1,
        },
        {
          evidenceId: "fixture-survey-anchor",
          type: "SURVEY_MAP",
          value: "fixture-28038/1",
          sourceArtifactVersionId: "fixture-survey-version",
          verified: true,
          weight: 1,
        },
      ],
    },
  ],
});

const jurisdiction = buildMegaDJurisdictionPacket({
  issue: "PROPERTY_OWNERSHIP",
  territory: "OTTOMAN_PALESTINE",
  regime: "OTTOMAN",
  onDate: "1870-01-01",
  rules: [
    {
      ruleId: "controlled-ottoman-jurisdiction-fixture",
      issue: "PROPERTY_OWNERSHIP",
      territory: "OTTOMAN_PALESTINE",
      regime: "OTTOMAN",
      validFrom: "1858-01-01",
      validTo: "1917-12-31",
      authorityClass: "CONTROLLED_PILOT_RULE",
      competentAuthority: "CONTROLLED_PILOT_AUTHORITY",
      proceduralLawLegalId: "ottoman-land-code-1858",
      evidenceRefs: realReferenceSha ? ["sha256:" + realReferenceSha] : [],
      verified: realReferenceEvidenceVerified,
    },
  ],
  legalStatusGate: {
    verified: realReferenceEvidenceVerified,
    evidenceRefs: realReferenceSha ? ["sha256:" + realReferenceSha] : [],
  },
});
const conclusionGate = buildMegaDConclusionGate({
  deed,
  assetTitle,
  jurisdiction,
  assertions: [
    {
      assertionId: "fixture-assertion-1",
      factKey: "asset:" + fixture.assetId + ":waqf_status",
      normalizedValue: "waqf",
      sourceKind: "WAQF_DEED",
      sourceVersionId: fixtureVersion,
      observedAt: "1552-01-01",
      authorityRank: 1,
      verified: true,
    },
  ],
});

const document = buildMegaDStructuredRetrievalDocument({
  deed,
  assetTitle,
  jurisdiction,
  conclusionGate,
  source: {
    domain: "land_law",
    era: "OTTOMAN",
    territories: ["OTTOMAN_PALESTINE"],
    authorityClass: "archival_primary",
    sourceUrl: "private://waqf-ai-mega-d/controlled-private-deed-fixture",
    publisher: "WAQF_AI controlled private pilot",
    artifactVersionId: fixtureVersion,
    artifactSha256: fixtureSha,
    locator: fixture.locator,
  },
});
const route = routeReferenceIssue(
  "ما علاقة حجة الوقف الخاصة بأصل عقاري مع سجل تاريخي في فلسطين العثمانية؟"
);
const hits = hybridReferenceSearch({
  query: "حجة وقف أصل عقاري فلسطين العثمانية",
  route,
  documents: [document],
  limit: 4,
});

const citation = buildReferenceGradeCitation({
  claimId: "mega-d-private-pilot-claim-1",
  sourceUrl: document.sourceUrl,
  sourceTitle: document.title,
  artifactVersionId: document.artifactVersionId,
  artifactSha256: document.artifactSha256,
  locator: { type: "page", value: "fixture-page-1" },
  excerpt: fixture.text,
  alignmentVerified: true,
  legalStatusEvidenceRefs: realReferenceSha
    ? ["sha256:" + realReferenceSha]
    : [],
});
const citationAudit = auditReferenceGradeCitations([citation]);

const pipelinePass =
  deed.conclusionEligible &&
  assetTitle.conclusionEligible &&
  jurisdiction.conclusionEligible &&
  conclusionGate.conclusionEligible &&
  citationAudit.valid;

const report = {
  program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
  phase: "MEGA_D_PRIVATE_E2E_PILOT",
  generatedAt: new Date().toISOString(),
  hardBoundaries: {
    liveSharedSupabaseMutation: false,
    mainMerge: false,
    baselinePromotion: false,
    production: false,
    publicCorpusRelease: false,
  },
  networkCalls: 0,
  privateFixture: {
    kind: fixture.fixtureKind,
    path: "<USER_HOME>/.palwakf/private_reference_cache/waqf-ai-mega-d/controlled-private-deed-fixture.json",
    sha256: fixtureSha,
    artifactVersionId: fixtureVersion,
    realHistoricalDeedArtifact: false,
  },
  realPreservedReferenceEvidence: {
    corpusId: "ottoman-land-code-1858-registry",
    expectedSha256:
      "bd4c856c808762a0ae805124203a343e6b2f7d3ca8a09445cae45a636979b15f",
    observedSha256: realReferenceSha,
    fixityVerified: realReferenceEvidenceVerified,
  },
  gates: {
    deed,
    assetTitle,
    jurisdiction,
    conclusionGate,
    ragHitCount: hits.length,
    ragTopDocumentId: hits[0]?.documentId || null,
    citationAudit,
  },
  pipelinePass,
  specialistExpertReviewSatisfied: false,
  realHistoricalDeedAcceptanceSatisfied: false,
  disposition: pipelinePass
    ? "PASS_PIPELINE_REAL_HISTORICAL_DEED_ARTIFACT_DEFERRED"
    : "FAIL_CLOSED_PIPELINE",
};

await mkdir(resolve("evidence"), { recursive: true });
await writeFile(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(
  JSON.stringify(
    {
      evidencePath,
      pipelinePass,
      disposition: report.disposition,
      realReferenceEvidenceVerified,
      realHistoricalDeedAcceptanceSatisfied:
        report.realHistoricalDeedAcceptanceSatisfied,
      ragHitCount: hits.length,
      citationValid: citationAudit.valid,
    },
    null,
    2
  )
);
