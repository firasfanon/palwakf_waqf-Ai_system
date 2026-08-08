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

const repositoryPath = 'server/runtimeRepository.ts';
const pilotPath = 'server/governedAgenticRagPilot.ts';
const packagePath = 'package.json';
const contractPath = 'docs/ai/governed_agentic_rag/AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1_AR.md';
const statePath = 'docs/ai/governed_agentic_rag/STATE_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1.md';
const uatPath = 'docs/ai/governed_agentic_rag/AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1_UAT_AR.md';
const errorRecordPath = 'ERROR_RECORD_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1_2026_07_12.md';

for (const relative of [repositoryPath, pilotPath, packagePath, contractPath, statePath, uatPath, errorRecordPath]) {
  assert(exists(relative), `required artifact present :: ${relative}`);
}

const repository = read(repositoryPath);
const pilot = read(pilotPath);
const pkg = JSON.parse(read(packagePath));
const contract = read(contractPath);
const state = read(statePath);
const uat = read(uatPath);
const errorRecord = read(errorRecordPath);

const exactStart = repository.indexOf('export async function runtimeGetKnowledgeDocumentByExactUuid');
const bundleStart = repository.indexOf('async function tryGetAssistantKnowledgeDocumentBundle', exactStart);
assert(exactStart >= 0 && bundleStart > exactStart, 'runtime repository exposes the bounded exact UUID lookup before the composite bundle');
const exactLookup = repository.slice(exactStart, bundleStart);

assert(exactLookup.includes(".from('knowledge_documents')"), 'exact lookup reads only assistant.knowledge_documents');
assert(exactLookup.includes(".eq('id', exactUuid)") && exactLookup.includes('.maybeSingle()'), 'exact lookup uses an equality predicate and at-most-one row');
assert(exactLookup.includes('normalizeExactKnowledgeDocumentUuid(id)'), 'invalid and non-UUID identifiers are rejected before the remote query');
assert(!/knowledge_sources|reference_documents|reference_files|knowledge_citations/.test(exactLookup), 'exact lookup does not depend on companion knowledge tables');
assert(!/\.or\(|\.ilike\(|title|source_url|semantic|vector|embedding/i.test(exactLookup.replace(/knowledge_document/gi, '')), 'exact lookup contains no title, URL, fuzzy, semantic, vector, or embedding resolver');
assert(!/\.insert\(|\.update\(|\.delete\(|\.upsert\(|runtime(Create|Update|Delete|Review)/.test(exactLookup), 'exact lookup contains no mutation path');
assert(!exactLookup.includes('assistantRuntimeBundleCircuitOpen()'), 'exact lookup is not blocked by the composite companion-table circuit breaker');
assert(exactLookup.includes('return { ...mapped, id: data.id, uuid: data.id };'), 'exact lookup preserves the sovereign UUID as the primary AR1 session identifier');

assert(pilot.includes('runtimeGetKnowledgeDocumentByExactUuid'), 'AR1 imports the direct exact UUID lookup');
const exactCall = pilot.indexOf('runtimeGetKnowledgeDocumentByExactUuid(stableId)');
const genericCall = pilot.indexOf('(runtimeGetKnowledgeDocumentById as any)(stableId)');
assert(exactCall >= 0 && genericCall > exactCall, 'AR1 tries the exact assistant UUID row before legacy/composite fallback');
assert(pilot.includes('runtimeRepository.assistant_knowledge_documents_uuid_exact_lookup'), 'AR1 records the exact lookup in candidate resolution evidence');
assert(pilot.includes('C4_SELECTED_COHORT_CURRENT_PROCESS_ONLY'), 'AR1 remains bounded to the current C4-selected cohort');
assert(!/hybridSearch|similaritySearch|cosineSimilarity|generateEmbeddings|vectorSearch/.test(pilot), 'AR1 still contains no semantic or vector resolution path');

const scriptName = 'verify:mega-batch-ar1-c4-direct-knowledge-document-metadata-exact-lookup-repair-v1';
assert(pkg.scripts?.[scriptName] === 'node scripts/verify-mega-batch-ar1-c4-direct-knowledge-document-metadata-exact-lookup-repair-v1.mjs', 'package registers the repair verifier');
assert(contract.includes('NO_DATABASE_WRITE') && contract.includes('NO_FUZZY_OR_SEMANTIC_MATCHING') && contract.includes('FAIL_CLOSED'), 'contract preserves no-write, deterministic-only, and fail-closed boundaries');
assert(state.includes('LOCAL_STATIC_VERIFICATION=PASS') && state.includes('RUNTIME_UAT=PENDING'), 'state distinguishes static success from pending runtime UAT');
assert(uat.includes('candidateCount > 0') && uat.includes('directC4MaterialReferences > 0') && uat.includes('AR1_SESSION_AUTO_START=NO'), 'UAT defines the required runtime closure and no-auto-start condition');
assert(errorRecord.includes('السبب الجذري') && errorRecord.includes('آخر baseline مستقر') && errorRecord.includes('ما فشل'), 'Error Record documents cause, failed attempts, and last stable baseline');

console.log('MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1_STATIC_VERIFICATION=PASS');
