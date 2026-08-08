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
const router = read('server/routers.ts');
const page = read('client/src/pages/admin/SourceProvenanceRightsRegistry.tsx');
const pkg = JSON.parse(read('package.json'));

assert(c3.includes("getAutonomousProvenanceAudit"), 'C3 derives candidates only from the C2 clustered audit');
assert(c3.includes("operator_triggered_bounded_external_metadata_check"), 'C3 is operator-triggered and bounded');
assert(c3.includes("MAX_EXTERNAL_URLS") && c3.includes("MAX_CONCURRENCY") && c3.includes("REQUEST_TIMEOUT_MS"), 'C3 has explicit URL, concurrency, and timeout bounds');
assert(c3.includes("redirect: 'manual'"), 'C3 never follows redirects automatically');
assert(c3.includes("validateDns") && c3.includes("dns_private_or_reserved_address"), 'C3 includes a DNS public-address SSRF guard');
assert(c3.includes("response.body.cancel"), 'C3 cancels any fallback response body and retains no document body');
assert(c3.includes("sourceLinkWrite: 'blocked'"), 'C3 blocks source-link writes for every matrix entry');
assert(c3.includes("rightsAssignment: 'blocked'"), 'C3 blocks rights assignment for every matrix entry');
assert(c3.includes("finalRelease: 'not_authorized'"), 'C3 never authorizes release');
assert(c3.includes("chatRag: 'blocked_pending_separate_gate'"), 'C3 keeps Chat/RAG behind a separate gate');
assert(c3.includes("OFFICIAL_URL_REACHABLE_METADATA_ONLY"), 'C3 distinguishes reachable official metadata candidates');
assert(c3.includes("ACADEMIC_URL_REACHABLE_METADATA_ONLY"), 'C3 distinguishes reachable academic metadata candidates');
assert(c3.includes("UNREACHABLE_OR_TIMEOUT_HOLD"), 'C3 holds unavailable URLs instead of inferring trust');
assert(router.includes("getAutonomousExternalSourceVerification"), 'router imports C3 verification service');
assert(router.includes("externalVerification: adminProcedure") && router.includes("maxUrls: z.number().int().min(1).max(32)"), 'router exposes C3 only as bounded admin read query');
assert(page.includes("externalVerification.useQuery") && page.includes("enabled: false"), 'C3 is not run automatically on page load');
assert(page.includes("تشغيل فحص C3 الخارجي"), 'admin page exposes an explicit C3 run control');
assert(page.includes("لا يقرأ أو يخزن النصوص أو PDF"), 'UI states the metadata-only non-retention boundary');
assert(page.includes("إتاحة Chat/RAG كلها محجوبة"), 'UI states release remains blocked');
assert(pkg.scripts['verify:mega-batch-c3-external-source-verification'] === 'node scripts/verify-mega-batch-c3-external-source-verification.mjs', 'C3 verifier is registered');

if (!process.exitCode) {
  console.log('MEGA_BATCH_C3_EXTERNAL_SOURCE_VERIFICATION_STATIC_VERIFICATION=PASS');
}
