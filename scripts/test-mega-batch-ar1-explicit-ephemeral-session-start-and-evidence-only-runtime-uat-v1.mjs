import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';

const root = process.cwd();
const source = fs.readFileSync(path.join(root, 'server/governedAgenticRagPilot.ts'), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
  },
  fileName: 'governedAgenticRagPilot.ts',
}).outputText;

const documentId = 'c3ebc0f4-fc16-4e49-bb25-4f87b9d63f88';
const clusterKey = 'url:https://www.palestinecabinet.gov.ps/portal/OrgStructure/Details/20';
const document = {
  id: documentId,
  title: 'مهام وزارة الأوقاف والشؤون الدينية الفلسطينية',
  content: 'تشمل مهام الوزارة الإشراف على شؤون الأوقاف وإدارة العقارات الوقفية ورعاية المساجد ضمن الاختصاصات المؤسسية.',
  category: 'administrative',
  source: null,
  sourceUrl: null,
};

let llmCalls = 0;
const actualRequire = createRequire(import.meta.url);
const customRequire = (id) => {
  if (id === 'node:crypto') return actualRequire(id);
  if (id === './_core/llm') return { invokeLLM: async () => { llmCalls += 1; throw new Error('LLM_MUST_NOT_BE_CALLED'); } };
  if (id === './runtimeRepository') return {
    runtimeGetKnowledgeDocumentByExactUuid: async (idValue) => String(idValue) === documentId ? document : null,
    runtimeGetKnowledgeDocumentById: async (idValue) => String(idValue) === documentId ? document : null,
    runtimeGetKnowledgeDocuments: async () => [document],
  };
  if (id === './verifiedSourceSelection') return {
    getVerifiedSourceSelectionAndControlledReleasePlan: async () => ({
      c3Evidence: { status: 'available', expiresAt: new Date(Date.now() + 20 * 60_000).toISOString() },
      selectedControlledMetadataPilot: [{
        clusterKey,
        title: document.title,
        checkedAt: new Date().toISOString(),
        disposition: 'CONTROLLED_METADATA_PILOT_CANDIDATE',
        dispositionLabel: 'مرشح خطة إطلاق بيانات وصفية محكومة فقط',
        candidateMaterials: [{ id: documentId, title: document.title, materialKind: 'knowledge_document' }],
      }],
    }),
  };
  if (id === './externalSourceVerification') return {
    getAutonomousExternalSourceVerification: async () => ({ summary: { requestedChecks: 1, c2ExternalCandidates: 1 } }),
  };
  throw new Error(`UNEXPECTED_REQUIRE:${id}`);
};

const module = { exports: {} };
const context = {
  module,
  exports: module.exports,
  require: customRequire,
  process: { env: {} },
  console,
  URL,
  Date,
  Map,
  Set,
  String,
  Number,
  Boolean,
  Array,
  Object,
  Math,
  JSON,
  RegExp,
  Error,
  Promise,
  Intl,
  TextEncoder,
  TextDecoder,
  setTimeout,
  clearTimeout,
};
vm.runInNewContext(output, context, { filename: 'governedAgenticRagPilot.cjs' });
const api = module.exports;

const operatorId = 'uat-operator';

const prep = await api.prepareGovernedAgenticRagPilotSessionAuthority({
  operatorId,
  binding: {
    clusterKey,
    documentId,
    evidenceTier: 'T3_CONTROLLED_INTERNAL_EVIDENCE',
    internalUseApprovalRef: 'UAT-INTERNAL-APPROVAL-001',
  },
  rightsApprovalRef: 'UAT-EVIDENCE-ONLY-SCOPE-001',
  reviewRationale: 'اختبار وظيفي معزول للتحضير وبدء جلسة Evidence-only دون كتابة أو نموذج.',
  reviewDecision: 'APPROVE_EPHEMERAL_INTERNAL_SESSION_PREP',
  acknowledgeInternalOnly: true,
  acknowledgeNoRightsGrant: true,
  acknowledgeModelBoundary: true,
});

if (prep.status !== 'prepared' || prep.sessionStarted !== false) throw new Error('PREPARE_CONTRACT_FAILED');

