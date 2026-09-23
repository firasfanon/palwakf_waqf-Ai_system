import { buildMegaGSpecialistQueue } from "./expertReviewMegaG";
import type { ExpertReviewItem, ExpertReviewRole } from "./expertReviewQueue";

export type TestReviewDisposition = "ACCEPT" | "DEFER" | "REJECT";
export type TestReviewAction = "VIEW" | "DECIDE";

export type TestReviewerFixture = {
  reviewerId: string;
  role: ExpertReviewRole;
  territories: string[];
  testOnly: true;
  nonAuthoritative: true;
  humanSpecialistAuthority: false;
  productionAuthority: false;
  recusedReviewIds: string[];
  proposedReviewIds: string[];
};

export type TestDecisionAttempt = {
  decisionId: string;
  reviewId: string;
  reviewerId: string;
  disposition: TestReviewDisposition;
  rationale: string;
  evidenceRefs: string[];
  decidedAt: string;
  supersedesDecisionId?: string;
};

export type TestDecisionRecord = TestDecisionAttempt & {
  testDecision: true;
  authoritativeHumanDecision: false;
  productionEffect: "NONE";
};

export type TestReviewAuditEvent = {
  sequence: number;
  eventType: "DECISION_RECORDED" | "DECISION_SUPERSEDED" | "DECISION_REJECTED";
  reviewId: string;
  reviewerId: string;
  decisionId: string;
  effective: boolean;
  reasons: string[];
  occurredAt: string;
};

export type TestReviewSimulationState = {
  decisions: TestDecisionRecord[];
  auditEvents: TestReviewAuditEvent[];
};

export type TestReviewAccessDecision = {
  allowed: boolean;
  reasons: string[];
};

const allTerritories = [
  "WEST_BANK",
  "GAZA",
  "JERUSALEM",
  "OTTOMAN_PALESTINE",
  "HISTORIC_PALESTINE",
];

function fixture(
  reviewerId: string,
  role: ExpertReviewRole,
  territories: string[]
): TestReviewerFixture {
  return {
    reviewerId,
    role,
    territories,
    testOnly: true,
    nonAuthoritative: true,
    humanSpecialistAuthority: false,
    productionAuthority: false,
    recusedReviewIds: [],
    proposedReviewIds: [],
  };
}

export function buildDefaultTestReviewerFixtures(): TestReviewerFixture[] {
  return [
    fixture("TEST_REVIEWER_LEGAL_GENERAL_001", "LEGAL_STATUS_REVIEWER", []),
    fixture("TEST_REVIEWER_LEGAL_WB_001", "LEGAL_STATUS_REVIEWER", [
      "WEST_BANK",
    ]),
    fixture("TEST_REVIEWER_LEGAL_GAZA_001", "LEGAL_STATUS_REVIEWER", ["GAZA"]),
    fixture("TEST_REVIEWER_LEGAL_JERUSALEM_001", "LEGAL_STATUS_REVIEWER", [
      "JERUSALEM",
    ]),
    fixture(
      "TEST_REVIEWER_WAQF_DEED_001",
      "WAQF_DEED_REVIEWER",
      allTerritories
    ),
    fixture("TEST_REVIEWER_FIQH_001", "FIQH_SHARIA_REVIEWER", allTerritories),
    fixture(
      "TEST_REVIEWER_HIST_001",
      "HISTORICAL_EVIDENCE_REVIEWER",
      allTerritories
    ),
    fixture("TEST_REVIEWER_RIGHTS_001", "RIGHTS_REVIEWER", allTerritories),
    fixture(
      "TEST_REVIEWER_SECURITY_001",
      "SECURITY_PRIVACY_REVIEWER",
      allTerritories
    ),
  ];
}

export function fixtureIsStrictlyNonAuthoritative(
  reviewer: TestReviewerFixture
): boolean {
  return (
    reviewer.reviewerId.startsWith("TEST_REVIEWER_") &&
    reviewer.testOnly === true &&
    reviewer.nonAuthoritative === true &&
    reviewer.humanSpecialistAuthority === false &&
    reviewer.productionAuthority === false
  );
}

export function evaluateTestReviewAccess(input: {
  reviewer: TestReviewerFixture;
  review: ExpertReviewItem;
  action: TestReviewAction;
}): TestReviewAccessDecision {
  const reasons: string[] = [];
  if (!fixtureIsStrictlyNonAuthoritative(input.reviewer)) {
    reasons.push("fixture_authority_boundary_violation");
  }
  if (input.reviewer.role !== input.review.role) {
    reasons.push("reviewer_role_mismatch");
  }
  if (
    input.review.territory &&
    !input.reviewer.territories.includes(input.review.territory)
  ) {
    reasons.push("reviewer_territory_scope_mismatch");
  }
  if (
    input.action === "DECIDE" &&
    input.reviewer.recusedReviewIds.includes(input.review.reviewId)
  ) {
    reasons.push("reviewer_recused");
  }
  if (
    input.action === "DECIDE" &&
    input.reviewer.proposedReviewIds.includes(input.review.reviewId)
  ) {
    reasons.push("self_approval_prohibited");
  }
  return {
    allowed: reasons.length === 0,
    reasons,
  };
}

