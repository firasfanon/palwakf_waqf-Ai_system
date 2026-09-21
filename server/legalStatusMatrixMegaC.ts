import {
  LEGAL_STATUS_MATRIX_PILOT_20260921,
  evaluateLegalStatusMatrixRow,
  type LegalStatusMatrixCandidate,
  type LegalStatusMatrixDecision,
} from "./legalStatusMatrixPilot";

const observedAt = "2026-09-22";

export const LEGAL_STATUS_MATRIX_MEGA_C_EXPANSION: LegalStatusMatrixCandidate[] =
  [
    {
      rowId: "land-authority-6-2010-west-bank",
      instrumentId: "PS-DECREE-LAW-6-2010-LAND-AUTHORITY",
      instrumentTitle: "قرار بقانون رقم (6) لسنة 2010م بشأن سلطة الأراضي",
      territory: "WEST_BANK",
      asOfDate: "2026-09-22",
      assertedStatus: "IN_FORCE",
      evidence: [
        {
          evidenceId: "ogb-23283-explicit-status",
          kind: "EXPLICIT_OFFICIAL_REGISTRY_STATUS",
          url: "https://mjr.ogb.gov.ps/Decrees/Details/23283",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "Official legislation registry records the instrument as in force and records its effective date.",
          territory: null,
          observedAt,
        },
        {
          evidenceId: "pla-current-legal-framework-6-2010",
          kind: "CURRENT_OFFICIAL_APPLICATION",
          url: "https://www.pla.pna.ps/ar/Article/360/",
          publisher: "سلطة الأراضي الفلسطينية",
          proposition:
            "Current Palestinian Land Authority legal-framework material identifies the 2010 Land Authority decree-law among its governing sources.",
          territory: "WEST_BANK",
          observedAt,
        },
      ],
      notes: [
        "Pilot conclusion is limited to the status/applicability proposition evidenced here; it does not certify every subordinate rule issued under the law.",
      ],
    },
    {
      rowId: "settlement-authority-7-2016-west-bank",
      instrumentId: "PS-DECREE-LAW-7-2016-SETTLEMENT-AUTHORITY",
      instrumentTitle:
        "قرار بقانون رقم (7) لسنة 2016م بشأن هيئة تسوية الأراضي والمياه",
      territory: "WEST_BANK",
      asOfDate: "2026-09-22",
      assertedStatus: "REPEALED",
      evidence: [
        {
          evidenceId: "ogb-21967-explicit-repeal-status",
          kind: "EXPLICIT_OFFICIAL_REGISTRY_STATUS",
          url: "https://mjr.ogb.gov.ps/Decrees/Details/21967",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "Official registry labels the instrument explicitly repealed.",
          territory: null,
          observedAt,
        },
      ],
      notes: [
        "Repeal status is explicit in the official registry, while the complete repealing-chain and territorial transition remain expert-review items.",
      ],
    },
    {
      rowId: "landlords-tenants-62-1953-west-bank",
      instrumentId: "JO-LANDLORD-TENANT-62-1953-CONSOLIDATED-PS",
      instrumentTitle:
        "قانون المالكين والمستأجرين رقم (62) لسنة 1953م وتعديلاته",
      territory: "WEST_BANK",
      asOfDate: "2026-09-22",
      assertedStatus: "AMENDED",
      evidence: [
        {
          evidenceId: "ogb-merged-119",
          kind: "OFFICIAL_CONSOLIDATED_TEXT",
          url: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/119/",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "Official consolidated text records the original law and later amendments including the 2022 Palestinian amendment.",
          territory: null,
          observedAt,
        },
        {
          evidenceId: "pla-current-lease-procedure-62-1953",
          kind: "CURRENT_OFFICIAL_APPLICATION",
          url: "https://www.pla.pna.ps/ar/Article/324/",
          publisher: "سلطة الأراضي الفلسطينية",
          proposition:
            "Current Land Authority lease procedure refers to landlord/tenant rules for relevant transactions.",
          territory: "WEST_BANK",
          observedAt,
        },
      ],
      notes: [
        "General landlord/tenant law is kept distinct from the special waqf tenancy law.",
      ],
    },
    {
      rowId: "landlords-tenants-62-1953-gaza",
      instrumentId: "JO-LANDLORD-TENANT-62-1953-CONSOLIDATED-PS",
      instrumentTitle:
        "قانون المالكين والمستأجرين رقم (62) لسنة 1953م وتعديلاته",
      territory: "GAZA",
      asOfDate: "2026-09-22",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "ogb-merged-119-global",
          kind: "OFFICIAL_CONSOLIDATED_TEXT",
          url: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/119/",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "The official consolidated text establishes instrument identity and amendments but does not independently resolve current Gaza applicability.",
          territory: null,
          observedAt,
        },
      ],
      notes: [
        "No West Bank operational evidence is imported into the Gaza row.",
      ],
    },
    {
      rowId: "waqf-tenancy-5-1964-west-bank",
      instrumentId: "JO-WAQF-TENANCY-5-1964",
      instrumentTitle:
        "قانون المالكين والمستأجرين للعقارات الوقفية رقم (5) لسنة 1964م",
      territory: "WEST_BANK",
      asOfDate: "2026-09-22",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "maqam-42-secondary-status",
          kind: "SECONDARY_STATUS_SIGNAL",
          url: "https://maqam.najah.edu/legislation/42/",
          publisher: "مقام / جامعة النجاح الوطنية",
          proposition:
            "Trusted legal-reference portal reports the law as in force in the West Bank.",
          territory: "WEST_BANK",
          observedAt,
        },
      ],
      notes: [
        "Secondary in-force signal is useful for prioritization but cannot by itself unlock an authoritative status conclusion.",
      ],
    },
    {
      rowId: "settlement-amendment-8-1955-west-bank",
      instrumentId: "JO-LAND-WATER-SETTLEMENT-AMENDMENT-8-1955",
      instrumentTitle:
        "قانون رقم (8) لسنة 1955م معدل لقانون تسوية الأراضي والمياه",
      territory: "WEST_BANK",
      asOfDate: "2026-09-22",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "najah-laws-29-secondary-status",
          kind: "SECONDARY_STATUS_SIGNAL",
          url: "https://laws-portal.najah.edu/legislation/29/",
          publisher: "بوابة القوانين / جامعة النجاح الوطنية",
          proposition:
            "Trusted legal-reference portal reports the amendment as in force in the West Bank.",
          territory: "WEST_BANK",
          observedAt,
        },
      ],
      notes: [
        "Requires authoritative consolidation/status evidence before a current-law conclusion.",
      ],
    },
    {
      rowId: "expropriation-2-1953-west-bank",
      instrumentId: "JO-EXPROPRIATION-LAW-2-1953-CONSOLIDATED-PS",
      instrumentTitle: "قانون الاستملاك رقم (2) لسنة 1953م وتعديلاته",
      territory: "WEST_BANK",
      asOfDate: "2026-09-22",
      assertedStatus: "AMENDED",
      evidence: [
        {
          evidenceId: "ogb-merged-49",
          kind: "OFFICIAL_CONSOLIDATED_TEXT",
          url: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/49/",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "Official consolidated text records the original expropriation law and subsequent amendments.",
          territory: null,
          observedAt,
        },
        {
          evidenceId: "maqam-78-secondary-status",
          kind: "SECONDARY_STATUS_SIGNAL",
          url: "https://maqam.najah.edu/legislation/78/",
          publisher: "مقام / جامعة النجاح الوطنية",
          proposition:
            "Trusted legal-reference portal reports current West Bank force as a secondary status signal.",
          territory: "WEST_BANK",
          observedAt,
        },
      ],
      notes: [
        "Official consolidation verifies amendment lineage, but secondary territorial status alone does not satisfy the territory gate.",
      ],
    },
    {
      rowId: "registration-transfer-fees-2-2012-west-bank",
      instrumentId: "PS-DECREE-LAW-2-2012-LAND-REGISTRATION-TRANSFER-FEES",
      instrumentTitle:
        "قرار بقانون رقم (2) لسنة 2012م بشأن رسوم تسجيل وانتقال الأراضي",
      territory: "WEST_BANK",
      asOfDate: "2026-09-22",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "ogb-22895-text-west-bank",
          kind: "OFFICIAL_TERRITORY_SPECIFIC_GUIDANCE",
          url: "https://mjr.ogb.gov.ps/Decrees/ViewText/22895/",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "The official text distinguishes underlying northern/West Bank registration-fee legislation.",
          territory: "WEST_BANK",
          observedAt,
        },
      ],
      notes: [
        "Territorial legal lineage is explicit, but present status remains unresolved until the current status/amendment chain is verified.",
      ],
    },
    {
      rowId: "registration-transfer-fees-2-2012-gaza",
      instrumentId: "PS-DECREE-LAW-2-2012-LAND-REGISTRATION-TRANSFER-FEES",
      instrumentTitle:
        "قرار بقانون رقم (2) لسنة 2012م بشأن رسوم تسجيل وانتقال الأراضي",
      territory: "GAZA",
      asOfDate: "2026-09-22",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "ogb-22895-text-gaza",
          kind: "OFFICIAL_TERRITORY_SPECIFIC_GUIDANCE",
          url: "https://mjr.ogb.gov.ps/Decrees/ViewText/22895/",
          publisher: "ديوان الجريدة الرسمية",
          proposition:
            "The official text distinguishes underlying southern/Gaza registration-fee legislation.",
          territory: "GAZA",
          observedAt,
        },
      ],
      notes: [
        "The Gaza lineage is tracked independently; the presence of a Palestinian decree-law does not by itself establish current Gaza application.",
      ],
    },
    {
      rowId: "ottoman-land-code-historic-palestine",
      instrumentId: "OTTOMAN-LAND-CODE-1274H-1858",
      instrumentTitle: "قانون الأراضي العثماني لسنة 1858م",
      territory: "OTTOMAN_PALESTINE",
      asOfDate: "1900-01-01",
      assertedStatus: "UNRESOLVED",
      evidence: [
        {
          evidenceId: "maqam-169-historical-reference",
          kind: "SECONDARY_REFERENCE",
          url: "https://maqam.najah.edu/legislation/169/",
          publisher: "مقام / جامعة النجاح الوطنية",
          proposition:
            "Trusted reference copy supports document identity and text discovery.",
          territory: "OTTOMAN_PALESTINE",
          observedAt,
        },
      ],
      notes: [
        "Historical applicability is not promoted to verified until an archival/primary edition or expert decision is linked.",
      ],
    },
    {
      rowId: "mandate-land-transfers-1940-historic-palestine",
      instrumentId: "MANDATE-PALESTINE-LAND-TRANSFERS-REGULATIONS-1940",
      instrumentTitle: "Land Transfers Regulations, 1940",
      territory: "HISTORIC_PALESTINE",
      asOfDate: "1940-03-01",
      assertedStatus: "HISTORICAL",
      evidence: [
        {
          evidenceId: "unispal-lon-1940-archive",
          kind: "ARCHIVAL_PRIMARY",
          url: "https://www.un.org/unispal/wp-content/uploads/2021/04/C-36-M-32-1940-VI_EN.pdf",
          publisher: "UNISPAL / League of Nations archival record",
          proposition:
            "Archival record preserves the 1940 Palestine Land Transfers Regulations.",
          territory: "HISTORIC_PALESTINE",
          observedAt,
        },
        {
          evidenceId: "palquest-1940-reference",
          kind: "SECONDARY_REFERENCE",
          url: "https://www.palquest.org/en/node/23188",
          publisher: "PalQuest / Institute for Palestine Studies",
          proposition:
            "Reference record identifies Palestine Official Gazette Supplement No. 2, issue 988, 28 February 1940.",
          territory: "HISTORIC_PALESTINE",
          observedAt,
        },
      ],
      notes: [
        "This verifies historical identity/application context only; it is not a claim of modern force.",
      ],
    },
    {
      rowId: "jerusalem-current-land-waqf-track",
      instrumentId: "JERUSALEM-CURRENT-LAND-WAQF-TRACK",
      instrumentTitle: "المسار القانوني الراهن للأرض والوقف في القدس",
      territory: "JERUSALEM",
      asOfDate: "2026-09-22",
      assertedStatus: "UNRESOLVED",
      evidence: [],
      notes: [
        "Intentionally unresolved until a separately approved Jerusalem source family and jurisdiction analysis are completed.",
      ],
    },
  ];

