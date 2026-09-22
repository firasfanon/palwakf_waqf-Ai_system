import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import {
  MEGA_G_PRIVATE_METADATA_EXPECTATIONS,
  buildMegaGCorpusTerminalLedger,
  buildMegaGRightsLedger,
  buildMegaGTerritoryTerminalPackets,
  megaGAllMandatoryCorpusTracksTerminal,
  megaGCaseDecision,
  megaGNoPublicReleaseRights,
} from "../server/referenceMegaG";
import {
  buildMegaGSpecialistEvidencePacks,
  megaGNoAutoApproval,
  megaGSpecialistHandoffSummary,
} from "../server/expertReviewMegaG";
import {
  hybridReferenceSearch,
  type ReferenceRetrievalDocument,
} from "../server/referenceRetrieval";
import { routeReferenceIssue } from "../server/referenceIssueRouter";
import { summarizeMegaFRetrievalHitForEvidence } from "../server/preProductionMegaF";

type PrivateManifest = {
  program: string;
  phase: string;
  generatedDate: string;
  preservedMetadata: Array<{
    corpusId: string;
    fileName: string;
    sha256: string;
    byteSize: number;
    sourceUrl: string;
  }>;
  blockedAcquisition: Array<{
    sourceId: string;
    url: string;
    result: string;
    bypassAttempted: boolean;
  }>;
  inheritedPrivateEvidence: string[];
  boundaries: Record<string, boolean | string>;
};

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function htmlText(bytes: Buffer): string {
  return bytes
    .toString("utf8")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_match, decimal) =>
      String.fromCodePoint(Number(decimal))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

const rootG = resolve(
  homedir(),
  ".palwakf",
  "private_reference_cache",
  "waqf-ai-mega-g"
);
const rootF = resolve(
  homedir(),
  ".palwakf",
  "private_reference_cache",
  "waqf-ai-mega-f"
);
const manifestPath = resolve(rootG, "mega-g-private-handoff-manifest.json");
const manifest = JSON.parse(
  await readFile(manifestPath, "utf8")
) as PrivateManifest;
const manifestSha256 = sha256(await readFile(manifestPath));

const metadataFixity = [];
for (const row of manifest.preservedMetadata) {
  const bytes = await readFile(resolve(rootG, row.fileName));
  const expected =
    MEGA_G_PRIVATE_METADATA_EXPECTATIONS[
      row.corpusId as keyof typeof MEGA_G_PRIVATE_METADATA_EXPECTATIONS
    ];
  const digest = sha256(bytes);
  metadataFixity.push({
    corpusId: row.corpusId,
    sha256: digest,
    byteSize: bytes.byteLength,
    pass:
      Boolean(expected) &&
      digest === row.sha256 &&
      digest === expected.sha256 &&
      bytes.byteLength === row.byteSize &&
      bytes.byteLength === expected.byteSize,
  });
}
const metadataFixityPass = metadataFixity.every(row => row.pass);
const noBypassPass = manifest.blockedAcquisition.every(
  row => row.bypassAttempted === false
);

const malikiMetadata = htmlText(
  await readFile(resolve(rootG, "fiqh-maliki-hattab-waqfeya-metadata.html"))
);
const shafiiMetadata = htmlText(
  await readFile(resolve(rootG, "fiqh-shafii-al-umm-waqfeya-metadata.html"))
);
const malikiIdentityPass =
  malikiMetadata.includes("أحكام الوقف") &&
  malikiMetadata.includes("عبد القادر باجي") &&
  malikiMetadata.includes("507");
const shafiiIdentityPass =
  shafiiMetadata.includes("الأم") &&
  shafiiMetadata.includes("رفعت فوزي عبد المطلب") &&
  shafiiMetadata.includes("6464");

