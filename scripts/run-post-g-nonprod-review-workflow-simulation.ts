import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { buildMegaGSpecialistQueue } from "../server/expertReviewMegaG";
import {
  buildDefaultTestReviewerFixtures,
  buildDeterministicFullReviewSimulation,
  buildNonAuthoritativeGateSimulation,
  buildReviewQueueSimulationSummary,
  evaluateTestReviewAccess,
  fixtureRegistrySeparationGuard,
  selectFixtureForReview,
  type TestReviewerFixture,
} from "../server/nonProductionReviewSimulation";

const queue = buildMegaGSpecialistQueue();
const reviewers = buildDefaultTestReviewerFixtures();
const simulation = buildDeterministicFullReviewSimulation();
const gate = buildNonAuthoritativeGateSimulation({
  queue: simulation.queue,
  state: simulation.state,
});
const queueSummary = buildReviewQueueSimulationSummary();
const separation = fixtureRegistrySeparationGuard(reviewers);

const gazaReview = queue.find(
  item => item.role === "LEGAL_STATUS_REVIEWER" && item.territory === "GAZA"
)!;
const westBankReviewer = reviewers.find(
  item => item.reviewerId === "TEST_REVIEWER_LEGAL_WB_001"
)!;
const rightsReview = queue.find(item => item.role === "RIGHTS_REVIEWER")!;
const rightsReviewer = selectFixtureForReview(rightsReview, reviewers)!;
const fiqhReview = queue.find(item => item.role === "FIQH_SHARIA_REVIEWER")!;
const wrongRoleReviewer = reviewers.find(
  item => item.role === "RIGHTS_REVIEWER"
)!;

const recusedReviewer: TestReviewerFixture = {
  ...rightsReviewer,
  recusedReviewIds: [rightsReview.reviewId],
};
const proposerReviewer: TestReviewerFixture = {
  ...rightsReviewer,
  proposedReviewIds: [rightsReview.reviewId],
};
const corruptedReviewer = {
  ...rightsReviewer,
  productionAuthority: true,
} as unknown as TestReviewerFixture;

const negativeUat = {
  wrongTerritoryDenied:
    evaluateTestReviewAccess({
      reviewer: westBankReviewer,
      review: gazaReview,
      action: "DECIDE",
    }).allowed === false,
  wrongRoleDenied:
    evaluateTestReviewAccess({
      reviewer: wrongRoleReviewer,
      review: fiqhReview,
      action: "DECIDE",
    }).allowed === false,
  recusalDenied:
    evaluateTestReviewAccess({
      reviewer: recusedReviewer,
      review: rightsReview,
      action: "DECIDE",
    }).allowed === false,
  selfApprovalDenied:
    evaluateTestReviewAccess({
      reviewer: proposerReviewer,
      review: rightsReview,
      action: "DECIDE",
    }).allowed === false,
  corruptedAuthorityFixtureDenied:
    evaluateTestReviewAccess({
      reviewer: corruptedReviewer,
      review: rightsReview,
      action: "VIEW",
    }).allowed === false,
};

const dispositions = simulation.state.decisions.reduce<Record<string, number>>(
  (acc, decision) => {
    acc[decision.disposition] = (acc[decision.disposition] || 0) + 1;
    return acc;
  },
  {}
);
const emptyEvidenceReviews = queue.filter(
  item => item.evidenceRefs.length === 0
);
const emptyEvidenceSafeDefers = emptyEvidenceReviews.every(review => {
  const decision = simulation.state.decisions.find(
    item => item.reviewId === review.reviewId
  );
  return (
    decision?.disposition === "DEFER" && decision.evidenceRefs.length === 0
  );
});

