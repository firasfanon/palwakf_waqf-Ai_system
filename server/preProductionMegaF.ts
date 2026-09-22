import { performance } from "node:perf_hooks";
import type {
  MegaERole,
  MegaEAccessDisposition,
} from "./preProductionAccessMegaE";
import { evaluateMegaEAccess } from "./preProductionAccessMegaE";
import { routeReferenceIssue } from "./referenceIssueRouter";
import {
  hybridReferenceSearch,
  selectReferenceEvidencePack,
  type ReferenceRetrievalDocument,
  type ReferenceRetrievalHit,
} from "./referenceRetrieval";

export type MegaFGuardedAction =
  | "FAIL_CLOSED_OVERRIDE"
  | "EXPORT_PRIVATE_REFERENCE"
  | "VIEW_SPECIALIST_CREDENTIAL_EVIDENCE"
  | "CHANGE_TERRITORY_SCOPE"
  | "APPROVE_SPECIALIST_DECISION"
  | "LIVE_SHARED_DB_MUTATION"
  | "MAIN_MERGE"
  | "BASELINE_PROMOTION"
  | "PRODUCTION_PUBLIC_RELEASE";

export type MegaFGuardDecision = {
  disposition: MegaEAccessDisposition;
  reasons: string[];
};

export function evaluateMegaFGuard(input: {
  role: MegaERole;
  action: MegaFGuardedAction;
  actorId?: string | null;
  reviewerId?: string | null;
  requestedSpecialistRole?: MegaERole | null;
  territory?: string | null;
  reviewerTerritories?: string[];
}): MegaFGuardDecision {
  switch (input.action) {
    case "FAIL_CLOSED_OVERRIDE":
      return {
        disposition: "DENY",
        reasons: ["fail_closed_override_forbidden"],
      };
    case "EXPORT_PRIVATE_REFERENCE":
      return {
        disposition: "DENY",
        reasons: ["private_reference_export_not_authorized"],
      };
    case "VIEW_SPECIALIST_CREDENTIAL_EVIDENCE":
      return ["SYSTEM_ACCESS_ADMIN", "SECURITY_PRIVACY_REVIEWER"].includes(
        input.role
      )
        ? { disposition: "ALLOW", reasons: ["credential_evidence_role"] }
        : { disposition: "DENY", reasons: ["credential_evidence_not_granted"] };
    case "CHANGE_TERRITORY_SCOPE":
      return {
        disposition: "SEPARATE_AUTH_REQUIRED",
        reasons: ["production_role_scope_grant_not_authorized"],
      };
    case "APPROVE_SPECIALIST_DECISION": {
      if (
        input.actorId &&
        input.reviewerId &&
        input.actorId === input.reviewerId
      ) {
        return { disposition: "DENY", reasons: ["self_approval_prohibited"] };
      }
      const base = evaluateMegaEAccess({
        role: input.role,
        action: "SPECIALIST_DECISION_APPROVE",
        requestedSpecialistRole: input.requestedSpecialistRole,
        territory: input.territory,
        reviewerTerritories: input.reviewerTerritories,
      });
      return base;
    }
    case "LIVE_SHARED_DB_MUTATION":
      return evaluateMegaEAccess({
        role: input.role,
        action: "LIVE_SHARED_DB_MUTATION",
      });
    case "MAIN_MERGE":
      return evaluateMegaEAccess({ role: input.role, action: "MAIN_MERGE" });
    case "BASELINE_PROMOTION":
      return evaluateMegaEAccess({
        role: input.role,
        action: "BASELINE_PROMOTION",
      });
    case "PRODUCTION_PUBLIC_RELEASE":
      return evaluateMegaEAccess({
        role: input.role,
        action: "PRODUCTION_PUBLIC_RELEASE",
      });
  }
}

const ALL_ROLES: MegaERole[] = [
  "PROGRAM_OWNER",
  "SYSTEM_ACCESS_ADMIN",
  "DEVELOPER_ENGINEER",
  "SOURCE_RESEARCHER",
  "INGESTION_OPERATOR",
  "DATA_GOVERNANCE_STEWARD",
  "LEGAL_STATUS_REVIEWER",
  "WAQF_DEED_REVIEWER",
  "FIQH_SHARIA_REVIEWER",
  "HISTORICAL_EVIDENCE_REVIEWER",
  "RIGHTS_REVIEWER",
  "SECURITY_PRIVACY_REVIEWER",
  "PROGRAM_ACCEPTANCE_REVIEWER",
  "AUDITOR_READ_ONLY",
  "RESEARCH_USER",
  "PUBLIC_USER_FUTURE",
  "RELEASE_OPERATOR",
];

