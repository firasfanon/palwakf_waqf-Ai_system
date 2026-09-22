import type { ReferenceCorpusItem } from "./referenceCorpus";
import {
  megaFSourceFamilies,
  MEGA_F_JUDICIAL_DECISIONS,
  type NormalizedJudicialDecision,
} from "./referenceMegaF";
import type { ReferenceSourceFamily } from "./referenceCorpusScaleUp";

const privateMetadataRights = {
  preserveAllowed: true,
  fullTextRetentionAllowed: true,
  ragAllowed: false,
  publicDisplayAllowed: false,
  downloadAllowed: false,
  quoteAllowed: false,
  reviewStatus: "pending" as const,
};

export const MEGA_G_REFERENCE_EXPANSION: ReferenceCorpusItem[] = [
  {
    corpusId: "fiqh-maliki-hattab-ahkam-al-waqf-metadata",
    title: "الحطاب المالكي — أحكام الوقف — metadata edition record",
    domain: "fiqh",
    era: "CROSS_ERA",
    sourceUrl:
      "https://www.waqfeya.net/books/%D8%A3%D8%AD%D9%83%D8%A7%D9%85-%D8%A7%D9%84%D9%88%D9%82%D9%81-816774af21e74392a33dee1761a2efad",
    publisher: "المكتبة الوقفية — metadata/reference page",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "FIQH-MALIKI-HATTAB-AHKAM-AL-WAQF-1430-2009",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...privateMetadataRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Edition metadata page privately preserved in MEGA_G with SHA-256 fixity.",
      "Edition metadata: Yahya ibn Muhammad al-Hattab al-Maliki; investigator Abd al-Qadir Baji; 1430/2009; 507 pages.",
      "Underlying PDF acquisition returned upstream failure; no bypass was attempted.",
      "Whole work is waqf-specific, but substantive doctrinal propositions remain human-specialist gated.",
    ],
  },
  {
    corpusId: "fiqh-shafii-al-umm-vol5-ahbas-metadata",
    title:
      "الشافعي — الأم — الجزء الخامس — باب الأحباس — metadata edition record",
    domain: "fiqh",
    era: "CROSS_ERA",
    sourceUrl:
      "https://www.waqfeya.net/books/%D8%A7%D9%84%D8%A3%D9%85-%D8%B7-%D8%A7%D9%84%D9%88%D9%81%D8%A7%D8%A1-600ea104307f43a1b06ccf360823dcff",
    publisher: "المكتبة الوقفية — metadata/reference page",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "FIQH-SHAFII-AL-UMM-WAFA-1422-2001-VOL5-AHBAS",
    territories: ["WEST_BANK", "GAZA", "JERUSALEM", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...privateMetadataRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Edition metadata page privately preserved in MEGA_G with SHA-256 fixity.",
      "Edition metadata: al-Shafi'i; investigator Rif'at Fawzi Abd al-Muttalib; Dar al-Wafa; 1422/2001; 11 volumes / 6464 pages.",
      "Waqfeya table of contents identifies al-Ahbas in volume 5.",
      "Underlying PDF acquisition returned HTTP 403; no bypass was attempted.",
      "Chapter-level locator is review-ready; substantive page-level doctrinal proposition remains human-specialist gated.",
    ],
  },
];

export const MEGA_G_PRIVATE_METADATA_EXPECTATIONS = {
  "fiqh-maliki-hattab-ahkam-al-waqf-metadata": {
    fileName: "fiqh-maliki-hattab-waqfeya-metadata.html",
    sha256: "6a1fed9904a09c0c86cd76b054e60954f404ac8fcccf93233650f0284160cc0f",
    byteSize: 78679,
  },
  "fiqh-shafii-al-umm-vol5-ahbas-metadata": {
    fileName: "fiqh-shafii-al-umm-waqfeya-metadata.html",
    sha256: "da49e6caedd90d3b18e12e5f70ccb78e09e2a907a85af67b028beb2704a921fd",
    byteSize: 118910,
  },
} as const;

export type MegaGTerminalState =
  | "EXPERT_REVIEW_READY"
  | "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP";

