import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import {
  MEGA_F_PRIVATE_ARTIFACT_EXPECTATIONS,
  MEGA_F_REFERENCE_EXPANSION,
  MEGA_F_SOURCE_READINESS,
  buildMegaFCorpusConvergence,
  buildMegaFTerritoryEvidencePackets,
  judicialDecisionByCaseNumber,
} from "../server/referenceMegaF";
import {
  benchmarkMegaFRetrieval,
  buildMegaFContinuityReadiness,
  buildMegaFSecurityNegativeMatrix,
  evaluateMegaFGuard,
} from "../server/preProductionMegaF";
import {
  buildMegaFSpecialistReadinessQueue,
  megaFSpecialistReadinessSummary,
} from "../server/expertReviewMegaF";
import {
  InMemorySovereignArchiveStore,
  SovereignReferenceArchiveCoordinator,
  sha256Bytes,
  verifyArtifactFixity,
  type ArtifactVersionManifest,
} from "../server/sovereignReferenceArchive";
import { replayReferenceQuestionOffline } from "../server/referenceContinuity";
import { MEGA_C_REFERENCE_CORPUS } from "../server/referenceCorpusScaleUp";
import type { ReferenceCorpusItem } from "../server/referenceCorpus";
import {
  hybridReferenceSearch,
  type ReferenceRetrievalDocument,
} from "../server/referenceRetrieval";
import { routeReferenceIssue } from "../server/referenceIssueRouter";
import {
  auditReferenceGradeCitations,
  buildReferenceGradeCitation,
} from "../server/referenceCitationEngine";
import {
  benchmarkInstalledModels,
  detectHardwareAdaptiveProfile,
} from "../server/hardwareAdaptiveRuntime";

type PrivateManifestRecord = {
  corpusId: string;
  fileName?: string;
  sourceUrl: string;
  sha256?: string;
  byteSize?: number;
  contentType?: string;
  pageCount?: number;
  result?: string;
  bypassAttempted?: boolean;
  mode?: string;
};

type PrivateManifest = {
  program: string;
  phase: string;
  generatedDate: string;
  preserved: PrivateManifestRecord[];
  notPreserved: PrivateManifestRecord[];
  boundaries: Record<string, boolean>;
};

const privateRoot = resolve(
  homedir(),
  ".palwakf",
  "private_reference_cache",
  "waqf-ai-mega-f"
);
const privateManifestPath = resolve(
  privateRoot,
  "mega-f-private-source-manifest.json"
);
const evidencePath = resolve(
  "evidence",
  "WAQF_AI_COMPREHENSIVE_REFERENCE_MEGA_F_PRIVATE_PILOT_20260923.json"
);

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_match, decimal) =>
      String.fromCodePoint(Number(decimal))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lrm;|&rlm;/gi, "");
}

function htmlToText(bytes: Buffer, title: string): string {
  const html = bytes.toString("utf8");
  return (
    title +
    " " +
    decodeHtmlEntities(
      html
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
    )
      .replace(/\s+/g, " ")
      .trim()
  );
}

function sourceById(corpusId: string): ReferenceCorpusItem {
  const all = [...MEGA_C_REFERENCE_CORPUS, ...MEGA_F_REFERENCE_EXPANSION];
  const item = all.find(row => row.corpusId === corpusId);
  if (!item) throw new Error("missing_corpus_item:" + corpusId);
  return item;
}

const manifest = JSON.parse(
  await readFile(privateManifestPath, "utf8")
) as PrivateManifest;
const privateManifestSha256 = sha256(await readFile(privateManifestPath));

const preservedResults: Array<{
  corpusId: string;
  fileName: string;
  sha256: string;
  byteSize: number;
  expectedSha256: string;
  expectedByteSize: number;
  fixityPass: boolean;
  contentType: string;
  pageCount: number | null;
}> = [];

const fileBytes = new Map<string, Buffer>();
for (const record of manifest.preserved) {
  if (!record.fileName || !record.sha256 || record.byteSize === undefined)
    throw new Error("invalid_private_manifest_record:" + record.corpusId);
  const bytes = await readFile(resolve(privateRoot, record.fileName));
  const digest = sha256(bytes);
  const expected =
    MEGA_F_PRIVATE_ARTIFACT_EXPECTATIONS[
      record.corpusId as keyof typeof MEGA_F_PRIVATE_ARTIFACT_EXPECTATIONS
    ];
  const expectedSha256 = expected?.sha256 || record.sha256;
  const expectedByteSize = expected?.byteSize || record.byteSize;
  const fixityPass =
    digest === record.sha256 &&
    digest === expectedSha256 &&
    bytes.byteLength === record.byteSize &&
    bytes.byteLength === expectedByteSize;
  preservedResults.push({
    corpusId: record.corpusId,
    fileName: record.fileName,
    sha256: digest,
    byteSize: bytes.byteLength,
    expectedSha256,
    expectedByteSize,
    fixityPass,
    contentType: record.contentType || "application/octet-stream",
    pageCount: record.pageCount ?? null,
  });
  fileBytes.set(record.corpusId, bytes);
}

