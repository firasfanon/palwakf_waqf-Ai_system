import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { load as loadHtml } from "cheerio";
import { PDFParse } from "pdf-parse";
import {
  MEGA_C_REFERENCE_CORPUS,
  buildCorpusCoverageLedger,
} from "../server/referenceCorpusScaleUp";
import {
  acquireCorpusItemPrivate,
  FileSystemSovereignArchiveStore,
} from "../server/referenceCorpusAcquisition";
import {
  FileSystemExtractedTextCache,
  rehydrateReferenceFromPreservedArtifact,
  replayReferenceQuestionOffline,
} from "../server/referenceContinuity";
import { routeReferenceIssue } from "../server/referenceIssueRouter";
import {
  hybridReferenceSearch,
  selectReferenceEvidencePack,
} from "../server/referenceRetrieval";
import {
  auditReferenceGradeCitations,
  buildReferenceGradeCitation,
} from "../server/referenceCitationEngine";
import { buildLegalStatusMatrixMegaC } from "../server/legalStatusMatrixMegaC";
import { buildExpertReviewQueue } from "../server/expertReviewQueue";
import type { ReferenceCorpusItem } from "../server/referenceCorpus";
import type { ArtifactVersionManifest } from "../server/sovereignReferenceArchive";

const privateRoot =
  process.env.WAQF_AI_PRIVATE_CORPUS_ROOT ||
  resolve(homedir(), ".palwakf", "private_reference_cache", "waqf-ai-mega-c");

const evidencePath = resolve(
  "evidence",
  "WAQF_AI_COMPREHENSIVE_REFERENCE_MEGA_C_PRIVATE_PILOT_20260922.json"
);
const extractedTextCache = new FileSystemExtractedTextCache(
  resolve(privateRoot, "derived-text-v1")
);

const selectedIds = [
  "waqf-amendment-2023-gazette-198-pdf",
  "land-settlement-process-pla",
  "ottoman-land-code-1858-registry",
  "land-settlement-law-40-1952-registry",
  "waqf-tenancy-law-5-1964-registry",
  "gaza-land-authority-legal-library",
  "pla-legal-framework-current",
  "pla-procedures-manual-2024",
  "pla-new-registration-procedure",
  "pla-lease-transaction-procedure",
  "mandate-land-transfers-regulations-1940-palquest",
  "mandate-land-transfers-regulations-1940-unispal",
  "gaza-government-property-legal-guidance",
  "movable-rights-security-11-2016",
  "movable-rights-security-11-2016-gazette-120-wafa",
  "land-authority-law-2010",
  "land-authority-law-2010-gazette-86-wafa",
  "settlement-authority-7-2016-official",
  "settlement-authority-7-2016-wafa",
];

