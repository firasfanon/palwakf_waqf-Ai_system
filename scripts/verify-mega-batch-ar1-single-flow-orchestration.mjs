import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL :: ${message}`);
  console.log(`PASS :: ${message}`);
};

const servicePath = 'server/governedAgenticRagPilot.ts';
const routerPath = 'server/routers.ts';
const pagePath = 'client/src/pages/admin/SourceProvenanceRightsRegistry.tsx';
const packagePath = 'package.json';
const contractPath = 'docs/ai/governed_agentic_rag/AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_V1_AR.md';
const statePath = 'docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_V1.md';
const uatPath = 'docs/ai/governed_agentic_rag/AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_UAT_AR.md';

for (const relative of [servicePath, routerPath, pagePath, packagePath, contractPath, statePath, uatPath]) {
  assert(exists(relative), `required artifact present :: ${relative}`);
}

const service = read(servicePath);
const router = read(routerPath);
const page = read(pagePath);
const pkg = JSON.parse(read(packagePath));
const contract = read(contractPath);
const state = read(statePath);
const uat = read(uatPath);

assert(service.includes("import { getAutonomousExternalSourceVerification } from './externalSourceVerification';"), 'AR1 single flow invokes the existing bounded C3 verifier in-process');
assert(service.includes('runGovernedAgenticRagPilotSingleFlowReadinessCycle') && service.includes("operator_triggered_single_flow_read_only_until_explicit_ephemeral_session"), 'service exposes an explicit read-only single-flow readiness cycle');
assert(service.includes("getAutonomousExternalSourceVerification({ maxUrls })") && service.includes('const catalog = await c4CandidateCatalog();'), 'single flow orders C3 before C4 deterministic eligibility in the same process');
assert(service.includes("'NO_SOURCE_OR_RIGHTS_WRITE'") && service.includes("'NO_DOCUMENT_CHUNK_EMBEDDING_OR_VECTOR_WRITE'"), 'single flow preserves no-write boundaries');
assert(!/runtime(Create|Update|Delete|Review)[A-Z]/.test(service) && !/insert\s*\(/.test(service), 'AR1 single-flow resolver contains no database create/update/delete/review/insert path');
assert(router.includes('runSingleFlowReadinessCycle: adminProcedure') && router.includes('runGovernedAgenticRagPilotSingleFlowReadinessCycle'), 'router exposes a protected operator-triggered single-flow mutation');
assert(page.includes('بدء دورة التحقق') && page.includes('لا تحتاج إلى فتح C3 أو C4'), 'operator UI presents one start action without manual C3/C4 navigation');
assert(page.includes('selectedPilotBindings.length === 1') && page.includes('اختر مادة واحدة أولًا'), 'operator UI enforces one selected candidate before showing session approval controls');
assert(!page.includes('openRequiredEvidenceStep') && !page.includes('pilotWorkflowSteps'), 'legacy five-step manual navigation is removed from the primary AR1 surface');
assert(pkg.scripts?.['verify:mega-batch-ar1-single-flow-orchestration'] === 'node scripts/verify-mega-batch-ar1-single-flow-orchestration.mjs', 'package registers the single-flow verifier');
assert(contract.includes('NO_SQL') && contract.includes('NO_DATABASE_WRITE') && contract.includes('NO_PUBLIC_CHAT_RELEASE'), 'batch contract preserves sovereign boundaries');
assert(state.includes('PREAPPLY_CANDIDATE') && state.includes('PRODUCTION_NOT_APPROVED=YES'), 'state remains preapply and production-blocked');
assert(uat.includes('لا تفتح C3 أو C4 يدويًا') && uat.includes('ONE_BUTTON_C3_TO_C4_FLOW=PASS'), 'UAT governs the one-button operator flow');
console.log('MEGA_BATCH_AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_V1_STATIC_VERIFICATION=PASS');
