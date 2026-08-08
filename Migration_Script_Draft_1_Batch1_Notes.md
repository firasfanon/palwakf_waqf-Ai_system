# Migration Script Draft 1 — Batch 1 Notes

## Purpose
This script performs the first controlled migration batch from:

- `.palwakf/runtime/local_runtime_store.json`

to:

- `assistant.system_settings`
- `assistant.knowledge_sources`

## File
Suggested project path:
- `scripts/migrations/migrate_assistant_batch1.ts`

## What the script does
1. Reads the local runtime store
2. Creates a backup snapshot before any write
3. Normalizes:
   - `systemSettings`
   - `knowledgeSources`
4. Upserts them into `assistant.*`
5. Writes:
   - migration report
   - knowledge source legacy-id mapping file

## What it does NOT do
- does not migrate knowledge documents yet
- does not migrate files yet
- does not migrate conversations/messages
- does not modify runtimeRepository yet
- does not delete or rewrite the source local store

## Required environment variables
One of:
- `PWF_SUPABASE_URL`
- `SUPABASE_URL`
- `VITE_SUPABASE_URL`

And one of:
- `PWF_SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_ROLE`

## Important prerequisite
For PostgREST writes to work cleanly, the `assistant` schema should be exposed in Supabase API settings.

## Suggested run command
From project root:

```powershell
pnpm exec tsx scripts/migrations/migrate_assistant_batch1.ts
```

## Output files
The script writes into:
- `.palwakf/runtime/backups/`
- `.palwakf/runtime/migration_reports/`

## Expected outputs
- local runtime backup snapshot
- `batch1_knowledge_sources_id_map_*.json`
- `migration_batch1_report_*.json`

## Why this is a safe first batch
- low-risk entities
- no chat disruption
- no knowledge/reference split yet
- critical config/source registry moved first
