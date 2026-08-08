# Knowledge Batch 04 — Supabase Import Operator Runbook

**Date:** 2026-06-18  
**Status:** Prepared only. Not executed.  
**DML status:** `NOT_APPLIED`.

## Arabic brief

هذا Runbook تشغيلي لإدخال صف المراجعة لاحقًا. لا يشغّل SQL في هذه الدفعة. الغرض منه منع الإدخال المباشر غير المحكوم، وتأكيد أن كل سجل يدخل أولًا كمرجع قيد المراجعة وليس كمعرفة معتمدة.

## Pre-apply gates

1. Confirm remote/staging Supabase target.
2. Confirm operator role and RLS/RBAC permissions.
3. Confirm backup/snapshot or rollback plan.
4. Confirm `assistant.reference_documents` and `assistant.knowledge_documents` schema shape.
5. Confirm review queue CSV hash.
6. Confirm `operator_ack=true` in the external deployment log.

## Import order

1. Load `review_queue_import_candidates_v1.csv` into a temporary staging table or ETL script outside production.
2. Import only non-HOLD and non-P4 rows as `assistant.reference_documents.status='in_review'`.
3. Set `authority_level` from `target_authority_level_if_approved`, but keep status as `in_review`.
4. Put old DB lineage fields into `metadata_json`.
5. Do not create `knowledge_documents` in the same step.
6. After human approval, create derived `knowledge_documents` with `is_chat_eligible=false` by default.
7. Only a separate approval action may set `is_chat_eligible=true`.

## Fail-closed rule

```text
If any review status, source identity, authority level, or reviewer chain is ambiguous, do not import the row.
```

## Verification queries after future apply

```sql
-- Expected: no direct approved/chat-eligible records from this import
select status, is_chat_eligible, count(*)
from assistant.knowledge_documents
group by status, is_chat_eligible
order by status, is_chat_eligible;

-- Expected: imported references, if any, start in review
select status, authority_level, count(*)
from assistant.reference_documents
group by status, authority_level
order by status, authority_level;
```

## Explicit non-authorization

This batch does not authorize production apply, destructive SQL, public schema writes, or Mega Batch 30.