const report = {
  generatedAt: "2026-09-23",
  program: "POST-G-DEV-001",
  scope: "NON_PRODUCTION_REVIEW_WORKFLOW_PREPRODUCTION_SIMULATION",
  authorization: {
    baseHead: "c473b17a331fce935c3e28b4993403d87a04dd65",
    baseTree: "d976136d63e8ef884522b059defd7c3e778b5261",
    branch: "task/WAQF-AI-POST-G-NONPROD-REVIEW-WORKFLOW-SIMULATION-V1",
    realSpecialistDecisions: false,
    productionUserAccounts: false,
    productionRoleGrants: false,
    liveSharedSupabaseMutation: false,
    mainMerge: false,
    baselinePromotion: false,
    production: false,
    publicCorpusRelease: false,
  },
  fixtureBoundary: separation,
  queue: queueSummary,
  simulation: {
    decisions: simulation.state.decisions.length,
    auditEvents: simulation.state.auditEvents.length,
    dispositions,
    emptyEvidenceReviewCount: emptyEvidenceReviews.length,
    emptyEvidenceSafeDefers,
    ...gate,
  },
  negativeUat,
  pass:
    separation.allFixturesStrictlyNonAuthoritative &&
    gate.simulatedWorkflowCoverageComplete &&
    gate.gate13Satisfied === false &&
    gate.authoritativeHumanDecisions === 0 &&
    gate.productionEffect === "NONE" &&
    emptyEvidenceSafeDefers &&
    Object.values(negativeUat).every(Boolean),
};

const evidencePath = resolve(
  "evidence",
  "WAQF_AI_POST_G_DEV_001_NONPROD_REVIEW_SIMULATION_20260923.json"
);
mkdirSync(dirname(evidencePath), { recursive: true });
writeFileSync(evidencePath, JSON.stringify(report, null, 2) + "\n", "utf8");

const docPath = resolve(
  "docs",
  "WAQF_AI_POST_G_DEV_001_IMPLEMENTATION_EVIDENCE_20260923.md"
);
mkdirSync(dirname(docPath), { recursive: true });
const markdown = [
  "# WAQF_AI POST-G-DEV-001 Implementation Evidence",
  "",
  "## Scope",
  "",
  "Non-production review workflow and preproduction simulation using test-only, non-authoritative reviewer fixtures.",
  "",
  "## Governing boundary",
  "",
  "- Real specialist binding/signoff remains deferred to preproduction acceptance.",
  "- Test fixtures cannot satisfy GATE-13.",
  "- Test fixtures cannot enter REVIEWER_AUTHORITY or real HUMAN_SIGNOFF.",
  "- Production effect is NONE.",
  "",
  "## Pilot result",
  "",
  "- Queue items: " + queueSummary.total,
  "- P0 items: " + queueSummary.p0,
  "- Blocking items: " + queueSummary.blocking,
  "- Effective test decisions: " + gate.effectiveTestDecisions,
  "- Blocking items test-covered: " + gate.blockingItemsTestCovered,
  "- Synthetic decision outcomes: " + JSON.stringify(dispositions),
  "- Empty evidence packs safely deferred without invented refs: " +
    emptyEvidenceSafeDefers,
  "- Gate-13 satisfied by fixtures: " + gate.gate13Satisfied,
  "- Authoritative human decisions: " + gate.authoritativeHumanDecisions,
  "- Production effect: " + gate.productionEffect,
  "",
  "## Negative / failure-mode UAT",
  "",
  ...Object.entries(negativeUat).map(
    ([name, passed]) => "- " + name + ": " + (passed ? "PASS" : "FAIL")
  ),
  "",
  "## Disposition",
  "",
  report.pass
    ? "PASS_NON_PRODUCTION_REVIEW_WORKFLOW_SIMULATION_WITH_ZERO_AUTHORITATIVE_OR_PRODUCTION_EFFECT"
    : "FAIL_NON_PRODUCTION_REVIEW_WORKFLOW_SIMULATION",
  "",
].join("\n");
writeFileSync(docPath, markdown, "utf8");

console.log(JSON.stringify(report, null, 2));
if (!report.pass) process.exit(1);
