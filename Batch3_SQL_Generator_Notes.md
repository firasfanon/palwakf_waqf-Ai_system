
# Batch 3 SQL Generator — Notes

## Why this exists
Batch 3 kept failing because PostgREST still could not see the new assistant tables reliably in schema cache.

Instead of spending more time fighting API cache, this script generates a plain SQL file from the local runtime data.

## What it generates
From:
- `knowledgeDocuments`
- `documentFiles`

It produces SQL inserts for:
- `assistant.reference_documents`
- `assistant.knowledge_documents`
- `assistant.reference_files`
- `assistant.knowledge_citations`

## Output location
The generated SQL file is written into:
- `.manus/db/migration_reports/`
or the matching runtime-store parent path

## Run
```powershell
$env:ASSISTANT_LOCAL_RUNTIME_FILE=".manus/db/local_runtime_store.json"
powershell -ExecutionPolicy Bypass -File scripts/migrations/export_assistant_batch3_sql.ps1
```

## Then
Open the generated `.sql` file, run it in Supabase SQL Editor, then verify counts in:
- `assistant.reference_documents`
- `assistant.reference_files`
- `assistant.knowledge_documents`
- `assistant.knowledge_citations`
