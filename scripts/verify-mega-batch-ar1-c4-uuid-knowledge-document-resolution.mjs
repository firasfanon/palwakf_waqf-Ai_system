import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sourceRoot = process.argv[2] || process.cwd();
const governedPath = path.join(sourceRoot, 'server', 'governedAgenticRagPilot.ts');
const routerPath = path.join(sourceRoot, 'server', 'routers.ts');

function read(file) {
  if (!fs.existsSync(file)) throw new Error(`FILE_NOT_FOUND: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').toUpperCase();
}

function mustContain(text, needle, label) {
  if (!text.includes(needle)) throw new Error(`MISSING_${label}: ${needle}`);
}

function mustNotMatch(text, regex, label) {
  if (regex.test(text)) throw new Error(`FORBIDDEN_${label}: ${regex}`);
}

const governed = read(governedPath);
const routers = read(routerPath);

mustContain(governed, 'function normalizeStableDocumentId', 'STABLE_ID_HELPER');
mustContain(governed, 'function readReferenceDocumentId', 'REFERENCE_DOCUMENT_ID_HELPER');
mustContain(governed, 'function isPilotDocumentMetadataUsable', 'METADATA_USABILITY_GATE');
mustContain(governed, 'async function listPilotKnowledgeDocuments', 'LIST_FALLBACK');
mustContain(governed, 'async function getPilotKnowledgeDocumentById', 'UUID_RESOLVER');
mustContain(governed, '(runtimeGetKnowledgeDocumentById as any)(stableId)', 'UUID_DIRECT_RUNTIME_LOOKUP');
mustContain(governed, 'const documents = await listPilotKnowledgeDocuments();', 'DOCUMENT_LIST_REUSE');
mustContain(governed, 'getPilotKnowledgeDocumentById(materialId, documents)', 'C4_MATERIAL_UUID_RESOLUTION');
mustContain(governed, 'readReferenceDocumentId(document) === referenceDocumentId', 'REFERENCE_ASSOCIATION_SNAKE_CAMEL');
mustContain(governed, 'runtimeRepository.uuid_or_numeric_id_resolution', 'RESOLUTION_EVIDENCE');
mustContain(governed, 'return isPilotDocumentUsable(document) ? { binding, document } : null;', 'SESSION_CONTENT_GATE');
mustContain(governed, 'NO_FUZZY_OR_SEMANTIC_MATCHING', 'NO_FUZZY_INVARIANT');

mustContain(routers, 'runSingleFlowReadinessCycle', 'SINGLE_FLOW_ROUTER');
mustContain(routers, 'z.union([z.number().int().positive(), z.string().trim().min(1).max(120)])', 'ROUTER_STRING_OR_NUMBER_DOCUMENT_ID');

// Do not forbid governance strings that mention semantic/vector.
// Forbid only implementation-style matching/search/vectorization code paths.
mustNotMatch(governed, /\bsemanticSearch\s*\(/i, 'SEMANTIC_SEARCH_CALL');
mustNotMatch(governed, /\bfuzzyMatch\s*\(/i, 'FUZZY_MATCH_CALL');
mustNotMatch(governed, /\bvectorSearch\s*\(/i, 'VECTOR_SEARCH_CALL');
mustNotMatch(governed, /\bcosineSimilarity\s*\(/i, 'COSINE_SIMILARITY_CALL');
mustNotMatch(governed, /\blevenshtein\s*\(/i, 'LEVENSHTEIN_CALL');
mustNotMatch(governed, /\bembeddingSearch\s*\(/i, 'EMBEDDING_SEARCH_CALL');

console.log(JSON.stringify({
  result: 'PASS',
  batch: 'MEGA_BATCH_AR1_C4_UUID_KNOWLEDGE_DOCUMENT_RESOLUTION_REPAIR_V1',
  governedAgenticRagPilot_sha256: sha256(governed),
  routers_sha256: sha256(routers),
  checked: [
    'uuid_or_numeric_knowledge_document_resolution',
    'runtimeGetKnowledgeDocuments_fallback',
    'reference_document_id_camel_and_snake_support',
    'session_content_gate_preserved',
    'single_flow_router_present',
    'no_fuzzy_semantic_vector_matching_implementation'
  ],
}, null, 2));
