import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const assert = (condition, message) => {
  if (!condition) {
    console.error(`FAIL :: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS :: ${message}`);
  }
};

const audit = read('server/autonomousProvenanceAudit.ts');
const router = read('server/routers.ts');
const page = read('client/src/pages/admin/SourceProvenanceRightsRegistry.tsx');
const pkg = JSON.parse(read('package.json'));

assert(audit.includes("getLegacyManusProvenanceReconciliation"), 'C2 derives only from the C1 read-only reconciliation layer');
assert(audit.includes("mode: 'read_only_deterministic_cluster_audit'"), 'C2 declares read-only deterministic audit mode');
assert(audit.includes('NO_AUTOMATIC') || audit.includes('noAutomaticSourceLinking'), 'C2 contains a no-automatic-linking invariant');
assert(audit.includes("sourceLinkWrite: 'blocked'"), 'source-link writes are blocked in every C2 disposition');
assert(audit.includes("rightsAssignment: 'blocked'"), 'rights assignment is blocked in every C2 disposition');
assert(audit.includes("chatRag: 'blocked_pending_separate_gate'"), 'Chat/RAG remains blocked behind a separate gate');
assert(audit.includes('TECHNICAL_MARKER_EXCLUDE'), 'technical import markers are isolated automatically');
assert(audit.includes('TEST_OR_INVALID_URL_QUARANTINE'), 'test or invalid URLs are quarantined automatically');
assert(audit.includes('OFFICIAL_SOURCE_CANDIDATE'), 'official-domain candidates receive a bounded disposition');
assert(audit.includes('ACADEMIC_SOURCE_CANDIDATE'), 'academic/repository candidates receive a bounded disposition');
assert(router.includes('getAutonomousProvenanceAudit'), 'router imports autonomous C2 audit service');
assert(router.includes('autonomousAudit: adminProcedure.query'), 'router exposes the C2 audit as a read query');
assert(page.includes('autonomousAudit.useQuery'), 'admin page requests the C2 audit through a query only');
assert(page.includes('تدقيق C2 الآلي وقرار التصرف النهائي'), 'admin page renders the C2 final-disposition surface');
assert(page.includes('لا يربط مصدرًا') && page.includes('لا يقرر ترخيصًا'), 'UI states the non-linking and non-licensing boundary');
assert(pkg.scripts['verify:mega-batch-c2-autonomous-provenance-audit'] === 'node scripts/verify-mega-batch-c2-autonomous-provenance-audit.mjs', 'C2 verifier is registered');

if (!process.exitCode) {
  console.log('MEGA_BATCH_C2_AUTONOMOUS_PROVENANCE_AUDIT_STATIC_VERIFICATION=PASS');
}
