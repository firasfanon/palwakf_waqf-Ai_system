# Migration Script Draft 1 — Batch 1 (Resilient Path Version)

## What changed
This version no longer assumes only one runtime-store path.

It now:
- checks `ASSISTANT_LOCAL_RUNTIME_FILE` first if provided
- searches these common paths automatically:
  - `.palwakf/runtime/local_runtime_store.json`
  - `.manus/runtime/local_runtime_store.json`
  - `local_runtime_store.json`
  - `runtime/local_runtime_store.json`

## Why this matters
The current project history includes more than one runtime-storage convention, so hardcoding `.palwakf/...` was too strict for the first migration batch.

## Recommended run
Normal:
```powershell
pnpm exec tsx scripts/migrations/migrate_assistant_batch1.ts
```

Explicit override:
```powershell
$env:ASSISTANT_LOCAL_RUNTIME_FILE=".manus/runtime/local_runtime_store.json"
pnpm exec tsx scripts/migrations/migrate_assistant_batch1.ts
```
