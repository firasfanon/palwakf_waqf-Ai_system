import type { LegalStatus, LegalTerritory } from "./legalReferenceModel";

export type LegalStatusEvidenceKind =
  | "EXPLICIT_OFFICIAL_REGISTRY_STATUS"
  | "OFFICIAL_CONSOLIDATED_TEXT"
  | "CURRENT_OFFICIAL_APPLICATION"
  | "OFFICIAL_TERRITORY_SPECIFIC_GUIDANCE"
  | "ARCHIVAL_PRIMARY"
  | "SECONDARY_STATUS_SIGNAL"
  | "EXPERT_REVIEW_DECISION"
  | "SECONDARY_REFERENCE";

export type LegalStatusMatrixEvidence = {
  evidenceId: string;
  kind: LegalStatusEvidenceKind;
  url: string;
  publisher: string;
  proposition: string;
  territory: LegalTerritory | null;
  observedAt: string;
};

export type LegalStatusMatrixCandidate = {
  rowId: string;
  instrumentId: string;
  instrumentTitle: string;
  territory: LegalTerritory;
  asOfDate: string;
  assertedStatus: LegalStatus;
  evidence: LegalStatusMatrixEvidence[];
  notes: string[];
};

export type LegalStatusMatrixDecision = LegalStatusMatrixCandidate & {
  explicitStatusVerified: boolean;
  currentOfficialApplicationVerified: boolean;
  territoryScopeVerified: boolean;
  legalStatusVerified: boolean;
  conclusionEligible: boolean;
  reviewRequired: boolean;
  reasons: string[];
};

function hasEvidence(
  row: LegalStatusMatrixCandidate,
  kind: LegalStatusEvidenceKind
): boolean {
  return row.evidence.some(item => item.kind === kind);
}

function hasTerritoryEvidence(row: LegalStatusMatrixCandidate): boolean {
  return row.evidence.some(
    item =>
      item.territory === row.territory &&
      [
        "CURRENT_OFFICIAL_APPLICATION",
        "OFFICIAL_TERRITORY_SPECIFIC_GUIDANCE",
        "ARCHIVAL_PRIMARY",
        "EXPERT_REVIEW_DECISION",
      ].includes(item.kind)
  );
}

export function evaluateLegalStatusMatrixRow(
  row: LegalStatusMatrixCandidate
): LegalStatusMatrixDecision {
  const reasons: string[] = [];
  const explicitStatusVerified = hasEvidence(
    row,
    "EXPLICIT_OFFICIAL_REGISTRY_STATUS"
  );
  const currentOfficialApplicationVerified = hasEvidence(
    row,
    "CURRENT_OFFICIAL_APPLICATION"
  );
  const territoryScopeVerified = hasTerritoryEvidence(row);
  const expertDecisionVerified = hasEvidence(row, "EXPERT_REVIEW_DECISION");
  const legalStatusVerified =
    row.assertedStatus !== "UNRESOLVED" &&
    (explicitStatusVerified ||
      expertDecisionVerified ||
      (row.assertedStatus === "AMENDED" &&
        hasEvidence(row, "OFFICIAL_CONSOLIDATED_TEXT")) ||
      (row.assertedStatus === "HISTORICAL" &&
        hasEvidence(row, "ARCHIVAL_PRIMARY")));

  if (!legalStatusVerified)
    reasons.push("legal_status_requires_further_verification");
  if (!territoryScopeVerified)
    reasons.push("territory_scope_requires_verification");
  if (currentOfficialApplicationVerified && !legalStatusVerified) {
    reasons.push("current_application_does_not_replace_status_verification");
  }
  if (row.assertedStatus === "UNRESOLVED")
    reasons.push("status_explicitly_unresolved");

  const conclusionEligible =
    legalStatusVerified &&
    territoryScopeVerified &&
    row.assertedStatus !== "DISPUTED" &&
    row.assertedStatus !== "UNRESOLVED";

  return {
    ...row,
    explicitStatusVerified,
    currentOfficialApplicationVerified,
    territoryScopeVerified,
    legalStatusVerified,
    conclusionEligible,
    reviewRequired: !conclusionEligible,
    reasons: [...new Set(reasons)],
  };
}

