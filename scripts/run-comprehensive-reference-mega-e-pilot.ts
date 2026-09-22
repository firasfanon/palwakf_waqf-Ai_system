import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import {
  assessMegaEHistoricalArtifact,
  buildHasekiRealDeedBenchmark,
  buildMegaECorpusConvergence,
  megaESourceFamilies,
  type MegaEHistoricalArtifactManifest,
} from "../server/referenceMegaE";
import {
  buildMegaDAssetTitlePacket,
  buildMegaDConclusionGate,
  buildMegaDDeedPacket,
  buildMegaDJurisdictionPacket,
  buildMegaDStructuredRetrievalDocument,
} from "../server/referenceMegaD";
import {
  buildMegaENegativeAuthorizationMatrix,
  evaluateMegaEAccess,
  projectSensitiveDeedForRole,
} from "../server/preProductionAccessMegaE";
import {
  buildMegaESpecialistReadinessQueue,
  specialistReadinessSummary,
} from "../server/expertReviewMegaE";
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
  "waqf-ai-mega-e"
);
const manifestPath = resolve(
  privateRoot,
  "haseki-hurrem-sultan-kudus-vakfiyesi.manifest.json"
);
const pdfPath = resolve(
  privateRoot,
  "haseki-hurrem-sultan-kudus-vakfiyesi-public-mirror.pdf"
);
const evidencePath = resolve(
  "evidence",
  "WAQF_AI_COMPREHENSIVE_REFERENCE_MEGA_E_PRIVATE_PILOT_20260922.json"
);

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function fold(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/[’‘ʻʼ]/g, "'")
    .replace(/\s+/g, " ");
}

function compactLatin(value: string): string {
  return fold(value).replace(/[^a-z0-9]+/g, "");
}

function shareEvidencePresent(text: string, placeToken: string): boolean {
  const index = text.indexOf(placeToken);
  if (index < 0) return false;
  const window = text.slice(index, index + 700);
  return window.includes("yirmidortkiratasildanonsekizkirat");
}

const manifest = JSON.parse(
  await readFile(manifestPath, "utf8")
) as MegaEHistoricalArtifactManifest;
const pdfBytes = await readFile(pdfPath);
const extractedPath = resolve(privateRoot, manifest.extractedTextFile);
const extractedText = await readFile(extractedPath, "utf8");
const folded = fold(extractedText);
const compact = compactLatin(extractedText);

const pdfHash = sha256(pdfBytes);
const textHash = sha256(Buffer.from(extractedText, "utf8"));
const fixityPass =
  pdfHash === manifest.pdfSha256 &&
  pdfBytes.length === manifest.pdfBytes &&
  (!manifest.extractedTextSha256 || textHash === manifest.extractedTextSha256);

const identityTextPass =
  compact.includes("hasekihurremsultan") &&
  compact.includes("vakiflargenelmudurluguyayinlari") &&
  compact.includes("9789751966971") &&
  compact.includes("964senesisabanayininortalarinda");

const bethlehemClausePass = shareEvidencePresent(compact, "beytullahm");
const beitJalaClausePass = shareEvidencePresent(compact, "beyticala");

const artifactAssessment = assessMegaEHistoricalArtifact(manifest);
const benchmark = buildHasekiRealDeedBenchmark(manifest);
const deedPacket = buildMegaDDeedPacket({
  deed: benchmark.deed,
  transcription: benchmark.transcription,
  conditions: [],
});

const assetPackets = benchmark.assets.map(asset =>
  buildMegaDAssetTitlePacket({
    asset,
    rights: benchmark.rights.filter(row => row.assetId === asset.assetId),
    titleEvents: benchmark.titleEvents.filter(
      row => row.assetId === asset.assetId
    ),
    parcelCandidates: [],
  })
);

const titleSafetyPass = assetPackets.every(
  packet =>
    packet.state === "FAIL_CLOSED" &&
    packet.ownershipInferenceAllowed === false &&
    packet.errors.length === 1 &&
    packet.errors[0].startsWith("title_event_date_unresolved:")
);

