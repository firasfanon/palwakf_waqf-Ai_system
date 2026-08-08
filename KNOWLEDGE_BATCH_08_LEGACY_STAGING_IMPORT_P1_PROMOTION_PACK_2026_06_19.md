# Knowledge Batch 08 — Legacy DB Staging Import + P1 Data Promotion Pack

## Nature
Assistant knowledge/data migration batch. This batch prepares operator-applied Supabase SQL for staging legacy DB content and promoting P1 records. It is not a production promotion and it was not executed against live Supabase from the ChatGPT sandbox.

## Decision
`KNOWLEDGE_BATCH_08_OPERATOR_STAGING_AND_P1_PROMOTION_PACK_PREPARED_LIVE_APPLY_PENDING`

## Inputs
- Base baseline: v56.
- KB07 extracted 929 payloads from old DB/JSON/SQL artifacts.
- KB08 also extracts 74 supplemental observed SELECT rows from old query logs.

## Scope
1. Stage all 929 KB07 payloads into `assistant.legacy_import_register` under `legacy_batch='knowledge_batch_08'`.
2. Stage supplemental observed rows under `legacy_batch='knowledge_batch_08_observed_rows'`.
3. Promote P1 knowledge/reference candidates to:
   - `assistant.reference_documents`
   - `assistant.knowledge_documents`
   - `assistant.knowledge_citations`
4. Stage P1 auxiliary page/operation data into `assistant.legacy_operational_records` for Knowledge Batch 09 page binding.

## Counts prepared

| Item | Count |
|---|---:|
| Main staging payloads | 929 |
| Supplemental observed rows | 74 |
| P1 rows from main staging | 893 |
| P1 knowledge/reference candidates | 876 |
| P1 auxiliary candidates | 17 |
| Review/domain-mapped rows | 36 |

## Operator SQL sequence

```text
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/00_OPERATOR_SEQUENCE_KNOWLEDGE_BATCH_08.md
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/01_preflight_read_only.sql
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/02_stage_all_929_legacy_payloads_OPERATOR_APPLY.sql
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/03_stage_supplemental_observed_rows_OPERATOR_APPLY.sql
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/04_promote_p1_knowledge_reference_documents_OPERATOR_APPLY.sql
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/05_promote_p1_auxiliary_operational_records_OPERATOR_APPLY.sql
sql_sandbox/knowledge_batch_08_legacy_staging_import_p1_promotion/06_post_apply_read_only_verification.sql
```

## Important rule
Staging is not the same as production approval. P1 promotion makes selected knowledge rows approved/chat-visible only inside the assistant knowledge corpus. It does not approve Mega Batch 30 and does not close 29A/RBAC/RLS.

## Next after apply evidence
Run `06_post_apply_read_only_verification.sql` and send the result. If accepted, proceed to:

```text
Knowledge Batch 08A — Supabase Apply Result Intake + P1 Promotion Acceptance
```

Then:

```text
Knowledge Batch 09 — Page Binding + Real Operations Enablement
```