context.process.env.AR1_INTERNAL_PILOT_LLM_ENABLED = '1';
let blockedWhenLlmEnabled = false;
try {
  await api.startGovernedAgenticRagPilotSession({
    operatorId,
    authorityPreparationId: prep.id,
    sessionStartDecision: 'AUTHORIZE_ONE_EPHEMERAL_EVIDENCE_ONLY_UAT_SESSION',
    uatReference: 'UAT-START-001',
    acknowledgeEvidenceOnly: true,
    acknowledgeOneQuestionLimit: true,
    acknowledgeRollbackRequired: true,
  });
} catch (error) {
  blockedWhenLlmEnabled = String(error?.message || error).includes('AR1_EVIDENCE_ONLY_RUNTIME_UAT_REQUIRES_LLM_DISABLED');
}
if (!blockedWhenLlmEnabled) throw new Error('LLM_ENABLED_NEGATIVE_GATE_FAILED');

context.process.env.AR1_INTERNAL_PILOT_LLM_ENABLED = '0';
const session = await api.startGovernedAgenticRagPilotSession({
  operatorId,
  authorityPreparationId: prep.id,
  sessionStartDecision: 'AUTHORIZE_ONE_EPHEMERAL_EVIDENCE_ONLY_UAT_SESSION',
  uatReference: 'UAT-START-001',
  acknowledgeEvidenceOnly: true,
  acknowledgeOneQuestionLimit: true,
  acknowledgeRollbackRequired: true,
});

if (session.sessionStarted !== true) throw new Error('SESSION_NOT_STARTED');
if (session.executionMode !== 'evidence_only_runtime_uat') throw new Error('WRONG_EXECUTION_MODE');
if (session.maxQuestions !== 1 || session.questionsExecuted !== 0) throw new Error('QUESTION_LIMIT_CONTRACT_FAILED');
if (session.llmGenerationEnabled !== false) throw new Error('LLM_BOUNDARY_FAILED');

const result = await api.runGovernedAgenticRagPilotQuestion({
  operatorId,
  sessionId: session.id,
  question: 'ما مهام الوزارة المتعلقة بالأوقاف والعقارات الوقفية؟',
});

if (result.executionMode !== 'evidence_only_runtime_uat') throw new Error('RESULT_MODE_FAILED');
if (result.questionCount !== 1 || result.maxQuestions !== 1) throw new Error('RESULT_QUESTION_COUNT_FAILED');
if (result.llmGenerationUsed !== false || llmCalls !== 0) throw new Error('LLM_WAS_USED');
if (result.nextAction !== 'ROLLBACK_SESSION') throw new Error('ROLLBACK_NEXT_ACTION_FAILED');

let secondQuestionBlocked = false;
try {
  await api.runGovernedAgenticRagPilotQuestion({
    operatorId,
    sessionId: session.id,
    question: 'سؤال ثان يجب حجبه',
  });
} catch (error) {
  secondQuestionBlocked = String(error?.message || error).includes('AR1_EVIDENCE_ONLY_UAT_ONE_QUESTION_LIMIT_REACHED');
}
if (!secondQuestionBlocked) throw new Error('SECOND_QUESTION_GATE_FAILED');

const rollback = api.rollbackGovernedAgenticRagPilotSession(session.id, operatorId);
if (rollback.rollbackApplied !== true || rollback.activeSessions !== 0 || rollback.sessionStarted !== false) {
  throw new Error('ROLLBACK_CONTRACT_FAILED');
}

const status = await api.getGovernedAgenticRagPilotStatus();
if (status.activeSessions !== 0) throw new Error('ACTIVE_SESSION_LEAK');
if (status.llmGenerationEnabled !== false) throw new Error('STATUS_LLM_BOUNDARY_FAILED');

console.log('PREPARE=PASS');
console.log('LLM_ENABLED_NEGATIVE_GATE=PASS');
console.log('EXPLICIT_SESSION_START=PASS');
console.log('EVIDENCE_ONLY_QUESTION=PASS');
console.log('ONE_QUESTION_LIMIT=PASS');
console.log('ROLLBACK=PASS');
console.log('ACTIVE_SESSIONS_AFTER_ROLLBACK=0');
console.log('LLM_CALLS=0');
console.log('FUNCTIONAL_ISOLATED_TEST=PASS');
