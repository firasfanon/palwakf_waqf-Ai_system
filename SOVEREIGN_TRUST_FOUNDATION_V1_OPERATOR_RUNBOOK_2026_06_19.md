# Sovereign Trust Foundation v1 — Operator Runbook

## Apply order

Run the following scripts exactly in order from:

```text
sql_sandbox/sovereign_assistant_trust_foundation_v1/
```

1. `00_PRECHECK_READ_ONLY.sql`
2. `01_SCHEMA_SCOPES_WORKFLOWS_RLS_OPERATOR_APPLY.sql`
3. `02_BACKFILL_CLASSIFY_QUARANTINE_AND_CREATE_REVIEW_TASKS_OPERATOR_APPLY.sql`
4. `03_VIEWS_RPC_AND_READ_ONLY_GATES_OPERATOR_APPLY.sql`
5. `04_POST_APPLY_READ_ONLY_VERIFICATION.sql`

## Hard requirements

- Execute with a role allowed to create/alter objects under schema `assistant`.
- Preserve all pre-existing records. No delete is authorized.
- Do not bulk set `verification_status='verified'`.
- Do not manually re-enable chat visibility for `test`, `duplicate` or `quarantined` records.
- Do not grant `anon` / `authenticated` direct access to new Assistant trust tables or RPCs.

## Evidence required after application

Return the full output from `04_POST_APPLY_READ_ONLY_VERIFICATION.sql`, plus:

- count of `public_chat_candidates`;
- count of `verified_public_chat_candidates`;
- count of citation verification tasks;
- confirmation that `unsafe_test_or_quarantine_visible = 0`;
- a screenshot/API result of `knowledgeTrust.snapshot` after server restart.

## Role allocation for human review

| Workflow stage | Minimum role | Required outcome |
|---|---|---|
| source verification | knowledge admin + domain reviewer | issuer, canonical location, authority tier and dates confirmed |
| citation verification | domain reviewer | locator/excerpt matches retained reference |
| content classification | knowledge admin | production/review/test/duplicate/quarantined decision recorded |
| scope assignment | platform/assistant admin | public/internal/restricted scope justified |
| publication review | knowledge admin | chat eligibility and reviewer event recorded |

## Stop conditions

Stop and report rather than improvise if any SQL statement fails due to an existing schema variation, missing canonical table, unavailable service role, or unsafe post-apply count.
