import { describe, expect, it } from "vitest";
import { buildMegaGSpecialistQueue } from "./expertReviewMegaG";
import {
  buildDefaultTestReviewerFixtures,
  buildDeterministicFullReviewSimulation,
  buildNonAuthoritativeGateSimulation,
  buildReviewQueueSimulationSummary,
  evaluateTestReviewAccess,
  fixtureIsStrictlyNonAuthoritative,
  fixtureRegistrySeparationGuard,
  recordTestDecision,
  selectFixtureForReview,
  validateTestDecisionAttempt,
  type TestReviewerFixture,
  type TestReviewSimulationState,
} from "./nonProductionReviewSimulation";

describe("POST-G-DEV-001 non-production review workflow simulation", () => {
  it("creates only obviously synthetic non-authoritative reviewer fixtures", () => {
    const fixtures = buildDefaultTestReviewerFixtures();
    expect(fixtures.length).toBeGreaterThanOrEqual(8);
    expect(fixtures.every(fixtureIsStrictlyNonAuthoritative)).toBe(true);
    expect(
      fixtures.every(item => item.reviewerId.startsWith("TEST_REVIEWER_"))
    ).toBe(true);
    expect(
      fixtures.every(item => item.humanSpecialistAuthority === false)
    ).toBe(true);
    expect(fixtures.every(item => item.productionAuthority === false)).toBe(
      true
    );
  });

  it("keeps fixtures mechanically outside real authority and signoff gates", () => {
    expect(fixtureRegistrySeparationGuard()).toEqual({
      allFixturesStrictlyNonAuthoritative: true,
      mayEnterReviewerAuthority: false,
      mayEnterHumanSignoff: false,
      maySatisfyGate13: false,
    });
  });

  it("denies a fixture whose authority flags are corrupted", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.role === "RIGHTS_REVIEWER")!;
    const original = selectFixtureForReview(review)!;
    const corrupted = {
      ...original,
      humanSpecialistAuthority: true,
    } as unknown as TestReviewerFixture;
    const result = evaluateTestReviewAccess({
      reviewer: corrupted,
      review,
      action: "VIEW",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("fixture_authority_boundary_violation");
  });

  it("denies wrong specialist role", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.role === "FIQH_SHARIA_REVIEWER")!;
    const wrong = buildDefaultTestReviewerFixtures().find(
      item => item.role === "RIGHTS_REVIEWER"
    )!;
    const result = evaluateTestReviewAccess({
      reviewer: wrong,
      review,
      action: "VIEW",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("reviewer_role_mismatch");
  });

  it("denies wrong territory for territory-scoped legal review", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(
      item => item.role === "LEGAL_STATUS_REVIEWER" && item.territory === "GAZA"
    )!;
    const westBank = buildDefaultTestReviewerFixtures().find(
      item => item.reviewerId === "TEST_REVIEWER_LEGAL_WB_001"
    )!;
    const result = evaluateTestReviewAccess({
      reviewer: westBank,
      review,
      action: "DECIDE",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("reviewer_territory_scope_mismatch");
  });

  it("denies recused reviewer from issuing an effective test decision", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.role === "RIGHTS_REVIEWER")!;
    const selected = selectFixtureForReview(review)!;
    const recused: TestReviewerFixture = {
      ...selected,
      recusedReviewIds: [review.reviewId],
    };
    const result = evaluateTestReviewAccess({
      reviewer: recused,
      review,
      action: "DECIDE",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("reviewer_recused");
  });

  it("denies self approval when the synthetic reviewer proposed the item", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.role === "RIGHTS_REVIEWER")!;
    const selected = selectFixtureForReview(review)!;
    const proposer: TestReviewerFixture = {
      ...selected,
      proposedReviewIds: [review.reviewId],
    };
    const result = evaluateTestReviewAccess({
      reviewer: proposer,
      review,
      action: "DECIDE",
    });
    expect(result.allowed).toBe(false);
    expect(result.reasons).toContain("self_approval_prohibited");
  });

  it("requires review-pack evidence for non-DEFER test outcomes", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.evidenceRefs.length > 0)!;
    const reviewer = selectFixtureForReview(review)!;
    const errors = validateTestDecisionAttempt({
      queue,
      reviewers: buildDefaultTestReviewerFixtures(),
      attempt: {
        decisionId: "test-missing-evidence",
        reviewId: review.reviewId,
        reviewerId: reviewer.reviewerId,
        disposition: "ACCEPT",
        rationale: "TEST_ONLY",
        evidenceRefs: [],
        decidedAt: "2026-09-23T12:00:00Z",
      },
    });
    expect(errors).toContain("evidence_refs_required_for_non_defer");
  });

  it("allows DEFER without invented refs when the governed review pack is empty", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.evidenceRefs.length === 0)!;
    const reviewer = selectFixtureForReview(review)!;
    const errors = validateTestDecisionAttempt({
      queue,
      reviewers: buildDefaultTestReviewerFixtures(),
      attempt: {
        decisionId: "test-defer-evidence-gap",
        reviewId: review.reviewId,
        reviewerId: reviewer.reviewerId,
        disposition: "DEFER",
        rationale: "TEST_ONLY explicit governed evidence gap",
        evidenceRefs: [],
        decidedAt: "2026-09-23T12:00:00Z",
      },
    });
    expect(errors).toEqual([]);
  });

  it("rejects evidence references outside the governed review pack", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.evidenceRefs.length > 0)!;
    const reviewer = selectFixtureForReview(review)!;
    const errors = validateTestDecisionAttempt({
      queue,
      reviewers: buildDefaultTestReviewerFixtures(),
      attempt: {
        decisionId: "test-foreign-evidence",
        reviewId: review.reviewId,
        reviewerId: reviewer.reviewerId,
        disposition: "REJECT",
        rationale: "TEST_ONLY",
        evidenceRefs: ["invented-evidence-ref"],
        decidedAt: "2026-09-23T12:00:00Z",
      },
    });
    expect(errors).toContain("evidence_ref_outside_review_pack");
  });

  it("records immutable test decision history and explicit supersession", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(item => item.evidenceRefs.length > 0)!;
    const reviewers = buildDefaultTestReviewerFixtures();
    const reviewer = selectFixtureForReview(review, reviewers)!;
    let state: TestReviewSimulationState = { decisions: [], auditEvents: [] };

    state = recordTestDecision({
      state,
      reviewers,
      queue,
      attempt: {
        decisionId: "test-first",
        reviewId: review.reviewId,
        reviewerId: reviewer.reviewerId,
        disposition: "DEFER",
        rationale: "TEST_ONLY initial decision",
        evidenceRefs: [review.evidenceRefs[0]],
        decidedAt: "2026-09-23T12:00:00Z",
      },
    });
    const firstSnapshot = JSON.stringify(state.decisions[0]);

    state = recordTestDecision({
      state,
      reviewers,
      queue,
      attempt: {
        decisionId: "test-second",
        reviewId: review.reviewId,
        reviewerId: reviewer.reviewerId,
        disposition: "ACCEPT",
        rationale: "TEST_ONLY superseding decision",
        evidenceRefs: [review.evidenceRefs[0]],
        decidedAt: "2026-09-23T12:05:00Z",
        supersedesDecisionId: "test-first",
      },
    });

    expect(state.decisions).toHaveLength(2);
    expect(JSON.stringify(state.decisions[0])).toBe(firstSnapshot);
    expect(state.auditEvents.map(item => item.eventType)).toEqual([
      "DECISION_RECORDED",
      "DECISION_SUPERSEDED",
    ]);
  });

  it("requires explicit supersession for an existing effective decision", () => {
    const full = buildDeterministicFullReviewSimulation();
    const review = full.queue.find(item => item.evidenceRefs.length > 0)!;
    const current = full.state.decisions.find(
      item => item.reviewId === review.reviewId
    )!;
    const reviewer = full.reviewers.find(
      item => item.reviewerId === current.reviewerId
    )!;
    const errors = validateTestDecisionAttempt({
      queue: full.queue,
      reviewers: full.reviewers,
      state: full.state,
      attempt: {
        decisionId: "test-overwrite-without-supersession",
        reviewId: review.reviewId,
        reviewerId: reviewer.reviewerId,
        disposition: "DEFER",
        rationale: "TEST_ONLY",
        evidenceRefs: [review.evidenceRefs[0]],
        decidedAt: "2026-09-23T13:00:00Z",
      },
    });
    expect(errors).toContain(
      "existing_effective_decision_requires_supersession"
    );
  });

  it("audits rejected decision attempts without creating an effective decision", () => {
    const queue = buildMegaGSpecialistQueue();
    const review = queue.find(
      item => item.role === "LEGAL_STATUS_REVIEWER" && item.territory === "GAZA"
    )!;
    const reviewers = buildDefaultTestReviewerFixtures();
    const wrong = reviewers.find(
      item => item.reviewerId === "TEST_REVIEWER_LEGAL_WB_001"
    )!;
    const state = recordTestDecision({
      state: { decisions: [], auditEvents: [] },
      reviewers,
      queue,
      attempt: {
        decisionId: "test-denied-territory",
        reviewId: review.reviewId,
        reviewerId: wrong.reviewerId,
        disposition: "DEFER",
        rationale: "TEST_ONLY",
        evidenceRefs: review.evidenceRefs.slice(0, 1),
        decidedAt: "2026-09-23T12:00:00Z",
      },
    });
    expect(state.decisions).toHaveLength(0);
    expect(state.auditEvents).toHaveLength(1);
    expect(state.auditEvents[0].effective).toBe(false);
    expect(state.auditEvents[0].reasons).toContain(
      "reviewer_territory_scope_mismatch"
    );
  });

  it("simulates all 47 specialist queue items without satisfying GATE-13", () => {
    const full = buildDeterministicFullReviewSimulation();
    const gate = buildNonAuthoritativeGateSimulation({
      queue: full.queue,
      state: full.state,
    });
    expect(full.queue).toHaveLength(47);
    expect(full.state.decisions).toHaveLength(47);
    expect(full.state.auditEvents).toHaveLength(47);
    expect(gate).toMatchObject({
      totalQueueItems: 47,
      effectiveTestDecisions: 47,
      blockingQueueItems: 43,
      blockingItemsTestCovered: 43,
      simulatedWorkflowCoverageComplete: true,
      gate13Satisfied: false,
      authoritativeHumanDecisions: 0,
      productionEffect: "NONE",
    });
  });

  it("uses DEFER rather than invented evidence for every empty legacy pack", () => {
    const full = buildDeterministicFullReviewSimulation();
    const empty = full.queue.filter(item => item.evidenceRefs.length === 0);
    expect(empty.length).toBeGreaterThan(0);
    for (const review of empty) {
      const decision = full.state.decisions.find(
        item => item.reviewId === review.reviewId
      )!;
      expect(decision.disposition).toBe("DEFER");
      expect(decision.evidenceRefs).toEqual([]);
    }
  });

  it("exercises ACCEPT, DEFER and REJECT as test-only outcomes", () => {
    const full = buildDeterministicFullReviewSimulation();
    const outcomes = new Set(
      full.state.decisions.map(item => item.disposition)
    );
    expect(outcomes).toEqual(new Set(["ACCEPT", "DEFER", "REJECT"]));
    expect(
      full.state.decisions.every(
        item =>
          item.testDecision &&
          item.authoritativeHumanDecision === false &&
          item.productionEffect === "NONE"
      )
    ).toBe(true);
  });

  it("preserves the MEGA_G queue census for review simulation", () => {
    expect(buildReviewQueueSimulationSummary()).toMatchObject({
      total: 47,
      p0: 36,
      blocking: 43,
    });
  });
});