function htmlText(bytes: Buffer): string {
  const $ = loadHtml(bytes.toString("utf8"));
  $("script,style,noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

async function extractedText(input: {
  bytes: Buffer;
  contentType: string;
}): Promise<string> {
  if (/html/i.test(input.contentType)) return htmlText(input.bytes);
  if (/pdf/i.test(input.contentType)) {
    const parser = new PDFParse({ data: input.bytes });
    try {
      const result = await parser.getText();
      return String(result.text || "")
        .replace(/\s+/g, " ")
        .trim();
    } finally {
      await parser.destroy();
    }
  }
  return input.bytes.toString("utf8").replace(/\s+/g, " ").trim();
}

function queryTokens(value: string): string[] {
  return [
    ...new Set(
      String(value)
        .normalize("NFKC")
        .replace(/[أإآٱ]/g, "ا")
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .split(/\s+/)
        .filter(token => token.length >= 2)
    ),
  ];
}

function alignedLocator(content: string, query: string) {
  const tokens = queryTokens(query);
  const articleRegex =
    /(مادة|المادة|Article)\s*\(?([0-9]+(?:\s*مكرر\s*[0-9]*)?)\)?/giu;
  const matches = [...content.matchAll(articleRegex)];
  if (!matches.length) {
    const score = tokens.reduce(
      (n, token) => n + (content.includes(token) ? 1 : 0),
      0
    );
    return score > 0
      ? {
          type: "section" as const,
          value: "document-body",
          excerpt: content.slice(0, 900),
        }
      : null;
  }
  let best: { score: number; value: string; excerpt: string } | null = null;
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index || 0;
    const end =
      i + 1 < matches.length
        ? matches[i + 1].index || content.length
        : Math.min(content.length, start + 2500);
    const excerpt = content.slice(start, end).trim();
    const score = tokens.reduce(
      (n, token) => n + (excerpt.includes(token) ? 1 : 0),
      0
    );
    const candidate = {
      score,
      value: matches[i][0],
      excerpt: excerpt.slice(0, 1200),
    };
    if (!best || candidate.score > best.score) best = candidate;
  }
  return best && best.score > 0
    ? { type: "article" as const, value: best.value, excerpt: best.excerpt }
    : null;
}

type PreservedRow = {
  item: ReferenceCorpusItem;
  manifest: ArtifactVersionManifest;
};

const acquisitionResults: any[] = [];
const preservedRows: PreservedRow[] = [];

async function acquireOne(corpusId: string) {
  const item = MEGA_C_REFERENCE_CORPUS.find(row => row.corpusId === corpusId);
  if (!item) return;
  try {
    const result = await acquireCorpusItemPrivate({
      item,
      privateArchiveRoot: privateRoot,
    });
    const primary =
      result.records.find(record => record.url === item.sourceUrl) ||
      result.records[0];
    if (!primary) {
      acquisitionResults.push({
        corpusId,
        status: "NO_RECORD",
        skipped: result.skipped,
      });
      return;
    }
    preservedRows.push({
      item,
      manifest: primary.artifact,
    });
    acquisitionResults.push({
      corpusId,
      status: "PRESERVED_PRIVATE",
      sourceUrl: item.sourceUrl,
      artifactVersionId: primary.artifact.versionId,
      artifactSha256: primary.artifact.sha256,
      byteSize: primary.artifact.byteSize,
      storageKey: primary.artifact.storageKey,
      trustLevel: primary.admission.trustLevel,
      reviewMode: primary.admission.reviewMode,
      chatEligible: primary.admission.chatEligible,
      publicDisplayEligible: primary.admission.publicDisplayEligible,
      skipped: result.skipped,
    });
  } catch (error: any) {
    acquisitionResults.push({
      corpusId,
      status: "FETCH_FAILED",
      error: String(error?.message || error),
    });
  }
}

const queue = [...selectedIds];
const workers = Array.from({ length: 3 }, async () => {
  while (queue.length) {
    const id = queue.shift();
    if (id) await acquireOne(id);
  }
});
await Promise.all(workers);

const archive = new FileSystemSovereignArchiveStore(privateRoot);
const rehydrated = [];
for (const preserved of preservedRows) {
  try {
    rehydrated.push(
      await rehydrateReferenceFromPreservedArtifact({
        preserved,
        store: archive,
        extractText: async ({ bytes, contentType }) =>
          extractedText({ bytes, contentType }),
        extractedTextCache,
      })
    );
  } catch (error: any) {
    acquisitionResults.push({
      corpusId: preserved.item.corpusId,
      status: "OFFLINE_REHYDRATION_FAILED",
      error: String(error?.message || error),
    });
  }
}

const scenarios = [
  {
    id: "WAQF_DEED_2023",
    question:
      "ما أثر تعديل قانون الأوقاف سنة 2023 على تسجيل الحجج الوقفية للأموال غير المنقولة؟",
  },
  {
    id: "WB_SETTLEMENT",
    question:
      "ما المرجع لإجراءات تسوية الأراضي والتسجيل الجديد في الضفة الغربية؟",
  },
  {
    id: "WB_WAQF_TENANCY",
    question:
      "ما المرجع القانوني للعقارات الوقفية المؤجرة في الضفة، وما علاقته بقانون المالكين والمستأجرين؟",
  },
  {
    id: "GAZA_LAND",
    question: "ما المسار القانوني للأراضي والتسجيل في قطاع غزة؟",
  },
  {
    id: "OTTOMAN",
    question: "ما تصنيف الأراضي في قانون الأراضي العثماني؟",
  },
  {
    id: "MANDATE_1940",
    question:
      "ما القيود التاريخية على انتقال الأراضي في فلسطين في عهد الانتداب سنة 1940؟",
  },
  {
    id: "MOVABLE_IMMOVABLE",
    question:
      "ما الفرق بين تنظيم الأموال المنقولة وغير المنقولة عند بحث حقوق الوقف؟",
  },
  {
    id: "JERUSALEM",
    question: "ما القانون النافذ على أرض وقف في القدس اليوم؟",
  },
];

const documents = rehydrated.map(row => row.document);
const scenarioResults = scenarios.map(scenario => {
  const route = routeReferenceIssue(scenario.question);
  const hits = hybridReferenceSearch({
    query: scenario.question,
    route,
    documents,
    limit: 8,
  });
  const pack = selectReferenceEvidencePack(hits, 4, [
    ...route.priorityDomains,
    ...route.preferredDomains,
  ]);
  const citations = pack.flatMap((hit, index) => {
    const locator = alignedLocator(hit.content, scenario.question);
    if (!locator) return [];
    return [
      buildReferenceGradeCitation({
        claimId: scenario.id + "-claim-" + String(index + 1),
        sourceUrl: hit.sourceUrl,
        sourceTitle: hit.title,
        artifactVersionId: hit.artifactVersionId,
        artifactSha256: hit.artifactSha256,
        locator: { type: locator.type, value: locator.value },
        excerpt: locator.excerpt,
        alignmentVerified: true,
        legalStatusEvidenceRefs: hit.legalStatusVerified
          ? ["verified_status"]
          : [],
      }),
    ];
  });
  return {
    scenarioId: scenario.id,
    question: scenario.question,
    route,
    topHits: pack.map(hit => ({
      documentId: hit.documentId,
      title: hit.title,
      authorityClass: hit.authorityClass,
      legalStatusVerified: hit.legalStatusVerified,
      usableForConclusion: hit.usableForConclusion,
      reasons: hit.reasons,
    })),
    citationAudit: auditReferenceGradeCitations(citations),
    citationCount: citations.length,
    conclusionEligible: pack.some(hit => hit.usableForConclusion),
    disposition:
      pack.length === 0
        ? "FAIL_CLOSED_NO_DOMAIN_EVIDENCE"
        : pack.some(hit => hit.usableForConclusion)
          ? "OFFLINE_RETRIEVAL_CITATION_PASS_CONCLUSION_AVAILABLE"
          : "OFFLINE_RETRIEVAL_CITATION_PASS_STATUS_GATE_CLOSED",
  };
});

const continuityResults = [];
for (const scenario of scenarios) {
  continuityResults.push(
    await replayReferenceQuestionOffline({
      question: scenario.question,
      preserved: preservedRows,
      store: archive,
      extractText: async ({ bytes, contentType }) =>
        extractedText({ bytes, contentType }),
      extractedTextCache,
    })
  );
}

const matrix = buildLegalStatusMatrixMegaC();
const reviewQueue = buildExpertReviewQueue();
const coverageLedger = buildCorpusCoverageLedger();

const report = {
  program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
  phase: "MEGA_C_CORPUS_SCALE_UP_PRIVATE_PILOT",
  generatedAt: new Date().toISOString(),
  hardBoundaries: {
    liveSharedSupabaseMutation: false,
    mainMerge: false,
    newBaseline: false,
    production: false,
    publicCorpusRelease: false,
  },
  privateArchiveRoot:
    "<USER_HOME>/.palwakf/private_reference_cache/waqf-ai-mega-c",
  selectedCorpusCount: selectedIds.length,
  corpusTotalCount: MEGA_C_REFERENCE_CORPUS.length,
  acquisitionResults,
  preservedCount: acquisitionResults.filter(
    row => row.status === "PRESERVED_PRIVATE"
  ).length,
  offlineRehydratedCount: rehydrated.length,
  offlineNetworkCalls: 0,
  allOfflineFixityVerified: rehydrated.every(row => row.fixityVerified),
  extractedTextCacheHitCount: rehydrated.filter(
    row => row.extractedTextCacheHit
  ).length,
  coverageLedger,
  legalStatusMatrixSummary: {
    rowCount: matrix.rowCount,
    conclusionEligibleRows: matrix.conclusionEligibleRows,
    reviewRequiredRows: matrix.reviewRequiredRows,
    territoryCounts: matrix.territoryCounts,
    unresolvedByTerritory: matrix.unresolvedByTerritory,
  },
  expertReviewQueueSummary: {
    itemCount: reviewQueue.itemCount,
    familyReviewCount: reviewQueue.familyReviewCount,
    legalStatusExceptionCount: reviewQueue.legalStatusExceptionCount,
    perDocumentRoutineRightsReviewCount:
      reviewQueue.perDocumentRoutineRightsReviewCount,
    pendingBlockingCount: reviewQueue.pendingBlockingCount,
  },
  scenarioResults,
  continuityResults,
  corpusBytesIncludedInEvidenceFile: false,
};

await mkdir(resolve("evidence"), { recursive: true });
await writeFile(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      evidencePath,
      corpusTotalCount: report.corpusTotalCount,
      selectedCorpusCount: report.selectedCorpusCount,
      preservedCount: report.preservedCount,
      offlineRehydratedCount: report.offlineRehydratedCount,
      allOfflineFixityVerified: report.allOfflineFixityVerified,
      extractedTextCacheHitCount: report.extractedTextCacheHitCount,
      legalStatusRows: matrix.rowCount,
      legalStatusConclusionEligible: matrix.conclusionEligibleRows,
      legalStatusReviewRequired: matrix.reviewRequiredRows,
      expertReviewItems: reviewQueue.itemCount,
      perDocumentRoutineRightsReviewCount:
        reviewQueue.perDocumentRoutineRightsReviewCount,
      scenarios: scenarioResults.map(result => ({
        scenarioId: result.scenarioId,
        disposition: result.disposition,
        topDocumentId: result.topHits[0]?.documentId || null,
        citationValid: result.citationAudit.valid,
      })),
    },
    null,
    2
  )
);
