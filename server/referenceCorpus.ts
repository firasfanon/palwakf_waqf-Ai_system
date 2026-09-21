import type { SourceAuthorityClass } from "./referenceSourceCollections";
import type {
  LegalRegime,
  LegalStatus,
  LegalTerritory,
} from "./legalReferenceModel";

export type ReferenceCorpusDomain =
  | "land_law"
  | "waqf_law"
  | "lease_hukr"
  | "registration_settlement"
  | "case_law"
  | "administrative"
  | "sharia"
  | "fiqh"
  | "historical"
  | "heritage"
  | "finance_investment";

export type ReferenceCorpusEra =
  | "OTTOMAN"
  | "BRITISH_MANDATE"
  | "JORDANIAN"
  | "EGYPTIAN_GAZA"
  | "PALESTINIAN_AUTHORITY"
  | "CONTEMPORARY"
  | "CROSS_ERA";

export type CorpusStatusAssertion = {
  territory: LegalTerritory;
  regime: LegalRegime;
  status: LegalStatus;
  evidenceUrl: string | null;
  verified: boolean;
  verifiedAt: string | null;
};

export type ReferenceCorpusItem = {
  corpusId: string;
  title: string;
  domain: ReferenceCorpusDomain;
  era: ReferenceCorpusEra;
  sourceUrl: string;
  publisher: string;
  authorityClass: SourceAuthorityClass;
  authorityVerified: boolean;
  canonicalIdentity: string;
  territories: LegalTerritory[];
  statusAssertions: CorpusStatusAssertion[];
  rights: {
    preserveAllowed: boolean;
    fullTextRetentionAllowed: boolean;
    ragAllowed: boolean;
    publicDisplayAllowed: boolean;
    downloadAllowed: boolean;
    quoteAllowed: boolean;
    reviewStatus: "verified" | "pending" | "rejected";
  };
  acquisition: {
    kind: "html" | "pdf" | "collection";
    respectRobotsTxt: boolean;
    maxDepth: number;
    maxDocuments: number;
  };
  notes: string[];
};

const pendingRights = {
  preserveAllowed: true,
  fullTextRetentionAllowed: true,
  ragAllowed: true,
  publicDisplayAllowed: false,
  downloadAllowed: false,
  quoteAllowed: true,
  reviewStatus: "pending" as const,
};