export type MegaGCorpusTrack = {
  todoId: string;
  familyIds: string[];
  terminalState: MegaGTerminalState;
  evidenceRefs: string[];
  reviewRole:
    | "LEGAL_STATUS_REVIEWER"
    | "WAQF_DEED_REVIEWER"
    | "FIQH_SHARIA_REVIEWER"
    | "HISTORICAL_EVIDENCE_REVIEWER"
    | "RIGHTS_REVIEWER";
  territories: string[];
  unresolvedQuestions: string[];
  evidenceGaps: string[];
  completionMeaning: string;
};

export type MegaGCaseNormalization = {
  decisionId: string;
  caseNumber: string;
  normalizedChain: Array<{
    level: "FIRST_INSTANCE" | "APPEAL" | "CASSATION";
    court: string;
    caseNumber: string;
    decisionDate: string | null;
  }>;
  normalizationState: "NORMALIZED" | "EXPERT_REVIEW_READY_WITH_SOURCE_CONFLICT";
  sourceConflictNotes: string[];
  generalizationAllowed: false;
};

export const MEGA_G_CASE_NORMALIZATIONS: MegaGCaseNormalization[] = [
  {
    decisionId: "ps-cassation-1383-2019",
    caseNumber: "1383/2019",
    normalizedChain: [
      {
        level: "FIRST_INSTANCE",
        court: "Hebron Court of First Instance",
        caseNumber: "27/2018",
        decisionDate: "2019-03-17",
      },
      {
        level: "APPEAL",
        court: "Jerusalem Court of Appeal",
        caseNumber: "341/2019",
        decisionDate: "2019-09-16",
      },
      {
        level: "CASSATION",
        court: "Palestinian Court of Cassation",
        caseNumber: "1383/2019",
        decisionDate: "2021-01-25",
      },
    ],
    normalizationState: "NORMALIZED",
    sourceConflictNotes: [],
    generalizationAllowed: false,
  },
  {
    decisionId: "ps-cassation-1543-2016",
    caseNumber: "1543/2016",
    normalizedChain: [
      {
        level: "FIRST_INSTANCE",
        court: "Ramallah Court of First Instance",
        caseNumber: "1025/2013",
        decisionDate: "2015-03-30",
      },
      {
        level: "APPEAL",
        court: "Ramallah Court of Appeal",
        caseNumber: "455/2015",
        decisionDate: "2016-11-28",
      },
      {
        level: "CASSATION",
        court: "Palestinian Court of Cassation",
        caseNumber: "1543/2016",
        decisionDate: "2020-04-28",
      },
    ],
    normalizationState: "EXPERT_REVIEW_READY_WITH_SOURCE_CONFLICT",
    sourceConflictNotes: [
      "The preserved decision text also references first-instance number 1053/2013 in the appellate-result narrative while separately identifying 1025/2013 as the filed civil case.",
      "MEGA_G preserves both identifiers and does not silently choose one as a corrected value.",
    ],
    generalizationAllowed: false,
  },
  {
    decisionId: "ps-cassation-397-2023",
    caseNumber: "397/2023",
    normalizedChain: [
      {
        level: "FIRST_INSTANCE",
        court: "Ramallah Magistrate Court",
        caseNumber: "257/2006",
        decisionDate: "2021-12-12",
      },
      {
        level: "APPEAL",
        court: "Ramallah Court of First Instance sitting as appellate court",
        caseNumber: "21/2022",
        decisionDate: "2023-01-30",
      },
      {
        level: "CASSATION",
        court: "Palestinian Court of Cassation",
        caseNumber: "397/2023",
        decisionDate: "2024-04-25",
      },
    ],
    normalizationState: "NORMALIZED",
    sourceConflictNotes: [],
    generalizationAllowed: false,
  },
];

function familySeedIds(familyId: string): string[] {
  return (
    megaFSourceFamilies().find(family => family.familyId === familyId)
      ?.seedCorpusIds || []
  );
}

