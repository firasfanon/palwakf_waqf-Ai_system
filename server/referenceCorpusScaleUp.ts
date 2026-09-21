import {
  MEGA_B_REFERENCE_SEED,
  type ReferenceCorpusDomain,
  type ReferenceCorpusEra,
  type ReferenceCorpusItem,
} from "./referenceCorpus";
import type { LegalTerritory } from "./legalReferenceModel";

export type CorpusCoverageState =
  | "COMPLETE"
  | "PARTIAL"
  | "UNRESOLVED"
  | "NOT_STARTED";

export type FamilyReviewPolicy =
  | "POLICY_AUTO_LOW_RISK"
  | "EXCEPTION_ONLY"
  | "EXPERT_REQUIRED";

export type ReferenceSourceFamily = {
  familyId: string;
  title: string;
  domains: ReferenceCorpusDomain[];
  eras: ReferenceCorpusEra[];
  territories: LegalTerritory[];
  priority: "P0" | "P1" | "P2";
  coverageState: CorpusCoverageState;
  acquisitionMode: "BOUNDED_COLLECTION" | "CURATED_DOCUMENTS" | "METADATA_ONLY";
  reviewPolicy: FamilyReviewPolicy;
  seedCorpusIds: string[];
  notes: string[];
};

const privateResearchRights = {
  preserveAllowed: true,
  fullTextRetentionAllowed: true,
  ragAllowed: true,
  publicDisplayAllowed: false,
  downloadAllowed: false,
  quoteAllowed: true,
  reviewStatus: "pending" as const,
};

