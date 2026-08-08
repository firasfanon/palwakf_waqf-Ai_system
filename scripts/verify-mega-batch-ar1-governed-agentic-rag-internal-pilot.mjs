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
const executionContract = 'docs/ai/governed_agentic_rag/AR1_GOVERNED_AGENTIC_RAG_INTERNAL_PILOT_VERTICAL_SLICE_AR.md';
const uatContract = 'docs/ai/governed_agentic_rag/AR1_INTERNAL_PILOT_UAT_AND_ROLLBACK_AR.md';
const corpusResolutionContract = 'docs/ai/governed_agentic_rag/AR1_CORPUS_RESOLUTION_AND_INTERNAL_PILOT_ACTIVATION_AR.md';
const corpusResolutionState = 'docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_CORPUS_RESOLUTION_AND_INTERNAL_PILOT_ACTIVATION.md';

for (const relative of [servicePath, routerPath, pagePath, packagePath, executionContract, uatContract, corpusResolutionContract, corpusResolutionState]) {
  assert(exists(relative), `AR1 required artifact present :: ${relative}`);
}

const service = read(servicePath);
const router = read(routerPath);
const page = read(pagePath);
const pkg = JSON.parse(read(packagePath));
const execution = read(executionContract);
const uat = read(uatContract);
const corpusResolution = read(corpusResolutionContract);
const corpusResolutionStateText = read(corpusResolutionState);

assert(service.includes('MAX_BINDINGS = 5'), 'AR1 limits each controlled corpus session to five bindings');
assert(service.includes("'T3_CONTROLLED_INTERNAL_EVIDENCE'") && service.includes("'T4_VERIFIED_CITATION_EVIDENCE'"), 'AR1 requires T3 or T4 session-scoped evidence tiers');
assert(service.includes('C3_C4_FRESH_EVIDENCE_REQUIRED_HOLD'), 'AR1 holds when fresh C3/C4 evidence is unavailable');
assert(service.includes('AR1_BINDING_NOT_IN_CURRENT_C4_SELECTED_COHORT'), 'AR1 binds only material currently associated with the selected C4 cohort');
assert(service.includes('AR1_INTERNAL_PILOT_LLM_ENABLED'), 'AR1 defaults to evidence-only output unless internal model generation is explicitly enabled');
assert(service.includes('NO_EXTERNAL_WEB_AGENT') && !/\bfetch\s*\(/.test(service), 'AR1 contains no external web-agent fetch path');
assert(!/from\s+['"]\.\/db['"]/.test(service), 'AR1 service does not import direct database write helpers');
assert(!/runtime(Create|Update|Delete|Review)[A-Z]/.test(service), 'AR1 service contains no runtime create/update/delete/review write helper');
assert(!/generateEmbeddings|hybridSearch|storagePut|insert\s*\(/.test(service), 'AR1 contains no embedding, vector, storage, or insert path');
assert(service.includes('sessions.delete(sessionId)') && service.includes('session_rolled_back'), 'AR1 supports in-memory rollback without database rollback');
assert(service.includes('hasUnsafeLegalConclusion') && service.includes('HUMAN_REVIEW_RECOMMENDED'), 'AR1 enforces legal-conclusion escalation and human review');
assert(service.includes('citationId') && service.includes('INSUFFICIENT_EVIDENCE'), 'AR1 returns traceable citations or abstains on insufficient evidence');
assert(service.includes("'escalated'") && service.includes("action === 'escalate' ? 'escalated' : 'answer_returned'"), 'AR1 records escalation as a distinct audit event without an unreachable abstention comparison');
assert(service.includes('runtimeGetKnowledgeDocuments') && service.includes('C4_DIRECT_MATERIAL_REFERENCE'), 'AR1 can resolve current existing knowledge documents from the selected C4 cohort');
assert(service.includes('DETERMINISTIC_TITLE_EXACT') && service.includes('DETERMINISTIC_URL_EXACT'), 'AR1 corpus resolution is restricted to exact title or exact URL evidence');
assert(service.includes('NO_FUZZY_OR_SEMANTIC_MATCHING') && !/hybridSearch|similaritySearch|cosineSimilarity|generateEmbeddings|vectorSearch/.test(service), 'AR1 blocks fuzzy, semantic, and vector-based corpus linking');
assert(service.includes('operatorConfirmationRequired: true') && service.includes('resolutionMethods'), 'AR1 preserves operator confirmation and resolution trace in the in-memory session');

assert(router.includes('from "./governedAgenticRagPilot"'), 'router imports the AR1 governed pilot service');
assert(router.includes('const governedAgenticRagPilotRouter = router({'), 'router defines the AR1 controlled pilot namespace');
assert(router.includes('startSession: adminProcedure') && router.includes('ask: adminProcedure') && router.includes('rollbackSession: adminProcedure'), 'AR1 session start, question, and rollback require admin procedure');
assert(router.includes('agenticRagPilot: governedAgenticRagPilotRouter'), 'AR1 router is exposed only through the governed admin namespace');

assert(page.includes('trpc.agenticRagPilot.startSession.useMutation()') || page.includes('trpc.agenticRagPilot.startSession.useMutation({'), 'admin page exposes explicit operator session creation');
assert(page.includes('إلغاء الجلسة ومسح الذاكرة'), 'admin page exposes the AR1 rollback control');
assert(page.includes('لا تُكتب نتائج الجلسة في قاعدة البيانات'), 'admin page states the no-persistent-write boundary');
assert(page.includes('AR1 — Pilot Agentic RAG داخلي محكوم'), 'admin page renders the internal-only AR1 surface');
assert(page.includes('حل corpus:') && page.includes('مطابقة حتمية حالية'), 'admin page discloses deterministic corpus resolution and its non-persistent boundary');

assert(pkg.scripts?.['verify:mega-batch-ar1-governed-agentic-rag-internal-pilot'] === 'node scripts/verify-mega-batch-ar1-governed-agentic-rag-internal-pilot.mjs', 'AR1 verifier is registered in package scripts');
assert(execution.includes('AR1B_STANDALONE=SUPERSEDED_BY_AR1_INTEGRATED_VERTICAL_SLICE'), 'AR1 documents the supersession of standalone AR1B without relaxing its controls');
assert(execution.includes('NO_PUBLIC_CHAT_RELEASE') && execution.includes('NO_PRODUCTION'), 'AR1 execution contract keeps public release and production out of scope');
assert(uat.includes('Negative UAT') && uat.includes('Rollback'), 'AR1 documentation includes negative UAT and rollback evidence');
assert(corpusResolution.includes('DETERMINISTIC_TITLE_EXACT') && corpusResolution.includes('NO_FUZZY_OR_SEMANTIC_CORPUS_LINKING'), 'AR1 corpus-resolution contract preserves exact-match-only and no-release controls');
assert(corpusResolutionStateText.includes('PREAPPLY_CANDIDATE'), 'AR1 corpus-resolution state document is present');

console.log('MEGA_BATCH_AR1_GOVERNED_AGENTIC_RAG_INTERNAL_PILOT_VERTICAL_SLICE_STATIC_VERIFICATION=PASS');
console.log('MEGA_BATCH_AR1_CORPUS_RESOLUTION_AND_INTERNAL_PILOT_ACTIVATION_STATIC_VERIFICATION=PASS');
