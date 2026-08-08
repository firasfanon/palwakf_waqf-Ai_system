# Sovereign Assistant Trust Foundation v1 — Operator Sequence

## Nature

This is a governed data/runtime hardening pack for the Assistant only. It does not promote production and it does not automatically claim human verification.

## Required order

1. `00_PRECHECK_READ_ONLY.sql`
2. `01_SCHEMA_SCOPES_WORKFLOWS_RLS_OPERATOR_APPLY.sql`
3. `02_BACKFILL_CLASSIFY_QUARANTINE_AND_CREATE_REVIEW_TASKS_OPERATOR_APPLY.sql`
4. `03_VIEWS_RPC_AND_READ_ONLY_GATES_OPERATOR_APPLY.sql`
5. `04_POST_APPLY_READ_ONLY_VERIFICATION.sql`

## Required evidence to return

- All result sets from `04_POST_APPLY_READ_ONLY_VERIFICATION.sql`.
- Confirmation that `unsafe_test_or_quarantine_visible = 0`.
- Counts of `verified` vs `linked` citations.
- Counts of open review tasks by stage.

## Stop conditions

Stop without attempting an ad-hoc workaround if:

- any Assistant canonical table is missing;
- the executor cannot create objects under schema `assistant`;
- RLS/GRANT behaviour conflicts with the approved service-role runtime;
- the safety result shows test/duplicate/quarantined records still chat-visible.
