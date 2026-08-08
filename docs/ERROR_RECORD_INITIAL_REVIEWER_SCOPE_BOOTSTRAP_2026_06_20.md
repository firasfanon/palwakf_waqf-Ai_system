# Error Record — Initial Reviewer Scope Bootstrap

- **Date:** 2026-06-20
- **Baseline before correction:** v64.1 Smart Tools 3 Reconciliation Gate Correction (pre-apply)
- **Repeated failure point:** `00B_KB58_KB08_DUPLICATE_TASK_CONSOLIDATION_OPERATOR_APPLY.sql`
- **Observed outcomes:**
  1. Placeholder UUID failure: `replace v_operator_auth_user_id...`
  2. Read-only entitlement lookup returned no rows.
  3. Full scope registry inspection returned no rows.
- **Root cause:** The trust-foundation schema created `assistant.knowledge_scope_assignments` but did not establish the initial review authority. The reconciliation script correctly required a scope assignment, leaving the first controlled operator unable to satisfy the gate.
- **Files affected:**
  - v64.1 `00B_KB58_KB08_DUPLICATE_TASK_CONSOLIDATION_OPERATOR_APPLY.sql`
  - New v64.2 `00AA_INITIAL_REVIEWER_SCOPE_BOOTSTRAP_OPERATOR_APPLY.sql`
  - New v64.2 `00AB_INITIAL_REVIEWER_SCOPE_BOOTSTRAP_READ_ONLY_VERIFICATION.sql`
  - New v64.2 `00B_KB58_KB08_DUPLICATE_TASK_CONSOLIDATION_OPERATOR_APPLY_V2.sql`
- **Remediation:** A one-time, identity-bound, review-only bootstrap. It fails closed if any scope assignment already exists, if the target auth user is absent, or if UUID/email verification differs.
- **Security boundary:** No publish/admin/all scope, no knowledge mutation, no source/citation mutation, no chat publication.
- **Post-fix evidence required:** `00AB` must return `BOOTSTRAP_VERIFIED_REVIEW_ONLY`; then v2 reconciliation plus v64.1 `00C` must verify the six-to-six task consolidation.
- **Stable baseline:** v64.1 remains the last pre-apply baseline. v64.2 is an additive pre-apply correction only.
