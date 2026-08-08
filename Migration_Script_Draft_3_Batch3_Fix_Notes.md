# Migration Script Draft 3 — Batch 3 Fix Notes

## Root cause fixed
Batch 3 failed while reading `assistant.knowledge_sources` because the script used:
- `Content-Profile: assistant`

for a **GET** request.

For reads from a custom PostgREST schema, the correct header is:
- `Accept-Profile: assistant`

## What changed
In `getKnowledgeSourcesFromDb(...)`:
- replaced `Content-Profile` with `Accept-Profile`

## Why this matters
Without this header fix, PostgREST tries to resolve the table in `public`, which leads to:
- `Could not find the table 'public.knowledge_sources' in the schema cache`

## Run again
```powershell
$env:ASSISTANT_LOCAL_RUNTIME_FILE=".manus/db/local_runtime_store.json"
pnpm exec tsx scripts/migrations/migrate_assistant_batch3.ts
```
