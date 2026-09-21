import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildLegalStatusMatrixMegaC } from "../server/legalStatusMatrixMegaC";
import { buildExpertReviewQueue } from "../server/expertReviewQueue";
import { buildCorpusCoverageLedger } from "../server/referenceCorpusScaleUp";

const matrix = buildLegalStatusMatrixMegaC();
const reviewQueue = buildExpertReviewQueue();
const coverageLedger = buildCorpusCoverageLedger();

const evidencePath = resolve(
  "evidence",
  "WAQF_AI_LEGAL_STATUS_MATRIX_MEGA_C_20260922.json"
);

const report = {
  program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
  phase: "MEGA_C_LEGAL_STATUS_AND_EXPERT_REVIEW",
  hardBoundaries: {
    liveSharedSupabaseMutation: false,
    mainMerge: false,
    newBaseline: false,
    production: false,
    publicCorpusRelease: false,
  },
  matrix,
  expertReviewQueue: reviewQueue,
  corpusCoverageLedger: coverageLedger,
  humanExpertDecisionsIncluded: false,
};

await mkdir(resolve("evidence"), { recursive: true });
await writeFile(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log(
  JSON.stringify(
    {
      evidencePath,
      rows: matrix.rowCount,
      conclusionEligible: matrix.conclusionEligibleRows,
      reviewRequired: matrix.reviewRequiredRows,
      territoryCounts: matrix.territoryCounts,
      unresolvedByTerritory: matrix.unresolvedByTerritory,
      expertReviewItems: reviewQueue.itemCount,
      familyReviewCount: reviewQueue.familyReviewCount,
      legalStatusExceptionCount: reviewQueue.legalStatusExceptionCount,
      perDocumentRoutineRightsReviewCount:
        reviewQueue.perDocumentRoutineRightsReviewCount,
      humanExpertDecisionsIncluded: false,
    },
    null,
    2
  )
);
