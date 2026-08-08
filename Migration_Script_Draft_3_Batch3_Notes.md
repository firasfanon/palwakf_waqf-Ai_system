# Migration Script Draft 3 — Batch 3 Notes

## Scope
This batch migrates:
- `knowledgeDocuments`
- `documentFiles`

into:
- `assistant.reference_documents`
- `assistant.reference_files`
- `assistant.knowledge_documents`
- `assistant.knowledge_citations`

## Key migration philosophy
The local runtime currently mixes:
- seeded references
- uploaded documents
- knowledge entries already consumed by chat

Instead of forcing a hard split too early, this batch performs a **transitional dual representation**:
- each local knowledge record becomes a retained `reference_document`
- and a governed `knowledge_document`
- with a basic citation linking them

This preserves the approved architectural rule:
- `reference_documents` and `knowledge_documents` stay separate from the start

## File handling behavior
If `documentFiles` contains explicit rows for a document, they are used.

If not, the script derives reference-file rows from inline fields such as:
- `sourceUrl`
- `pdfUrl`
- `fileUrl`

### Important transitional note
For inline `data:` URLs, the script stores a placeholder locator such as:
- `legacy://inline-data-url/<uuid>`

This is intentional for the first migration cycle.
Actual movement of binary file content to storage should happen in a later dedicated file-storage pass.

## Source linking
The script attempts to link each migrated document to:
- `assistant.knowledge_sources`

using current DB rows in `assistant.knowledge_sources` and legacy-compatible identifiers/names.

## Suggested run
```powershell
$env:ASSISTANT_LOCAL_RUNTIME_FILE=".manus/db/local_runtime_store.json"
pnpm exec tsx scripts/migrations/migrate_assistant_batch3.ts
```
