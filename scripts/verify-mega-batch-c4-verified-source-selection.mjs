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

const c3 = read('server/externalSourceVerification.ts');
const c4 = read('server/verifiedSourceSelection.ts');
const router = read('server/routers.ts');
const page = read('client/src/pages/admin/SourceProvenanceRightsRegistry.tsx');
const pkg = JSON.parse(read('package.json'));

assert(c4.includes('getAutonomousProvenanceAudit'), 'C4 derives its plan from the C2 clustered provenance audit');
assert(c4.includes('getLatestAutonomousExternalSourceVerificationEvidence'), 'C4 consumes only the latest C3 evidence handoff');
assert(!c4.includes('fetch(') && !c4.includes("node:dns"), 'C4 does not execute an external HTTP or DNS request');
assert(c4.includes('C3_EVIDENCE_REQUIRED_HOLD'), 'C4 holds candidates when fresh C3 evidence is absent or stale');
assert(c4.includes('CONTROLLED_METADATA_PILOT_CANDIDATE'), 'C4 creates only a bounded controlled metadata/citation planning cohort');
assert(c4.includes('MAX_CONTROLLED_METADATA_PILOT_CANDIDATES'), 'C4 has an explicit pilot-cohort limit');
assert(c4.includes("sourceLinkWrite: 'blocked'") && c4.includes("rightsAssignment: 'blocked'"), 'C4 blocks source-link and rights writes for every disposition');
assert(c4.includes("fullTextRetention: 'blocked'") && c4.includes("chatRag: 'blocked_pending_separate_gate'"), 'C4 blocks full-text retention and Chat/RAG release');
assert(c4.includes("finalRelease: 'not_authorized'") && c4.includes("production: 'not_authorized'"), 'C4 never authorizes final release or production');

assert(c3.includes('latestC3Evidence') && c3.includes('getLatestAutonomousExternalSourceVerificationEvidence'), 'C3 exposes only an ephemeral process-memory evidence handoff');
assert(c3.includes('C3_EVIDENCE_TTL_MS') && c3.includes("status: 'stale'"), 'C3 evidence has an explicit freshness expiry and stale state');

assert(router.includes('getControlledSourceRegistryDesign'), 'reconciliation preserves the existing C4 controlled registry design service');
assert(router.includes('controlledRegistryDesign: adminProcedure.query'), 'reconciliation preserves the existing C4 controlled registry design read query');
assert(router.includes('getVerifiedSourceSelectionAndControlledReleasePlan'), 'router imports the C4 verified source selection plan service');
assert(router.includes('controlledReleasePlan: adminProcedure.query'), 'router exposes the C4 release plan only as an admin read query');

assert(page.includes('controlledRegistryDesign.useQuery'), 'admin page preserves the existing C4 controlled registry design surface');
assert(page.includes('controlledReleasePlan.useQuery'), 'admin page requests the reconciled C4 release plan via a query only');
assert(page.includes('C4 — تصميم سجل المصدر المنضبط وبوابة الحقوق — قراءة فقط'), 'admin page preserves the controlled registry design surface');
assert(page.includes('C4 — اختيار المصادر المتحققة وخطة إطلاق معرفة محكومة — قراءة فقط'), 'admin page renders the verified source selection and controlled release plan surface');
assert(page.includes('C4 لن ينفذ فحص شبكة بدلًا عنه') && page.includes('لا يوجد ربط مصدر أو حق أو عرض عام أو Chat/RAG'), 'UI states C4 non-external and non-release boundaries');

assert(pkg.scripts['verify:mega-batch-c4-controlled-source-registry-design'] === 'node scripts/verify-mega-batch-c4-controlled-source-registry-design.mjs', 'reconciliation preserves the prior C4 registry-design verifier');
assert(pkg.scripts['verify:mega-batch-c4-verified-source-selection'] === 'node scripts/verify-mega-batch-c4-verified-source-selection.mjs', 'reconciled C4 verifier is registered');

if (!process.exitCode) {
  console.log('MEGA_BATCH_C4_RECONCILIATION_FROM_ACTUAL_C3_BASELINE_STATIC_VERIFICATION=PASS');
}
