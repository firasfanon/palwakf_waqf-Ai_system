# Sovereign Trust Foundation v1B — Post-Apply Verification SQL Fix

## Nature
Read-only verification hotfix only. No DDL, DML, RLS, role, UI, or production-gate change.

## Evidence received
- The v1A review-task query returned the expected open-workflow inventory.
- The strict v1A operator apply returned `Success. No rows returned`.
- The later read-only verification stopped with PostgreSQL `42601` at `from assistant.knowledge_documents kd`.

## Root cause
The verifier placed `count(*) from assistant.v_chat_retrieval_candidates_v1` inside the select list without a scalar-subquery wrapper. PostgreSQL therefore reached `from` where it expected the next select expression.

## Correction
`strict_public_chat_candidates` is now evaluated using:

```sql
(
  select count(*)
  from assistant.v_chat_retrieval_candidates_v1
) as strict_public_chat_candidates
```

## Required operator action
Rerun only:

`sql_sandbox/sovereign_assistant_trust_foundation_v1a_strict_gate/02_POST_APPLY_READ_ONLY_VERIFICATION.sql`

## Acceptance criteria
- `unverified_authority_chat_visible = 0`
- `source_not_verified_chat_visible = 0`
- `no_verified_citation_chat_visible = 0`
- `strict_public_chat_candidates` may be `0` until human source/citation verification is completed.

## Status
`V1A_OPERATOR_APPLY_EVIDENCE_RECEIVED_V1B_POST_APPLY_VERIFICATION_PENDING_CORRECTED_SQL_RESULT`
