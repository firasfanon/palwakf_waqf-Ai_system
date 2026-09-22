import type { ReferenceCorpusItem } from "./referenceCorpus";
import {
  megaESourceFamilies,
  type MegaECorpusConvergenceEntry,
} from "./referenceMegaE";
import type { ReferenceSourceFamily } from "./referenceCorpusScaleUp";
import type { LegalTerritory } from "./legalReferenceModel";

const privatePendingRights = {
  preserveAllowed: true,
  fullTextRetentionAllowed: true,
  ragAllowed: true,
  publicDisplayAllowed: false,
  downloadAllowed: false,
  quoteAllowed: true,
  reviewStatus: "pending" as const,
};

const liveReadOnlyRights = {
  preserveAllowed: false,
  fullTextRetentionAllowed: false,
  ragAllowed: false,
  publicDisplayAllowed: false,
  downloadAllowed: false,
  quoteAllowed: true,
  reviewStatus: "pending" as const,
};

export const MEGA_F_REFERENCE_EXPANSION: ReferenceCorpusItem[] = [
  {
    corpusId: "maqam-cassation-1383-2019-hukr",
    title: "نقض مدني 1383/2019 — الحكر ورقبة العقار الوقفي",
    domain: "case_law",
    era: "CONTEMPORARY",
    sourceUrl: "https://maqam.najah.edu/judgments/7576/",
    publisher: "مقام / جامعة النجاح الوطنية — نسخة مرجعية للحكم",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "PS-CASSATION-CIVIL-1383-2019-2021-01-25",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privatePendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Private bytes preserved in MEGA_F with SHA-256 fixity.",
      "Case-specific holding distinguishes waqf raqaba from hukr/usufruct and must not be generalized beyond the represented dispute without legal analysis.",
      "Maqam is treated as a reference copy, not an official court-origin download.",
    ],
  },
  {
    corpusId: "maqam-cassation-1543-2016-waqf",
    title: "نقض مدني 1543/2016 — الوقف الصحيح ووقف التخصيصات",
    domain: "case_law",
    era: "CONTEMPORARY",
    sourceUrl: "https://maqam.najah.edu/judgments/7543/",
    publisher: "مقام / جامعة النجاح الوطنية — نسخة مرجعية للحكم",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "PS-CASSATION-CIVIL-1543-2016-2020-04-28",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privatePendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Private bytes preserved in MEGA_F with SHA-256 fixity.",
      "Waqf classification reasoning remains case-specific and specialist-reviewable.",
    ],
  },
  {
    corpusId: "maqam-cassation-397-2023-mosque-waqf",
    title: "نقض مدني 397/2023 — عقار مسجد ووقف",
    domain: "case_law",
    era: "CONTEMPORARY",
    sourceUrl: "https://maqam.najah.edu/judgments/9799/",
    publisher: "مقام / جامعة النجاح الوطنية — نسخة مرجعية للحكم",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "PS-CASSATION-CIVIL-397-2023-2024-04-25",
    territories: ["WEST_BANK"],
    statusAssertions: [],
    rights: { ...privatePendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Private bytes preserved in MEGA_F with SHA-256 fixity.",
      "Used as a newer representative waqf/property judgment, not as a universal rule.",
    ],
  },
  {
    corpusId: "gaza-pla-land-specific-laws-2020",
    title: "قوانين خاصة بالأراضي — سلطة الأراضي الفلسطينية في غزة",
    domain: "land_law",
    era: "CROSS_ERA",
    sourceUrl:
      "https://www.pla.gov.ps/ar/%D9%82%D9%88%D8%A7%D9%86%D9%8A%D9%86-%D8%AE%D8%A7%D8%B5%D8%A9-%D8%A8%D8%A7%D9%84%D8%A7%D8%B1%D8%A7%D8%B6%D9%8A-1403.html",
    publisher: "سلطة الأراضي الفلسطينية - غزة",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "GAZA-PLA-LAND-SPECIFIC-LAWS-INVENTORY-1403",
    territories: ["GAZA"],
    statusAssertions: [],
    rights: { ...privatePendingRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Private bytes preserved in MEGA_F with SHA-256 fixity.",
      "The inventory materially expands Gaza legal-lineage evidence but does not prove current force of every listed instrument.",
      "No West Bank status is inherited into Gaza.",
    ],
  },
  {
    corpusId: "jerusalem-israel-land-registry-extract-service",
    title: "Israel Ministry of Justice — Land registration extract service",
    domain: "registration_settlement",
    era: "CONTEMPORARY",
    sourceUrl: "https://www.gov.il/en/service/land_registration_extract",
    publisher: "Israel Ministry of Justice / gov.il",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "IL-MOJ-LAND-REGISTRY-EXTRACT-SERVICE",
    territories: ["JERUSALEM"],
    statusAssertions: [],
    rights: { ...liveReadOnlyRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Operational registry source represented as live read-only evidence; local automated preservation was blocked with HTTP 403 and no bypass was attempted.",
      "Presence of an operational registry service is not a sovereignty determination and does not resolve historical or current waqf title by itself.",
    ],
  },
  {
    corpusId: "jerusalem-soi-unregulated-cadastre-service",
    title:
      "Survey of Israel — cadastre information for unregulated Jerusalem area",
    domain: "registration_settlement",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://www.gov.il/en/service/information-cadastre-unregulated-area-jerusalem",
    publisher: "Survey of Israel / gov.il",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "IL-SOI-JERUSALEM-UNREGULATED-CADASTRE-SERVICE",
    territories: ["JERUSALEM"],
    statusAssertions: [],
    rights: { ...liveReadOnlyRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Operational cadastral evidence only; local automated preservation was blocked with HTTP 403 and no bypass was attempted.",
      "No sovereignty, ownership, or waqf-status conclusion may be inferred from the service alone.",
    ],
  },
  {
    corpusId: "quran-complex-developer-platform",
    title: "King Fahd Glorious Qur'an Printing Complex — Developer Platform",
    domain: "sharia",
    era: "CROSS_ERA",
    sourceUrl: "https://qurancomplex.gov.sa/en/techquran/dev/",
    publisher: "King Fahd Glorious Qur'an Printing Complex",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "SA-KFGQPC-QURAN-DEVELOPER-PLATFORM",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...liveReadOnlyRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Official primary-source infrastructure represented live read-only; local acquisition timed out and no bypass was attempted.",
      "This source proves an official Qur'an text infrastructure exists; it is not by itself a waqf-specific legal conclusion.",
    ],
  },
  {
    corpusId: "bukhari-2737-muslim-1632-waqf-hadith-dorar",
    title: "حديث عمر في وقف خيبر — البخاري 2737 ومسلم 1632",
    domain: "sharia",
    era: "CROSS_ERA",
    sourceUrl: "https://dorar.net/hadith/sharh/150850",
    publisher: "الدرر السنية — توثيق مرجعي لهوية الحديث",
    authorityClass: "scholarly_authoritative",
    authorityVerified: true,
    canonicalIdentity: "HADITH-BUKHARI-2737-MUSLIM-1632-WAQF-KHAYBAR",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...liveReadOnlyRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Live reference identifies the waqf hadith in Sahih al-Bukhari 2737 and Sahih Muslim 1632.",
      "Automated preservation returned HTTP 403; no bypass was attempted.",
      "Primary-hadith identity is represented, but specialist sharia interpretation remains mandatory.",
    ],
  },
  {
    corpusId: "fiqh-hanafi-hilal-ahkam-al-waqf",
    title: "هلال الرأي — أحكام الوقف",
    domain: "fiqh",
    era: "CROSS_ERA",
    sourceUrl: "https://archive.org/download/fp45181_202605/45181.pdf",
    publisher:
      "طبعة فقهية حنفية محفوظة عبر Internet Archive / بيانات هوية من المكتبة الوقفية",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "FIQH-HANAFI-HILAL-AL-RAI-AHKAM-AL-WAQF-1355",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...privatePendingRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
      timeoutMs: 30_000,
    },
    notes: [
      "Private PDF preserved in MEGA_F with SHA-256 fixity; 348 pages.",
      "Scanned/image-heavy edition: source identity can be reviewed without OCR, but substantive page-level fiqh assertions remain fail-closed until an exact locator and specialist review exist.",
    ],
  },
  {
    corpusId: "fiqh-hanbali-khallal-kitab-al-wuquf",
    title: "الخلال — كتاب الوقوف من مسائل الإمام أحمد بن حنبل",
    domain: "fiqh",
    era: "CROSS_ERA",
    sourceUrl: "https://www.archive.org/download/waq10461/10461.pdf",
    publisher: "مكتبة المعارف 1410/1989 — نسخة محفوظة عبر Internet Archive",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "FIQH-HANBALI-KHALLAL-KITAB-AL-WUQUF-1410-1989",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...privatePendingRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
      timeoutMs: 30_000,
    },
    notes: [
      "Private PDF preserved in MEGA_F with SHA-256 fixity; 881 pages.",
      "Scanned/image-heavy edition; no OCR-derived substantive holding is admitted in MEGA_F.",
    ],
  },
];

