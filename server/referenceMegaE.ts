import type { ReferenceCorpusItem } from "./referenceCorpus";
import {
  MEGA_C_SOURCE_FAMILIES,
  type ReferenceSourceFamily,
} from "./referenceCorpusScaleUp";
import {
  evaluateReferenceAdmission,
  type ReferenceAdmissionDecision,
} from "./referenceGovernance";
import type { AlignedDeedTranscription } from "./waqfDeedProcessing";
import type {
  TitleChainEvent,
  WaqfAsset,
  WaqfAssetRight,
  WaqfDeed,
} from "./waqfReferenceDomain";

export type MegaEHistoricalArtifactManifest = {
  artifactId: string;
  documentIdentity: string;
  editionPublisher: string;
  editionYear: number;
  editionSeries: string;
  isbn: string;
  historicalDocumentDate: string | null;
  historicalDocumentDateLabel: string;
  historicalDocumentGregorianRange: string;
  historicalDateEvidenceStrength: string;
  acquisitionUrl: string;
  acquisitionHostRole: "PUBLIC_MIRROR" | "OFFICIAL_ORIGIN" | string;
  officialOriginDownload: boolean;
  officialEditionIdentityVerified: boolean;
  identityEvidence: string[];
  pdfSha256: string;
  pdfBytes: number;
  pageCount: number;
  pdfCreationDate: string;
  pdfCreator: string;
  extractedTextFile: string;
  extractedTextSha256?: string;
  extractionTool: string;
  benchmarkLocators: {
    bethlehemShare: string;
    beitJalaShare: string;
  };
  normalizedClaims: {
    bethlehemShare: string;
    beitJalaShare: string;
  };
  rights: {
    privatePreservation: boolean;
    privateResearchBenchmark: boolean;
    publicDisplay: boolean;
    publicDownload: boolean;
    rightsReviewStatus: "PENDING" | "VERIFIED" | "REJECTED";
  };
  canonicalAdmission: boolean;
  specialistReview: "PENDING" | "APPROVED" | "REJECTED";
  distinctEarlierWaqfiyya?: {
    date: string;
    language: string;
    sameDocument: boolean;
    note: string;
  };
  notes: string[];
};

export type MegaEArtifactAssessment = {
  artifactId: string;
  identityVerified: boolean;
  officialOriginDownload: boolean;
  privateBenchmarkEligible: boolean;
  canonicalAdmissionEligible: boolean;
  publicReleaseEligible: boolean;
  trustDecision: ReferenceAdmissionDecision;
  reasons: string[];
};

const pendingPrivateRights = {
  preserveAllowed: true,
  fullTextRetentionAllowed: true,
  ragAllowed: true,
  publicDisplayAllowed: false,
  downloadAllowed: false,
  quoteAllowed: true,
  reviewStatus: "pending" as const,
};

