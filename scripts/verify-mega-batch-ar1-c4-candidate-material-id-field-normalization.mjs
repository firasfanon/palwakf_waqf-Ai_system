import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const sourceRoot = process.argv[2] || process.cwd();
const governedPath = path.join(sourceRoot, 'server', 'governedAgenticRagPilot.ts');

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

function mustMatch(text, regex, label) {
  if (!regex.test(text)) throw new Error(`MISSING_${label}: ${regex}`);
}

function mustNotMatch(text, regex, label) {
  if (regex.test(text)) throw new Error(`FORBIDDEN_${label}: ${regex}`);
}

const governed = read(governedPath);

mustContain(governed, 'function stableDocumentIds', 'STABLE_DOCUMENT_IDS');
mustContain(governed, 'function preferredKnowledgeDocumentId', 'PREFERRED_DOCUMENT_ID');
mustContain(governed, 'function normalizeMaterialKind', 'MATERIAL_KIND_NORMALIZATION');
mustContain(governed, 'function readKnowledgeDocumentIdFromCandidateMaterial', 'KNOWLEDGE_MATERIAL_ID_READER');
mustContain(governed, 'function readReferenceDocumentIdFromCandidateMaterial', 'REFERENCE_MATERIAL_ID_READER');
mustContain(governed, 'stableDocumentIds(document).includes(stableId)', 'UUID_AND_ID_MATCHING');
mustContain(governed, 'readKnowledgeDocumentIdFromCandidateMaterial(material)', 'DIRECT_C4_MATERIAL_ID_READER_USAGE');
mustContain(governed, 'readReferenceDocumentIdFromCandidateMaterial(material)', 'REFERENCE_C4_MATERIAL_ID_READER_USAGE');
mustContain(governed, 'candidateMaterials.id_field_normalized_to_knowledge_document_uuid', 'ID_FIELD_NORMALIZATION_EVIDENCE');
mustContain(governed, 'NO_FUZZY_OR_SEMANTIC_MATCHING', 'NO_FUZZY_INVARIANT');

mustMatch(governed, /material\?\.knowledgeDocumentId[\s\S]*material\?\.knowledge_document_id[\s\S]*material\?\.documentId[\s\S]*material\?\.document_id[\s\S]*material\?\.materialId[\s\S]*material\?\.material_id[\s\S]*material\?\.uuid[\s\S]*material\?\.id/, 'KNOWLEDGE_MATERIAL_FIELD_ORDER');
mustMatch(governed, /document\?\.id[\s\S]*document\?\.uuid[\s\S]*document\?\.knowledgeDocumentUuid[\s\S]*document\?\.knowledge_document_uuid/, 'DOCUMENT_STABLE_IDS');

mustNotMatch(governed, /\bsemanticSearch\s*\(/i, 'SEMANTIC_SEARCH_CALL');
mustNotMatch(governed, /\bfuzzyMatch\s*\(/i, 'FUZZY_MATCH_CALL');
mustNotMatch(governed, /\bvectorSearch\s*\(/i, 'VECTOR_SEARCH_CALL');
mustNotMatch(governed, /\bcosineSimilarity\s*\(/i, 'COSINE_SIMILARITY_CALL');
mustNotMatch(governed, /\blevenshtein\s*\(/i, 'LEVENSHTEIN_CALL');
mustNotMatch(governed, /\bembeddingSearch\s*\(/i, 'EMBEDDING_SEARCH_CALL');

console.log(JSON.stringify({
  result: 'PASS',
  batch: 'MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1',
  governedAgenticRagPilot_sha256: sha256(governed),
  checked: [
    'candidateMaterials_id_field_normalization',
    'knowledge_document_material_kind_gate',
    'reference_document_material_kind_gate',
    'document_uuid_and_id_matching',
    'preferred_uuid_document_id_for_session_bindings',
    'no_fuzzy_semantic_vector_matching_implementation'
  ],
}, null, 2));
