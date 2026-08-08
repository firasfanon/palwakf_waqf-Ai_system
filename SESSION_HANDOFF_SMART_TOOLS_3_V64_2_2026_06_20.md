# Session Handoff — Smart Tools 3 v64.2

## Exact resumption point
The KB58/KB08 duplicate task consolidation is **not applied**. The scope registry was verified empty. The intended initial reviewer account is bound by UUID/email in the v64.2 scripts.

## What was observed
- Reconciliation preflight: 12 historical tasks for 6 logical `knowledge_document` targets.
- Six KB58 quarantine tasks and six KB08 classification tasks were open for the same six documents.
- Original reconciliation script correctly blocked because its placeholder operator UUID was not replaced.
- Scope lookup returned zero matching rows; full table inspection returned zero rows.

## Correct next execution sequence
1. Run v64.2 `00AA_INITIAL_REVIEWER_SCOPE_BOOTSTRAP_OPERATOR_APPLY.sql` in Staging.
2. Run v64.2 `00AB_INITIAL_REVIEWER_SCOPE_BOOTSTRAP_READ_ONLY_VERIFICATION.sql`.
3. Run v64.2 `00B_KB58_KB08_DUPLICATE_TASK_CONSOLIDATION_OPERATOR_APPLY_V2.sql`.
4. Run v64.1 `00C_POST_CONSOLIDATION_READ_ONLY_VERIFICATION.sql`.
5. Only when the reconciliation decision is verified, resume v64 starting at `01_HUMAN_REVIEW_OPERATIONS_V1_OPERATOR_APPLY.sql`.

## Non-negotiable controls
- No direct client DML to assistant knowledge tables.
- No automatic approvals or releases.
- `assistant.publish` must be granted separately later with independent evidence.
- Production remains blocked pending staging runtime, browser, and negative RBAC/RLS evidence.

## Current status
```text
BOOTSTRAP_PATCH_PREPARED_NOT_APPLIED
RECONCILIATION_NOT_APPLIED
LIVE_APPLY_PENDING
PRODUCTION_NOT_APPROVED
```