const caseFiles = {
  "1383/2019": resolve(rootF, "maqam-1383-2019.html"),
  "1543/2016": resolve(rootF, "maqam-1543-2016.html"),
  "397/2023": resolve(rootF, "maqam-397-2023.html"),
};
const caseIdentityChecks: Record<string, boolean> = {};
for (const [caseNumber, file] of Object.entries(caseFiles)) {
  const bytes = await readFile(file);
  const text = htmlText(bytes);
  const governed = megaGCaseDecision(caseNumber);
  const sourceIdentityPass =
    Boolean(governed.source) &&
    governed.source!.caseNumber === caseNumber &&
    governed.source!.sourceArtifactSha256 === sha256(bytes);
  const lowerChainPass =
    Boolean(governed.normalization) &&
    governed
      .normalization!.normalizedChain.filter(link => link.level !== "CASSATION")
      .every(link => text.includes(link.caseNumber));
  caseIdentityChecks[caseNumber] = sourceIdentityPass && lowerChainPass;
}

const ledger = buildMegaGCorpusTerminalLedger();
const allMandatoryTerminal = megaGAllMandatoryCorpusTracksTerminal();
const noNotStarted = ledger.every(row =>
  ["EXPERT_REVIEW_READY", "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP"].includes(
    row.terminalState
  )
);
const expertReady = ledger.filter(
  row => row.terminalState === "EXPERT_REVIEW_READY"
);
const deferred = ledger.filter(
  row => row.terminalState === "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP"
);
const everyDeferredHasGap = deferred.every(
  row => row.evidenceGaps.length > 0 && row.unresolvedQuestions.length > 0
);

const territoryPackets = buildMegaGTerritoryTerminalPackets();
const territoryFailClosedPass = territoryPackets.every(
  packet =>
    packet.terminalState === "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP" &&
    packet.currentLegalStatusResolved === false &&
    packet.authoritativeConclusionEligible === false &&
    packet.sovereigntyInferenceAllowed === false &&
    packet.ownershipInferenceAllowed === false &&
    packet.evidenceGaps.length > 0
);

const rightsLedger = buildMegaGRightsLedger();
const rightsPass =
  megaGNoPublicReleaseRights() &&
  rightsLedger.every(row => row.publicReleaseAllowed === false);

const specialistPacks = buildMegaGSpecialistEvidencePacks();
const specialistSummary = megaGSpecialistHandoffSummary();
const specialistBoundaryPass =
  megaGNoAutoApproval() &&
  specialistSummary.actualHumanDecisionsIncluded === false &&
  specialistSummary.productionExpertSignoffSatisfied === false;