export function buildMegaGCorpusTerminalLedger(): MegaGCorpusTrack[] {
  return [
    {
      todoId: "CORP-LAND-001",
      familyIds: [
        "LAND_OTTOMAN",
        "LAND_BRITISH_MANDATE",
        "LAND_JORDANIAN_WB",
        "LAND_PALESTINIAN_WB",
        "LAND_GAZA_CURRENT",
        "LAND_JERUSALEM_TRACK",
      ],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        ...familySeedIds("LAND_OTTOMAN"),
        ...familySeedIds("LAND_BRITISH_MANDATE"),
        ...familySeedIds("LAND_JORDANIAN_WB"),
        ...familySeedIds("LAND_PALESTINIAN_WB"),
        ...familySeedIds("LAND_GAZA_CURRENT"),
        ...familySeedIds("LAND_JERUSALEM_TRACK"),
      ],
      reviewRole: "LEGAL_STATUS_REVIEWER",
      territories: ["WEST_BANK", "GAZA", "JERUSALEM"],
      unresolvedQuestions: [
        "Confirm instrument-by-instrument current status and transition effects by territory/date.",
      ],
      evidenceGaps: [
        "Some current-status conclusions remain unresolved by design.",
      ],
      completionMeaning:
        "Canonical era/territory inventory is ready for specialist status review; this does not mean every possible land-law source has been collected.",
    },
    {
      todoId: "CORP-LAND-002",
      familyIds: [
        "LAND_OTTOMAN",
        "LAND_BRITISH_MANDATE",
        "LAND_JORDANIAN_WB",
        "LAND_PALESTINIAN_WB",
      ],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        "MEGA_C_PRIVATE_ARTIFACT_SET",
        "MEGA_F_PRIVATE_ARTIFACT_SET",
        "MEGA_G_PRESERVED_VS_LIVE_ONLY_RIGHTS_LEDGER",
      ],
      reviewRole: "RIGHTS_REVIEWER",
      territories: ["WEST_BANK", "GAZA", "JERUSALEM"],
      unresolvedQuestions: [
        "Review preservation/public-display/download rights independently from legal authority.",
      ],
      evidenceGaps: [
        "Several official/live sources block automated preservation; no bypass is authorized.",
      ],
      completionMeaning:
        "Preserved versus live-only evidence is explicitly separated and ready for rights review.",
    },
    {
      todoId: "CORP-LAND-003",
      familyIds: ["LAND_JORDANIAN_WB", "LAND_PALESTINIAN_WB"],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        ...familySeedIds("LAND_JORDANIAN_WB"),
        ...familySeedIds("LAND_PALESTINIAN_WB"),
        "MEGA_C_LEGAL_STATUS_MATRIX",
      ],
      reviewRole: "LEGAL_STATUS_REVIEWER",
      territories: ["WEST_BANK"],
      unresolvedQuestions: [
        "Confirm unresolved/amended/repealed status rows and transition lineage.",
      ],
      evidenceGaps: [],
      completionMeaning:
        "West Bank status map is evidence-bundled for specialist review; unresolved rows remain visible.",
    },
    {
      todoId: "CORP-LAND-004",
      familyIds: ["LAND_GAZA_CURRENT"],
      terminalState: "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP",
      evidenceRefs: [
        ...familySeedIds("LAND_GAZA_CURRENT"),
        "MEGA_F_GAZA_TERRITORY_PACKET",
      ],
      reviewRole: "LEGAL_STATUS_REVIEWER",
      territories: ["GAZA"],
      unresolvedQuestions: [
        "Determine current force and interaction of Gaza-specific land/registration/waqf instruments.",
      ],
      evidenceGaps: [
        "No sufficiently authoritative consolidated Gaza current-status chain is available in the admitted corpus.",
        "West Bank status inheritance is prohibited.",
      ],
      completionMeaning:
        "Gaza is terminally deferred with an explicit evidence gap rather than falsely resolved.",
    },
    {
      todoId: "CORP-WAQF-001",
      familyIds: ["WAQF_LAW_CURRENT"],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: familySeedIds("WAQF_LAW_CURRENT"),
      reviewRole: "LEGAL_STATUS_REVIEWER",
      territories: ["WEST_BANK", "GAZA", "JERUSALEM"],
      unresolvedQuestions: [
        "Confirm subordinate waqf regulations/instructions and territory-specific applicability.",
      ],
      evidenceGaps: [
        "Not every subordinate administrative instrument is represented as a preserved canonical artifact.",
      ],
      completionMeaning:
        "Core historical/current waqf legal/admin family is ready for specialist gap/status review.",
    },
    {
      todoId: "CORP-LEASE-001",
      familyIds: ["WAQF_LEASE_HUKR"],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        ...familySeedIds("WAQF_LEASE_HUKR"),
        "maqam-cassation-1383-2019-hukr",
        "maqam-cassation-1543-2016-waqf",
      ],
      reviewRole: "LEGAL_STATUS_REVIEWER",
      territories: ["WEST_BANK", "GAZA"],
      unresolvedQuestions: [
        "Confirm relationships among general tenancy, special waqf tenancy, hukr, and ijāratayn by territory/date.",
      ],
      evidenceGaps: ["Gaza current applicability remains unresolved."],
      completionMeaning:
        "Lease/hukr source and case bundle is ready for expert review without collapsing distinct legal constructs.",
    },
    {
      todoId: "CORP-REG-001",
      familyIds: ["REGISTRATION_SETTLEMENT"],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        ...familySeedIds("REGISTRATION_SETTLEMENT"),
        "maqam-cassation-1383-2019-hukr",
        "maqam-cassation-1543-2016-waqf",
      ],
      reviewRole: "LEGAL_STATUS_REVIEWER",
      territories: ["WEST_BANK", "GAZA", "JERUSALEM"],
      unresolvedQuestions: [
        "Confirm title/settlement/registration status by territory and any surviving historical rules.",
      ],
      evidenceGaps: [
        "Jerusalem applicability remains independently unresolved.",
        "Gaza current status remains independently unresolved.",
      ],
      completionMeaning:
        "Registration/settlement corpus is ready for expert review with territory gaps preserved.",
    },
    {
      todoId: "CORP-CASE-001",
      familyIds: ["CASE_LAW"],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        ...familySeedIds("CASE_LAW"),
        ...MEGA_G_CASE_NORMALIZATIONS.map(row => row.decisionId),
      ],
      reviewRole: "LEGAL_STATUS_REVIEWER",
      territories: ["WEST_BANK"],
      unresolvedQuestions: [
        "Review case-specific holdings, appellate identity, and generalization limits.",
      ],
      evidenceGaps: [
        "1543/2016 contains conflicting first-instance identifiers that require human review.",
        "The representative sample is not an exhaustive court corpus.",
      ],
      completionMeaning:
        "Representative waqf/property case-law set is normalized enough for expert review, not universal doctrinal inference.",
    },
    {
      todoId: "CORP-SHARIA-001",
      familyIds: ["SHARIA_PRIMARY"],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        ...familySeedIds("SHARIA_PRIMARY"),
        "HADITH-BUKHARI-2737",
        "HADITH-MUSLIM-1632",
      ],
      reviewRole: "FIQH_SHARIA_REVIEWER",
      territories: [],
      unresolvedQuestions: [
        "Confirm source admission and the exact scope of any waqf proposition before doctrinal use.",
      ],
      evidenceGaps: [
        "Primary collection bytes are not fully preserved locally.",
      ],
      completionMeaning:
        "Canonical source identities/locators are ready for sharia specialist review; no automated religious ruling is admitted.",
    },
    {
      todoId: "CORP-FIQH-001",
      familyIds: ["FIQH_CLASSICAL"],
      terminalState: "EXPERT_REVIEW_READY",
      evidenceRefs: [
        ...familySeedIds("FIQH_CLASSICAL"),
        "fiqh-maliki-hattab-ahkam-al-waqf-metadata",
        "fiqh-shafii-al-umm-vol5-ahbas-metadata",
      ],
      reviewRole: "FIQH_SHARIA_REVIEWER",
      territories: [],
      unresolvedQuestions: [
        "Confirm edition/source admission and select exact doctrinal page locators before proposition extraction.",
      ],
      evidenceGaps: [
        "Maliki and Shafi'i underlying PDFs were not preserved because upstream acquisition failed; metadata pages were preserved instead.",
        "Substantive doctrinal page locators remain a human-specialist task.",
      ],
      completionMeaning:
        "Hanafi/Maliki/Shafi'i/Hanbali source representation is ready for specialist review without auto-generating madhhab rulings.",
    },
  ];
}

