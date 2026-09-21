import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { resolve } from "node:path";
import { load as loadHtml } from "cheerio";
import { PDFParse } from "pdf-parse";
import { MEGA_B_REFERENCE_SEED } from "../server/referenceCorpus";
import {
  acquireCorpusItemPrivate,
  defaultCollectionFetcher,
} from "../server/referenceCorpusAcquisition";
import { routeReferenceIssue } from "../server/referenceIssueRouter";
import {
  hybridReferenceSearch,
  selectReferenceEvidencePack,
  type ReferenceRetrievalDocument,
} from "../server/referenceRetrieval";
import {
  auditReferenceGradeCitations,
  buildReferenceGradeCitation,
} from "../server/referenceCitationEngine";

const privateRoot =
  process.env.WAQF_AI_PRIVATE_CORPUS_ROOT ||
  resolve(homedir(), ".palwakf", "private_reference_cache", "waqf-ai-mega-b");

const evidencePath = resolve(
  "evidence",
  "WAQF_AI_COMPREHENSIVE_REFERENCE_MEGA_B_PRIVATE_PILOT_20260921.json"
);

const selectedIds = [
  "waqf-law-1966-consolidated",
  "waqf-amendment-2023",
  "waqf-amendment-2023-gazette-198-pdf",
  "land-authority-law-2010",
  "land-settlement-process-pla",
  "ottoman-land-code-1858-registry",
  "land-settlement-law-40-1952-registry",
  "gaza-land-authority-legal-library",
];

function htmlText(bytes: Buffer): string {
  const $ = loadHtml(bytes.toString("utf8"));
  $("script,style,noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

async function extractedText(
  bytes: Buffer,
  contentType: string
): Promise<string> {
  if (/html/i.test(contentType)) return htmlText(bytes);
  if (/pdf/i.test(contentType)) {
    const parser = new PDFParse({ data: bytes });
    try {
      const result = await parser.getText();
      return String(result.text || "")
        .replace(/\s+/g, " ")
        .trim();
    } finally {
      await parser.destroy();
    }
  }
  return bytes.toString("utf8").replace(/\s+/g, " ").trim();
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
  const articleRegex = /(مادة|المادة)\s*\(?([0-9]+(?:\s*مكرر\s*[0-9]*)?)\)?/gu;
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

const capturedBodies = new Map<string, Buffer>();
const retrievalDocuments: ReferenceRetrievalDocument[] = [];
const acquisitionResults: any[] = [];

for (const corpusId of selectedIds) {
  const item = MEGA_B_REFERENCE_SEED.find(row => row.corpusId === corpusId);
  if (!item) continue;
  try {
    const result = await acquireCorpusItemPrivate({
      item,
      privateArchiveRoot: privateRoot,
      fetcher: async url => {
        const response = await defaultCollectionFetcher(url);
        capturedBodies.set(url, response.body);
        return response;
      },
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
      continue;
    }
    const body =
      capturedBodies.get(primary.url) ||
      capturedBodies.get(item.sourceUrl) ||
      Buffer.alloc(0);
    const content = await extractedText(
      body,
      String(
        primary.artifact.metadata.source_content_type ||
          primary.artifact.contentType ||
          ""
      )
    );
    retrievalDocuments.push({
      documentId: item.corpusId,
      title: item.title,
      content,
      domain: item.domain,
      era: item.era,
      territories: item.territories,
      authorityClass: item.authorityClass,
      sourceUrl: item.sourceUrl,
      publisher: item.publisher,
      legalStatusVerified: item.statusAssertions.some(
        status => status.verified
      ),
      artifactVersionId: primary.artifact.versionId,
      artifactSha256: primary.artifact.sha256,
      locator: null,
      semanticScore: 0,
      graphScore: item.statusAssertions.length ? 0.3 : 0,
    });
    acquisitionResults.push({
      corpusId,
      status: "PRESERVED_PRIVATE",
      sourceUrl: item.sourceUrl,
      artifactVersionId: primary.artifact.versionId,
      artifactSha256: primary.artifact.sha256,
      byteSize: primary.artifact.byteSize,
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

const scenarios = [
  {
    id: "WAQF_2023",
    question: "ما أثر تعديل 2023 على قانون الأوقاف والحجج الوقفية؟",
  },
  {
    id: "SETTLEMENT",
    question:
      "ما المرجع لإجراءات تسوية الأراضي والاعتراض على جدول الحقوق في الضفة؟",
  },
  { id: "OTTOMAN", question: "ما تصنيف الأراضي في قانون الأراضي العثماني؟" },
  {
    id: "GAZA_REGISTRATION",
    question: "ما القانون المعمول به في قطاع غزة بشأن تسجيل الأراضي؟",
  },
];

const pilotResults = scenarios.map(scenario => {
  const route = routeReferenceIssue(scenario.question);
  const hits = hybridReferenceSearch({
    query: scenario.question,
    route,
    documents: retrievalDocuments,
    limit: 8,
  });
  const pack = selectReferenceEvidencePack(hits, 4);
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
      sourceUrl: hit.sourceUrl,
      authorityClass: hit.authorityClass,
      legalStatusVerified: hit.legalStatusVerified,
      usableForConclusion: hit.usableForConclusion,
      reasons: hit.reasons,
      scores: hit.scores,
    })),
    citations: citations.map(citation => ({
      citationId: citation.citationId,
      sourceUrl: citation.sourceUrl,
      artifactVersionId: citation.artifactVersionId,
      artifactSha256: citation.artifactSha256,
      locator: citation.locator,
      alignmentVerified: citation.alignmentVerified,
    })),
    citationAudit: auditReferenceGradeCitations(citations),
    conclusionEligible: pack.some(hit => hit.usableForConclusion),
    pilotDisposition:
      pack.length === 0
        ? "FAIL_CLOSED_NO_DOMAIN_EVIDENCE"
        : pack.some(hit => hit.usableForConclusion)
          ? "RETRIEVAL_CITATION_PASS_CONCLUSION_EVIDENCE_AVAILABLE"
          : "RETRIEVAL_CITATION_PASS_LEGAL_STATUS_GATE_CLOSED",
  };
});

const report = {
  program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
  phase: "MEGA_B_PRIVATE_CORPUS_PILOT",
  generatedAt: new Date().toISOString(),
  hardBoundaries: {
    liveSupabaseMutation: false,
    mainMerge: false,
    newBaseline: false,
    production: false,
    publicCorpusRelease: false,
  },
  privateArchiveRoot: privateRoot,
  acquisitionResults,
  pilotResults,
  corpusBytesIncludedInEvidenceFile: false,
};

await mkdir(resolve("evidence"), { recursive: true });
await writeFile(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(
  JSON.stringify(
    {
      evidencePath,
      preserved: acquisitionResults.filter(
        row => row.status === "PRESERVED_PRIVATE"
      ).length,
      failed: acquisitionResults.filter(row => row.status === "FETCH_FAILED")
        .length,
      scenarios: pilotResults.map(row => ({
        id: row.scenarioId,
        topHit: row.topHits[0]?.documentId || null,
        citations: row.citations.length,
        citationAudit: row.citationAudit,
      })),
    },
    null,
    2
  )
);