const case1383Text = htmlText(await readFile(caseFiles["1383/2019"]));
const gazaText = htmlText(
  await readFile(resolve(rootF, "gaza-pla-land-laws.html"))
);
const documents: ReferenceRetrievalDocument[] = [
  {
    documentId: "mega-g-case-1383",
    title: "Cassation 1383/2019 — hukr / waqf raqaba",
    content: case1383Text,
    domain: "case_law",
    era: "CONTEMPORARY",
    territories: ["WEST_BANK"],
    authorityClass: "reference_secondary",
    sourceUrl: "https://maqam.najah.edu/judgments/7576/",
    publisher: "Maqam / An-Najah National University",
    legalStatusVerified: true,
    artifactVersionId: "mega-f-case-1383-private",
    artifactSha256:
      "a868798e54b60acd307e918d095a106eaae049fdff3019f5b37c0fa14f064067",
    locator: "case-specific-holding",
    structuredConclusionEligible: true,
    conclusionScope: "CASE_SPECIFIC",
    conclusionScopeTokens: ["1383/2019"],
    semanticScore: 0.95,
    graphScore: 0.7,
  },
  {
    documentId: "mega-g-gaza-land-inventory",
    title: "Gaza Land Authority — land-specific laws inventory",
    content: gazaText,
    domain: "land_law",
    era: "CONTEMPORARY",
    territories: ["GAZA"],
    authorityClass: "official_derivative",
    sourceUrl:
      "https://www.pla.gov.ps/ar/%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86-%D8%AE%D8%A7%D8%B5%D8%A9-%D8%A8%D8%A7%D9%84%D8%A7%D8%B1%D8%A7%D8%B6%D9%8A-1403.html",
    publisher: "Palestinian Land Authority - Gaza",
    legalStatusVerified: false,
    artifactVersionId: "mega-f-gaza-private",
    artifactSha256:
      "bb21fb543a070f538347317b48a36b9ddb73ded6e2c5cf7b6fd8b2d240f9f9b4",
    locator: "legal-lineage-inventory",
    structuredConclusionEligible: false,
    semanticScore: 0.9,
    graphScore: 0.4,
  },
  {
    documentId: "mega-g-maliki-source-identity",
    title: "Maliki waqf source — al-Hattab, Ahkam al-Waqf",
    content:
      "Maliki source identity only: Ahkam al-Waqf, 1430/2009, 507 pages.",
    domain: "fiqh",
    era: "CROSS_ERA",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    authorityClass: "reference_secondary",
    sourceUrl:
      "https://www.waqfeya.net/books/%D8%A3%D8%AD%D9%83%D8%A7%D9%85-%D8%A7%D9%84%D9%88%D9%82%D9%81-816774af21e74392a33dee1761a2efad",
    publisher: "Waqfeya metadata",
    legalStatusVerified: false,
    artifactVersionId: "mega-g-maliki-metadata",
    artifactSha256:
      "6a1fed9904a09c0c86cd76b054e60954f404ac8fcccf93233650f0284160cc0f",
    locator: "whole-work-waqf-source-identity",
    structuredConclusionEligible: false,
    semanticScore: 0.75,
    graphScore: 0,
  },
  {
    documentId: "mega-g-shafii-source-identity",
    title: "Shafii source — al-Umm vol. 5 / al-Ahbas",
    content:
      "Shafii source identity only: al-Umm, Dar al-Wafa 1422/2001, volume 5 includes al-Ahbas.",
    domain: "fiqh",
    era: "CROSS_ERA",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    authorityClass: "reference_secondary",
    sourceUrl:
      "https://www.waqfeya.net/books/%D8%A7%D9%84%D8%A3%D9%85-%D8%B7-%D8%A7%D9%84%D9%88%D9%81%D8%A7%D8%A1-600ea104307f43a1b06ccf360823dcff",
    publisher: "Waqfeya metadata",
    legalStatusVerified: false,
    artifactVersionId: "mega-g-shafii-metadata",
    artifactSha256:
      "da49e6caedd90d3b18e12e5f70ccb78e09e2a907a85af67b028beb2704a921fd",
    locator: "volume-5:al-ahbas",
    structuredConclusionEligible: false,
    semanticScore: 0.75,
    graphScore: 0,
  },
];

const caseQuery = "ما حكم نقض 1383/2019 بشأن الحكر ورقبة الوقف؟";
const gazaQuery = "ما القوانين الحالية للأراضي في غزة؟";
const fiqhQuery = "ما قول الفقه المالكي والشافعي في الوقف؟";

const caseHits = hybridReferenceSearch({
  query: caseQuery,
  route: routeReferenceIssue(caseQuery),
  documents,
});
const gazaHits = hybridReferenceSearch({
  query: gazaQuery,
  route: routeReferenceIssue(gazaQuery),
  documents,
});
const fiqhHits = hybridReferenceSearch({
  query: fiqhQuery,
  route: routeReferenceIssue(fiqhQuery),
  documents,
});

const multiSourceE2EPass =
  caseHits.some(
    hit =>
      hit.documentId === "mega-g-case-1383" && hit.usableForConclusion === true
  ) &&
  gazaHits.some(
    hit =>
      hit.documentId === "mega-g-gaza-land-inventory" &&
      hit.usableForConclusion === false
  ) &&
  fiqhHits.length > 0 &&
  fiqhHits.every(hit => hit.usableForConclusion === false);