export const MEGA_E_REFERENCE_EXPANSION: ReferenceCorpusItem[] = [
  {
    corpusId: "haseki-hurrem-kudus-waqfiyya-vgm-2017-public-mirror",
    title:
      "Haseki Hürrem Sultan Kudüs Vakfiyesi — VGM 2017 edition, public mirror",
    domain: "historical",
    era: "OTTOMAN",
    sourceUrl:
      "https://drive.google.com/file/d/17e-jsPPSweDmkRDsd1MSUJBiW25yBbmU/view?usp=sharing",
    publisher:
      "Vakıflar Genel Müdürlüğü 2017 edition preserved from a public mirror",
    authorityClass: "reference_secondary",
    authorityVerified: true,
    canonicalIdentity: "TR-VGM-HASEKI-HURREM-KUDUS-WAQFIYYA-2017",
    territories: ["OTTOMAN_PALESTINE", "HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...pendingPrivateRights },
    acquisition: {
      kind: "pdf",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
      timeoutMs: 30_000,
    },
    notes: [
      "The bytes identify themselves as the VGM 2017 facsimile/translation edition and match external bibliographic identity evidence.",
      "The acquisition host is a public mirror, not an asserted official VGM-origin download.",
      "Private benchmark use is allowed; canonical/public admission remains review-gated.",
      "The preserved PDF represents the later Arabic waqfiyya of mid-Shaaban 964 AH (June 1557), not the distinct Turkish waqfiyya dated 24 May 1552.",
    ],
  },
  {
    corpusId: "haseki-hurrem-kudus-waqfiyya-vgm-publication-record",
    title: "VGM publication record — Haseki Hürrem Sultan Kudüs Vakfiyesi",
    domain: "historical",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://www.vgm.gov.tr/yayin-haberleri/haseki-hurrem-sultan-kudus-vakfiyesi-tipkibasim-kitabi",
    publisher: "Vakıflar Genel Müdürlüğü",
    authorityClass: "official_primary",
    authorityVerified: true,
    canonicalIdentity: "TR-VGM-PUBLICATION-RECORD-HASEKI-KUDUS-2017",
    territories: ["HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...pendingPrivateRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Identity evidence for the VGM publication; not a substitute for official-origin artifact bytes.",
    ],
  },
  {
    corpusId: "haseki-hurrem-kudus-waqfiyya-ttk-bibliographic-record",
    title: "TTK bibliographic record — Haseki Hürrem Sultan Kudüs Vakfiyesi",
    domain: "historical",
    era: "CONTEMPORARY",
    sourceUrl:
      "https://kutuphane.ttk.gov.tr/details?id=587932&materialType=KT&query=Hurrem+Sultan.",
    publisher: "Türk Tarih Kurumu Kütüphanesi",
    authorityClass: "official_derivative",
    authorityVerified: true,
    canonicalIdentity: "TR-TTK-BIB-HASEKI-KUDUS-2017-587932",
    territories: ["HISTORIC_PALESTINE"],
    statusAssertions: [],
    rights: { ...pendingPrivateRights },
    acquisition: {
      kind: "html",
      respectRobotsTxt: true,
      maxDepth: 0,
      maxDocuments: 1,
    },
    notes: [
      "Bibliographic corroboration for Ankara 2017, ISBN 9789751966971, VGM publications no. 125.",
    ],
  },
];

export function assessMegaEHistoricalArtifact(
  manifest: MegaEHistoricalArtifactManifest
): MegaEArtifactAssessment {
  const reasons: string[] = [];
  const hashOk = /^[a-f0-9]{64}$/i.test(manifest.pdfSha256);
  const identityVerified =
    manifest.officialEditionIdentityVerified &&
    manifest.identityEvidence.length >= 2 &&
    manifest.pageCount > 0 &&
    manifest.pdfBytes > 0 &&
    hashOk;
  if (!identityVerified) reasons.push("artifact_identity_not_verified");
  if (!manifest.officialOriginDownload)
    reasons.push("artifact_bytes_from_public_mirror");
  if (manifest.rights.rightsReviewStatus !== "VERIFIED")
    reasons.push("rights_review_pending");
  if (manifest.specialistReview !== "APPROVED")
    reasons.push("specialist_review_pending");
  if (manifest.canonicalAdmission)
    reasons.push("unexpected_preapproved_canonical_flag");

  const trustDecision = evaluateReferenceAdmission({
    authorityClass: manifest.officialOriginDownload
      ? "official_primary"
      : "reference_secondary",
    authorityVerified: identityVerified,
    identityVerified,
    legalStatus: null,
    legalStatusVerified: false,
    rights: {
      preserveAllowed: manifest.rights.privatePreservation,
      fullTextRetentionAllowed: manifest.rights.privateResearchBenchmark,
      ragAllowed: manifest.rights.privateResearchBenchmark,
      publicDisplayAllowed: manifest.rights.publicDisplay,
      downloadAllowed: manifest.rights.publicDownload,
      quoteAllowed: true,
      reviewStatus:
        manifest.rights.rightsReviewStatus === "VERIFIED"
          ? "verified"
          : manifest.rights.rightsReviewStatus === "REJECTED"
            ? "rejected"
            : "pending",
    },
    extractionConfidence: 0.99,
    hasEvidenceConflict: false,
    citationAlignmentVerified: true,
    sensitivePersonalData: false,
  });

  const privateBenchmarkEligible =
    identityVerified &&
    manifest.rights.privatePreservation &&
    manifest.rights.privateResearchBenchmark;
  const canonicalAdmissionEligible =
    privateBenchmarkEligible &&
    manifest.officialOriginDownload &&
    manifest.rights.rightsReviewStatus === "VERIFIED" &&
    manifest.specialistReview === "APPROVED" &&
    manifest.canonicalAdmission;
  const publicReleaseEligible =
    canonicalAdmissionEligible &&
    manifest.rights.publicDisplay &&
    manifest.rights.publicDownload;

  return {
    artifactId: manifest.artifactId,
    identityVerified,
    officialOriginDownload: manifest.officialOriginDownload,
    privateBenchmarkEligible,
    canonicalAdmissionEligible,
    publicReleaseEligible,
    trustDecision,
    reasons: [...new Set(reasons)],
  };
}
export function megaESourceFamilies(): ReferenceSourceFamily[] {
  return MEGA_C_SOURCE_FAMILIES.map(family => {
    if (family.familyId !== "HISTORICAL_WAQF") {
      return {
        ...family,
        seedCorpusIds: [...family.seedCorpusIds],
        notes: [...family.notes],
      };
    }
    return {
      ...family,
      coverageState: "PARTIAL",
      acquisitionMode: "CURATED_DOCUMENTS",
      seedCorpusIds: [
        ...family.seedCorpusIds,
        ...MEGA_E_REFERENCE_EXPANSION.map(item => item.corpusId),
      ],
      notes: [
        ...family.notes,
        "MEGA_E adds a real Haseki Hürrem Sultan Jerusalem waqfiyya private benchmark from an identity-verified VGM 2017 edition public mirror.",
        "The mirror is not treated as official-origin bytes; canonical/public admission remains expert/rights gated.",
      ],
    };
  });
}

export type HasekiRealDeedBenchmark = {
  deed: WaqfDeed;
  transcription: AlignedDeedTranscription;
  assets: WaqfAsset[];
  rights: WaqfAssetRight[];
  titleEvents: TitleChainEvent[];
  historicalDateLabel: string;
  historicalGregorianRange: string;
  exactGregorianDateResolved: false;
  locators: {
    bethlehemShare: string;
    beitJalaShare: string;
  };
  normalizedShares: {
    bethlehem: "18/24";
    beitJala: "18/24";
  };
  modernParcelIdentityResolved: false;
  modernOwnershipInferenceAllowed: false;
};

export type MegaECorpusConvergenceEntry = {
  familyId: string;
  state: "ADVANCED" | "UNCHANGED_OPEN" | "DEFERRED";
  coverageState: string;
  blocker: string | null;
};

export function buildMegaECorpusConvergence(): MegaECorpusConvergenceEntry[] {
  const families = megaESourceFamilies();
  const stateFor = (familyId: string): MegaECorpusConvergenceEntry => {
    const family = families.find(row => row.familyId === familyId);
    if (!family) {
      return {
        familyId,
        state: "DEFERRED",
        coverageState: "MISSING",
        blocker: "source_family_missing",
      };
    }
    if (familyId === "HISTORICAL_WAQF") {
      return {
        familyId,
        state: "ADVANCED",
        coverageState: family.coverageState,
        blocker:
          "official_origin_bytes_rights_review_and_specialist_interpretation_pending",
      };
    }
    const blockers: Record<string, string> = {
      CASE_LAW: "representative_judgments_and_appellate_normalization_pending",
      SHARIA_PRIMARY: "primary_source_edition_and_expert_admission_pending",
      FIQH_CLASSICAL:
        "madhhab_edition_page_identity_and_expert_admission_pending",
      LAND_GAZA_CURRENT: "territory_specific_status_evidence_unresolved",
      LAND_JERUSALEM_TRACK:
        "territory_specific_status_and_jurisdiction_unresolved",
    };
    return {
      familyId,
      state:
        family.coverageState === "NOT_STARTED" ? "DEFERRED" : "UNCHANGED_OPEN",
      coverageState: family.coverageState,
      blocker: blockers[familyId] || "coverage_not_complete",
    };
  };
  return [
    "HISTORICAL_WAQF",
    "CASE_LAW",
    "SHARIA_PRIMARY",
    "FIQH_CLASSICAL",
    "LAND_GAZA_CURRENT",
    "LAND_JERUSALEM_TRACK",
  ].map(stateFor);
}

export function artifactVersionIdFromSha(sha256: string): string {
  return "sha256-" + sha256.toLowerCase();
}

export function buildHasekiRealDeedBenchmark(
  manifest: MegaEHistoricalArtifactManifest
): HasekiRealDeedBenchmark {
  const versionId = artifactVersionIdFromSha(manifest.pdfSha256);
  const deedId = "waqf-deed-haseki-hurrem-kudus-arabic-964ah";
  const bethlehemAssetId = "historical-waqf-share-beytul-lahm-18-of-24";
  const beitJalaAssetId = "historical-waqf-share-beyticala-18-of-24";
  const deed: WaqfDeed = {
    deedId,
    title: "Haseki Hürrem Sultan Kudüs Vakfiyesi — Arabic waqfiyya, 964 AH",
    deedDate: null,
    courtOrAuthority: null,
    waqifEntityIds: ["historical-person:haseki-hurrem-sultan"],
    assetIds: [bethlehemAssetId, beitJalaAssetId],
    beneficiaryIds: [],
    nazirEntityIds: [],
    witnessEntityIds: [],
    waqfType: "CHARITABLE",
    conditionIds: [],
    relatedDeedIds: [],
    preservedArtifactVersionId: versionId,
    transcriptionReferenceId: "vgm-2017-osman-keskinoglu-translation",
    registrationStatus: "UNRESOLVED",
    settlementStatus: "UNRESOLVED",
  };
  const transcription: AlignedDeedTranscription = {
    transcriptionId: "vgm-2017-osman-keskinoglu-translation",
    artifactVersionId: versionId,
    pages: [],
    fullText:
      "Beytü'l-Lahm: 24 kırattan 18 kırat; Beyticala: 24 kırattan 18 kırat. Exact modern parcel identity is unresolved.",
    meanConfidence: 0.99,
    minimumConfidence: 0.99,
    requiresHumanReview: false,
    uncertainSegmentCount: 0,
  };
  const assets: WaqfAsset[] = [
    {
      assetId: bethlehemAssetId,
      canonicalName: "Beytü'l-Lahm historical waqf share — 18/24",
      assetKind: "IMMOVABLE",
      waqfType: "CHARITABLE",
      landClass: "UNRESOLVED",
      historicalPlaceNames: ["Beytü'l-Lahm", "Bethlehem", "بيت لحم"],
      currentParcelRefs: [],
      preservedEvidenceVersionIds: [versionId],
    },
    {
      assetId: beitJalaAssetId,
      canonicalName: "Beyticala historical waqf share — 18/24",
      assetKind: "IMMOVABLE",
      waqfType: "CHARITABLE",
      landClass: "UNRESOLVED",
      historicalPlaceNames: ["Beyticala", "Beit Jala", "بيت جالا"],
      currentParcelRefs: [],
      preservedEvidenceVersionIds: [versionId],
    },
  ];
  const rights: WaqfAssetRight[] = assets.map((asset, index) => ({
    rightId: "historical-waqf-share-right-" + String(index + 1),
    assetId: asset.assetId,
    rightType: "OTHER",
    holderEntityId: "historical-waqf:haseki-hurrem-sultan-kudus",
    validFrom: null,
    validTo: null,
    evidenceVersionIds: [versionId],
    confidence: 0.99,
    verified: true,
  }));
  const titleEvents: TitleChainEvent[] = assets.map((asset, index) => ({
    eventId: "historical-waqf-deed-event-" + String(index + 1),
    assetId: asset.assetId,
    eventType: "WAQF_DEED",
    occurredAt: null,
    sequenceHint: 1,
    evidenceVersionIds: [versionId],
    factSummary:
      index === 0
        ? "The VGM translation states that an 18/24 share in Beytü'l-Lahm is endowed."
        : "The VGM translation states that an 18/24 share in Beyticala is endowed.",
    confidence: 0.99,
    verified: true,
  }));
  return {
    deed,
    transcription,
    assets,
    rights,
    titleEvents,
    historicalDateLabel: manifest.historicalDocumentDateLabel,
    historicalGregorianRange: manifest.historicalDocumentGregorianRange,
    exactGregorianDateResolved: false,
    locators: { ...manifest.benchmarkLocators },
    normalizedShares: {
      bethlehem: "18/24",
      beitJala: "18/24",
    },
    modernParcelIdentityResolved: false,
    modernOwnershipInferenceAllowed: false,
  };
}