export function megaGAllMandatoryCorpusTracksTerminal(): boolean {
  const ledger = buildMegaGCorpusTerminalLedger();
  return (
    ledger.length === 10 &&
    ledger.every(
      row =>
        row.terminalState === "EXPERT_REVIEW_READY" ||
        row.terminalState === "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP"
    )
  );
}

export function megaGDeferredTracks(): MegaGCorpusTrack[] {
  return buildMegaGCorpusTerminalLedger().filter(
    row => row.terminalState === "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP"
  );
}

export function megaGExpertReadyTracks(): MegaGCorpusTrack[] {
  return buildMegaGCorpusTerminalLedger().filter(
    row => row.terminalState === "EXPERT_REVIEW_READY"
  );
}

export function megaGSourceFamilies(): ReferenceSourceFamily[] {
  return megaFSourceFamilies().map(original => {
    if (original.familyId !== "FIQH_CLASSICAL") return original;
    return {
      ...original,
      seedCorpusIds: [
        ...new Set([
          ...original.seedCorpusIds,
          "fiqh-maliki-hattab-ahkam-al-waqf-metadata",
          "fiqh-shafii-al-umm-vol5-ahbas-metadata",
        ]),
      ],
      coverageState: "PARTIAL",
      acquisitionMode: "CURATED_DOCUMENTS",
      notes: [
        ...original.notes,
        "MEGA_G completes four-madhhab source representation for specialist handoff: Hanafi/Hanbali preserved full editions plus Maliki/Shafi'i preserved edition metadata.",
        "PARTIAL is retained because source-admission readiness is not the same as specialist-approved doctrinal extraction.",
      ],
    };
  });
}