export const MEGA_F_PRIVATE_ARTIFACT_EXPECTATIONS = {
  "maqam-cassation-1383-2019-hukr": {
    fileName: "maqam-1383-2019.html",
    sha256: "a868798e54b60acd307e918d095a106eaae049fdff3019f5b37c0fa14f064067",
    byteSize: 38058,
  },
  "maqam-cassation-1543-2016-waqf": {
    fileName: "maqam-1543-2016.html",
    sha256: "d4a15a4052e384883fdfbaf51343dca90fd134481cabdf8d279228807f8d1f9a",
    byteSize: 52711,
  },
  "maqam-cassation-397-2023-mosque-waqf": {
    fileName: "maqam-397-2023.html",
    sha256: "fd35da533695065dd9888dfd56509298afca67cfc6cd07a8e376b724108cc4e5",
    byteSize: 41097,
  },
  "gaza-land-authority-legal-library": {
    fileName: "gaza-pla-legal-library.html",
    sha256: "dc1b278bdd4b268c58db99747258df1603b61699a35d511453ace719422e991a",
    byteSize: 111226,
  },
  "gaza-pla-land-specific-laws-2020": {
    fileName: "gaza-pla-land-laws.html",
    sha256: "bb21fb543a070f538347317b48a36b9ddb73ded6e2c5cf7b6fd8b2d240f9f9b4",
    byteSize: 126655,
  },
  "fiqh-hanafi-hilal-ahkam-al-waqf": {
    fileName: "fiqh-hilal-ahkam-al-waqf.pdf",
    sha256: "b6186e5d6e7378a944eadf8af876781ee1c7647337d2c143222a5eccffa4268d",
    byteSize: 6945124,
    pageCount: 348,
  },
  "fiqh-hanbali-khallal-kitab-al-wuquf": {
    fileName: "fiqh-khallal-kitab-al-wuquf.pdf",
    sha256: "e882bc8f2eacb167987c5b2e0daa72bded6f56938f068587d5f83a7d2f521037",
    byteSize: 11576223,
    pageCount: 881,
  },
} as const;

