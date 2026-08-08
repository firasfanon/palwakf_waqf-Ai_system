# Knowledge Batch 08 — Operator SQL Sequence

## Nature
Operator-applied Supabase migration pack. It was prepared in ChatGPT sandbox but not executed here.

## Required order

1. `01_preflight_read_only.sql`
2. `02_stage_all_929_legacy_payloads_OPERATOR_APPLY.sql`
3. `03_stage_supplemental_observed_rows_OPERATOR_APPLY.sql` optional but recommended
4. `04_promote_p1_knowledge_reference_documents_OPERATOR_APPLY.sql`
5. `05_promote_p1_auxiliary_operational_records_OPERATOR_APPLY.sql`
6. `06_post_apply_read_only_verification.sql`

## Expected core counts

- Main staging payloads: 929 under `legacy_batch='knowledge_batch_08'`.
- Supplemental observed rows: 74 under `legacy_batch='knowledge_batch_08_observed_rows'`.
- P1 candidates from main staging: 893.
- P1 knowledge/reference candidates: 876.

## Stop conditions

Stop and report results if any required table is missing, or if staging count is far below 929.