const overallPass =
  metadataFixityPass &&
  noBypassPass &&
  malikiIdentityPass &&
  shafiiIdentityPass &&
  Object.values(caseIdentityChecks).every(Boolean) &&
  allMandatoryTerminal &&
  noNotStarted &&
  everyDeferredHasGap &&
  territoryFailClosedPass &&
  rightsPass &&
  specialistBoundaryPass &&
  multiSourceE2EPass;

const report = {
  program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
  phase: "MEGA_G_FINAL_CORPUS_COMPLETION_SPECIALIST_HANDOFF_PRIVATE_PILOT",
  generatedAt: new Date().toISOString(),
  exactAuthorizedBase: "418a98ba3966e3137c1eafb905acf4f5c35224ec",
  privateManifest: {
    pathHint:
      "~/.palwakf/private_reference_cache/waqf-ai-mega-g/mega-g-private-handoff-manifest.json",
    sha256: manifestSha256,
    metadataFixity,
    metadataFixityPass,
    blockedAcquisition: manifest.blockedAcquisition,
    noBypassPass,
  },
  sourceIdentity: {
    malikiIdentityPass,
    shafiiIdentityPass,
    caseIdentityChecks,
  },
  corpusTerminalLedger: ledger,
  corpusSummary: {
    mandatoryTracks: ledger.length,
    expertReviewReady: expertReady.length,
    explicitlyDeferredWithEvidenceGap: deferred.length,
    noNotStarted,
    allMandatoryTerminal,
    everyDeferredHasGap,
  },
  territoryPackets,
  territoryFailClosedPass,
  rightsLedger,
  rightsPass,
  specialistHandoff: {
    packs: specialistPacks,
    summary: specialistSummary,
    boundaryPass: specialistBoundaryPass,
  },
  multiSourceE2E: {
    caseHits: caseHits.map(summarizeMegaFRetrievalHitForEvidence),
    gazaHits: gazaHits.map(summarizeMegaFRetrievalHitForEvidence),
    fiqhHits: fiqhHits.map(summarizeMegaFRetrievalHitForEvidence),
    pass: multiSourceE2EPass,
  },
  hardBoundaries: {
    actualSpecialistDecisions: "HUMAN_ACTS_ONLY",
    mainMerge: false,
    baselinePromotion: false,
    liveSharedSupabaseMutation: false,
    production: false,
    publicCorpusRelease: false,
    paidProviderProcurement: false,
    actualProductionUserAccountProvisioning: false,
    postMegaGDefaultMegaHEngineering: false,
  },
  overallPass,
  disposition: overallPass
    ? "PASS_FINAL_CORPUS_TERMINAL_LEDGER_AND_SPECIALIST_HANDOFF_READY_WITH_EXPLICIT_EVIDENCE_GAPS"
    : "FAIL_CLOSED_MEGA_G_HANDOFF_PILOT",
};

await mkdir(resolve("evidence"), { recursive: true });
const evidencePath = resolve(
  "evidence",
  "WAQF_AI_COMPREHENSIVE_REFERENCE_MEGA_G_PRIVATE_PILOT_20260923.json"
);
await writeFile(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(
  JSON.stringify(
    {
      evidencePath,
      disposition: report.disposition,
      metadataFixityPass,
      noBypassPass,
      malikiIdentityPass,
      shafiiIdentityPass,
      caseIdentityChecks,
      mandatoryTracks: ledger.length,
      expertReviewReady: expertReady.length,
      explicitlyDeferredWithEvidenceGap: deferred.length,
      territoryFailClosedPass,
      rightsPass,
      specialistPacks: specialistPacks.length,
      specialistBoundaryPass,
      multiSourceE2EPass,
      overallPass,
    },
    null,
    2
  )
);
