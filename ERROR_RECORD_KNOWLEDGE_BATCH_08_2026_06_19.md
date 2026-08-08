# Error Record — Knowledge Batch 08 — 2026-06-19

## Error / Risk
Old DB migration evidence is heterogeneous: INSERT SQL, JSON registries, SELECT snapshots, schema logs, failed query logs, and current Supabase-imported KB05A rows all overlap.

## Cause
The pre-Supabase database was not exported as a single canonical full dump in this session. Available evidence comes from old query logs and source files.

## Mitigation
- Stage all extracted payloads into `assistant.legacy_import_register` before final promotion.
- Use idempotent promotion checks by legacy key and title.
- Store supplemental SELECT rows separately under `knowledge_batch_08_observed_rows`.
- Defer page binding to KB09 after DB apply evidence is returned.

## Stable baseline before this batch
v56.

## New baseline after this batch
v57, pending operator apply evidence.