export type JudicialAppellateRelation = {
  relation:
    | "ORIGINATES_FROM"
    | "APPEAL_OF"
    | "CASSATION_OF"
    | "REMANDED_TO"
    | "RESOLVES";
  court: string;
  caseNumber: string;
  decisionDate: string | null;
};

export type NormalizedJudicialDecision = {
  decisionId: string;
  court: string;
  level: "FIRST_INSTANCE" | "APPEAL" | "CASSATION";
  caseNumber: string;
  decisionDate: string;
  territory: LegalTerritory;
  sourceCorpusId: string;
  sourceArtifactSha256: string;
  issueTags: string[];
  holdingSummary: string;
  disposition: string;
  appellateRelations: JudicialAppellateRelation[];
  appellateNormalizationComplete: boolean;
  caseSpecificOnly: true;
  generalizationAllowed: false;
  specialistReview: "PENDING";
};

export const MEGA_F_JUDICIAL_DECISIONS: NormalizedJudicialDecision[] = [
  {
    decisionId: "ps-cassation-1383-2019",
    court: "Palestinian Court of Cassation",
    level: "CASSATION",
    caseNumber: "1383/2019",
    decisionDate: "2021-01-25",
    territory: "WEST_BANK",
    sourceCorpusId: "maqam-cassation-1383-2019-hukr",
    sourceArtifactSha256:
      "a868798e54b60acd307e918d095a106eaae049fdff3019f5b37c0fa14f064067",
    issueTags: ["waqf", "hukr", "usufruct", "raqaba", "registration"],
    holdingSummary:
      "Case-specific holding keeps raqaba with the waqf while the hukr/benefit right is registered to the claimant.",
    disposition: "CASSATION_ACCEPTED_AND_REGISTRATION_RELIEF_ORDERED",
    appellateRelations: [
      {
        relation: "ORIGINATES_FROM",
        court: "Hebron Court of First Instance",
        caseNumber: "27/2018",
        decisionDate: null,
      },
      {
        relation: "CASSATION_OF",
        court: "Jerusalem Court of Appeal",
        caseNumber: "341/2019",
        decisionDate: "2019-09-16",
      },
      {
        relation: "RESOLVES",
        court: "Palestinian Court of Cassation",
        caseNumber: "1383/2019",
        decisionDate: "2021-01-25",
      },
    ],
    appellateNormalizationComplete: true,
    caseSpecificOnly: true,
    generalizationAllowed: false,
    specialistReview: "PENDING",
  },
  {
    decisionId: "ps-cassation-1543-2016",
    court: "Palestinian Court of Cassation",
    level: "CASSATION",
    caseNumber: "1543/2016",
    decisionDate: "2020-04-28",
    territory: "WEST_BANK",
    sourceCorpusId: "maqam-cassation-1543-2016-waqf",
    sourceArtifactSha256:
      "d4a15a4052e384883fdfbaf51343dca90fd134481cabdf8d279228807f8d1f9a",
    issueTags: ["waqf", "waqf_allotment", "ottoman_land", "raqaba"],
    holdingSummary:
      "Representative case on the legal characterization of waqf and allocation-type waqf; exact doctrinal use remains specialist-reviewed.",
    disposition: "CASE_SPECIFIC_CASSATION_DECISION",
    appellateRelations: [],
    appellateNormalizationComplete: false,
    caseSpecificOnly: true,
    generalizationAllowed: false,
    specialistReview: "PENDING",
  },
  {
    decisionId: "ps-cassation-397-2023",
    court: "Palestinian Court of Cassation",
    level: "CASSATION",
    caseNumber: "397/2023",
    decisionDate: "2024-04-25",
    territory: "WEST_BANK",
    sourceCorpusId: "maqam-cassation-397-2023-mosque-waqf",
    sourceArtifactSha256:
      "fd35da533695065dd9888dfd56509298afca67cfc6cd07a8e376b724108cc4e5",
    issueTags: ["waqf", "mosque", "property", "sale", "division"],
    holdingSummary:
      "Newer representative mosque/waqf property decision; no universal property rule is inferred.",
    disposition: "CASE_SPECIFIC_CASSATION_DECISION",
    appellateRelations: [],
    appellateNormalizationComplete: false,
    caseSpecificOnly: true,
    generalizationAllowed: false,
    specialistReview: "PENDING",
  },
];
export type MegaFSourceReadiness = {
  corpusId: string;
  sourceIdentityVerified: boolean;
  preservedBytes: boolean;
  artifactSha256: string | null;
  exactPageOrHoldingLocatorVerified: boolean;
  specialistReview: "PENDING";
  privateRetrievalEligible: boolean;
  substantiveConclusionEligible: boolean;
  blockers: string[];
};

