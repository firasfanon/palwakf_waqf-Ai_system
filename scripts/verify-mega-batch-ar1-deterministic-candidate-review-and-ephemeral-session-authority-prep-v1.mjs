import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const batch = 'MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1';
const files = {
  service: 'server/governedAgenticRagPilot.ts',
  router: 'server/routers.ts',
  ui: 'client/src/pages/admin/SourceProvenanceRightsRegistry.tsx',
  package: 'package.json',
  guide: 'PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md',
  changelog: 'CHANGELOG.md',
  state: 'STATE.md',
  currentTask: 'CURRENT_TASK.md',
  design: 'docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_AR.md',
  batchState: 'docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1.md',
  uat: 'docs/ai/governed_agentic_rag/AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_UAT_AR.md',
  errorRecord: 'ERROR_RECORD_MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1_2026_07_12.md',
};

const text = {};
let failures = 0;
function pass(message) { console.log(`PASS :: ${message}`); }
function fail(message) { failures += 1; console.error(`FAIL :: ${message}`); }
function check(condition, message) { condition ? pass(message) : fail(message); }

for (const [key, rel] of Object.entries(files)) {
  const abs = path.join(root, rel);
  check(fs.existsSync(abs), `required artifact present :: ${rel}`);
  text[key] = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
}

const service = text.service;
const router = text.router;
const ui = text.ui;
const pkg = JSON.parse(text.package || '{}');
const prepBlock = service.split('export async function prepareGovernedAgenticRagPilotSessionAuthority')[1]?.split('export function getGovernedAgenticRagPilotAuthorityPreparation')[0] || '';
const startBlock = service.split('export async function startGovernedAgenticRagPilotSession')[1]?.split('function sessionSummary')[0] || '';
const prepareUiBlock = ui.split('const preparePilotSessionAuthority')[1]?.split('const revokePilotSessionAuthority')[0] || '';

check(service.includes('const AUTHORITY_PREPARATION_TTL_MS = 10 * 60 * 1_000;'), 'authority preparation TTL is bounded to ten minutes');
check(service.includes("status: 'prepared' | 'consumed' | 'revoked'"), 'authority preparation lifecycle is explicit');
check(service.includes('const authorityPreparations = new Map<string, AuthorityPreparation>();'), 'authority preparation uses process-memory storage only');
check(prepBlock.includes("reviewDecision: 'APPROVE_EPHEMERAL_INTERNAL_SESSION_PREP'"), 'review decision is explicit and narrow');
check(prepBlock.includes('acknowledgeInternalOnly') && prepBlock.includes('acknowledgeNoRightsGrant') && prepBlock.includes('acknowledgeModelBoundary'), 'all three operator acknowledgements are required');
check(prepBlock.includes("reviewRationale.length < 12"), 'candidate review rationale has a minimum threshold');
check(prepBlock.includes("catalog.status !== 'READY_FOR_OPERATOR_BINDING'"), 'preparation requires current C4 readiness');
check(prepBlock.includes("catalog.candidates.find"), 'preparation revalidates the exact current C4 candidate');
check(prepBlock.includes('Math.min(Date.now() + AUTHORITY_PREPARATION_TTL_MS, c3EvidenceExpiryMs)'), 'preparation expiry is bounded by current C3 expiry');
check(prepBlock.includes('operatorId') && service.includes('AR1_AUTHORITY_PREPARATION_OPERATOR_MISMATCH'), 'preparation is bound to the authenticated operator');
check(prepBlock.includes("'NO_SESSION_AUTO_START'"), 'preparation contract explicitly forbids automatic session start');
check(prepBlock.includes('activeSessions: sessions.size'), 'preparation reports but does not mutate active sessions');
check(!prepBlock.includes('sessions.set('), 'preparation never creates an AR1 session');
check(!prepBlock.includes('getDb(') && !prepBlock.includes('runtimeCreate') && !prepBlock.includes('.from(') && !prepBlock.includes('supabase'), 'preparation contains no database mutation call');
check(!prepBlock.includes('invokeLLM('), 'preparation contains no model invocation');
check(startBlock.includes('authorityPreparationId: string;'), 'session start requires an authority preparation id');
check(startBlock.includes('requirePreparedAuthority(authorityPreparationId, operatorId)'), 'session start consumes operator-bound prepared authority');
check(startBlock.includes('candidateStillCurrent'), 'session start revalidates candidate currency before consumption');
check(service.includes("sessionStartPolicy: 'SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED'"), 'status exposes the separate authorization policy');