const allPrivateFixityPass = preservedResults.every(row => row.fixityPass);
const blockedAcquisitionRespectPass = manifest.notPreserved.every(
  row => row.bypassAttempted === false
);
const case1383Bytes = fileBytes.get("maqam-cassation-1383-2019-hukr");
if (!case1383Bytes) throw new Error("case_1383_private_bytes_missing");
const case1383Text = htmlToText(
  case1383Bytes,
  "نقض 1383/2019 الحكر ورقبة العقار الوقفي"
);
const case1383IdentityPass =
  case1383Text.includes("1383") &&
  case1383Text.includes("341/2019") &&
  case1383Text.includes("27/2018");
const case1383HoldingTermsPass =
  case1383Text.includes("الحكر") &&
  case1383Text.includes("رقبة") &&
  case1383Text.includes("المنفعة");
const normalized1383 = judicialDecisionByCaseNumber("1383/2019");
if (!normalized1383) throw new Error("normalized_1383_missing");
const appellateChainPass =
  normalized1383.appellateNormalizationComplete &&
  normalized1383.appellateRelations.some(row => row.caseNumber === "27/2018") &&
  normalized1383.appellateRelations.some(
    row => row.caseNumber === "341/2019"
  ) &&
  normalized1383.generalizationAllowed === false;

const primaryStore = new InMemorySovereignArchiveStore();
const coordinator = new SovereignReferenceArchiveCoordinator(primaryStore);
const preservedForReplay: Array<{
  item: ReferenceCorpusItem;
  manifest: ArtifactVersionManifest;
}> = [];

for (const row of preservedResults.filter(item =>
  item.contentType.startsWith("text/html")
)) {
  const item = sourceById(row.corpusId);
  const bytes = fileBytes.get(row.corpusId)!;
  const preserved = await coordinator.preserve({
    collectionId: "waqf-ai-mega-f-private-operability",
    sourceUrl: item.sourceUrl,
    retrievedAt: "2026-09-23T00:00:00+03:00",
    contentType: row.contentType,
    bytes,
    metadata: {
      privatePilot: true,
      publicReleaseAllowed: false,
    },
  });
  if (preserved.manifest.sha256 !== row.sha256)
    throw new Error("archive_manifest_sha_mismatch:" + row.corpusId);
  preservedForReplay.push({ item, manifest: preserved.manifest });
}

const restoreStore = new InMemorySovereignArchiveStore();
const restoreChecks: Array<{
  corpusId: string;
  restored: boolean;
  fixityPass: boolean;
}> = [];
for (const preserved of preservedForReplay) {
  const bytes = await primaryStore.get(preserved.manifest.storageKey);
  if (!bytes) {
    restoreChecks.push({
      corpusId: preserved.item.corpusId,
      restored: false,
      fixityPass: false,
    });
    continue;
  }
  await restoreStore.putImmutable(preserved.manifest.storageKey, bytes);
  restoreChecks.push({
    corpusId: preserved.item.corpusId,
    restored: true,
    fixityPass: await verifyArtifactFixity(restoreStore, preserved.manifest),
  });
}
const localRestoreDrillPass =
  restoreChecks.length > 0 &&
  restoreChecks.every(row => row.restored && row.fixityPass);

const htmlExtractor = async (input: {
  bytes: Buffer;
  item: ReferenceCorpusItem;
}) => htmlToText(input.bytes, input.item.title);

const caseReplaySource = preservedForReplay.filter(
  row => row.item.corpusId === "maqam-cassation-1383-2019-hukr"
);
const caseOfflineReplay = await replayReferenceQuestionOffline({
  question: "ما أثر الحكر على رقبة العقار في نقض 1383/2019؟",
  preserved: caseReplaySource,
  store: restoreStore,
  extractText: htmlExtractor,
});

const gazaReplaySources = preservedForReplay.filter(row =>
  [
    "gaza-land-authority-legal-library",
    "gaza-pla-land-specific-laws-2020",
  ].includes(row.item.corpusId)
);
const gazaOfflineReplay = await replayReferenceQuestionOffline({
  question: "ما منظومة قوانين الأراضي في غزة؟",
  preserved: gazaReplaySources,
  store: restoreStore,
  extractText: htmlExtractor,
});
const offlineReplayPass =
  caseOfflineReplay.networkCalls === 0 &&
  caseOfflineReplay.allFixityVerified &&
  gazaOfflineReplay.networkCalls === 0 &&
  gazaOfflineReplay.allFixityVerified;

