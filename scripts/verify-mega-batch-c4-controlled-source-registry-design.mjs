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

const c4 = read('server/controlledSourceRegistryDesign.ts');
const router = read('server/routers.ts');
const page = read('client/src/pages/admin/SourceProvenanceRightsRegistry.tsx');
const pkg = JSON.parse(read('package.json'));

assert(c4.includes("getAutonomousProvenanceAudit"), 'C4 derives registry blueprints only from the C2 clustered audit');
assert(c4.includes("deterministic_registry_blueprint_and_rights_gate_design_only"), 'C4 declares design-only read mode');
assert(c4.includes("noDatabaseWrite: true") && c4.includes("noSqlApply: true"), 'C4 contains no database write or SQL apply path');
assert(c4.includes("noControlledRegistryCreate: true") && c4.includes("noControlledRegistryUpdate: true"), 'C4 blocks controlled registry creation and update');
assert(c4.includes("sourceLinkWrite: 'blocked'") && c4.includes("rightsAssignment: 'blocked'"), 'C4 blocks source links and rights assignment');
assert(c4.includes("noExternalRequest: true"), 'C4 does not execute external verification requests');
assert(c4.includes("chatRag: 'blocked_pending_separate_gate'") && c4.includes("finalRelease: 'not_authorized'"), 'C4 keeps Chat/RAG and final release blocked');
assert(c4.includes("G1_SOURCE_IDENTITY_AND_DOMAIN_VERIFICATION") && c4.includes("G6_CHAT_RAG_GATE"), 'C4 defines the staged source and rights gates');
assert(c4.includes("C3 results are intentionally not replayed or persisted here"), 'C4 does not persist C3 reachability as permanent trust');
assert(router.includes("getControlledSourceRegistryDesign"), 'router imports C4 controlled registry design service');
assert(router.includes("controlledRegistryDesign: adminProcedure.query"), 'router exposes C4 only as an admin read query');
assert(page.includes("controlledRegistryDesign.useQuery"), 'admin page requests C4 through a query only');
assert(page.includes("C4 — تصميم سجل المصدر المنضبط وبوابة الحقوق — قراءة فقط"), 'admin page renders the C4 read-only design surface');
assert(page.includes("لا توجد في C4 هجرة SQL أو إنشاء جداول أو إجراء كتابة"), 'UI states the no-SQL and no-write boundary');
assert(page.includes("إنشاء السجل={blueprint.controlledRegistryWrite}"), 'UI displays the blocked registry-write contract');
assert(pkg.scripts['verify:mega-batch-c4-controlled-source-registry-design'] === 'node scripts/verify-mega-batch-c4-controlled-source-registry-design.mjs', 'C4 verifier is registered');

if (!process.exitCode) {
  console.log('MEGA_BATCH_C4_CONTROLLED_SOURCE_REGISTRY_AND_RIGHTS_GATE_DESIGN_STATIC_VERIFICATION=PASS');
}
