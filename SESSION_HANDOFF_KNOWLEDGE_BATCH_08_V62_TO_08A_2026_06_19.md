# Session Handoff — KB08 v62 to KB08A

## Current database evidence
- `assistant.legacy_import_register` exists.
- Main KB08 stage rows: 929.
- Observed supplemental stage rows: 66.
- Operational promotion completed: 17 main + 46 observed = 63.
- P1 knowledge/reference rows remain staged; this is safe.

## Mandatory next execution
Use the v62 replacement for `04_promote_p1_knowledge_reference_documents_OPERATOR_APPLY.sql` with `psql` and `ON_ERROR_STOP=1`, then run v62 `06_post_apply_read_only_verification.sql`.

## Do not do
- Do not use any pre-v62 step 04 file.
- Do not approve or enable chat eligibility during KB08 promotion.
- Do not alter Trust Foundation strict gate.

## Next batch
Knowledge Batch 08A — Supabase Apply Result Intake + Review-Only P1 Promotion Acceptance.