export const MEGA_B_REFERENCE_SEED: ReferenceCorpusItem[] = [
  {
    corpusId: "official-gazette-reference-root",
    title: "المرجع الإلكتروني للجريدة الرسمية الفلسطينية",
    domain: "administrative",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl: "https://mjr.ogb.gov.ps/",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-OFFICIAL-GAZETTE-ELECTRONIC-REFERENCE",
    territories: ["WEST_BANK", "GAZA"],
    statusAssertions: [],
    rights: { ...pendingRights },
    acquisition: {
      kind: "collection",
      respectRobotsTxt: true,
      maxDepth: 1,
      maxDocuments: 25,
    },
    notes: [
      "Official publication/reference portal; corpus expansion remains bounded and reviewed.",
    ],
  },
  {
    corpusId: "waqf-law-1966-consolidated",
    title: "قانون الأوقاف والشؤون الدينية رقم (26) لسنة 1966م وتعديلاته",
    domain: "waqf_law",
    era: "JORDANIAN",
    sourceUrl: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/165",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "PS-WAQF-LAW-26-1966-CONSOLIDATED",
    territories: ["WEST_BANK", "GAZA"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "MIXED",
        status: "AMENDED",
        evidenceUrl: "https://mjr.ogb.gov.ps/MergedLegislations/ViewText/165",
        verified: false,
        verifiedAt: null,
      },
      {
        territory: "GAZA",
        regime: "MIXED",
        status: "UNRESOLVED",
        evidenceUrl: null,
        verified: false,
        verifiedAt: null,
      },
    ],
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Territorial status remains expert-reviewable; portal provides a consolidated text and amendment lineage.",
    ],
  },
  {
    corpusId: "waqf-amendment-2023",
    title: "قرار بقانون رقم (2) لسنة 2023م بتعديل قانون الأوقاف",
    domain: "waqf_law",
    era: "CONTEMPORARY",
    sourceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/33311",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-DECREE-LAW-2-2023-WAQF",
    territories: ["WEST_BANK", "GAZA"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "IN_FORCE",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/33311",
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
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Official text; final territorial applicability must be separately verified.",
    ],
  },
  {
    corpusId: "waqf-amendment-2023-gazette-198-pdf",
    title:
      "الوقائع الفلسطينية العدد 198 — قرار بقانون رقم (2) لسنة 2023م بتعديل قانون الأوقاف",
    domain: "waqf_law",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://info.wafa.ps/userfiles/server/%D8%A7%D9%84%D9%88%D9%82%D8%A7%D8%A6%D8%B9%20%D8%A7%D9%84%D9%81%D9%84%D8%B3%D8%B7%D9%8A%D9%86%D9%8A%D8%A9%20%D8%A7%D9%84%D8%B9%D8%AF%D8%AF%20198.pdf",
    publisher:
      "وكالة الأنباء والمعلومات الفلسطينية وفا — نسخة من الوقائع الفلسطينية العدد 198",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "PS-OFFICIAL-GAZETTE-198-WAQF-AMENDMENT-2-2023",
    territories: ["WEST_BANK", "GAZA"],
    statusAssertions: [
      {
        territory: "WEST_BANK",
        regime: "PALESTINIAN",
        status: "IN_FORCE",
        evidenceUrl: "https://mjr.ogb.gov.ps/Decrees/ViewText/33311",
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
    rights: { ...pendingRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Official Gazette issue mirror hosted by WAFA; preserve as derivative publication evidence.",
      "Current territorial applicability remains separately reviewable and is not inferred from mirror availability.",
    ],
  },
  {
    corpusId: "land-authority-law-2010",
    title: "قرار بقانون رقم (6) لسنة 2010م بشأن سلطة الأراضي",
    domain: "land_law",
    era: "PALESTINIAN_AUTHORITY",
    sourceUrl: "https://mjr.ogb.gov.ps/Decrees/Details/23283",
    publisher: "ديوان الجريدة الرسمية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-DECREE-LAW-6-2010-LAND-AUTHORITY",
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
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: ["Official legislation detail page."],
  },
  {
    corpusId: "land-settlement-process-pla",
    title: "الإدارة العامة لتسوية الأراضي والمياه",
    domain: "registration_settlement",
    era: "CONTEMPORARY",
    sourceUrl: "https://www.pla.pna.ps/ar/Article/481/",
    publisher: "سلطة الأراضي الفلسطينية",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-PLA-LAND-WATER-SETTLEMENT-GUIDE",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Operational settlement guidance; not a substitute for the underlying statute.",
    ],
  },
  {
    corpusId: "ottoman-land-code-1858-registry",
    title: "قانون الأراضي العثماني",
    domain: "land_law",
    era: "OTTOMAN",
    sourceUrl: "https://maqam.najah.edu/legislation/169/",
    publisher: "مقام / جامعة النجاح الوطنية",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "OTTOMAN-LAND-CODE-1274H-1858",
    territories: ["WEST_BANK", "GAZA", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Trusted discovery/reference copy; current applicability requires primary/legal-status evidence.",
    ],
  },
  {
    corpusId: "land-settlement-law-40-1952-registry",
    title: "قانون تسوية الأراضي والمياه رقم (40) لسنة 1952م",
    domain: "registration_settlement",
    era: "JORDANIAN",
    sourceUrl: "https://laws-portal.najah.edu/legislation/15/",
    publisher: "بوابة القوانين / جامعة النجاح الوطنية",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "JO-LAND-WATER-SETTLEMENT-40-1952",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Reference text; status must be cross-checked against authoritative current evidence.",
    ],
  },
  {
    corpusId: "waqf-tenancy-law-5-1964-registry",
    title: "قانون المالكين والمستأجرين للعقارات الوقفية رقم (5) لسنة 1964م",
    domain: "lease_hukr",
    era: "JORDANIAN",
    sourceUrl: "https://maqam.najah.edu/legislation/42/",
    publisher: "مقام / جامعة النجاح الوطنية",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "JO-WAQF-TENANCY-5-1964",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Waqf lease corpus seed; legal status verification remains separate.",
    ],
  },
  {
    corpusId: "gaza-land-authority-legal-library",
    title: "القوانين والأنظمة والقرارات والتعليمات المعمول بها في سلطة الأراضي",
    domain: "land_law",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://www.pla.gov.ps/ar/القوانين-والأنظمة-والقرارات-والتعليمات-المعمول-بها-في-سلطة-الأراضي-1408.html",
    publisher: "سلطة الأراضي الفلسطينية - غزة",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "GAZA-PLA-LEGAL-LIBRARY",
    territories: ["GAZA"],
    statusAssertions: [],
    rights: { ...pendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 1,
      maxDocuments: 20,
    },
    notes: [
      "Must stay in a Gaza-specific applicability track; do not copy West Bank status assumptions.",
    ],
  },
  {
    corpusId: "palestinian-supreme-court-technical-office",
    title: "المكتب الفني للمحكمة العليا / المبادئ والأحكام",
    domain: "case_law",
    era: "CONTEMPORARY",
    sourceUrl: "https://www.courts.gov.ps/",
    publisher: "مجلس القضاء الأعلى الفلسطيني",
    authorityClass: "judicial_primary",
    authorityVerified: true,
    canonicalIdentity: "PS-SUPREME-COURT-TECHNICAL-OFFICE",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...pendingRights },
    acquisition: {
      kind: "collection",
      respectRobotsTxt: true,
      maxDepth: 1,
      maxDocuments: 20,
    },
    notes: [
      "Judgment corpus requires case identity, court level, appellate status and exact holding/reasoning separation.",
    ],
  },
];