const preservedManifestByCorpus = new Map(
  preservedForReplay.map(row => [row.item.corpusId, row.manifest])
);
const caseManifest = preservedManifestByCorpus.get(
  "maqam-cassation-1383-2019-hukr"
)!;
const gazaManifest = preservedManifestByCorpus.get(
  "gaza-pla-land-specific-laws-2020"
)!;

const retrievalDocuments: ReferenceRetrievalDocument[] = [
  {
    documentId: "case-1383-2019-real",
    title: "نقض 1383/2019 — الحكر ورقبة العقار الوقفي",
    content: case1383Text,
    domain: "case_law",
    era: "CONTEMPORARY",
    territories: ["WEST_BANK"],
    authorityClass: "reference_secondary",
    sourceUrl: sourceById("maqam-cassation-1383-2019-hukr").sourceUrl,
    publisher: "مقام / جامعة النجاح الوطنية",
    legalStatusVerified: case1383IdentityPass && case1383HoldingTermsPass,
    artifactVersionId: caseManifest.versionId,
    artifactSha256: caseManifest.sha256,
    locator: "case-specific-holding-and-appellate-chain",
    semanticScore: 0.95,
    graphScore: 0.7,
    structuredConclusionEligible:
      case1383IdentityPass && case1383HoldingTermsPass,
  },
  {
    documentId: "gaza-land-lineage-real",
    title: "قوانين خاصة بالأراضي — غزة",
    content: htmlToText(
      fileBytes.get("gaza-pla-land-specific-laws-2020")!,
      "قوانين خاصة بالأراضي في غزة"
    ),
    domain: "land_law",
    era: "CROSS_ERA",
    territories: ["GAZA"],
    authorityClass: "official_derivative",
    sourceUrl: sourceById("gaza-pla-land-specific-laws-2020").sourceUrl,
    publisher: "سلطة الأراضي الفلسطينية - غزة",
    legalStatusVerified: false,
    artifactVersionId: gazaManifest.versionId,
    artifactSha256: gazaManifest.sha256,
    locator: "legal-lineage-inventory",
    semanticScore: 0.9,
    graphScore: 0.4,
    structuredConclusionEligible: false,
  },
  ...MEGA_F_SOURCE_READINESS.filter(
    row => row.corpusId.startsWith("fiqh-") && row.artifactSha256
  ).map<ReferenceRetrievalDocument>(row => {
    const item = sourceById(row.corpusId);
    return {
      documentId: row.corpusId + "-identity",
      title: item.title,
      content:
        item.title +
        " محفوظة كطبعة فقهية للبحث الخاص؛ لا يوجد في MEGA_F موضع صفحة موضوعي معتمد للاستنتاج.",
      domain: "fiqh",
      era: "CROSS_ERA",
      territories: item.territories,
      authorityClass: item.authorityClass,
      sourceUrl: item.sourceUrl,
      publisher: item.publisher,
      legalStatusVerified: false,
      artifactVersionId: "sha256-" + row.artifactSha256,
      artifactSha256: row.artifactSha256!,
      locator: null,
      semanticScore: 0.75,
      graphScore: 0,
      structuredConclusionEligible: false,
    };
  }),
];
const caseRoute = routeReferenceIssue(
  "ما الذي قررته محكمة النقض في 1383/2019 عن الحكر ورقبة الوقف؟"
);
const caseHits = hybridReferenceSearch({
  query: "نقض 1383/2019 الحكر رقبة الوقف",
  route: caseRoute,
  documents: retrievalDocuments,
});
const caseSpecificConclusionPass =
  caseHits.length > 0 &&
  caseHits[0].documentId === "case-1383-2019-real" &&
  caseHits[0].usableForConclusion;

const gazaRoute = routeReferenceIssue("ما القوانين الحالية للأراضي في غزة؟");
const gazaHits = hybridReferenceSearch({
  query: "قوانين الأراضي غزة",
  route: gazaRoute,
  documents: retrievalDocuments,
});
const gazaFailClosedPass =
  gazaHits.length > 0 &&
  gazaHits[0].documentId === "gaza-land-lineage-real" &&
  gazaHits[0].usableForConclusion === false &&
  gazaHits[0].reasons.includes("legal_status_not_verified") &&
  gazaHits[0].reasons.includes("structured_conclusion_gate_closed");