export const MEGA_F_SOURCE_READINESS: MegaFSourceReadiness[] = [
  {
    corpusId: "maqam-cassation-1383-2019-hukr",
    sourceIdentityVerified: true,
    preservedBytes: true,
    artifactSha256:
      "a868798e54b60acd307e918d095a106eaae049fdff3019f5b37c0fa14f064067",
    exactPageOrHoldingLocatorVerified: true,
    specialistReview: "PENDING",
    privateRetrievalEligible: true,
    substantiveConclusionEligible: true,
    blockers: [
      "case_specific_only",
      "specialist_generalization_review_pending",
    ],
  },
  {
    corpusId: "maqam-cassation-1543-2016-waqf",
    sourceIdentityVerified: true,
    preservedBytes: true,
    artifactSha256:
      "d4a15a4052e384883fdfbaf51343dca90fd134481cabdf8d279228807f8d1f9a",
    exactPageOrHoldingLocatorVerified: false,
    specialistReview: "PENDING",
    privateRetrievalEligible: true,
    substantiveConclusionEligible: false,
    blockers: [
      "exact_holding_locator_review_pending",
      "specialist_interpretation_pending",
    ],
  },
  {
    corpusId: "maqam-cassation-397-2023-mosque-waqf",
    sourceIdentityVerified: true,
    preservedBytes: true,
    artifactSha256:
      "fd35da533695065dd9888dfd56509298afca67cfc6cd07a8e376b724108cc4e5",
    exactPageOrHoldingLocatorVerified: false,
    specialistReview: "PENDING",
    privateRetrievalEligible: true,
    substantiveConclusionEligible: false,
    blockers: [
      "exact_holding_locator_review_pending",
      "specialist_interpretation_pending",
    ],
  },
  {
    corpusId: "bukhari-2737-muslim-1632-waqf-hadith-dorar",
    sourceIdentityVerified: true,
    preservedBytes: false,
    artifactSha256: null,
    exactPageOrHoldingLocatorVerified: true,
    specialistReview: "PENDING",
    privateRetrievalEligible: false,
    substantiveConclusionEligible: false,
    blockers: [
      "live_read_only_source",
      "primary_collection_bytes_not_preserved",
      "sharia_specialist_review_pending",
    ],
  },
  {
    corpusId: "fiqh-hanafi-hilal-ahkam-al-waqf",
    sourceIdentityVerified: true,
    preservedBytes: true,
    artifactSha256:
      "b6186e5d6e7378a944eadf8af876781ee1c7647337d2c143222a5eccffa4268d",
    exactPageOrHoldingLocatorVerified: false,
    specialistReview: "PENDING",
    privateRetrievalEligible: true,
    substantiveConclusionEligible: false,
    blockers: [
      "scanned_edition_no_governed_page_locator",
      "fiqh_specialist_review_pending",
    ],
  },
  {
    corpusId: "fiqh-hanbali-khallal-kitab-al-wuquf",
    sourceIdentityVerified: true,
    preservedBytes: true,
    artifactSha256:
      "e882bc8f2eacb167987c5b2e0daa72bded6f56938f068587d5f83a7d2f521037",
    exactPageOrHoldingLocatorVerified: false,
    specialistReview: "PENDING",
    privateRetrievalEligible: true,
    substantiveConclusionEligible: false,
    blockers: [
      "scanned_edition_no_governed_page_locator",
      "fiqh_specialist_review_pending",
    ],
  },
];