function effectiveDecisionMap(
  decisions: TestDecisionRecord[]
): Map<string, TestDecisionRecord> {
  const effective = new Map<string, TestDecisionRecord>();
  for (const decision of decisions) effective.set(decision.reviewId, decision);
  return effective;
}

export function validateTestDecisionAttempt(input: {
  attempt: TestDecisionAttempt;
  reviewers: TestReviewerFixture[];
  queue?: ExpertReviewItem[];
  state?: TestReviewSimulationState;
}): string[] {
  const queue = input.queue || buildMegaGSpecialistQueue();
  const state = input.state || { decisions: [], auditEvents: [] };
  const errors: string[] = [];
  const review = queue.find(item => item.reviewId === input.attempt.reviewId);
  const reviewer = input.reviewers.find(
    item => item.reviewerId === input.attempt.reviewerId
  );

  if (!review) errors.push("review_item_not_found");
  if (!reviewer) errors.push("test_reviewer_not_found");
  if (!input.attempt.rationale.trim()) errors.push("rationale_required");
  if (!input.attempt.decidedAt.trim())
    errors.push("decision_timestamp_required");

  if (reviewer && review) {
    const access = evaluateTestReviewAccess({
      reviewer,
      review,
      action: "DECIDE",
    });
    errors.push(...access.reasons);

    if (
      input.attempt.disposition !== "DEFER" &&
      input.attempt.evidenceRefs.length === 0
    ) {
      errors.push("evidence_refs_required_for_non_defer");
    }
    if (
      input.attempt.disposition === "DEFER" &&
      review.evidenceRefs.length > 0 &&
      input.attempt.evidenceRefs.length === 0
    ) {
      errors.push("available_evidence_should_be_referenced_for_defer");
    }
    for (const ref of input.attempt.evidenceRefs) {
      if (!review.evidenceRefs.includes(ref)) {
        errors.push("evidence_ref_outside_review_pack");
      }
    }
  }

  const current = review
    ? effectiveDecisionMap(state.decisions).get(review.reviewId)
    : undefined;
  if (current && !input.attempt.supersedesDecisionId) {
    errors.push("existing_effective_decision_requires_supersession");
  }
  if (input.attempt.supersedesDecisionId) {
    const predecessor = state.decisions.find(
      decision => decision.decisionId === input.attempt.supersedesDecisionId
    );
    if (!predecessor) {
      errors.push("superseded_decision_not_found");
    } else {
      if (predecessor.reviewId !== input.attempt.reviewId) {
        errors.push("superseded_decision_review_mismatch");
      }
      if (current?.decisionId !== predecessor.decisionId) {
        errors.push("superseded_decision_not_current");
      }
    }
  }

  return [...new Set(errors)];
}

export function recordTestDecision(input: {
  state: TestReviewSimulationState;
  attempt: TestDecisionAttempt;
  reviewers: TestReviewerFixture[];
  queue?: ExpertReviewItem[];
}): TestReviewSimulationState {
  const queue = input.queue || buildMegaGSpecialistQueue();
  const reasons = validateTestDecisionAttempt({
    attempt: input.attempt,
    reviewers: input.reviewers,
    queue,
    state: input.state,
  });
  const eventBase = {
    sequence: input.state.auditEvents.length + 1,
    reviewId: input.attempt.reviewId,
    reviewerId: input.attempt.reviewerId,
    decisionId: input.attempt.decisionId,
    occurredAt: input.attempt.decidedAt,
  };
  if (reasons.length) {
    return {
      decisions: [...input.state.decisions],
      auditEvents: [
        ...input.state.auditEvents,
        {
          ...eventBase,
          eventType: "DECISION_REJECTED",
          effective: false,
          reasons,
        },
      ],
    };
  }

  const record: TestDecisionRecord = {
    ...input.attempt,
    evidenceRefs: [...input.attempt.evidenceRefs],
    testDecision: true,
    authoritativeHumanDecision: false,
    productionEffect: "NONE",
  };
  return {
    decisions: [...input.state.decisions, record],
    auditEvents: [
      ...input.state.auditEvents,
      {
        ...eventBase,
        eventType: input.attempt.supersedesDecisionId
          ? "DECISION_SUPERSEDED"
          : "DECISION_RECORDED",
        effective: true,
        reasons: input.attempt.supersedesDecisionId
          ? ["test_decision_supersession_recorded"]
          : ["test_decision_recorded"],
      },
    ],
  };
}

