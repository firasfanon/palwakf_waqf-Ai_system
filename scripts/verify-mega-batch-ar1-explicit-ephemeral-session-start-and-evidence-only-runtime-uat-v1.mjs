import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const service = read('server/governedAgenticRagPilot.ts');
const routers = read('server/routers.ts');
const ui = read('client/src/pages/admin/SourceProvenanceRightsRegistry.tsx');
const pkg = JSON.parse(read('package.json'));
const guide = read('PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md');
const state = read('STATE.md');
const currentTask = read('CURRENT_TASK.md');

const checks = [];
const check = (ok, label) => {
  if (!ok) {
    console.error(`FAIL :: ${label}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS :: ${label}`);
  }
};

for (const [text, label] of [
  ['EVIDENCE_ONLY_UAT_MAX_QUESTIONS = 1', 'one-question constant'],
  ["executionMode: 'evidence_only_runtime_uat'", 'session starts in evidence-only mode'],
  ["AR1_EVIDENCE_ONLY_RUNTIME_UAT_REQUIRES_LLM_DISABLED", 'start blocks enabled LLM'],
  ["AR1_EVIDENCE_ONLY_UAT_ONE_QUESTION_LIMIT_REACHED", 'second question blocked'],
  ["EXPLICIT_EVIDENCE_ONLY_RUNTIME_UAT", 'question result marks evidence-only UAT'],
  ["LLM_GENERATION_DISABLED_BY_SESSION_CONTRACT", 'session contract disables LLM'],
  ["nextAction: 'RUN_ONE_EVIDENCE_ONLY_QUESTION_THEN_ROLLBACK'", 'start directs one question then rollback'],
  ["nextAction: 'ROLLBACK_SESSION'", 'question directs rollback'],
  ["rollbackApplied: true", 'rollback contract retained'],
]) check(service.includes(text), label);

for (const [text, label] of [
  ["sessionStartDecision: z.literal('AUTHORIZE_ONE_EPHEMERAL_EVIDENCE_ONLY_UAT_SESSION')", 'router requires explicit decision'],
  ["acknowledgeEvidenceOnly: z.literal(true)", 'router requires evidence-only acknowledgement'],
  ["acknowledgeOneQuestionLimit: z.literal(true)", 'router requires one-question acknowledgement'],
  ["acknowledgeRollbackRequired: z.literal(true)", 'router requires rollback acknowledgement'],
]) check(routers.includes(text), label);

for (const [text, label] of [
  ['بدء جلسة Evidence-only لمرة واحدة', 'UI enables explicit start'],
  ['pilotSessionStartReady', 'UI gates start'],
  ["sessionStartDecision: 'AUTHORIZE_ONE_EPHEMERAL_EVIDENCE_ONLY_UAT_SESSION'", 'UI submits explicit decision'],
  ['Evidence-only مثبت بعقد الجلسة', 'UI displays evidence-only contract'],
  ['Boolean(pilotResult)', 'UI blocks repeat question after result'],
]) check(ui.includes(text), label);

check(!ui.includes('بدء الجلسة محجوب حتى تفويض التنفيذ'), 'old mechanically blocked start removed');
check(pkg.scripts['verify:mega-batch-ar1-explicit-ephemeral-session-start-and-evidence-only-runtime-uat-v1'], 'verify script registered');
check(pkg.scripts['test:mega-batch-ar1-explicit-ephemeral-session-start-and-evidence-only-runtime-uat-v1'], 'functional test registered');

for (const marker of [
  'NO_DATABASE_WRITE',
  'NO_SOURCE_LINK_WRITE',
  'NO_RIGHTS_ASSIGNMENT',
  'NO_PUBLIC_CHAT_RELEASE',
  'NO_PRODUCTION',
]) {
  check(service.includes(marker), `service preserves ${marker}`);
}
check(guide.includes('AR1 Explicit Ephemeral Session Start and Evidence-only Runtime UAT V1'), 'guide records batch');
check(state.includes('RUNTIME_UAT=PENDING'), 'state does not overclaim runtime acceptance');
check(currentTask.includes('EVIDENCE_ONLY_SESSION_RUNTIME_UAT'), 'current task points to runtime UAT');

if (!process.exitCode) {
  console.log('MEGA_BATCH_AR1_EXPLICIT_EPHEMERAL_SESSION_START_AND_EVIDENCE_ONLY_RUNTIME_UAT_V1_STATIC_VERIFICATION=PASS');
  console.log('DATABASE_WRITE=NO');
  console.log('LLM_GENERATION=DISABLED_BY_SESSION_CONTRACT');
  console.log('RUNTIME_UAT=PENDING');
}