check(router.includes('prepareSessionAuthority: adminProcedure'), 'admin-only preparation route is registered');
check(router.includes("reviewRationale: z.string().trim().min(12).max(1000)"), 'router enforces review rationale length');
check(router.includes("acknowledgeNoRightsGrant: z.literal(true)"), 'router enforces no-rights-grant acknowledgement');
check(router.includes('authorityPreparation: adminProcedure'), 'operator-bound preparation status route is registered');
check(router.includes('revokeAuthorityPreparation: adminProcedure'), 'preparation revocation route is registered');
check(router.includes("startSession: adminProcedure") && router.includes('authorityPreparationId: z.string().trim().min(8).max(160)'), 'start route accepts only prepared authority id');

check(ui.includes('trpc.agenticRagPilot.prepareSessionAuthority.useMutation'), 'UI exposes preparation action');
check(ui.includes('pilotNoRightsGrantAcknowledged'), 'UI captures no-rights-grant acknowledgement');
check(ui.includes('pilotReviewerNote.trim().length >= 12'), 'UI requires substantive review rationale');
check(ui.includes("reviewDecision: 'APPROVE_EPHEMERAL_INTERNAL_SESSION_PREP'"), 'UI submits the narrow review decision');
check(ui.includes('تم تحضير الصلاحية دون بدء الجلسة'), 'UI distinguishes preparation from session start');
check(ui.includes('بدء الجلسة محجوب حتى تفويض التنفيذ'), 'UI visibly blocks session start in this batch');
check(ui.includes('disabled={true}'), 'session start control is mechanically disabled');
check(!prepareUiBlock.includes('startPilotSession.mutate'), 'preparation success handler never starts a session');
check(ui.includes('revokeAuthorityPreparation.useMutation'), 'UI supports in-memory preparation revocation');

const scriptName = 'verify:mega-batch-ar1-deterministic-candidate-review-and-ephemeral-session-authority-prep-v1';
check(pkg.scripts?.[scriptName] === 'node scripts/verify-mega-batch-ar1-deterministic-candidate-review-and-ephemeral-session-authority-prep-v1.mjs', 'package registers the verifier');

for (const marker of [
  'NO_DATABASE_WRITE',
  'NO_SOURCE_LINK_WRITE',
  'NO_RIGHTS_ASSIGNMENT',
  'NO_SESSION_AUTO_START',
  'SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED',
]) {
  check(text.design.includes(marker), `design preserves boundary :: ${marker}`);
  check(text.batchState.includes(marker), `state preserves boundary :: ${marker}`);
}
check(text.uat.includes('activeSessions = 0') && text.uat.includes('sessionStarted = false'), 'UAT requires no session creation');
check(text.errorRecord.includes('السبب') && text.errorRecord.includes('ما فشل') && text.errorRecord.includes('الحل') && text.errorRecord.includes('آخر baseline مستقر'), 'Error Record includes required diagnostic fields');
check(text.guide.includes(batch), 'governing guide records the batch');
check(text.changelog.includes(batch), 'changelog records the batch');
check(text.state.includes('RUNTIME_UAT=PENDING'), 'global state does not overclaim runtime acceptance');
check(text.currentTask.includes('AUTHORITY_PREPARATION_RUNTIME_UAT'), 'current task points to preparation UAT');

if (failures) {
  console.error(`${batch}_STATIC_VERIFICATION=FAIL`);
  console.error(`FAILURE_COUNT=${failures}`);
  process.exit(1);
}
console.log(`${batch}_STATIC_VERIFICATION=PASS`);
console.log('SOURCE_OR_RIGHTS_WRITE=NO');
console.log('SESSION_AUTO_START=NO');
console.log('RUNTIME_UAT=PENDING');