export function buildMegaFSecurityNegativeMatrix(): Array<{
  role: MegaERole;
  action: MegaFGuardedAction;
  expected: MegaEAccessDisposition;
}> {
  const universallyDenied: MegaFGuardedAction[] = [
    "FAIL_CLOSED_OVERRIDE",
    "EXPORT_PRIVATE_REFERENCE",
  ];
  const separateAuthority: MegaFGuardedAction[] = [
    "CHANGE_TERRITORY_SCOPE",
    "LIVE_SHARED_DB_MUTATION",
    "MAIN_MERGE",
    "BASELINE_PROMOTION",
    "PRODUCTION_PUBLIC_RELEASE",
  ];
  return ALL_ROLES.flatMap(role => [
    ...universallyDenied.map(action => ({
      role,
      action,
      expected: "DENY" as const,
    })),
    ...separateAuthority.map(action => ({
      role,
      action,
      expected: "SEPARATE_AUTH_REQUIRED" as const,
    })),
  ]);
}

export type MegaFEvidenceHitSummary = {
  documentId: string;
  title: string;
  domain: ReferenceRetrievalHit["domain"];
  era: ReferenceRetrievalHit["era"];
  territories: ReferenceRetrievalHit["territories"];
  authorityClass: ReferenceRetrievalHit["authorityClass"];
  sourceUrl: string;
  publisher: string;
  legalStatusVerified: boolean;
  artifactVersionId: string;
  artifactSha256: string;
  locator: string | null;
  structuredConclusionEligible?: boolean;
  conclusionScope?: "GENERAL" | "CASE_SPECIFIC";
  conclusionScopeTokens?: string[];
  scores: ReferenceRetrievalHit["scores"];
  usableForConclusion: boolean;
  reasons: string[];
};

export function summarizeMegaFRetrievalHitForEvidence(
  hit: ReferenceRetrievalHit
): MegaFEvidenceHitSummary {
  return {
    documentId: hit.documentId,
    title: hit.title,
    domain: hit.domain,
    era: hit.era,
    territories: [...hit.territories],
    authorityClass: hit.authorityClass,
    sourceUrl: hit.sourceUrl,
    publisher: hit.publisher,
    legalStatusVerified: hit.legalStatusVerified,
    artifactVersionId: hit.artifactVersionId,
    artifactSha256: hit.artifactSha256,
    locator: hit.locator,
    structuredConclusionEligible: hit.structuredConclusionEligible,
    conclusionScope: hit.conclusionScope,
    conclusionScopeTokens: hit.conclusionScopeTokens
      ? [...hit.conclusionScopeTokens]
      : undefined,
    scores: { ...hit.scores },
    usableForConclusion: hit.usableForConclusion,
    reasons: [...hit.reasons],
  };
}

export type MegaFPerformanceBenchmark = {
  iterations: number;
  queryCount: number;
  documentCount: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  averageMs: number;
  totalMs: number;
  paidProviderCalls: 0;
  providerCostUsd: 0;
  externalNetworkCalls: 0;
  productionSloCertified: false;
};

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

export function benchmarkMegaFRetrieval(input: {
  documents: ReferenceRetrievalDocument[];
  queries: string[];
  iterations?: number;
  evidencePackSize?: number;
}): MegaFPerformanceBenchmark {
  const iterations = Math.max(1, Math.min(input.iterations || 100, 10_000));
  const queries = input.queries.length ? input.queries : ["وقف"];
  const samples: number[] = [];
  const started = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    const query = queries[i % queries.length];
    const t0 = performance.now();
    const route = routeReferenceIssue(query);
    const hits = hybridReferenceSearch({
      query,
      route,
      documents: input.documents,
      limit: 8,
    });
    selectReferenceEvidencePack(hits, input.evidencePackSize || 4, [
      ...route.priorityDomains,
      ...route.preferredDomains,
    ]);
    samples.push(performance.now() - t0);
  }
  const totalMs = performance.now() - started;
  const sum = samples.reduce((acc, value) => acc + value, 0);
  return {
    iterations,
    queryCount: queries.length,
    documentCount: input.documents.length,
    p50Ms: percentile(samples, 50),
    p95Ms: percentile(samples, 95),
    maxMs: Math.max(...samples),
    averageMs: sum / samples.length,
    totalMs,
    paidProviderCalls: 0,
    providerCostUsd: 0,
    externalNetworkCalls: 0,
    productionSloCertified: false,
  };
}

export type MegaFContinuityReadiness = {
  localImmutableRestoreDrillRequired: true;
  localOfflineReplayRequired: true;
  fixityRequired: true;
  independentProviderCertified: false;
  productionContinuityCertified: false;
  externalDebt: string[];
};

export function buildMegaFContinuityReadiness(): MegaFContinuityReadiness {
  return {
    localImmutableRestoreDrillRequired: true,
    localOfflineReplayRequired: true,
    fixityRequired: true,
    independentProviderCertified: false,
    productionContinuityCertified: false,
    externalDebt: [
      "independent_second_provider_not_provisioned",
      "production_worm_retention_not_certified",
      "production_restore_runbook_not_accepted",
    ],
  };
}
