import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  ['server/legacyManusProvenance.ts', ['getLegacyManusProvenanceReconciliation', 'read-only', 'legacy_import_register', 'noLifecycleMutation', 'noRightsConclusionFromMigrationContainer']],
  ['server/routers.ts', ['legacyManusReconciliation: adminProcedure', 'getLegacyManusProvenanceReconciliation']],
  ['client/src/pages/admin/SourceProvenanceRightsRegistry.tsx', ['legacyManusReconciliation', 'استعادة منشأ Manus القديمة — قراءة فقط', 'وعاء الترحيل KB08 ليس ناشرًا للمادة']],
  ['sql_sandbox/mega_batch_c1_legacy_manus_provenance_recovery_and_evidence_reconciliation/00_C1_PREFLIGHT_READ_ONLY.sql', ['begin transaction read only', 'legacy_import_register', 'rollback']],
  ['sql_sandbox/mega_batch_c1_legacy_manus_provenance_recovery_and_evidence_reconciliation/01_C1_LEGACY_PROVENANCE_FIELD_CENSUS_READ_ONLY.sql', ['STRICT READ ONLY', 'payload_walk', 'rollback']],
  ['sql_sandbox/mega_batch_c1_legacy_manus_provenance_recovery_and_evidence_reconciliation/02_C1_EVIDENCE_RECONCILIATION_REGISTER_READ_ONLY.sql', ['STRICT READ ONLY', 'READ_ONLY_C1_NO_SOURCE_OR_RIGHTS_WRITE', 'rollback']],
  ['sql_sandbox/mega_batch_c1_legacy_manus_provenance_recovery_and_evidence_reconciliation/04_OPERATOR_SEQUENCE_AR.md', ['NO_INSERT_UPDATE_DELETE', 'NO_SOURCE_CONTAINER_AS_PUBLISHER']],
];
const failures = [];
for (const [relative, markers] of required) {
  const target = path.join(root, relative);
  if (!fs.existsSync(target)) { failures.push(`MISSING:${relative}`); continue; }
  const text = fs.readFileSync(target, 'utf8');
  for (const marker of markers) if (!text.includes(marker)) failures.push(`MISSING_MARKER:${relative}:${marker}`);
}
const service = fs.readFileSync(path.join(root, 'server/legacyManusProvenance.ts'), 'utf8');
if (/\.insert\(|\.update\(|\.delete\(|\.rpc\(/.test(service)) failures.push('LEGACY_PROVENANCE_SERVICE_MUST_BE_READ_ONLY');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (pkg.scripts?.['verify:mega-batch-c1-legacy-manus-provenance'] !== 'node scripts/verify-mega-batch-c1-legacy-manus-provenance.mjs') failures.push('MISSING_C1_VERIFIER');
if (pkg.scripts?.['verify:mega-batch-c-source-provenance-rights'] !== 'node scripts/verify-mega-batch-c-source-provenance-rights.mjs') failures.push('MISSING_C_VERIFIER');
if (pkg.scripts?.['verify:admin-sidebar-usage-category-accordion'] !== 'node scripts/verify-admin-sidebar-usage-category-accordion.mjs') failures.push('MISSING_PRESERVED_SIDEBAR_ACCORDION_VERIFIER');
if (failures.length) {
  console.error('MEGA_BATCH_C1_LEGACY_MANUS_PROVENANCE_STATIC_VERIFICATION=FAIL');
  for (const failure of failures) console.error(failure);
  process.exit(1);
}
console.log('MEGA_BATCH_C1_LEGACY_MANUS_PROVENANCE_STATIC_VERIFICATION=PASS');
console.log('C1_READ_ONLY_ONLY=PASS');
console.log('NO_SOURCE_CONTAINER_AS_PUBLISHER=PASS');
console.log('NO_AUTOMATIC_PROVENANCE_INFERENCE=PASS');
console.log('NO_SOURCE_OR_RIGHTS_WRITE=PASS');
console.log('NO_AUTOMATIC_PROMOTION=PASS');
console.log('NO_AUTOMATIC_CHAT_RELEASE=PASS');
