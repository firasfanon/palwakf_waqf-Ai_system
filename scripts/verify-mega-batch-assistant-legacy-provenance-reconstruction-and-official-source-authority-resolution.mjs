import fs from 'node:fs';
import path from 'node:path';
const root = process.cwd();
const required = [
  'server/knowledgeOperations.ts',
  'server/routers.ts',
  'client/src/pages/admin/LegacyProvenanceResolutionCenter.tsx',
  'client/src/config/adminRegistryV2.ts',
  'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution/00_PREAPPLY_LEGACY_PROVENANCE_READ_ONLY.sql',
  'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution/01_PROVENANCE_LEDGER_SCHEMA_OPERATOR_APPLY.sql',
  'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution/02_RUN_LEGACY_PROVENANCE_RECONSTRUCTION_OPERATOR_APPLY.sql',
  'sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution/03_POST_APPLY_READ_ONLY_VERIFICATION.sql',
  'docs/ai/knowledge_activation/LEGACY_PROVENANCE_RECONSTRUCTION_AND_OFFICIAL_SOURCE_AUTHORITY_RESOLUTION_V1_AR.md',
  'package.json',
];
let failed = false;
function check(label, ok) { console.log(`${ok ? 'PASS' : 'FAIL'} :: ${label}`); if (!ok) failed = true; }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
for (const rel of required) check(`artifact ${rel}`, fs.existsSync(path.join(root, rel)));
if (!failed) {
  const ops=read('server/knowledgeOperations.ts');
  const router=read('server/routers.ts');
  const ui=read('client/src/pages/admin/LegacyProvenanceResolutionCenter.tsx');
  const registry=read('client/src/config/adminRegistryV2.ts');
  const sql=read('sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution/01_PROVENANCE_LEDGER_SCHEMA_OPERATOR_APPLY.sql').toLowerCase();
  const pre=read('sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution/00_PREAPPLY_LEGACY_PROVENANCE_READ_ONLY.sql').toLowerCase();
  const post=read('sql_sandbox/mega_batch_assistant_legacy_provenance_reconstruction_and_official_source_authority_resolution/03_POST_APPLY_READ_ONLY_VERIFICATION.sql').toLowerCase();
  const pkg=JSON.parse(read('package.json'));
  check('runtime provenance reconstruction operation', ops.includes('runtimeRunLegacyProvenanceReconstruction'));
  check('runtime provenance decision operation', ops.includes('runtimeRecordLegacyProvenanceDecision'));
  check('runtime duplicate citation reconciliation operation', ops.includes('runtimeReconcileDuplicateCitationReviewTask'));
  check('protected legacy provenance router', router.includes('const legacyProvenanceRouter = router({') && router.includes('runReconstruction') && router.includes('recordDecision'));
  check('legacy provenance router registered', router.includes('legacyProvenance: legacyProvenanceRouter'));
  check('admin route registered', registry.includes('/admin/legacy-provenance'));
  check('operator UI rejects import container authority', ui.includes('لا يحول وعاء الاستيراد إلى مصدر رسمي'));
  check('schema creates provenance runs', sql.includes('knowledge_provenance_reconstruction_runs'));
  check('schema records explicit reviewer decisions', sql.includes('rpc_record_legacy_provenance_resolution_v1'));
  check('schema supports explicit duplicate citation reconciliation', sql.includes('rpc_reconcile_duplicate_citation_review_task_v1'));
  check('reconstruction source does not auto-update canonical sources', !sql.includes('update assistant.knowledge_sources'));
  check('reconstruction source does not auto-update references', !sql.includes('update assistant.reference_documents'));
  check('reconstruction source does not auto-update knowledge documents', !sql.includes('update assistant.knowledge_documents'));
  check('preflight is read only', pre.includes('begin transaction read only') && pre.includes('rollback'));
  check('post-apply is read only', post.includes('begin transaction read only') && post.includes('rollback'));
  check('package registers verifier', pkg.scripts?.['verify:mega-batch-assistant-legacy-provenance-reconstruction-and-official-source-authority-resolution'] === 'node scripts/verify-mega-batch-assistant-legacy-provenance-reconstruction-and-official-source-authority-resolution.mjs');
}
console.log(`MEGA_BATCH_ASSISTANT_LEGACY_PROVENANCE_RECONSTRUCTION_AND_OFFICIAL_SOURCE_AUTHORITY_RESOLUTION_V1_STATIC_VERIFICATION=${failed ? 'FAIL' : 'PASS'}`);
process.exit(failed ? 1 : 0);
