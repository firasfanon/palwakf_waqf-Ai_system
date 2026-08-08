# Migration Script Draft 2 — Batch 2 Notes

## Scope
This script migrates:
- `fetchedContent` -> `assistant.fetched_content`
- `fetchLogs` -> `assistant.fetch_logs`
- `classificationRatings` -> `assistant.classification_ratings`
- `fetchedContentReviewEvents` -> `assistant.review_events`

## Dependency
Batch 1 should already have run successfully because this script attempts to load:
- `batch1_knowledge_sources_id_map_*.json`

to map local source ids into migrated `assistant.knowledge_sources` UUIDs.

## Runtime store search
This script uses the resilient runtime-file search logic and also accepts:
- `ASSISTANT_LOCAL_RUNTIME_FILE`

## Output
The script writes:
- backup snapshot
- `batch2_fetched_content_id_map_*.json`
- `migration_batch2_report_*.json`

## Important migration rule
This batch intentionally does not touch:
- knowledge documents
- reference documents
- files
- conversations/messages

It focuses only on:
- intake content
- fetch history
- review/governance events
- rating records

## Suggested run
```powershell
$env:ASSISTANT_LOCAL_RUNTIME_FILE=".manus/db/local_runtime_store.json"
pnpm exec tsx scripts/migrations/migrate_assistant_batch2.ts
```