export const MEGA_C_REFERENCE_EXPANSION: ReferenceCorpusItem[] = [
  {
    corpusId: "pla-legal-framework-current",
    title: "الإطار القانوني لعمل سلطة الأراضي",
    domain: "land_law",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://www.pla.pna.ps/ar/Article/360/%D8%A7%D9%84%D8%A5%D8%B7%D8%A7%D8%B1-%D8%A7%D9%84%D9%82%D8%A7%D9%86%D9%88%D9%86%D9%8A-%D9%84%D8%B9%D9%85%D9%84-%D8%B3%D9%84%D8%B7%D8%A9-%D8%A7%D9%84%D8%A3%D8%B1%D8%A7%D8%B6%D9%8A",
    publisher: "سلطة الأراضي الفلسطينية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-PLA-CURRENT-LEGAL-FRAMEWORK",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Official current legal-framework inventory used as a source-family map, not as proof that every listed instrument is fully consolidated or currently applicable.",
    ],
  },
  {
    corpusId: "pla-procedures-manual-2024",
    title: "الإطار القانوني لعمل سلطة الأراضي — نسخة PDF",
    domain: "administrative",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://www.pla.pna.ps/public/files/uploads/2024/procedures_manual.pdf",
    publisher: "سلطة الأراضي الفلسطينية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-PLA-LEGAL-FRAMEWORK-PDF",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
      timeoutMs: 20_000,
    },
    notes: [
      "Official PDF version of the Land Authority legal-framework inventory; not a separate procedures manual.",
      "The inventory maps governing source families but does not by itself prove that every listed instrument is fully consolidated or currently applicable.",
    ],
  },
  {
    corpusId: "land-authority-law-2010-gazette-86-wafa",
    title:
      "الوقائع الفلسطينية العدد 86 — قرار بقانون رقم (6) لسنة 2010م بشأن سلطة الأراضي",
    domain: "land_law",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl: "https://info.wafa.ps/userfiles/server/pdf/fact_86.pdf",
    publisher:
      "وكالة الأنباء والمعلومات الفلسطينية وفا — نسخة من الوقائع الفلسطينية العدد 86",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "PS-OFFICIAL-GAZETTE-86-LAND-AUTHORITY-6-2010",
    territories: ["WEST_BANK"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "IN_FORCE",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/Details/23283",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
      timeoutMs: 20_000,
    },
    notes: [
      "Preserved official-publication mirror for the 2010 Land Authority decree-law; registry status remains independently resolved from OGB evidence.",
    ],
  },
  {
    corpusId: "settlement-authority-7-2016-wafa",
    title:
      "قرار بقانون رقم (7) لسنة 2016م بشأن هيئة تسوية الأراضي والمياه — نسخة وفا",
    domain: "registration_settlement",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl: "https://info.wafa.ps/Pages/Details/33324",
    publisher: "وكالة الأنباء والمعلومات الفلسطينية وفا",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "PS-DECREE-LAW-7-2016-SETTLEMENT-AUTHORITY-WAFA-COPY",
    territories: ["WEST_BANK"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "REPEALED",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/Details/21967",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Derivative copy used for preservation when the official registry blocks automated acquisition; explicit repeal status is verified separately against OGB.",
    ],
  },
  {
    corpusId: "settlement-amendment-8-1955-registry",
    title: "قانون رقم (8) لسنة 1955م معدل لقانون تسوية الأراضي والمياه",
    domain: "registration_settlement",
    era: "JORDANIAN",
    sourceUrl: "https://laws-portal.najah.edu/legislation/29/",
    publisher: "بوابة القوانين / جامعة النجاح الوطنية",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "JO-LAND-WATER-SETTLEMENT-AMENDMENT-8-1955",
    territories: ["WEST_BANK"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "JORDANIAN_WEST_BANK",
        status: "IN_FORCE",
        evidenceUrl: "https://laws-portal.najah.edu/legislation/29/",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Secondary status signal only; expert legal-status verification remains required.",
    ],
  },
  {
    corpusId: "expropriation-law-2-1953-consolidated",
    title: "قانون الاستملاك رقم (2) لسنة 1953م وتعديلاته",
    domain: "land_law",
    era: "JORDANIAN",
    sourceUrl:
      "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/49/%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D8%A7%D8%B3%D8%AA%D9%85%D9%84%D8%A7%D9%83-%D8%B1%D9%82%D9%85-2-%D9%84%D8%B3%D9%86%D8%A9-1953%D9%85-%D9%81%D9%84%D8%B3%D8%B7%D9%8A%D9%86",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "JO-EXPROPRIATION-LAW-2-1953-CONSOLIDATED-PS",
    territories: ["WEST_BANK"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "MIXED",
        status: "AMENDED",
        evidenceUrl: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/49/",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Official consolidated lineage includes later amendments; territorial/current status remains a separate review dimension.",
    ],
  },
  {
    corpusId: "settlement-authority-7-2016-official",
    title: "قرار بقانون رقم (7) لسنة 2016م بشأن هيئة تسوية الأراضي والمياه",
    domain: "registration_settlement",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl: "https://mjr.ogb.gov.ps/Decrees/Details/21967",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-DECREE-LAW-7-2016-SETTLEMENT-AUTHORITY",
    territories: ["WEST_BANK"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "REPEALED",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/Details/21967",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Official registry currently labels the instrument explicitly repealed. The repealing chain must still be captured before an expert closure decision.",
    ],
  },
  {
    corpusId: "landlords-tenants-62-1953-consolidated",
    title: "قانون المالكين والمستأجرين رقم (62) لسنة 1953م وتعديلاته",
    domain: "lease_hukr",
    era: "JORDANIAN",
    sourceUrl:
      "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/119/%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%A7%D9%84%D9%85%D8%A7%D9%84%D9%83%D9%8A%D9%86-%D9%88%D8%A7%D9%84%D9%85%D8%B3%D8%AA%D8%A3%D8%AC%D8%B1%D9%8A%D9%86-%D9%82%D8%A7%D9%86%D9%88%D9%86-%D8%B1%D9%82%D9%85-62-%D9%84%D8%B3%D9%86%D8%A9-1953-%D9%81%D9%84%D8%B3%D8%B7%D9%8A%D9%86",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "JO-LANDLORD-TENANT-62-1953-CONSOLIDATED-PS",
    territories: ["WEST_BANK"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "MIXED",
        status: "AMENDED",
        evidenceUrl: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/119/",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "General lease law remains semantically distinct from the special waqf tenancy law.",
    ],
  },
  {
    corpusId: "landlords-tenants-amendment-35-2022",
    title:
      "قرار بقانون رقم (35) لسنة 2022م بتعديل قانون المالكين والمستأجرين رقم (62) لسنة 1953م",
    domain: "lease_hukr",
    era: "CONTEMPORARY",
    sourceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/33216/",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-DECREE-LAW-35-2022-LANDLORD-TENANT",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Amendment source; relationship to general lease law must be represented explicitly in the legal graph.",
    ],
  },
  {
    corpusId: "land-registration-fees-2-1952-consolidated",
    title: "نظام رسوم تسجيل الأراضي والمياه رقم (2) لسنة 1952م وتعديلاته",
    domain: "registration_settlement",
    era: "JORDANIAN",
    sourceUrl:
      "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/148/%D9%86%D8%B8%D8%A7%D9%85-%D8%B1%D8%B3%D9%88%D9%85-%D8%AA%D8%B3%D8%AC%D9%8A%D9%84-%D8%A7%D9%84%D8%A3%D8%B1%D8%A7%D8%B6%D9%8A-%D9%88%D8%A7%D9%84%D9%85%D9%8A%D8%A7%D9%87-%D8%B1%D9%82%D9%85-2-%D9%84%D8%B3%D9%86%D8%A9-1952%D9%85-%D9%81%D9%84%D8%B3%D8%B7%D9%8A%D9%86",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "JO-LAND-WATER-REGISTRATION-FEES-2-1952",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Official consolidated registration-fee instrument; current applicability must remain evidence-backed.",
    ],
  },
  {
    corpusId: "land-registration-transfer-fees-2-2012",
    title: "قرار بقانون رقم (2) لسنة 2012م بشأن رسوم تسجيل وانتقال الأراضي",
    domain: "registration_settlement",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/22895/",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-DECREE-LAW-2-2012-LAND-REGISTRATION-TRANSFER-FEES",
    territories: ["WEST_BANK", "GAZA"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "UNRESOLVED",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/22895/",
        verified: false,
        verifiedAt: null,
      },
      {
        territory: "GAZA",
        regime: "PALESTINIAN",
        status: "UNRESOLVED",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/22895/",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "The text itself distinguishes underlying northern and southern land-fee regimes; current territorial status must be resolved separately.",
    ],
  },
  {
    corpusId: "pla-new-registration-procedure",
    title: "معاملة التسجيل الجديد للأموال غير المنقولة",
    domain: "registration_settlement",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://www.pla.pna.ps/ar/Article/312/%D9%85%D8%B9%D8%A7%D9%85%D9%84%D8%A9-%D8%A7%D9%84%D8%AA%D8%B3%D8%AC%D9%8A%D9%84-%D8%A7%D9%84%D8%AC%D8%AF%D9%8A%D8%AF",
    publisher: "سلطة الأراضي الفلسطينية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-PLA-NEW-REGISTRATION-PROCEDURE",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Current procedure identifies Law No. 6 of 1964 as a governing source for previously unregistered immovable property.",
    ],
  },
  {
    corpusId: "pla-lease-transaction-procedure",
    title: "معاملات الإجارة وتحويلها وفكها",
    domain: "lease_hukr",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://www.pla.pna.ps/ar/Article/324/%D9%85%D8%B9%D8%A7%D9%85%D9%84%D8%A7%D8%AA-%D8%A7%D9%84%D8%A5%D8%AC%D8%A7%D8%B1%D8%A9-%D9%88%D8%AA%D8%AD%D9%88%D9%8A%D9%84%D9%87%D8%A7-%D9%88%D9%81%D9%83%D9%87%D8%A7",
    publisher: "سلطة الأراضي الفلسطينية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-PLA-LEASE-TRANSACTION-PROCEDURE",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Current administrative procedure distinguishes settlement-law lease registration from municipal landlord/tenant rules.",
    ],
  },
  {
    corpusId: "movable-rights-security-11-2016-gazette-120-wafa",
    title:
      "الوقائع الفلسطينية العدد 120 — قرار بقانون رقم (11) لسنة 2016م بشأن ضمان الحقوق في المال المنقول",
    domain: "finance_investment",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl:
      "https://info.wafa.ps/userfiles/server/pdf/Palestanian_facts_number_120_%281%29.pdf",
    publisher:
      "وكالة الأنباء والمعلومات الفلسطينية وفا — نسخة من الوقائع الفلسطينية العدد 120",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "PS-OFFICIAL-GAZETTE-120-MOVABLE-RIGHTS-11-2016",
    territories: ["WEST_BANK", "GAZA"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "IN_FORCE",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/Details/21943",
        verified: false,
        verifiedAt: null,
      },
      {
        territory: "GAZA",
        regime: "PALESTINIAN",
        status: "UNRESOLVED",
        evidenceUrl: null,
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
      timeoutMs: 20_000,
    },
    notes: [
      "Preserved Gazette mirror for movable-rights law. West Bank/Gaza applicability remains independently status-gated.",
    ],
  },
  {
    corpusId: "movable-rights-security-11-2016",
    title: "قرار بقانون رقم (11) لسنة 2016م بشأن ضمان الحقوق في المال المنقول",
    domain: "finance_investment",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/21943/",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-DECREE-LAW-11-2016-MOVABLE-RIGHTS-SECURITY",
    territories: ["WEST_BANK", "GAZA"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Relevant where waqf administration touches movable assets or security rights; it must not be conflated with immovable-property title rules.",
    ],
  },
  {
    corpusId: "mandate-land-transfers-regulations-1940-palquest",
    title: "Land Transfers Regulations, 1940",
    domain: "land_law",
    era: "BRITISH_MANDATE",
    sourceUrl: "https://www.palquest.org/en/node/23188",
    publisher: "PalQuest / Institute for Palestine Studies",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "MANDATE-PALESTINE-LAND-TRANSFERS-REGULATIONS-1940",
    territories: ["HISTORIC_PALESTINE"],
    statusAssertions: [
      {
        territory: "HISTORIC_PALESTINE",
        regime: "BRITISH_MANDATE",
        status: "HISTORICAL",
        evidenceUrl: "https://www.palquest.org/en/node/23188",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Historical reference copy that identifies Palestine Official Gazette Supplement No. 2, issue 988, 28 February 1940 as the source.",
    ],
  },
  {
    corpusId: "mandate-land-transfers-regulations-1940-unispal",
    title:
      "League of Nations archive copy — Palestine Land Transfers Regulations 1940",
    domain: "land_law",
    era: "BRITISH_MANDATE",
    sourceUrl:
      "https://www.un.org/unispal/wp-content/uploads/2021/04/C-36-M-32-1940-VI_EN.pdf",
    publisher: "United Nations UNISPAL / League of Nations archival record",
    authorityClass: "archival_primary",
    authorityVerified: true,
    canonicalIdentity: "LON-PALESTINE-LAND-TRANSFERS-REGULATIONS-1940-ARCHIVE",
    territories: ["HISTORIC_PALESTINE"],
    statusAssertions: [
      {
        territory: "HISTORIC_PALESTINE",
        regime: "BRITISH_MANDATE",
        status: "HISTORICAL",
        evidenceUrl:
          "https://www.un.org/unispal/wp-content/uploads/2021/04/C-36-M-32-1940-VI_EN.pdf",
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Archival evidence for the 1940 regulations; historical legal effect is distinct from modern applicability.",
    ],
  },
  {
    corpusId: "gaza-government-property-legal-guidance",
    title: "الإدارة العامة لأملاك الحكومة — الإطار التشريعي في قطاع غزة",
    domain: "land_law",
    era: "EGYPTIAN_GAZA",
    sourceUrl:
      "https://www.pla.gov.ps/ar/%D8%A7%D9%84%D8%A5%D8%AF%D8%A7%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D8%A7%D9%85%D8%A9-%D9%84%D8%A3%D9%85%D9%84%D8%A7%D9%83-%D8%A7%D9%84%D8%AD%D9%83%D9%88%D9%85%D8%A9-291.html",
    publisher: "سلطة الأراضي الفلسطينية - غزة",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "GAZA-PLA-GOVERNMENT-PROPERTY-LEGAL-GUIDANCE",
    territories: ["GAZA"],
    statusAssertions: [],
    rights: { ...privateResearchRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Gaza-specific legal track evidence. It must never inherit a West Bank status by default.",
    ],
  },
];

export const MEGA_C_REFERENCE_CORPUS: ReferenceCorpusItem[] = [
  ...MEGA_B_REFERENCE_SEED,
  ...MEGA_C_REFERENCE_EXPANSION,
];

export const MEGA_C_SOURCE_FAMILIES: ReferenceSourceFamily[] = [
  {
    familyId: "LAND_WEST_BANK_CURRENT",
    title: "West Bank current land-law family",
    domains: ["land_law", "registration_settlement", "administrative"],
    eras: ["JORDANIAN", "PALESTINIAN_AUTHORITY", "CONTEMPORARY"],
    territories: ["WEST_BANK"],
    priority: "P0",
    coverageState: "PARTIAL",
    acquisitionMode: "BOUNDED_COLLECTION",
    reviewPolicy: "EXCEPTION_ONLY",
    seedCorpusIds: [
      "pla-legal-framework-current",
      "pla-procedures-manual-2024",
      "land-authority-law-2010",
      "land-authority-law-2010-gazette-86-wafa",
      "land-settlement-law-40-1952-registry",
      "settlement-amendment-8-1955-registry",
      "expropriation-law-2-1953-consolidated",
      "settlement-authority-7-2016-official",
      "settlement-authority-7-2016-wafa",
      "land-registration-fees-2-1952-consolidated",
      "land-registration-transfer-fees-2-2012",
      "pla-new-registration-procedure",
    ],
    notes: [
      "Current official framework materially expanded, but statute-by-statute amendment/repeal consolidation remains incomplete.",
    ],
  },
  {
    familyId: "LAND_GAZA_CURRENT",
    title: "Gaza current land-law family",
    domains: ["land_law", "registration_settlement", "administrative"],
    eras: ["EGYPTIAN_GAZA", "PALESTINIAN_AUTHORITY", "CONTEMPORARY"],
    territories: ["GAZA"],
    priority: "P0",
    coverageState: "UNRESOLVED",
    acquisitionMode: "BOUNDED_COLLECTION",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [
      "gaza-land-authority-legal-library",
      "gaza-government-property-legal-guidance",
      "land-registration-transfer-fees-2-2012",
      "movable-rights-security-11-2016",
      "movable-rights-security-11-2016-gazette-120-wafa",
    ],
    notes: [
      "Separate legal lineage required. No West Bank status may be copied into Gaza.",
    ],
  },
  {
    familyId: "LAND_JERUSALEM_TRACK",
    title: "Jerusalem-specific land/waqf applicability track",
    domains: ["land_law", "waqf_law", "registration_settlement"],
    eras: ["JORDANIAN", "CONTEMPORARY", "CROSS_ERA"],
    territories: ["JERUSALEM"],
    priority: "P1",
    coverageState: "UNRESOLVED",
    acquisitionMode: "METADATA_ONLY",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [],
    notes: [
      "Independent Jerusalem track intentionally left unresolved pending source-family and jurisdiction review.",
    ],
  },
  {
    familyId: "LAND_OTTOMAN",
    title: "Ottoman land-law family",
    domains: ["land_law", "historical"],
    eras: ["OTTOMAN"],
    territories: ["OTTOMAN_PALESTINE", "HISTORIC_PALESTINE"],
    priority: "P0",
    coverageState: "PARTIAL",
    acquisitionMode: "CURATED_DOCUMENTS",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: ["ottoman-land-code-1858-registry"],
    notes: [
      "Ottoman Land Code is seeded; original-language editions, amendments, tapu practice and waqf interactions remain incomplete.",
    ],
  },
  {
    familyId: "LAND_MANDATE",
    title: "British Mandate land-law family",
    domains: ["land_law", "registration_settlement", "historical"],
    eras: ["BRITISH_MANDATE"],
    territories: ["HISTORIC_PALESTINE"],
    priority: "P0",
    coverageState: "PARTIAL",
    acquisitionMode: "CURATED_DOCUMENTS",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [
      "mandate-land-transfers-regulations-1940-palquest",
      "mandate-land-transfers-regulations-1940-unispal",
    ],
    notes: [
      "1940 transfer regulations are now represented by reference and archival copies; broader Mandate ordinances remain incomplete.",
    ],
  },
  {
    familyId: "WAQF_POSITIVE_LAW",
    title: "Waqf positive-law and administration family",
    domains: ["waqf_law", "administrative"],
    eras: ["JORDANIAN", "PALESTINIAN_AUTHORITY", "CONTEMPORARY"],
    territories: ["WEST_BANK", "GAZA", "JERUSALEM"],
    priority: "P0",
    coverageState: "PARTIAL",
    acquisitionMode: "CURATED_DOCUMENTS",
    reviewPolicy: "EXCEPTION_ONLY",
    seedCorpusIds: [
      "waqf-law-1966-consolidated",
      "waqf-amendment-2023",
      "waqf-amendment-2023-gazette-198-pdf",
    ],
    notes: [
      "Core law and 2023 amendment are seeded; subordinate systems/instructions and territorial applicability remain incomplete.",
    ],
  },
  {
    familyId: "WAQF_LEASE_HUKR",
    title: "Waqf tenancy, hukr and related lease family",
    domains: ["lease_hukr", "waqf_law"],
    eras: ["JORDANIAN", "CONTEMPORARY"],
    territories: ["WEST_BANK", "GAZA"],
    priority: "P0",
    coverageState: "PARTIAL",
    acquisitionMode: "CURATED_DOCUMENTS",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [
      "waqf-tenancy-law-5-1964-registry",
      "landlords-tenants-62-1953-consolidated",
      "landlords-tenants-amendment-35-2022",
      "pla-lease-transaction-procedure",
    ],
    notes: [
      "Special waqf tenancy and general lease law are represented separately; hukr/ijaratayn doctrine and Gaza path remain incomplete.",
    ],
  },
  {
    familyId: "REGISTRATION_SETTLEMENT",
    title: "Registration, settlement, surveying and title family",
    domains: ["registration_settlement", "land_law"],
    eras: ["JORDANIAN", "PALESTINIAN_AUTHORITY", "CONTEMPORARY"],
    territories: ["WEST_BANK", "GAZA"],
    priority: "P0",
    coverageState: "PARTIAL",
    acquisitionMode: "BOUNDED_COLLECTION",
    reviewPolicy: "EXCEPTION_ONLY",
    seedCorpusIds: [
      "land-settlement-process-pla",
      "land-settlement-law-40-1952-registry",
      "settlement-amendment-8-1955-registry",
      "settlement-authority-7-2016-official",
      "settlement-authority-7-2016-wafa",
      "land-registration-fees-2-1952-consolidated",
      "land-registration-transfer-fees-2-2012",
      "pla-new-registration-procedure",
    ],
    notes: [
      "Current procedures and major statutes are represented; full title-chain and parcel rules remain incomplete.",
    ],
  },
  {
    familyId: "CASE_LAW",
    title: "Waqf/property case-law family",
    domains: ["case_law"],
    eras: ["CONTEMPORARY"],
    territories: ["WEST_BANK", "GAZA", "JERUSALEM"],
    priority: "P0",
    coverageState: "PARTIAL",
    acquisitionMode: "BOUNDED_COLLECTION",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: ["palestinian-supreme-court-technical-office"],
    notes: [
      "Judicial source family exists, but representative judgments and appellate-status normalization remain incomplete.",
    ],
  },
  {
    familyId: "SHARIA_PRIMARY",
    title: "Primary sharia evidence family",
    domains: ["sharia"],
    eras: ["CROSS_ERA"],
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    priority: "P0",
    coverageState: "NOT_STARTED",
    acquisitionMode: "METADATA_ONLY",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [],
    notes: [
      "No primary sharia collection is admitted until source authority, edition and rights policy are reviewed.",
    ],
  },
  {
    familyId: "FIQH_CLASSICAL",
    title: "Classical and modern fiqh family",
    domains: ["fiqh"],
    eras: ["CROSS_ERA"],
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    priority: "P0",
    coverageState: "NOT_STARTED",
    acquisitionMode: "METADATA_ONLY",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [],
    notes: [
      "Madhhab/source/edition/page identity is mandatory before admission.",
    ],
  },
  {
    familyId: "HISTORICAL_WAQF",
    title: "Historical waqf deeds, registers, tapu and maps",
    domains: ["historical"],
    eras: ["OTTOMAN", "BRITISH_MANDATE", "JORDANIAN", "CROSS_ERA"],
    territories: [
      "OTTOMAN_PALESTINE",
      "HISTORIC_PALESTINE",
      "WEST_BANK",
      "GAZA",
      "JERUSALEM",
    ],
    priority: "P1",
    coverageState: "NOT_STARTED",
    acquisitionMode: "METADATA_ONLY",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [],
    notes: [
      "Real deed/register pilot requires controlled source selection, transcription provenance and privacy review.",
    ],
  },
  {
    familyId: "FINANCE_PROPERTY",
    title: "Movable/immovable finance, tax and investment family",
    domains: ["finance_investment", "land_law"],
    eras: ["JORDANIAN", "PALESTINIAN_AUTHORITY", "CONTEMPORARY"],
    territories: ["WEST_BANK", "GAZA"],
    priority: "P1",
    coverageState: "PARTIAL",
    acquisitionMode: "CURATED_DOCUMENTS",
    reviewPolicy: "EXPERT_REQUIRED",
    seedCorpusIds: [
      "movable-rights-security-11-2016",
      "movable-rights-security-11-2016-gazette-120-wafa",
    ],
    notes: [
      "Initial movable-rights source seeded; waqf tax, compensation and investment corpus remains incomplete.",
    ],
  },
];

export type CorpusCoverageLedgerRow = {
  familyId: string;
  title: string;
  priority: "P0" | "P1" | "P2";
  coverageState: CorpusCoverageState;
  reviewPolicy: FamilyReviewPolicy;
  corpusItemCount: number;
  missingSeedCorpusIds: string[];
  unresolvedStatusCorpusIds: string[];
  rightsPendingCorpusIds: string[];
  territories: LegalTerritory[];
  complete: boolean;
};

export function buildCorpusCoverageLedger(
  corpus: ReferenceCorpusItem[] = MEGA_C_REFERENCE_CORPUS,
  families: ReferenceSourceFamily[] = MEGA_C_SOURCE_FAMILIES
): CorpusCoverageLedgerRow[] {
  const byId = new Map(corpus.map(item => [item.corpusId, item]));
  return families.map(family => {
    const items = family.seedCorpusIds
      .map(id => byId.get(id))
      .filter((item): item is ReferenceCorpusItem => Boolean(item));
    const missingSeedCorpusIds = family.seedCorpusIds.filter(
      id => !byId.has(id)
    );
    const unresolvedStatusCorpusIds = items
      .filter(
        item =>
          item.statusAssertions.length === 0 ||
          item.statusAssertions.some(
            status => !status.verified || status.status === "UNRESOLVED"
          )
      )
      .map(item => item.corpusId);
    const rightsPendingCorpusIds = items
      .filter(item => item.rights.reviewStatus !== "verified")
      .map(item => item.corpusId);
    return {
      familyId: family.familyId,
      title: family.title,
      priority: family.priority,
      coverageState: family.coverageState,
      reviewPolicy: family.reviewPolicy,
      corpusItemCount: items.length,
      missingSeedCorpusIds,
      unresolvedStatusCorpusIds,
      rightsPendingCorpusIds,
      territories: [...family.territories],
      complete:
        family.coverageState === "COMPLETE" &&
        missingSeedCorpusIds.length === 0 &&
        unresolvedStatusCorpusIds.length === 0 &&
        rightsPendingCorpusIds.length === 0,
    };
  });
}

export function validateMegaCCorpusScaleUp(): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const canonicalIds = new Set<string>();
  for (const item of MEGA_C_REFERENCE_CORPUS) {
    if (ids.has(item.corpusId))
      errors.push(`duplicate_corpus_id:${item.corpusId}`);
    ids.add(item.corpusId);
    if (canonicalIds.has(item.canonicalIdentity)) {
      errors.push(`duplicate_canonical_identity:${item.canonicalIdentity}`);
    }
    canonicalIds.add(item.canonicalIdentity);
  }
  for (const family of MEGA_C_SOURCE_FAMILIES) {
    for (const id of family.seedCorpusIds) {
      if (!ids.has(id))
        errors.push(`missing_family_seed:${family.familyId}:${id}`);
    }
    if (
      family.coverageState === "COMPLETE" &&
      family.seedCorpusIds.length === 0
    ) {
      errors.push(`empty_complete_family:${family.familyId}`);
    }
  }
  return [...new Set(errors)];
}