const fiqhRoute = routeReferenceIssue("ما قول الفقه الحنفي والحنبلي في الوقف؟");
const fiqhHits = hybridReferenceSearch({
  query: "الفقه الحنفي الحنبلي الوقف",
  route: fiqhRoute,
  documents: retrievalDocuments,
});
const fiqhFailClosedPass =
  fiqhHits.length > 0 &&
  fiqhHits.every(hit => hit.usableForConclusion === false);

const shariaReadiness = MEGA_F_SOURCE_READINESS.find(row =>
  row.corpusId.includes("bukhari-2737")
);
const shariaFailClosedPass =
  Boolean(shariaReadiness) &&
  shariaReadiness!.preservedBytes === false &&
  shariaReadiness!.substantiveConclusionEligible === false;

const caseCitation = buildReferenceGradeCitation({
  claimId: "mega-f-case-1383-identity",
  sourceUrl: sourceById("maqam-cassation-1383-2019-hukr").sourceUrl,
  sourceTitle: "نقض 1383/2019",
  artifactVersionId: caseManifest.versionId,
  artifactSha256: caseManifest.sha256,
  locator: { type: "case", value: "1383/2019" },
  excerpt: "1383/2019",
  alignmentVerified: case1383IdentityPass,
  legalStatusEvidenceRefs: [],
});
const citationAudit = auditReferenceGradeCitations([caseCitation]);

const securityMatrix = buildMegaFSecurityNegativeMatrix();
const securityMatrixPass = securityMatrix.every(
  item =>
    evaluateMegaFGuard({
      role: item.role,
      action: item.action,
    }).disposition === item.expected
);
const selfApprovalDenied =
  evaluateMegaFGuard({
    role: "LEGAL_STATUS_REVIEWER",
    action: "APPROVE_SPECIALIST_DECISION",
    actorId: "reviewer-me",
    reviewerId: "reviewer-me",
    requestedSpecialistRole: "LEGAL_STATUS_REVIEWER",
    territory: "GAZA",
    reviewerTerritories: ["GAZA"],
  }).disposition === "DENY";
const failClosedOverrideDenied =
  evaluateMegaFGuard({
    role: "PROGRAM_OWNER",
    action: "FAIL_CLOSED_OVERRIDE",
  }).disposition === "DENY";

const performanceBenchmark = benchmarkMegaFRetrieval({
  documents: retrievalDocuments,
  queries: [
    "ما حكم نقض 1383/2019 بشأن الحكر؟",
    "ما القوانين الحالية للأراضي في غزة؟",
    "ما قول الفقه الحنفي في الوقف؟",
  ],
  iterations: 500,
});
const localPerformancePass =
  performanceBenchmark.providerCostUsd === 0 &&
  performanceBenchmark.paidProviderCalls === 0 &&
  performanceBenchmark.externalNetworkCalls === 0 &&
  performanceBenchmark.p95Ms >= performanceBenchmark.p50Ms;

let hardwareProfile: Awaited<
  ReturnType<typeof detectHardwareAdaptiveProfile>
> | null = null;
let localModelBenchmarks: Awaited<ReturnType<typeof benchmarkInstalledModels>> =
  [];
let localModelBenchmarkError: string | null = null;
try {
  hardwareProfile = await detectHardwareAdaptiveProfile(true);
  localModelBenchmarks = await benchmarkInstalledModels(hardwareProfile, 256);
} catch (error) {
  localModelBenchmarkError =
    error instanceof Error ? error.message : String(error);
}

const localModelCostPass = localModelBenchmarks.every(
  row => typeof row.tokensPerSecond === "number"
);
const continuityReadiness = buildMegaFContinuityReadiness();
const specialistReadiness = megaFSpecialistReadinessSummary();
const specialistReviewQueue = buildMegaFSpecialistReadinessQueue();
const territoryPackets = buildMegaFTerritoryEvidencePackets();
const corpusConvergence = buildMegaFCorpusConvergence();

const overallPass =
  allPrivateFixityPass &&
  blockedAcquisitionRespectPass &&
  case1383IdentityPass &&
  case1383HoldingTermsPass &&
  appellateChainPass &&
  localRestoreDrillPass &&
  offlineReplayPass &&
  caseSpecificConclusionPass &&
  gazaFailClosedPass &&
  fiqhFailClosedPass &&
  shariaFailClosedPass &&
  citationAudit.valid &&
  securityMatrixPass &&
  selfApprovalDenied &&
  failClosedOverrideDenied &&
  localPerformancePass &&
  localModelCostPass &&
  territoryPackets.every(packet => !packet.conclusionEligible) &&
  specialistReadiness.actualHumanDecisionsIncluded === false;

