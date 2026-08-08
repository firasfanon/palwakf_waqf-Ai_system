import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const required=[
 'server/knowledgeOperations.ts',
 'server/routers.ts',
 'client/src/pages/admin/LegacyProvenanceResolutionCenter.tsx',
 'client/src/config/adminRegistryV2.ts',
 'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution_v1_1/00_PREAPPLY_V1_1_NESTED_EVIDENCE_READ_ONLY.sql',
 'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution_v1_1/01_PROVENANCE_LEDGER_V1_1_SCHEMA_OPERATOR_APPLY.sql',
 'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution_v1_1/02_RUN_PROVENANCE_RECONSTRUCTION_V1_1_OPERATOR_APPLY.sql',
 'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution_v1_1/03_POST_APPLY_V1_1_READ_ONLY_VERIFICATION.sql',
 'docs/ai/knowledge_activation/LEGACY_PROVENANCE_RECONSTRUCTION_AND_OFFICIAL_SOURCE_AUTHORITY_RESOLUTION_V1_1_AR.md',
 'package.json',
];
let failed=false;
function check(label,ok){console.log(`${ok?'PASS':'FAIL'} :: ${label}`);if(!ok)failed=true;}
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
for(const rel of required)check(`artifact ${rel}`,fs.existsSync(path.join(root,rel)));
if(!failed){
 const ops=read('server/knowledgeOperations.ts'); const router=read('server/routers.ts'); const ui=read('client/src/pages/admin/LegacyProvenanceResolutionCenter.tsx'); const registry=read('client/src/config/adminRegistryV2.ts');
 const sql=read('sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution_v1_1/01_PROVENANCE_LEDGER_V1_1_SCHEMA_OPERATOR_APPLY.sql').toLowerCase();
 const pre=read('sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution_v1_1/00_PREAPPLY_V1_1_NESTED_EVIDENCE_READ_ONLY.sql').toLowerCase();
 const post=read('sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution_v1_1/03_POST_APPLY_V1_1_READ_ONLY_VERIFICATION.sql').toLowerCase();
 const pkg=JSON.parse(read('package.json'));
 check('V1.1 runtime reconstruction operation',ops.includes('runtimeRunLegacyProvenanceReconstructionV11')&&ops.includes('rpc_refresh_legacy_provenance_reconstruction_v1_1'));
 check('V1.1 router delegates all provenance operations',router.includes('runtimeRunLegacyProvenanceReconstructionV11')&&router.includes('runtimeGetLegacyProvenanceSnapshotV11')&&router.includes('runtimeRecordLegacyProvenanceDecisionV11'));
 check('legacy provenance route retained',registry.includes('/admin/legacy-provenance'));
 check('operator UI distinguishes lineage from authority',ui.includes('الربط الحتمي لا يساوي تحققًا من المصدر أو اعتمادًا للنشر'));
 check('operator UI rejects import container authority',ui.includes('وعاء الاستيراد لا يتحول إلى مصدر رسمي'));
 check('schema reads nested legacy row',sql.includes("payload_json->'row'")||sql.includes("payload_json -> 'row'"));
 check('schema reads retained reference file evidence',sql.includes('assistant.reference_files')&&sql.includes('extracted_text'));
 check('schema excludes test artifact host',sql.includes('example\\.com')||sql.includes('example.com'));
 check('schema records deterministic methods',sql.includes('exact_legacy_key')&&sql.includes('exact_content_fingerprint')&&sql.includes('exact_title_and_url'));
 check('schema creates V1.1 ledger',sql.includes('knowledge_provenance_reconstruction_runs_v1_1')&&sql.includes('knowledge_provenance_reconstruction_items_v1_1'));
 check('schema does not auto-update canonical sources',!sql.includes('update assistant.knowledge_sources'));
 check('schema does not auto-update references',!sql.includes('update assistant.reference_documents'));
 check('schema does not auto-update knowledge documents',!sql.includes('update assistant.knowledge_documents'));
 check('schema does not auto-update citations',!sql.includes('update assistant.knowledge_citations'));
 check('preflight is read only',pre.includes('begin transaction read only')&&pre.includes('rollback'));
 check('post-apply is read only',post.includes('begin transaction read only')&&post.includes('rollback'));
 check('package registers V1.1 verifier',pkg.scripts?.['verify:mega-batch-assistant-legacy-provenance-reconstruction-v1-1']==='node scripts/verify-mega-batch-assistant-legacy-provenance-reconstruction-v1-1.mjs');
}
console.log(`MEGA_BATCH_ASSISTANT_LEGACY_PROVENANCE_RECONSTRUCTION_AND_OFFICIAL_SOURCE_AUTHORITY_RESOLUTION_V1_1_STATIC_VERIFICATION=${failed?'FAIL':'PASS'}`);
process.exit(failed?1:0);
