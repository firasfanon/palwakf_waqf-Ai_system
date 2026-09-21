import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildLegalStatusMatrixPilot } from "../server/legalStatusMatrixPilot";

const matrix = buildLegalStatusMatrixPilot();
const evidencePath = resolve(
  "evidence",
  "WAQF_AI_LEGAL_STATUS_MATRIX_PILOT_20260921.json"
);

await mkdir(resolve("evidence"), { recursive: true });
await writeFile(
  evidencePath,
  JSON.stringify(
    {
      program: "WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1",
      phase: "LEGAL_STATUS_MATRIX_PILOT",
      hardBoundaries: {
        liveSupabaseMutation: false,
        mainMerge: false,
        newBaseline: false,
        production: false,
        publicCorpusRelease: false,
      },
      ...matrix,
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(
  JSON.stringify(
    {
      evidencePath,
      rowCount: matrix.rowCount,
      conclusionEligibleRows: matrix.conclusionEligibleRows,
      reviewRequiredRows: matrix.reviewRequiredRows,
      unresolvedGazaRows: matrix.unresolvedGazaRows,
      rows: matrix.rows.map(row => ({
        rowId: row.rowId,
        territory: row.territory,
        assertedStatus: row.assertedStatus,
        legalStatusVerified: row.legalStatusVerified,
        territoryScopeVerified: row.territoryScopeVerified,
        conclusionEligible: row.conclusionEligible,
        reasons: row.reasons,
      })),
    },
    null,
    2
  )
);
