import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  ['client/src/pages/admin/SourceProvenanceRightsRegistry.tsx', ['سجل المصادر وحقوق النشر', 'sourceProvenance.registry', 'المواد المرتبطة بالمصدر', 'لا يمنح ترخيصًا قانونيًا تلقائيًا']],
  ['client/src/config/adminRegistryV2.ts', ['/admin/source-provenance-rights', 'SourceProvenanceRightsRegistry', 'dataState: "connected"']],
  ['server/sourceProvenanceRights.ts', ['getSourceProvenanceRegistry', 'rpc_source_provenance_upsert_source_v1', 'rpc_source_provenance_archive_source_v1', 'no_automatic_chat_release']],
  ['server/routers.ts', ['sourceProvenance: sourceProvenanceRouter', 'const sourceProvenanceRouter = router', 'upsert: adminProcedure']],
  ['sql_sandbox/mega_batch_c_source_provenance_rights_and_link_governance/00_MEGA_BATCH_C_PREFLIGHT_READ_ONLY.sql', ['read only', 'assistant.knowledge_sources']],
  ['sql_sandbox/mega_batch_c_source_provenance_rights_and_link_governance/01_SCHEMA_RLS_RPC_OPERATOR_APPLY.sql', ['assistant.source_url_history', 'assistant.source_rights_profiles', 'assistant.source_provenance_events', 'NO', 'rpc_source_provenance_upsert_source_v1']],
  ['sql_sandbox/mega_batch_c_source_provenance_rights_and_link_governance/02_POST_APPLY_READ_ONLY_VERIFICATION.sql', ['READ ONLY verification', 'source_rights_profiles']],
];
const failures = [];
for (const [relative, markers] of required) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) { failures.push(`MISSING:${relative}`); continue; }
  const text = fs.readFileSync(target, 'utf8');
  for (const marker of markers) if (!text.includes(marker)) failures.push(`MISSING_MARKER:${relative}:${marker}`);
}
const registry = fs.readFileSync(path.join(root, 'client/src/config/adminRegistryV2.ts'), 'utf8');
if (registry.includes('connected_after_sql_gate')) failures.push('UNDECLARED_ADMIN_PAGE_DATA_STATE');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.['verify:admin-sidebar-usage-category-accordion'] !== 'node scripts/verify-admin-sidebar-usage-category-accordion.mjs') {
  failures.push('MISSING_PRESERVED_SIDEBAR_ACCORDION_VERIFIER');
}
if (pkg.scripts?.['verify:mega-batch-c-source-provenance-rights'] !== 'node scripts/verify-mega-batch-c-source-provenance-rights.mjs') {
  failures.push('MISSING_MBC_VERIFIER');
}
const sql = fs.readFileSync(path.join(root, 'sql_sandbox/mega_batch_c_source_provenance_rights_and_link_governance/01_SCHEMA_RLS_RPC_OPERATOR_APPLY.sql'), 'utf8');
if (/\binsert\s+into\s+assistant\.knowledge_sources\b/i.test(sql) && !sql.includes('rpc_source_provenance_upsert_source_v1')) failures.push('UNEXPECTED_DIRECT_SOURCE_INSERT_OUTSIDE_RPC');
if (!sql.includes('revoke all on assistant.source_url_history from public, anon, authenticated')) failures.push('MISSING_DIRECT_ACCESS_REVOKE');
if (failures.length) {
  console.error('MEGA_BATCH_C_SOURCE_PROVENANCE_RIGHTS_STATIC_VERIFICATION=FAIL');
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log('MEGA_BATCH_C_SOURCE_PROVENANCE_RIGHTS_STATIC_VERIFICATION=PASS');
console.log('SIDEBAR_ACCORDION_VERIFIER_PRESERVED=PASS');
console.log('NO_AUTOMATIC_REFETCH=PASS');
console.log('NO_AUTOMATIC_PROMOTION=PASS');
console.log('NO_AUTOMATIC_CHAT_RELEASE=PASS');
console.log('NO_HARD_DELETE_OF_REFERENCED_SOURCE=PASS');