export type MegaFTerritoryEvidencePacket = {
  territory: "GAZA" | "JERUSALEM";
  evidenceCorpusIds: string[];
  evidenceMode: "PRESERVED_PRIVATE" | "LIVE_READ_ONLY";
  evidenceCoverageAdvanced: boolean;
  currentLegalStatusResolved: false;
  conclusionEligible: false;
  sovereigntyInferenceAllowed: false;
  ownershipInferenceAllowed: false;
  blockers: string[];
};

export function buildMegaFTerritoryEvidencePackets(): MegaFTerritoryEvidencePacket[] {
  return [
    {
      territory: "GAZA",
      evidenceCorpusIds: [
        "gaza-land-authority-legal-library",
        "gaza-government-property-legal-guidance",
        "gaza-pla-land-specific-laws-2020",
      ],
      evidenceMode: "PRESERVED_PRIVATE",
      evidenceCoverageAdvanced: true,
      currentLegalStatusResolved: false,
      conclusionEligible: false,
      sovereigntyInferenceAllowed: false,
      ownershipInferenceAllowed: false,
      blockers: [
        "instrument_by_instrument_current_status_unresolved",
        "expert_territory_legal_status_review_pending",
      ],
    },
    {
      territory: "JERUSALEM",
      evidenceCorpusIds: [
        "jerusalem-israel-land-registry-extract-service",
        "jerusalem-soi-unregulated-cadastre-service",
      ],
      evidenceMode: "LIVE_READ_ONLY",
      evidenceCoverageAdvanced: true,
      currentLegalStatusResolved: false,
      conclusionEligible: false,
      sovereigntyInferenceAllowed: false,
      ownershipInferenceAllowed: false,
      blockers: [
        "live_sources_not_privately_preserved",
        "jurisdiction_and_applicability_unresolved",
        "expert_territory_legal_status_review_pending",
      ],
    },
  ];
}

function mergeSeedIds(
  family: ReferenceSourceFamily,
  ids: string[]
): ReferenceSourceFamily {
  return {
    ...family,
    seedCorpusIds: [...new Set([...family.seedCorpusIds, ...ids])],
    notes: [...family.notes],
  };
}

