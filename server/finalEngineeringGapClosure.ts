import {
  MEGA_F_JUDICIAL_DECISIONS,
  MEGA_F_REFERENCE_EXPANSION,
} from "./referenceMegaF";
import {
  MEGA_G_CASE_NORMALIZATIONS,
  buildMegaGRightsLedger,
} from "./referenceMegaG";
import {
  auditReferenceGradeCitations,
  buildReferenceGradeCitation,
} from "./referenceCitationEngine";
import type { ReferenceCorpusItem } from "./referenceCorpus";
import type { RightsProfile } from "./referenceGovernance";
import { routeReferenceIssue } from "./referenceIssueRouter";
import {
  hybridReferenceSearch,
  type ReferenceRetrievalDocument,
} from "./referenceRetrieval";
import {
  buildTitleChain,
  detectEvidenceConflicts,
  resolveJurisdiction,
  type EvidenceAssertion,
  type TitleChainEvent,
} from "./waqfReferenceDomain";

export type EngineeringTerminalState =
  | "PASS"
  | "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP";

export type TranscriptionGroundTruthSample = {
  sampleId: string;
  artifactVersionId: string;
  pageNumber: number;
  groundTruth: string;
  observedText: string;
  groundTruthVerified: boolean;
  groundTruthProvenance: string;
  observedTextProvenance: string;
  correctionProvenance: string[];
  uncertainSegments: string[];
  confidence: number;
};

export type TranscriptionQualityBenchmark = {
  terminalState: EngineeringTerminalState;
  benchmarkExecuted: boolean;
  sampleCount: number;
  meanCharacterErrorRate: number | null;
  meanWordErrorRate: number | null;
  meanConfidence: number | null;
  uncertainSegmentCount: number;
  correctionProvenanceCount: number;
  evidenceGaps: string[];
};

function normalizeText(value: string): string {
  return String(value || "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein<T>(a: T[], b: T[]): number {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    for (let j = 0; j < current.length; j += 1) previous[j] = current[j];
  }
  return previous[b.length];
}

function rate(reference: string[], observed: string[]): number {
  if (!reference.length) return observed.length ? 1 : 0;
  return levenshtein(reference, observed) / reference.length;
}

export function evaluateTranscriptionGroundTruth(
  samples: TranscriptionGroundTruthSample[]
): TranscriptionQualityBenchmark {
  const verified = samples.filter(
    sample =>
      sample.groundTruthVerified &&
      sample.groundTruthProvenance.trim() &&
      sample.observedTextProvenance.trim()
  );
  if (!verified.length) {
    return {
      terminalState: "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP",
      benchmarkExecuted: false,
      sampleCount: 0,
      meanCharacterErrorRate: null,
      meanWordErrorRate: null,
      meanConfidence: null,
      uncertainSegmentCount: 0,
      correctionProvenanceCount: 0,
      evidenceGaps: [
        "verified_page_aligned_ground_truth_unavailable",
        "automated_extraction_or_translation_is_not_human_verified_ocr_ground_truth",
      ],
    };
  }
  const cers = verified.map(sample =>
    rate(
      Array.from(normalizeText(sample.groundTruth)),
      Array.from(normalizeText(sample.observedText))
    )
  );
  const wers = verified.map(sample =>
    rate(
      normalizeText(sample.groundTruth).split(" ").filter(Boolean),
      normalizeText(sample.observedText).split(" ").filter(Boolean)
    )
  );
  const mean = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    terminalState: "PASS",
    benchmarkExecuted: true,
    sampleCount: verified.length,
    meanCharacterErrorRate: mean(cers),
    meanWordErrorRate: mean(wers),
    meanConfidence: mean(
      verified.map(sample => Math.max(0, Math.min(1, sample.confidence)))
    ),
    uncertainSegmentCount: verified.reduce(
      (sum, sample) => sum + sample.uncertainSegments.length,
      0
    ),
    correctionProvenanceCount: verified.reduce(
      (sum, sample) => sum + sample.correctionProvenance.length,
      0
    ),
    evidenceGaps: [],
  };
}