export const LEGAL_STATUS_MATRIX_MEGA_C_20260922: LegalStatusMatrixCandidate[] =
  [
    ...LEGAL_STATUS_MATRIX_PILOT_20260921,
    ...LEGAL_STATUS_MATRIX_MEGA_C_EXPANSION,
  ];

export function buildLegalStatusMatrixMegaC(): {
  generatedForDate: string;
  rowCount: number;
  conclusionEligibleRows: number;
  reviewRequiredRows: number;
  territoryCounts: Record<string, number>;
  unresolvedByTerritory: Record<string, number>;
  rows: LegalStatusMatrixDecision[];
} {
  const rows = LEGAL_STATUS_MATRIX_MEGA_C_20260922.map(
    evaluateLegalStatusMatrixRow
  );
  const territoryCounts: Record<string, number> = {};
  const unresolvedByTerritory: Record<string, number> = {};
  for (const row of rows) {
    territoryCounts[row.territory] = (territoryCounts[row.territory] || 0) + 1;
    if (!row.conclusionEligible) {
      unresolvedByTerritory[row.territory] =
        (unresolvedByTerritory[row.territory] || 0) + 1;
    }
  }
  return {
    generatedForDate: "2026-09-22",
    rowCount: rows.length,
    conclusionEligibleRows: rows.filter(row => row.conclusionEligible).length,
    reviewRequiredRows: rows.filter(row => row.reviewRequired).length,
    territoryCounts,
    unresolvedByTerritory,
    rows,
  };
}