export function megaFSourceFamilies(): ReferenceSourceFamily[] {
  return megaESourceFamilies().map(original => {
    let family = mergeSeedIds(original, []);
    switch (family.familyId) {
      case "CASE_LAW":
        family = mergeSeedIds(family, [
          "maqam-cassation-1383-2019-hukr",
          "maqam-cassation-1543-2016-waqf",
          "maqam-cassation-397-2023-mosque-waqf",
        ]);
        return {
          ...family,
          coverageState: "PARTIAL",
          acquisitionMode: "CURATED_DOCUMENTS",
          notes: [
            ...family.notes,
            "MEGA_F adds three privately preserved representative waqf/property cassation judgments and a normalized appellate chain for 1383/2019.",
            "Coverage remains PARTIAL because representative appellate normalization is not complete across the entire case-law family.",
          ],
        };
      case "SHARIA_PRIMARY":
        family = mergeSeedIds(family, [
          "quran-complex-developer-platform",
          "bukhari-2737-muslim-1632-waqf-hadith-dorar",
        ]);
        return {
          ...family,
          coverageState: "PARTIAL",
          acquisitionMode: "METADATA_ONLY",
          notes: [
            ...family.notes,
            "MEGA_F represents official Qur'an digital-source infrastructure and the canonical Bukhari 2737 / Muslim 1632 waqf-hadith identity.",
            "Primary bytes are not fully preserved and sharia interpretation remains specialist-gated.",
          ],
        };
      case "FIQH_CLASSICAL":
        family = mergeSeedIds(family, [
          "fiqh-hanafi-hilal-ahkam-al-waqf",
          "fiqh-hanbali-khallal-kitab-al-wuquf",
        ]);
        return {
          ...family,
          coverageState: "PARTIAL",
          acquisitionMode: "CURATED_DOCUMENTS",
          notes: [
            ...family.notes,
            "MEGA_F privately preserves one Hanafi waqf edition and one Hanbali waqf edition with exact byte fixity and page counts.",
            "Substantive page-level fiqh conclusions remain closed until exact locators and specialist review are available.",
          ],
        };
      case "LAND_GAZA_CURRENT":
        family = mergeSeedIds(family, ["gaza-pla-land-specific-laws-2020"]);
        return {
          ...family,
          coverageState: "UNRESOLVED",
          acquisitionMode: "CURATED_DOCUMENTS",
          notes: [
            ...family.notes,
            "MEGA_F materially expands the Gaza legal-lineage inventory using privately preserved Gaza Land Authority pages.",
            "Coverage advancement does not resolve current force or permit West Bank status inheritance.",
          ],
        };
      case "LAND_JERUSALEM_TRACK":
        family = mergeSeedIds(family, [
          "jerusalem-israel-land-registry-extract-service",
          "jerusalem-soi-unregulated-cadastre-service",
        ]);
        return {
          ...family,
          coverageState: "UNRESOLVED",
          acquisitionMode: "CURATED_DOCUMENTS",
          notes: [
            ...family.notes,
            "MEGA_F adds current operational land-registry/cadastre evidence for Jerusalem as live read-only sources.",
            "No sovereignty, title, or applicability conclusion is inferred from operational service evidence.",
          ],
        };
      default:
        return family;
    }
  });
}

export function buildMegaFCorpusConvergence(): MegaECorpusConvergenceEntry[] {
  const families = megaFSourceFamilies();
  const byId = new Map(families.map(family => [family.familyId, family]));
  return [
    {
      familyId: "CASE_LAW",
      state: "ADVANCED",
      coverageState: byId.get("CASE_LAW")?.coverageState || "MISSING",
      blocker: "full_representative_appellate_normalization_pending",
    },
    {
      familyId: "SHARIA_PRIMARY",
      state: "ADVANCED",
      coverageState: byId.get("SHARIA_PRIMARY")?.coverageState || "MISSING",
      blocker: "primary_bytes_and_specialist_interpretation_pending",
    },
    {
      familyId: "FIQH_CLASSICAL",
      state: "ADVANCED",
      coverageState: byId.get("FIQH_CLASSICAL")?.coverageState || "MISSING",
      blocker: "page_locator_and_specialist_interpretation_pending",
    },
    {
      familyId: "LAND_GAZA_CURRENT",
      state: "UNCHANGED_OPEN",
      coverageState: byId.get("LAND_GAZA_CURRENT")?.coverageState || "MISSING",
      blocker: "territory_specific_current_status_unresolved",
    },
    {
      familyId: "LAND_JERUSALEM_TRACK",
      state: "UNCHANGED_OPEN",
      coverageState:
        byId.get("LAND_JERUSALEM_TRACK")?.coverageState || "MISSING",
      blocker: "jurisdiction_and_applicability_unresolved",
    },
  ];
}

export function judicialDecisionByCaseNumber(
  caseNumber: string
): NormalizedJudicialDecision | null {
  return (
    MEGA_F_JUDICIAL_DECISIONS.find(row => row.caseNumber === caseNumber) || null
  );
}

export function canGeneralizeJudicialDecision(
  decision: NormalizedJudicialDecision
): false {
  return decision.generalizationAllowed;
}