const jurisdiction = buildMegaDJurisdictionPacket({
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

const conclusionGate = buildMegaDConclusionGate({
  deed: deedPacket,
  assetTitle: assetPackets[0],
  jurisdiction,
  assertions: [],
});

const structuredDocument = buildMegaDStructuredRetrievalDocument({
  deed: deedPacket,
  assetTitle: assetPackets[0],
  jurisdiction,
  conclusionGate,
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
  documents: [structuredDocument],
});
const ragSafetyPass =
  hits.length === 1 &&
  hits[0].usableForConclusion === false &&
  hits[0].reasons.includes("structured_conclusion_gate_closed");

const citation = buildReferenceGradeCitation({
  claimId: "mega-e-haseki-bethlehem-share",
  sourceUrl: manifest.acquisitionUrl,
  sourceTitle: manifest.documentIdentity,
  artifactVersionId: benchmark.deed.preservedArtifactVersionId,
  artifactSha256: manifest.pdfSha256,
  locator: { type: "page", value: "translation-page-10:item-14" },
  excerpt: "Beytü'l-Lahm ... yirmi dört kırat ... on sekiz kırat",
  alignmentVerified: bethlehemClausePass,
  legalStatusEvidenceRefs: [],
});
const citationAudit = auditReferenceGradeCitations([citation]);

const authorizationMatrix = buildMegaENegativeAuthorizationMatrix();
const authorizationMatrixPass = authorizationMatrix.every(
  row =>
    evaluateMegaEAccess({ role: row.role, action: row.action }).disposition ===
    row.expected
);
const developerSpecialistDenied =
  evaluateMegaEAccess({
    role: "DEVELOPER_ENGINEER",
    action: "SPECIALIST_DECISION_APPROVE",
    requestedSpecialistRole: "WAQF_DEED_REVIEWER",
  }).disposition === "DENY";

const sensitiveProjection = projectSensitiveDeedForRole({
  role: "RESEARCH_USER",
  deed: {
    deedId: benchmark.deed.deedId,
    title: benchmark.deed.title,
    beneficiaryIds: ["private-beneficiary-fixture"],
    witnessEntityIds: ["private-witness-fixture"],
    nazirEntityIds: ["private-nazir-fixture"],
  },
});
const sensitiveRedactionPass =
  sensitiveProjection.sensitiveFieldsRedacted &&
  sensitiveProjection.beneficiaryIds.length === 0 &&
  sensitiveProjection.witnessEntityIds.length === 0 &&
  sensitiveProjection.nazirEntityIds.length === 0;

const families = megaESourceFamilies();
const familyState = Object.fromEntries(
  ["HISTORICAL_WAQF", "CASE_LAW", "SHARIA_PRIMARY", "FIQH_CLASSICAL"].map(
    id => [id, families.find(row => row.familyId === id)?.coverageState || null]
  )
);
const corpusDebtPreserved =
  familyState.HISTORICAL_WAQF === "PARTIAL" &&
  familyState.CASE_LAW === "PARTIAL" &&
  familyState.SHARIA_PRIMARY === "NOT_STARTED" &&
  familyState.FIQH_CLASSICAL === "NOT_STARTED";

const specialistReadiness = specialistReadinessSummary();
const specialistReviewQueue = buildMegaESpecialistReadinessQueue();

const realEvidenceSafetyPass =
  fixityPass &&
  identityTextPass &&
  bethlehemClausePass &&
  beitJalaClausePass &&
  artifactAssessment.privateBenchmarkEligible &&
  artifactAssessment.canonicalAdmissionEligible === false &&
  deedPacket.state === "PASS" &&
  titleSafetyPass &&
  jurisdiction.state === "FAIL_CLOSED" &&
  conclusionGate.state === "FAIL_CLOSED" &&
  ragSafetyPass &&
  citationAudit.valid;

const report = {
  program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
  phase: "MEGA_E_REAL_EVIDENCE_PREPRODUCTION_PRIVATE_PILOT",
  generatedAt: new Date().toISOString(),
  hardBoundaries: {
    mainMerge: false,
    baselinePromotion: false,
    liveSharedSupabaseMutation: false,
    production: false,
    publicCorpusRelease: false,
    paidProviderProcurement: false,
    actualProductionUserProvisioning: false,
  },
  networkCalls: 0,
  sharedSupabaseMutations: 0,
  realHistoricalDeed: {
    artifactId: manifest.artifactId,
    realHistoricalDeedArtifact: true,
    officialEditionIdentityVerified: manifest.officialEditionIdentityVerified,
    officialOriginDownload: manifest.officialOriginDownload,
    acquisitionHostRole: manifest.acquisitionHostRole,
    pdfSha256: pdfHash,
    pdfBytes: pdfBytes.length,
    extractedTextSha256: textHash,
    fixityPass,
    identityTextPass,
    historicalDateLabel: manifest.historicalDocumentDateLabel,
    historicalGregorianRange: manifest.historicalDocumentGregorianRange,
    distinctEarlier1552Waqfiyya:
      manifest.distinctEarlierWaqfiyya?.sameDocument === false,
    bethlehem: {
      locator: manifest.benchmarkLocators.bethlehemShare,
      normalizedShare: manifest.normalizedClaims.bethlehemShare,
      evidencePass: bethlehemClausePass,
    },
    beitJala: {
      locator: manifest.benchmarkLocators.beitJalaShare,
      normalizedShare: manifest.normalizedClaims.beitJalaShare,
      evidencePass: beitJalaClausePass,
    },
  },
  admission: artifactAssessment,
  pipeline: {
    deedState: deedPacket.state,
    assetTitleStates: assetPackets.map(packet => ({
      assetId: packet.assetId,
      state: packet.state,
      errors: packet.errors,
      ownershipInferenceAllowed: packet.ownershipInferenceAllowed,
    })),
    titleSafetyPass,
    jurisdictionState: jurisdiction.state,
    jurisdictionReasons: jurisdiction.reasons,
    conclusionState: conclusionGate.state,
    conclusionReasons: conclusionGate.reasons,
    ragHitCount: hits.length,
    ragUsableForConclusion: hits[0]?.usableForConclusion ?? null,
    ragSafetyPass,
    citationAudit,
  },
  preProductionAccess: {
    negativeAuthorizationCases: authorizationMatrix.length,
    negativeAuthorizationMatrix: authorizationMatrix,
    authorizationMatrixPass,
    developerSpecialistDenied,
    sensitiveRedactionPass,
    productionAccountsProvisioned: false,
  },
  specialistReadiness,
  specialistReviewQueue,
  corpusCoverage: familyState,
  corpusConvergenceLedger: buildMegaECorpusConvergence(),
  corpusDebtPreserved,
  actualSpecialistHumanDecisionsIncluded: false,
  realEvidenceSafetyPass,
  disposition:
    realEvidenceSafetyPass &&
    authorizationMatrixPass &&
    developerSpecialistDenied &&
    sensitiveRedactionPass &&
    corpusDebtPreserved
      ? "PASS_REAL_DEED_EVIDENCE_EXTRACTION_WITH_LEGAL_CONCLUSION_FAIL_CLOSED_AND_SPECIALIST_REVIEW_PENDING"
      : "FAIL_CLOSED_MEGA_E_PRIVATE_PILOT",
};

await mkdir(resolve("evidence"), { recursive: true });
await writeFile(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      evidencePath,
      disposition: report.disposition,
      realEvidenceSafetyPass,
      fixityPass,
      identityTextPass,
      bethlehemClausePass,
      beitJalaClausePass,
      deedState: deedPacket.state,
      titleSafetyPass,
      jurisdictionState: jurisdiction.state,
      conclusionState: conclusionGate.state,
      ragSafetyPass,
      citationValid: citationAudit.valid,
      authorizationMatrixPass,
      sensitiveRedactionPass,
      corpusDebtPreserved,
      specialistPending: specialistReadiness.blocking,
    },
    null,
    2
  )
);