export const LEGAL_STATUS_MATRIX_PILOT_20260921: LegalStatusMatrixCandidate[] =
  [
    {
      rowId: "waqf-2023-west-bank",
      instrumentId: "PS-DECREE-LAW-2-2023-WAQF",
      instrumentTitle:
        "قرار بقانون رقم (2) لسنة 2023م بتعديل قانون الأوقاف والشؤون والمقدسات الإسلامية رقم (26) لسنة 1966م وتعديلاته",
      territory: "WEST_BANK",
      asOfDate: "2026-09-21",
      assertedStatus: "IN_FORCE",
      evidence: [
        {
          evidenceId: "ogb-33311-status",
          kind: "EXPLICIT_OFFICIAL_REGISTRY_STATUS",
          url: "https://mjr.ogb.gov.ps/Decrees/Details/33311",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "Official registry marks the decree-law as in force and records an effective date of 2023-02-23.",
          territory: null,
          observedAt: "2026-09-21",
        },
        {
          evidenceId: "ogb-2023-hebron-instruction",
          kind: "CURRENT_OFFICIAL_APPLICATION",
          url: "https://mjr.ogb.gov.ps/Decrees/ViewText/33468/",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "A later official instruction concerning the Ibrahimi Mosque relies on the 2023 waqf amendment.",
          territory: "WEST_BANK",
          observedAt: "2026-09-21",
        },
      ],
      notes: [
        "Pilot verifies explicit registry status and a West Bank application signal; broader constitutional/territorial questions remain reviewable outside this row.",
      ],
    },
    {
      rowId: "waqf-2023-gaza",
      instrumentId: "PS-DECREE-LAW-2-2023-WAQF",
      instrumentTitle:
        "قرار بقانون رقم (2) لسنة 2023م بتعديل قانون الأوقاف والشؤون والمقدسات الإسلامية رقم (26) لسنة 1966م وتعديلاته",
      territory: "GAZA",
      asOfDate: "2026-09-21",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "ogb-33311-status-global",
          kind: "EXPLICIT_OFFICIAL_REGISTRY_STATUS",
          url: "https://mjr.ogb.gov.ps/Decrees/Details/33311",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "The registry status of the instrument is official, but this evidence does not by itself resolve current Gaza applicability.",
          territory: null,
          observedAt: "2026-09-21",
        },
      ],
      notes: [
        "No Gaza-specific current applicability conclusion is inferred from West Bank/central-government evidence.",
      ],
    },
    {
      rowId: "waqf-law-1966-west-bank",
      instrumentId: "PS-WAQF-LAW-26-1966-CONSOLIDATED",
      instrumentTitle:
        "قانون الأوقاف والشؤون الدينية رقم (26) لسنة 1966م وتعديلاته",
      territory: "WEST_BANK",
      asOfDate: "2026-09-21",
      assertedStatus: "AMENDED",
      evidence: [
        {
          evidenceId: "ogb-merged-165",
          kind: "OFFICIAL_CONSOLIDATED_TEXT",
          url: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/165",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "Official consolidated text lists the original law and its amendments through the 2023 decree-law.",
          territory: null,
          observedAt: "2026-09-21",
        },
        {
          evidenceId: "ogb-2023-hebron-law-application",
          kind: "CURRENT_OFFICIAL_APPLICATION",
          url: "https://mjr.ogb.gov.ps/Decrees/ViewText/33468/",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "Official West Bank instruction relies on the amended waqf legislation.",
          territory: "WEST_BANK",
          observedAt: "2026-09-21",
        },
      ],
      notes: [
        "The row identifies the law as amended, not as an untouched 1966 text.",
      ],
    },
    {
      rowId: "settlement-40-1952-west-bank",
      instrumentId: "JO-LAND-WATER-SETTLEMENT-40-1952",
      instrumentTitle: "قانون تسوية الأراضي والمياه رقم (40) لسنة 1952م",
      territory: "WEST_BANK",
      asOfDate: "2026-09-21",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "pla-current-settlement-page",
          kind: "CURRENT_OFFICIAL_APPLICATION",
          url: "https://www.pla.pna.ps/ar/Article/481/",
          publisher: "سلطة الأراضي الفلسطينية",
          proposition:
            "Current Land Authority settlement guidance expressly operates by reference to Law No. 40 of 1952.",
          territory: "WEST_BANK",
          observedAt: "2026-09-21",
        },
        {
          evidenceId: "pla-2025-settlement-notice",
          kind: "CURRENT_OFFICIAL_APPLICATION",
          url: "https://www.pla.pna.ps/public/files/server/works/317-1751794921.pdf",
          publisher: "هيئة تسوية الأراضي والمياه",
          proposition:
            "A 2025 official settlement notice invokes Article 6 of Law No. 40 of 1952.",
          territory: "WEST_BANK",
          observedAt: "2026-09-21",
        },
      ],
      notes: [
        "Current official application is verified, but a full amendment/repeal consolidation is still required before asserting a complete legal-status conclusion.",
      ],
    },
    {
      rowId: "land-regime-gaza",
      instrumentId: "GAZA-LAND-REGIME-CURRENT-MATRIX-SEED",
      instrumentTitle: "مسار تشريعات الأراضي المعمول بها في قطاع غزة",
      territory: "GAZA",
      asOfDate: "2026-09-21",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "gaza-pla-government-property",
          kind: "OFFICIAL_TERRITORY_SPECIFIC_GUIDANCE",
          url: "https://www.pla.gov.ps/ar/%D8%A7%D9%84%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9-%D9%84%D8%A3%D9%85%D9%84%D8%A7%D9%83-%D8%A7%D9%84%D8%AD%D9%83%D9%88%D9%85%D8%A9-291.html",
          publisher: "سلطة الأراضي الفلسطينية - غزة",
          proposition:
            "Gaza-specific official guidance describes Egyptian-administration legislation and land-law layers relevant to government and waqf property.",
          territory: "GAZA",
          observedAt: "2026-09-21",
        },
      ],
      notes: [
        "This row proves a separate Gaza legal track exists; it intentionally does not collapse that track into a single current statute.",
      ],
    },
  ];

export function buildLegalStatusMatrixPilot() {
  const rows = LEGAL_STATUS_MATRIX_PILOT_20260921.map(
    evaluateLegalStatusMatrixRow
  );
  return {
    generatedForDate: "2026-09-21",
    rowCount: rows.length,
    conclusionEligibleRows: rows.filter(row => row.conclusionEligible).length,
    reviewRequiredRows: rows.filter(row => row.reviewRequired).length,
    unresolvedGazaRows: rows.filter(
      row => row.territory === "GAZA" && !row.conclusionEligible
    ).length,
    rows,
  };
}
