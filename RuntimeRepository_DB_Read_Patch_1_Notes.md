# RuntimeRepository DB Read Patch 1

## Purpose
Enable the application to read migrated Batch 1 data from Supabase `assistant.*` first, while keeping local runtime fallback.

## Scope
This patch updates:
- `server/runtimeRepository.ts`

## What changed
### 1) Assistant Supabase client
Adds a server-side Supabase client resolver using:
- `PWF_SUPABASE_URL`
- `PLATFORM_SUPABASE_URL`
- `SUPABASE_URL`
- `VITE_SUPABASE_URL`

and service-role/anon fallbacks:
- `PWF_SUPABASE_SERVICE_ROLE_KEY`
- `PLATFORM_SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLATFORM_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_ANON_KEY`

### 2) Knowledge sources read path
`runtimeGetKnowledgeSources()` now reads from:
- `assistant.knowledge_sources`
first, then falls back to:
- legacy MySQL path if available
- local runtime store otherwise

### 3) Legacy ID preservation
Migrated assistant rows use UUID ids in DB, but current UI/router still expects numeric ids.
This patch maps:
- `metadata_json.legacy_id`
back into the runtime read model so current screens continue to work.

### 4) Stats/top-active reads
These now compute from `assistant.knowledge_sources` when available.

### 5) System settings read bridge
`runtimeGetSystemSettings()` now:
- reads local defaults/settings first
- overlays assistant DB key/value rows if present
- falls back safely when DB rows do not exist yet

## Important limitations
- This is a **read patch**, not a full write cutover
- create/update/delete for knowledge sources still follow the old path for now
- system settings writes remain local in this patch
- this patch is intentionally conservative

## Why this order is correct
Batch 1 migrated:
- `knowledgeSources`
- and found no `systemSettings` rows in local runtime

So the safest next step is DB-first reads for migrated entities before changing writes.

## Expected result after patch
- Knowledge Sources page should reflect the migrated 8 rows from `assistant.knowledge_sources`
- Existing UI should continue to work because legacy numeric ids are preserved in runtime output
- Local fallback remains available if Supabase read fails
