# RuntimeRepository DB Read Patch 3

## Scope closed in this patch
DB-first read for assistant knowledge was expanded from `assistant.knowledge_sources` only to:
- `assistant.knowledge_documents`
- `assistant.reference_documents`
- `assistant.reference_files`
- `assistant.knowledge_citations`

## File touched
- `server/runtimeRepository.ts`

## What changed
- Added Supabase assistant read helpers for governed knowledge documents
- Added mapping from assistant rows to the legacy runtime/document shape expected by current UI and chat retrieval
- Added companion reads for reference files and citations
- Switched `runtimeGetKnowledgeDocuments` to assistant-first, then existing DB/local fallback
- Switched `runtimeGetKnowledgeDocumentById` to assistant-first, then existing DB/local fallback
- Switched `runtimeGetDocumentFiles` to assistant-first, then existing DB/local fallback

## Intentionally not changed
- Write flows (create/update/delete) remain on existing paths
- SQL/migrations unchanged
- UI unchanged