export function megaGCaseDecision(caseNumber: string): {
  source: NormalizedJudicialDecision | null;
  normalization: MegaGCaseNormalization | null;
} {
  return {
    source:
      MEGA_F_JUDICIAL_DECISIONS.find(
        decision => decision.caseNumber === caseNumber
      ) || null,
    normalization:
      MEGA_G_CASE_NORMALIZATIONS.find(
        decision => decision.caseNumber === caseNumber
      ) || null,
  };
}

export type MegaGTerritoryTerminalPacket = {
  territory: "GAZA" | "JERUSALEM";
  terminalState: "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP";
  evidenceRefs: string[];
  currentLegalStatusResolved: false;
  authoritativeConclusionEligible: false;
  sovereigntyInferenceAllowed: false;
  ownershipInferenceAllowed: false;
  evidenceGaps: string[];
  specialistRole: "LEGAL_STATUS_REVIEWER";
};

export function buildMegaGTerritoryTerminalPackets(): MegaGTerritoryTerminalPacket[] {
  return [
    {
      territory: "GAZA",
      terminalState: "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP",
      evidenceRefs: [
        ...familySeedIds("LAND_GAZA_CURRENT"),
        "MEGA_F_GAZA_TERRITORY_PACKET",
      ],
      currentLegalStatusResolved: false,
      authoritativeConclusionEligible: false,
      sovereigntyInferenceAllowed: false,
      ownershipInferenceAllowed: false,
      evidenceGaps: [
        "instrument_by_instrument_current_force_not_authoritatively_consolidated",
        "territory_specific_expert_review_pending",
      ],
      specialistRole: "LEGAL_STATUS_REVIEWER",
    },
    {
      territory: "JERUSALEM",
      terminalState: "EXPLICITLY_DEFERRED_WITH_EVIDENCE_GAP",
      evidenceRefs: [
        ...familySeedIds("LAND_JERUSALEM_TRACK"),
        "MEGA_F_JERUSALEM_TERRITORY_PACKET",
      ],
      currentLegalStatusResolved: false,
      authoritativeConclusionEligible: false,
      sovereigntyInferenceAllowed: false,
      ownershipInferenceAllowed: false,
      evidenceGaps: [
        "operational_registry_evidence_does_not_resolve_jurisdiction_or_applicability",
        "live_sources_not_privately_preserved",
        "territory_specific_expert_review_pending",
      ],
      specialistRole: "LEGAL_STATUS_REVIEWER",
    },
  ];
}