export function validateReferenceCorpusItem(
  item: ReferenceCorpusItem
): string[] {
  const errors: string[] = [];
  if (!item.corpusId.trim()) errors.push("corpus_id_required");
  if (!item.canonicalIdentity.trim())
    errors.push("canonical_identity_required");
  if (!item.sourceUrl.trim()) errors.push("source_url_required");
  try {
    const url = new URL(item.sourceUrl);
    if (!["http:", "https:"].includes(url.protocol))
      errors.push("web_source_url_required");
  } catch {
    errors.push("invalid_source_url");
  }
  if (!item.publisher.trim()) errors.push("publisher_required");
  if (!item.territories.length) errors.push("territory_required");
  if (item.authorityClass === "unverified" && item.authorityVerified)
    errors.push("unverified_authority_cannot_be_verified");
  if (
    item.statusAssertions.some(status => status.verified && !status.evidenceUrl)
  )
    errors.push("verified_status_requires_evidence_url");
  if (item.rights.ragAllowed && !item.rights.fullTextRetentionAllowed)
    errors.push("rag_requires_full_text_retention");
  if (item.acquisition.maxDocuments < 1)
    errors.push("max_documents_must_be_positive");
  return [...new Set(errors)];
}

export function corpusCoverageSummary(items: ReferenceCorpusItem[]) {
  const domains = new Set(items.map(item => item.domain));
  const eras = new Set(items.map(item => item.era));
  const territories = new Set(items.flatMap(item => item.territories));
  const unresolvedStatusItems = items.filter(
    item =>
      item.statusAssertions.length === 0 ||
      item.statusAssertions.some(
        status => !status.verified || status.status === "UNRESOLVED"
      )
  );
  return {
    itemCount: items.length,
    domains: [...domains].sort(),
    eras: [...eras].sort(),
    territories: [...territories].sort(),
    unresolvedStatusCorpusIds: unresolvedStatusItems.map(item => item.corpusId),
    complete: false as const,
    completenessReason:
      "MEGA_B seed inventory is a governed starting corpus, not a claim of exhaustive coverage.",
  };
}
