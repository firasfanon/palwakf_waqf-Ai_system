import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const checks = [];
const requireFile = (p) => checks.push([`artifact ${p}`, fs.existsSync(path.join(root,p))]);
const contains = (p, text) => {
  const file = path.join(root,p);
  checks.push([`${p} contains ${text}`, fs.existsSync(file) && fs.readFileSync(file,'utf8').includes(text)]);
};
[
  'server/assistantMaturityPolicy.ts','server/knowledgeOperations.ts','server/routers.ts',
  'client/src/pages/admin/KnowledgeActivationCenter.tsx','client/src/config/adminRegistryV2.ts',
  'sql_sandbox/mega_batch_assistant_knowledge_sovereign_audit_approval_productivity_activation/00_FULL_CORPUS_PREFLIGHT_READ_ONLY.sql',
  'sql_sandbox/mega_batch_assistant_knowledge_sovereign_audit_approval_productivity_activation/01_ACTIVATION_LEDGER_SCHEMA_OPERATOR_APPLY.sql',
  'docs/ai/knowledge_activation/OPERATOR_RUNBOOK_AR.md'
].forEach(requireFile);
contains('server/assistantMaturityPolicy.ts','MEGA_BATCH_ASSISTANT_KNOWLEDGE_SOVEREIGN_AUDIT_APPROVAL_AND_PRODUCTIVITY_ACTIVATION_V1');
contains('server/assistantMaturityPolicy.ts','official_knowledge_release');
contains('server/knowledgeOperations.ts','runtimeRunKnowledgeActivationAudit');
contains('server/knowledgeOperations.ts','rpc_refresh_knowledge_activation_audit_v1');
contains('server/routers.ts','knowledgeActivationRouter');
contains('server/routers.ts','runFullAudit');
contains('client/src/pages/admin/KnowledgeActivationCenter.tsx','بدء تدقيق شامل للمعرفة الموجودة');
contains('client/src/config/adminRegistryV2.ts','/admin/knowledge-activation');
contains('sql_sandbox/mega_batch_assistant_knowledge_sovereign_audit_approval_productivity_activation/01_ACTIVATION_LEDGER_SCHEMA_OPERATOR_APPLY.sql','assistant.knowledge_activation_runs');
contains('sql_sandbox/mega_batch_assistant_knowledge_sovereign_audit_approval_productivity_activation/01_ACTIVATION_LEDGER_SCHEMA_OPERATOR_APPLY.sql','rpc_refresh_knowledge_activation_audit_v1');
let failed=0; for (const [name,ok] of checks) { console.log(`${ok?'PASS':'FAIL'} :: ${name}`); if(!ok) failed++; }
console.log(`MEGA_BATCH_ASSISTANT_KNOWLEDGE_SOVEREIGN_AUDIT_APPROVAL_AND_PRODUCTIVITY_ACTIVATION_V1_STATIC_VERIFICATION=${failed?'FAIL':'PASS'}`);
process.exitCode=failed?1:0;