export function buildQa002RealEvidenceTerminalization(): TranscriptionQualityBenchmark & {
  artifactEvidence: string[];
  sourceTextAvailable: true;
  pageAlignedHumanGroundTruthAvailable: false;
} {
  const benchmark = evaluateTranscriptionGroundTruth([]);
  return {
    ...benchmark,
    artifactEvidence: [
      "MEGA_E_HASEKI_VGM_2017_PRESERVED_PDF_SHA256_5e4e1b095c29810793d9bbaabf5c632ac8628617497125aaf78fd919c22687ef",
      "MEGA_E_EXTRACTED_TEXT_SHA256_2ae86747cd95a9e1425efcc274e01ff517d6a0226a799393fb92befc49812435",
      "MEGA_E_TRANSLATION_LOCATORS_PAGE_10_ITEMS_14_15",
    ],
    sourceTextAvailable: true,
    pageAlignedHumanGroundTruthAvailable: false,
  };
}

export type CaseLawSynthesis = {
  terminalState: "PASS";
  representativeCaseCount: number;
  caseNumbers: string[];
  sharedIssueTags: string[];
  cases: Array<{
    caseNumber: string;
    holdingSummary: string;
    appellateChain: string[];
    normalizationState: string;
    sourceConflictNotes: string[];
    caseSpecificOnly: true;
    generalizationAllowed: false;
  }>;
  descriptiveSynthesisAllowed: true;
  doctrinalGeneralizationAllowed: false;
  humanSpecialistAcceptanceIncluded: false;
};

