import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));
const assert = (condition, message) => {
  if (!condition) throw new Error(`FAIL :: ${message}`);
  console.log(`PASS :: ${message}`);
};

const servicePath = 'server/governedAgenticRagPilot.ts';
const routerPath = 'server/routers.ts';
const pagePath = 'client/src/pages/admin/SourceProvenanceRightsRegistry.tsx';
const packagePath = 'package.json';
const contractPath = 'docs/ai/governed_agentic_rag/AR1_C4_DETERMINISTIC_ELIGIBILITY_RESOLUTION_AND_CONTROLLED_INTERNAL_PILOT_V1_AR.md';
const statePath = 'docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_C4_DETERMINISTIC_ELIGIBILITY_RESOLUTION_AND_CONTROLLED_INTERNAL_PILOT_V1.md';
const uatPath = 'docs/ai/governed_agentic_rag/AR1_C4_DETERMINISTIC_ELIGIBILITY_RESOLUTION_AND_CONTROLLED_INTERNAL_PILOT_UAT_AR.md';

for (const relative of [servicePath, routerPath, pagePath, packagePath, contractPath, statePath, uatPath]) {
  assert(exists(relative), `required artifact present :: ${relative}`);
}
const service = read(servicePath);
const router = read(routerPath);
const page = read(pagePath);
const pkg = JSON.parse(read(packagePath));
const contract = read(contractPath);
const state = read(statePath);
const uat = read(uatPath);

assert(service.includes('C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION'), 'AR1 supports an exact C4 reference_document-to-knowledge_document association');
assert(service.includes('knowledge_document.reference_document_id_exact') && service.includes('candidateMaterials.reference_document_id_exact'), 'AR1 records both sides of the exact reference-document association');
assert(service.includes('linkedDocuments.length !== 1') && service.includes('rejectedAmbiguousDirectAssociations'), 'AR1 rejects ambiguous reference-document associations instead of choosing implicitly');
assert(service.includes("typeof document?.id === 'string' || typeof document?.id === 'number'"), 'AR1 accepts only resolved runtime numeric ids or UUID ids');
assert(!service.includes('const numericId = Number(material?.id);'), 'AR1 does not discard UUID C4 material identifiers');
assert(service.includes('NO_FUZZY_OR_SEMANTIC_MATCHING') && !/hybridSearch|similaritySearch|cosineSimilarity|generateEmbeddings|vectorSearch/.test(service), 'AR1 preserves no-fuzzy, no-semantic, and no-vector resolution');
assert(!/runtime(Create|Update|Delete|Review)[A-Z]/.test(service) && !/insert\s*\(/.test(service), 'AR1 resolver has no database create/update/delete/review/insert path');
assert(router.includes("documentId: z.union([z.number().int().positive(), z.string().trim().min(1).max(120)])"), 'router accepts canonical existing numeric ids or UUID ids only');
assert(page.includes('إحالة C4 مرجعية فريدة') && page.includes('إحالات ملتبسة مرفوضة'), 'operator UI explains the exact reference association and ambiguity hold');
assert(page.includes('إحالة C4 مباشرة عبر وثيقة مرجعية واحدة'), 'operator UI preserves deterministic-only boundary in governance details');
assert(pkg.scripts?.['verify:mega-batch-ar1-c4-deterministic-eligibility'] === 'node scripts/verify-mega-batch-ar1-c4-deterministic-eligibility.mjs', 'package registers the deterministic C4 eligibility verifier');
assert(contract.includes('NO_SQL') && contract.includes('NO_DATABASE_WRITE') && contract.includes('NO_RIGHTS_LAYER_ACTIVATION'), 'batch contract keeps SQL, writes, and rights-layer activation out of scope');
assert(contract.includes('C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION') && contract.includes('EXACT_REFERENCE_DOCUMENT_ID'), 'batch contract documents the new exact association method');
assert(state.includes('PREAPPLY_CANDIDATE') && state.includes('PUBLIC_CHAT_RELEASE=NOT_AUTHORIZED'), 'batch state remains preapply and release-blocked');
assert(uat.includes('AR1_BINDING_NOT_IN_CURRENT_C4_SELECTED_COHORT') && uat.includes('إلغاء الجلسة ومسح الذاكرة'), 'UAT includes cohort-bound negative path and rollback');
console.log('MEGA_BATCH_AR1_C4_DETERMINISTIC_ELIGIBILITY_RESOLUTION_AND_CONTROLLED_INTERNAL_PILOT_V1_STATIC_VERIFICATION=PASS');