export function selectFixtureForReview(
  review: ExpertReviewItem,
  reviewers = buildDefaultTestReviewerFixtures()
): TestReviewerFixture | undefined {
  return reviewers.find(
    reviewer =>
      reviewer.role === review.role &&
      (!review.territory || reviewer.territories.includes(review.territory)) &&
      !reviewer.recusedReviewIds.includes(review.reviewId) &&
      !reviewer.proposedReviewIds.includes(review.reviewId)
  );
}

export function buildDeterministicFullReviewSimulation(): {
  queue: ExpertReviewItem[];
  reviewers: TestReviewerFixture[];
  state: TestReviewSimulationState;
} {
  const queue = buildMegaGSpecialistQueue();
  const reviewers = buildDefaultTestReviewerFixtures();
  let state: TestReviewSimulationState = { decisions: [], auditEvents: [] };
  const dispositions: TestReviewDisposition[] = ["ACCEPT", "DEFER", "REJECT"];

  queue.forEach((review, index) => {
    const reviewer = selectFixtureForReview(review, reviewers);
    if (!reviewer) return;
    const disposition =
      review.evidenceRefs.length === 0
        ? "DEFER"
        : dispositions[index % dispositions.length];
    const evidenceRefs =
      review.evidenceRefs.length === 0
        ? []
        : review.evidenceRefs.slice(0, Math.min(2, review.evidenceRefs.length));
    state = recordTestDecision({
      state,
      reviewers,
      queue,
      attempt: {
        decisionId: "test-decision-" + String(index + 1).padStart(3, "0"),
        reviewId: review.reviewId,
        reviewerId: reviewer.reviewerId,
        disposition,
        rationale:
          disposition === "DEFER" && review.evidenceRefs.length === 0
            ? "TEST_ONLY defer because governed review pack has an explicit evidence gap."
            : "TEST_ONLY workflow simulation; no human or production authority.",
        evidenceRefs,
        decidedAt: "2026-09-23T12:00:00Z",
      },
    });
  });

  return { queue, reviewers, state };
}

export function buildNonAuthoritativeGateSimulation(input?: {
  queue?: ExpertReviewItem[];
  state?: TestReviewSimulationState;
}): {
  totalQueueItems: number;
  effectiveTestDecisions: number;
  blockingQueueItems: number;
  blockingItemsTestCovered: number;
  simulatedWorkflowCoverageComplete: boolean;
  gate13Satisfied: false;
  authoritativeHumanDecisions: 0;
  productionEffect: "NONE";
} {
  const queue = input?.queue || buildMegaGSpecialistQueue();
  const state = input?.state || buildDeterministicFullReviewSimulation().state;
  const effective = effectiveDecisionMap(state.decisions);
  const blocking = queue.filter(item => item.blocksAuthoritativeConclusion);
  return {
    totalQueueItems: queue.length,
    effectiveTestDecisions: effective.size,
    blockingQueueItems: blocking.length,
    blockingItemsTestCovered: blocking.filter(item =>
      effective.has(item.reviewId)
    ).length,
    simulatedWorkflowCoverageComplete: queue.every(item =>
      effective.has(item.reviewId)
    ),
    gate13Satisfied: false,
    authoritativeHumanDecisions: 0,
    productionEffect: "NONE",
  };
}

export function buildReviewQueueSimulationSummary(): {
  total: number;
  p0: number;
  blocking: number;
  byRole: Record<string, number>;
  byTerritory: Record<string, number>;
} {
  const queue = buildMegaGSpecialistQueue();
  const byRole: Record<string, number> = {};
  const byTerritory: Record<string, number> = {};
  for (const item of queue) {
    byRole[item.role] = (byRole[item.role] || 0) + 1;
    const territory = item.territory || "GLOBAL_OR_NONE";
    byTerritory[territory] = (byTerritory[territory] || 0) + 1;
  }
  return {
    total: queue.length,
    p0: queue.filter(item => item.priority === "P0").length,
    blocking: queue.filter(item => item.blocksAuthoritativeConclusion).length,
    byRole,
    byTerritory,
  };
}

export function fixtureRegistrySeparationGuard(
  reviewers = buildDefaultTestReviewerFixtures()
): {
  allFixturesStrictlyNonAuthoritative: boolean;
  mayEnterReviewerAuthority: false;
  mayEnterHumanSignoff: false;
  maySatisfyGate13: false;
} {
  return {
    allFixturesStrictlyNonAuthoritative: reviewers.every(
      fixtureIsStrictlyNonAuthoritative
    ),
    mayEnterReviewerAuthority: false,
    mayEnterHumanSignoff: false,
    maySatisfyGate13: false,
  };
}