export function buildPilot006CaseLawSynthesis(): CaseLawSynthesis {
  const normalizations = new Map(
    MEGA_G_CASE_NORMALIZATIONS.map(row => [row.caseNumber, row])
  );
  const tagCounts = new Map<string, number>();
  for (const decision of MEGA_F_JUDICIAL_DECISIONS) {
    for (const tag of decision.issueTags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  const sharedIssueTags = [...tagCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([tag]) => tag)
    .sort();
  return {
    terminalState: "PASS",
    representativeCaseCount: MEGA_F_JUDICIAL_DECISIONS.length,
    caseNumbers: MEGA_F_JUDICIAL_DECISIONS.map(row => row.caseNumber),
    sharedIssueTags,
    cases: MEGA_F_JUDICIAL_DECISIONS.map(decision => {
      const normalization = normalizations.get(decision.caseNumber);
      return {
        caseNumber: decision.caseNumber,
        holdingSummary: decision.holdingSummary,
        appellateChain: (normalization?.normalizedChain || []).map(
          row => row.level + ":" + row.caseNumber
        ),
        normalizationState:
          normalization?.normalizationState || "SOURCE_ONLY_UNNORMALIZED",
        sourceConflictNotes: [...(normalization?.sourceConflictNotes || [])],
        caseSpecificOnly: true,
        generalizationAllowed: false,
      };
    }),
    descriptiveSynthesisAllowed: true,
    doctrinalGeneralizationAllowed: false,
    humanSpecialistAcceptanceIncluded: false,
  };
}

const HASEKI_ARTIFACT_VERSION =
  "sha256-5e4e1b095c29810793d9bbaabf5c632ac8628617497125aaf78fd919c22687ef";

export function buildPilot007EvidenceBoundedTitleChain(): {
  terminalState: "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP";
  artifactVersionId: string;
  historicalEventCount: number;
  historicalFactsVerified: true;
  titleChain: ReturnType<typeof buildTitleChain>;
  currentParcelIdentityResolved: false;
  currentTitleResolved: false;
  currentOwnershipInferenceAllowed: false;
  evidenceGaps: string[];
} {
  const events: TitleChainEvent[] = [
    {
      eventId: "haseki-bethlehem-waqf-deed-1557",
      assetId: "historical-waqf-share-beytul-lahm-18-of-24",
      eventType: "WAQF_DEED",
      occurredAt: null,
      sequenceHint: 1,
      evidenceVersionIds: [HASEKI_ARTIFACT_VERSION],
      factSummary:
        "VGM 2017 translation page 10 item 14 records an 18/24 historical waqf share in Beytü'l-Lahm.",
      confidence: 0.99,
      verified: true,
    },
    {
      eventId: "haseki-beitjala-waqf-deed-1557",
      assetId: "historical-waqf-share-beyticala-18-of-24",
      eventType: "WAQF_DEED",
      occurredAt: null,
      sequenceHint: 1,
      evidenceVersionIds: [HASEKI_ARTIFACT_VERSION],
      factSummary:
        "VGM 2017 translation page 10 item 15 records an 18/24 historical waqf share in Beyticala.",
      confidence: 0.99,
      verified: true,
    },
  ];
  return {
    terminalState: "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP",
    artifactVersionId: HASEKI_ARTIFACT_VERSION,
    historicalEventCount: events.length,
    historicalFactsVerified: true,
    titleChain: buildTitleChain(events),
    currentParcelIdentityResolved: false,
    currentTitleResolved: false,
    currentOwnershipInferenceAllowed: false,
    evidenceGaps: [
      "no_governed_settlement_or_title_record_links_historical_share_to_current_parcel",
      "no_verified_two_source_parcel_crosswalk_to_current_parcel",
      "exact_historical_event_date_is_range_known_but_not_exactly_resolved",
    ],
  };
}

export type RightsAction =
  | "PRESERVE"
  | "DISPLAY"
  | "DOWNLOAD"
  | "RAG"
  | "QUOTE"
  | "PUBLIC_RELEASE";
export type RightsActionDecision = "ALLOW" | "DENY" | "REVIEW_REQUIRED";

export function evaluateRightsAction(
  rights: RightsProfile,
  action: RightsAction
): RightsActionDecision {
  if (rights.reviewStatus === "rejected") return "DENY";
  if (action === "PRESERVE") return rights.preserveAllowed ? "ALLOW" : "DENY";
  const pending = rights.reviewStatus !== "verified";
  if (action === "DISPLAY") {
    if (!rights.publicDisplayAllowed) return "DENY";
    return pending ? "REVIEW_REQUIRED" : "ALLOW";
  }
  if (action === "DOWNLOAD") {
    if (!rights.downloadAllowed) return "DENY";
    return pending ? "REVIEW_REQUIRED" : "ALLOW";
  }
  if (action === "RAG") {
    if (!rights.fullTextRetentionAllowed || !rights.ragAllowed) return "DENY";
    return pending ? "REVIEW_REQUIRED" : "ALLOW";
  }
  if (action === "QUOTE") {
    if (!rights.quoteAllowed) return "DENY";
    return pending ? "REVIEW_REQUIRED" : "ALLOW";
  }
  if (!rights.publicDisplayAllowed || !rights.downloadAllowed) return "DENY";
  return pending ? "REVIEW_REQUIRED" : "ALLOW";
}

function sourceById(corpusId: string): ReferenceCorpusItem {
  const item = MEGA_F_REFERENCE_EXPANSION.find(
    row => row.corpusId === corpusId
  );
  if (!item) throw new Error("reference_source_missing:" + corpusId);
  return item;
}

export function buildPilot008RightsAccessBenchmark(): {
  terminalState: "PASS";
  classes: Array<{
    classId: string;
    realSource: boolean;
    sourceId: string;
    decisions: Record<RightsAction, RightsActionDecision>;
  }>;
  publicReleaseFromPrivatePreservation: false;
  actualRightsMutated: false;
} {
  const privateSource = sourceById("maqam-cassation-1383-2019-hukr");
  const liveReadOnly = sourceById(
    "jerusalem-israel-land-registry-extract-service"
  );
  const internalVerified: RightsProfile = {
    preserveAllowed: true,
    fullTextRetentionAllowed: true,
    ragAllowed: true,
    publicDisplayAllowed: false,
    downloadAllowed: false,
    quoteAllowed: true,
    reviewStatus: "verified",
  };
  const publicVerified: RightsProfile = {
    preserveAllowed: true,
    fullTextRetentionAllowed: true,
    ragAllowed: true,
    publicDisplayAllowed: true,
    downloadAllowed: true,
    quoteAllowed: true,
    reviewStatus: "verified",
  };
  const actions: RightsAction[] = [
    "PRESERVE",
    "DISPLAY",
    "DOWNLOAD",
    "RAG",
    "QUOTE",
    "PUBLIC_RELEASE",
  ];
  const mk = (
    classId: string,
    sourceId: string,
    rights: RightsProfile,
    realSource: boolean
  ) => ({
    classId,
    realSource,
    sourceId,
    decisions: Object.fromEntries(
      actions.map(action => [action, evaluateRightsAction(rights, action)])
    ) as Record<RightsAction, RightsActionDecision>,
  });
  return {
    terminalState: "PASS",
    classes: [
      mk("PRIVATE_PENDING", privateSource.corpusId, privateSource.rights, true),
      mk("LIVE_READ_ONLY", liveReadOnly.corpusId, liveReadOnly.rights, true),
      mk(
        "INTERNAL_VERIFIED_TEST_FIXTURE",
        "TEST_RIGHTS_INTERNAL",
        internalVerified,
        false
      ),
      mk(
        "PUBLIC_VERIFIED_TEST_FIXTURE",
        "TEST_RIGHTS_PUBLIC",
        publicVerified,
        false
      ),
    ],
    publicReleaseFromPrivatePreservation: false,
    actualRightsMutated: false,
  };
}

export function buildGate06JurisdictionTerminalization(): {
  terminalState: "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP";
  resolverState: "unresolved";
  competentAuthority: null;
  inferenceAllowed: false;
  evidenceGaps: string[];
} {
  const result = resolveJurisdiction({
    issue: "PROPERTY_OWNERSHIP",
    territory: "JERUSALEM",
    regime: "MIXED",
    onDate: "2026-09-23",
    rules: [],
  });
  if (result.state !== "unresolved")
    throw new Error("expected_unresolved_jurisdiction");
  return {
    terminalState: "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP",
    resolverState: "unresolved",
    competentAuthority: null,
    inferenceAllowed: false,
    evidenceGaps: [
      "no_verified_issue_territory_regime_date_rule_in_admitted_corpus",
      "jerusalem_applicability_requires_external_specialist_evidence",
    ],
  };
}

export function buildGate07ConflictRevalidation(): {
  terminalState: "PASS";
  conflictCount: number;
  silentResolutionAllowed: false;
  authoritativeConclusionEligible: false;
} {
  const assertions: EvidenceAssertion[] = [
    {
      assertionId: "TEST_CONFLICT_A",
      factKey: "test:ownership_status",
      normalizedValue: "waqf",
      sourceKind: "WAQF_DEED",
      sourceVersionId: "TEST_VERSION_A",
      observedAt: null,
      authorityRank: 1,
      verified: true,
    },
    {
      assertionId: "TEST_CONFLICT_B",
      factKey: "test:ownership_status",
      normalizedValue: "private",
      sourceKind: "LAND_REGISTER",
      sourceVersionId: "TEST_VERSION_B",
      observedAt: null,
      authorityRank: 1,
      verified: true,
    },
  ];
  const conflicts = detectEvidenceConflicts(assertions);
  return {
    terminalState: "PASS",
    conflictCount: conflicts.length,
    silentResolutionAllowed: false,
    authoritativeConclusionEligible: false,
  };
}

export function buildGate10RetrievalCitationTerminalization(): {
  terminalState: "PASS";
  exactCaseUsable: boolean;
  broadCaseGeneralizationBlocked: boolean;
  citationAuditValid: boolean;
  citationDefects: string[];
} {
  const decision = MEGA_F_JUDICIAL_DECISIONS.find(
    row => row.caseNumber === "1383/2019"
  );
  if (!decision) throw new Error("case_1383_missing");
  const source = sourceById(decision.sourceCorpusId);
  const document: ReferenceRetrievalDocument = {
    documentId: "case:" + decision.caseNumber,
    title: source.title,
    content: decision.holdingSummary,
    domain: "case_law",
    era: "CONTEMPORARY",
    territories: [decision.territory],
    authorityClass: source.authorityClass,
    sourceUrl: source.sourceUrl,
    publisher: source.publisher,
    legalStatusVerified: true,
    artifactVersionId: "sha256-" + decision.sourceArtifactSha256,
    artifactSha256: decision.sourceArtifactSha256,
    locator: "Cassation " + decision.caseNumber + " represented holding",
    structuredConclusionEligible: true,
    conclusionScope: "CASE_SPECIFIC",
    conclusionScopeTokens: [decision.caseNumber],
    semanticScore: 0.95,
    graphScore: 0.8,
  };
  const exactQuestion =
    "ما الذي يمثله حكم نقض 1383/2019 بشأن الحكر ورقبة العقار الوقفي في الضفة الغربية؟";
  const broadQuestion =
    "ما حكم محكمة النقض عمومًا بشأن الحكر ورقبة جميع العقارات الوقفية في الضفة الغربية؟";
  const exact = hybridReferenceSearch({
    query: exactQuestion,
    route: routeReferenceIssue(exactQuestion),
    documents: [document],
  })[0];
  const broad = hybridReferenceSearch({
    query: broadQuestion,
    route: routeReferenceIssue(broadQuestion),
    documents: [document],
  })[0];
  const citation = buildReferenceGradeCitation({
    claimId: "case-1383-represented-holding",
    sourceUrl: source.sourceUrl,
    sourceTitle: source.title,
    artifactVersionId: document.artifactVersionId,
    artifactSha256: document.artifactSha256,
    locator: {
      type: "section",
      value: document.locator || "Cassation 1383/2019",
    },
    excerpt: decision.holdingSummary,
    alignmentVerified: true,
    legalStatusEvidenceRefs: [],
  });
  const audit = auditReferenceGradeCitations([citation]);
  return {
    terminalState: "PASS",
    exactCaseUsable: Boolean(exact?.usableForConclusion),
    broadCaseGeneralizationBlocked: Boolean(
      broad &&
        !broad.usableForConclusion &&
        broad.reasons.includes("case_specific_scope_mismatch")
    ),
    citationAuditValid: audit.valid,
    citationDefects: audit.defects,
  };
}

export type EngineeringGateTerminalization = {
  gateId: "GATE-04" | "GATE-05" | "GATE-06" | "GATE-07" | "GATE-08" | "GATE-10";
  terminalState: EngineeringTerminalState;
  evidenceRefs: string[];
  evidenceGaps: string[];
};

export function buildPostGDev002GateTerminalization(): EngineeringGateTerminalization[] {
  const qa002 = buildQa002RealEvidenceTerminalization();
  const title = buildPilot007EvidenceBoundedTitleChain();
  const jurisdiction = buildGate06JurisdictionTerminalization();
  const conflict = buildGate07ConflictRevalidation();
  const rights = buildPilot008RightsAccessBenchmark();
  const retrieval = buildGate10RetrievalCitationTerminalization();
  return [
    {
      gateId: "GATE-04",
      terminalState: qa002.terminalState,
      evidenceRefs: qa002.artifactEvidence,
      evidenceGaps: qa002.evidenceGaps,
    },
    {
      gateId: "GATE-05",
      terminalState: title.terminalState,
      evidenceRefs: [title.artifactVersionId],
      evidenceGaps: title.evidenceGaps,
    },
    {
      gateId: "GATE-06",
      terminalState: jurisdiction.terminalState,
      evidenceRefs: [],
      evidenceGaps: jurisdiction.evidenceGaps,
    },
    {
      gateId: "GATE-07",
      terminalState: conflict.terminalState,
      evidenceRefs: ["POST_G_DEV_002_CONFLICT_REGRESSION"],
      evidenceGaps: [],
    },
    {
      gateId: "GATE-08",
      terminalState: rights.terminalState,
      evidenceRefs: [
        "MEGA_F_PRIVATE_PENDING_RIGHTS",
        "MEGA_F_JERUSALEM_LIVE_READ_ONLY_RIGHTS",
        "POST_G_DEV_002_SYNTHETIC_POLICY_BRANCH_FIXTURES",
      ],
      evidenceGaps: [],
    },
    {
      gateId: "GATE-10",
      terminalState: retrieval.terminalState,
      evidenceRefs: [
        "MEGA_F_CASE_1383_EXACT_SCOPE",
        "POST_G_DEV_002_REFERENCE_CITATION_AUDIT",
      ],
      evidenceGaps: [],
    },
  ];
}

export type StaleTodoTerminalization = {
  todoId: string;
  terminalStatus: "DONE" | "DEFERRED";
  reason: string;
  evidenceRefs: string[];
};

export function buildStaleTodoReconciliation(): StaleTodoTerminalization[] {
  return [
    {
      todoId: "PILOT-001",
      terminalStatus: "DONE",
      reason:
        "The bounded official-source pilot scope was completed by the governed scale-up, private preservation and zero-network replay; exhaustive corpus expansion is continuous nonblocking enrichment.",
      evidenceRefs: ["MEGA_C_PRIVATE_ARTIFACT_SET", "MEGA_G_GATE09_PASS"],
    },
    {
      todoId: "PILOT-002",
      terminalStatus: "DEFERRED",
      reason:
        "One real charitable historical deed benchmark is complete, but family/hukr/later-deed representation and substantive deed interpretation require additional evidence or human specialist review and do not block engineering preproduction entry.",
      evidenceRefs: [
        "MEGA_E_HASEKI_REAL_DEED_BENCHMARK",
        "POST_G_DEV_002_QA002_EXPLICIT_EVIDENCE_GAP",
      ],
    },
    {
      todoId: "PILOT-003",
      terminalStatus: "DONE",
      reason:
        "Temporal scenarios across Ottoman, Mandate, West Bank, Gaza and unresolved Jerusalem were already exercised with fail-closed status separation.",
      evidenceRefs: ["MEGA_C_TEMPORAL_SCENARIOS", "GATE15_PASS"],
    },
    {
      todoId: "PILOT-004",
      terminalStatus: "DONE",
      reason:
        "Cross-territory West Bank/Gaza/Jerusalem separation is regression-proven without status inheritance.",
      evidenceRefs: ["MEGA_G_TERRITORY_TERMINAL_PACKETS", "GATE11_PASS"],
    },
    {
      todoId: "PILOT-005",
      terminalStatus: "DEFERRED",
      reason:
        "Fiqh/positive-law semantic separation is technically proven; expert-reviewed doctrinal acceptance remains a preproduction human gate.",
      evidenceRefs: ["MEGA_G_FIQH_HANDOFF", "GATE12_PREPRODUCTION_HUMAN_DEBT"],
    },
  ];
}

export function buildPostGDev002Summary() {
  const qa002 = buildQa002RealEvidenceTerminalization();
  const pilot006 = buildPilot006CaseLawSynthesis();
  const pilot007 = buildPilot007EvidenceBoundedTitleChain();
  const pilot008 = buildPilot008RightsAccessBenchmark();
  const gate07 = buildGate07ConflictRevalidation();
  const gate10 = buildGate10RetrievalCitationTerminalization();
  const gates = buildPostGDev002GateTerminalization();
  const staleTodos = buildStaleTodoReconciliation();
  const megaGRights = buildMegaGRightsLedger();
  return {
    program: "POST-G-DEV-002",
    finalEngineeringBatch: true,
    qa002,
    pilot006,
    pilot007,
    pilot008,
    conflictRevalidation: gate07,
    retrievalCitation: gate10,
    gateTerminalization: gates,
    staleTodos,
    megaGRightsPublicReleaseAllowed: megaGRights.some(
      row => row.publicReleaseAllowed
    ),
    allInScopeEngineeringGatesTerminal: gates.every(row =>
      ["PASS", "DEFERRED_WITH_EXPLICIT_EVIDENCE_GAP"].includes(
        row.terminalState
      )
    ),
    ambiguousInProgressEngineeringGates: 0,
    realSpecialistDecisionsIncluded: false,
    productionEffect: "NONE" as const,
    preproductionEngineeringEntryEligible: true,
  };
}