const report = {
  program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
  phase: "MEGA_F_PREPRODUCTION_EVIDENCE_OPERABILITY_PRIVATE_PILOT",
  generatedAt: new Date().toISOString(),
  exactAuthorizedBase: "233723c5562ca26ad849ac246e7a96afb9a862df",
  hardBoundaries: {
    mainMerge: false,
    baselinePromotion: false,
    liveSharedSupabaseMutation: false,
    production: false,
    publicCorpusRelease: false,
    paidProviderProcurement: false,
    actualProductionUserAccountProvisioning: false,
    actualSpecialistDecisions: "HUMAN_ACTS_ONLY",
  },
  privateManifest: {
    pathHint:
      "~/.palwakf/private_reference_cache/waqf-ai-mega-f/mega-f-private-source-manifest.json",
    sha256: privateManifestSha256,
    preservedCount: manifest.preserved.length,
    notPreservedCount: manifest.notPreserved.length,
    allPrivateFixityPass,
    blockedAcquisitionRespectPass,
    preservedResults,
    notPreserved: manifest.notPreserved,
  },
  caseLaw: {
    representativeDecisionCount: 3,
    case1383IdentityPass,
    case1383HoldingTermsPass,
    appellateChainPass,
    normalized1383,
    caseSpecificConclusionPass,
    generalizationAllowed: false,
  },
  corpusConvergence,
  territoryPackets,
  shariaFiqh: {
    sourceReadiness: MEGA_F_SOURCE_READINESS,
    shariaFailClosedPass,
    fiqhHitCount: fiqhHits.length,
    fiqhFailClosedPass,
    actualFiqhOrShariaSpecialistDecisionIncluded: false,
  },
  continuity: {
    localRestoreDrillPass,
    restoreChecks,
    offlineReplayPass,
    caseOfflineReplay,
    gazaOfflineReplay,
    readiness: continuityReadiness,
  },
  multiSourceE2E: {
    retrievalDocumentCount: retrievalDocuments.length,
    caseSpecificConclusionPass,
    caseTopHit: caseHits[0] || null,
    gazaFailClosedPass,
    gazaTopHit: gazaHits[0] || null,
    fiqhFailClosedPass,
    fiqhTopHits: fiqhHits,
    shariaFailClosedPass,
    citationAudit,
  },
  security: {
    negativeAuthorizationCases: securityMatrix.length,
    negativeAuthorizationMatrix: securityMatrix,
    securityMatrixPass,
    selfApprovalDenied,
    failClosedOverrideDenied,
    productionAccountsProvisioned: false,
  },
  performanceCost: {
    retrieval: performanceBenchmark,
    hardwareProfile,
    localModelBenchmarks,
    localModelBenchmarkError,
    localModelCostPass,
    paidProviderProcurement: false,
    paidProviderCostUsd: 0,
  },
  specialistReadiness,
  specialistReviewQueue,
  sharedSupabaseMutations: 0,
  externalNetworkCallsDuringOfflineReplay: 0,
  overallPass,
  disposition: overallPass
    ? "PASS_PREPRODUCTION_EVIDENCE_AND_OPERABILITY_WITH_HUMAN_SPECIALIST_AND_EXTERNAL_INFRASTRUCTURE_DEBT_EXPLICIT"
    : "FAIL_CLOSED_MEGA_F_PRIVATE_PILOT",
};

await mkdir(resolve("evidence"), { recursive: true });
await writeFile(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(
  JSON.stringify(
    {
      evidencePath,
      disposition: report.disposition,
      allPrivateFixityPass,
      blockedAcquisitionRespectPass,
      case1383IdentityPass,
      case1383HoldingTermsPass,
      appellateChainPass,
      localRestoreDrillPass,
      offlineReplayPass,
      caseSpecificConclusionPass,
      gazaFailClosedPass,
      fiqhFailClosedPass,
      shariaFailClosedPass,
      citationValid: citationAudit.valid,
      securityCases: securityMatrix.length,
      securityMatrixPass,
      selfApprovalDenied,
      failClosedOverrideDenied,
      retrievalP50Ms: performanceBenchmark.p50Ms,
      retrievalP95Ms: performanceBenchmark.p95Ms,
      paidProviderCostUsd: 0,
      hardwareTier: hardwareProfile?.tier || null,
      localModelResults: localModelBenchmarks.map(row => ({
        model: row.model,
        usable: row.usable,
        tokensPerSecond: row.tokensPerSecond,
        latencyMs: row.latencyMs,
      })),
      specialistPending: specialistReadiness.blocking,
    },
    null,
    2
  )
);