export type MegaGRightsLedgerEntry = {
  sourceId: string;
  preservationMode:
    | "PRESERVED_PRIVATE_FULL"
    | "PRESERVED_PRIVATE_METADATA_ONLY"
    | "LIVE_READ_ONLY";
  publicReleaseAllowed: false;
  specialistRightsReviewPending: boolean;
  evidenceRef: string;
  notes: string[];
};

export function buildMegaGRightsLedger(): MegaGRightsLedgerEntry[] {
  return [
    {
      sourceId: "maqam-cassation-representative-set",
      preservationMode: "PRESERVED_PRIVATE_FULL",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef: "MEGA_F_PRIVATE_CASE_LAW_ARTIFACTS",
      notes: ["Raw judgment copies remain outside Git."],
    },
    {
      sourceId: "gaza-land-authority-representative-set",
      preservationMode: "PRESERVED_PRIVATE_FULL",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef: "MEGA_F_PRIVATE_GAZA_ARTIFACTS",
      notes: ["Preservation does not imply public redistribution rights."],
    },
    {
      sourceId: "fiqh-hanafi-hilal-ahkam-al-waqf",
      preservationMode: "PRESERVED_PRIVATE_FULL",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef:
        "sha256:b6186e5d6e7378a944eadf8af876781ee1c7647337d2c143222a5eccffa4268d",
      notes: ["Substantive doctrinal extraction remains specialist-gated."],
    },
    {
      sourceId: "fiqh-hanbali-khallal-kitab-al-wuquf",
      preservationMode: "PRESERVED_PRIVATE_FULL",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef:
        "sha256:e882bc8f2eacb167987c5b2e0daa72bded6f56938f068587d5f83a7d2f521037",
      notes: ["Substantive doctrinal extraction remains specialist-gated."],
    },
    {
      sourceId: "fiqh-maliki-hattab-ahkam-al-waqf-metadata",
      preservationMode: "PRESERVED_PRIVATE_METADATA_ONLY",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef:
        "sha256:6a1fed9904a09c0c86cd76b054e60954f404ac8fcccf93233650f0284160cc0f",
      notes: [
        "Underlying PDF acquisition failed upstream; no bypass attempted.",
      ],
    },
    {
      sourceId: "fiqh-shafii-al-umm-vol5-ahbas-metadata",
      preservationMode: "PRESERVED_PRIVATE_METADATA_ONLY",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef:
        "sha256:da49e6caedd90d3b18e12e5f70ccb78e09e2a907a85af67b028beb2704a921fd",
      notes: [
        "Underlying PDF acquisition returned HTTP 403; no bypass attempted.",
      ],
    },
    {
      sourceId: "quran-complex-developer-platform",
      preservationMode: "LIVE_READ_ONLY",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef: "MEGA_F_SHARIA_SOURCE_READINESS",
      notes: [
        "Official source identity represented; local preservation incomplete.",
      ],
    },
    {
      sourceId: "bukhari-2737-muslim-1632-waqf-hadith-dorar",
      preservationMode: "LIVE_READ_ONLY",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef: "MEGA_F_SHARIA_SOURCE_READINESS",
      notes: ["Automated preservation was blocked; no bypass attempted."],
    },
    {
      sourceId: "jerusalem-operational-registry-services",
      preservationMode: "LIVE_READ_ONLY",
      publicReleaseAllowed: false,
      specialistRightsReviewPending: true,
      evidenceRef: "MEGA_F_JERUSALEM_TERRITORY_PACKET",
      notes: [
        "Operational source presence does not resolve sovereignty/title/applicability.",
      ],
    },
  ];
}

export function megaGNoPublicReleaseRights(): boolean {
  return buildMegaGRightsLedger().every(
    entry => entry.publicReleaseAllowed === false
  );
}
