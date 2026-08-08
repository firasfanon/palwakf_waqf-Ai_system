# Verification Notes — Knowledge Batch 08 — 2026-06-19

## Sandbox verification
- Parsed KB07 bulk SQL records: 929.
- Generated P1 promotion matrix: OK.
- Generated supplemental observed row extraction: 74 rows.
- ZIP creation and integrity will be checked after packaging.

## Live DB status
Not executed in ChatGPT sandbox because Supabase credentials/session are not available.

## Required operator verification after apply
Run:

```sql
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/06_post_apply_read_only_verification.sql
```

Expected staging baseline:

```text
knowledge_batch_08 stage rows = 929
```

Promotion counts may be lower than P1 candidates because idempotency intentionally skips rows already imported in KB05A or rows matching existing titles/legacy keys.
