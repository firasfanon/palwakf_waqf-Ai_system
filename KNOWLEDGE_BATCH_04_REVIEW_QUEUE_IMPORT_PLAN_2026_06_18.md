# Knowledge Batch 04 — Review Queue Import Plan + Human Approval Matrix

**Date:** 2026-06-18  
**Source baseline:** `waqf_ai_model_hybrid_llm_admin_v44_knowledge_batch_03_old_db_reference_intake_2026_06_18.zip`  
**Source register:** `knowledge_batch_03_old_db_extracted/old_db_knowledge_register_extracted_sanitized.csv`  
**Decision:** `KNOWLEDGE_BATCH_04_REVIEW_QUEUE_IMPORT_PLAN_AND_HUMAN_APPROVAL_MATRIX_PREPARED_NO_IMPORT_APPLIED`

## Arabic brief

هذه دفعة **خطة إدخال صف مراجعة + مصفوفة اعتماد بشرية**. لا تنفذ DDL/DML على Supabase، ولا تعتمد أي مرجع، ولا تفتح أي سجل للشات. الهدف هو تحويل السجل المسترد من قاعدة البيانات القديمة إلى Queue حوكمي واضح يمكن لفريق المعرفة/القانون/الإدارة مراجعته قبل أي إدخال فعلي.

## Governing rule

```text
Recovered old DB knowledge is not approved knowledge.
All recovered records enter human review first.
Reference documents are imported before derived knowledge documents.
Knowledge documents are not chat-visible unless status='approved' and is_chat_eligible=true.
```

## Source facts from Batch 03

| Metric | Count |
|---|---:|
| Total recovered review candidates | 138 |
| P1/P2/P3 import-plan candidates | 77 |
| Triage-only candidates | 59 |
| Hold/excluded candidates | 2 |
| Supabase imports applied in this batch | 0 |
| Chat-eligible records created in this batch | 0 |

## Import stages

| Stage | Meaning | Default target | Chat status |
|---|---|---|---|
| Stage 01 | Legal/primary official references | `assistant.reference_documents` as `in_review` only | `false` |
| Stage 02 | Fiqh, official, ministry/admin candidates | `assistant.reference_documents` as `in_review` only | `false` |
| Stage 03 | Supporting/historical references | `assistant.reference_documents` as `in_review` only, supporting only | `false` |
| Stage 04 | Triage-only uncertain records | no import; review queue only | `false` |
| Hold | excluded/test/non-authoritative | no import | `false` |

## Bucket summary

| Bucket | Count | Required reviewers | Default action |
|---|---:|---|---|
| `HOLD_EXCLUDED_DO_NOT_IMPORT` | 2 | senior_knowledge_approver;knowledge_admin | Hold/no import |
| `P1_LEGAL_PRIMARY_REFERENCE_REVIEW` | 35 | legal_reviewer;senior_knowledge_approver;knowledge_admin | Reference document in-review only |
| `P2_FIQH_AUTHORITY_REVIEW` | 2 | fiqh_reviewer;senior_knowledge_approver;knowledge_admin | Reference document in-review only |
| `P2_MINISTRY_ADMINISTRATIVE_REVIEW` | 14 | ministry_domain_owner;knowledge_admin;senior_knowledge_approver | Reference document in-review only |
| `P2_OFFICIAL_REFERENCE_REVIEW` | 4 | domain_reviewer;knowledge_admin;senior_knowledge_approver | Reference document in-review only |
| `P3_HISTORICAL_SUPPORTING_REVIEW` | 5 | historical_reviewer;knowledge_admin | Reference document in-review only |
| `P3_SUPPORTING_REFERENCE_REVIEW` | 17 | domain_reviewer;knowledge_admin | Reference document in-review only |
| `P4_PUBLIC_WEB_TRIAGE_REQUIRED` | 1 | knowledge_admin;source_verification_reviewer | Triage/no import until reclassified |
| `P4_TRIAGE_REQUIRED` | 58 | knowledge_admin;triage_reviewer | Triage/no import until reclassified |

## Mandatory import sequence

1. **Pre-import source verification**
   - Confirm title, source, publisher/authority, and jurisdiction.
   - Reject or hold placeholder/test records.
   - Mark missing-source records as blocked until a source is supplied.

2. **Reference document intake only**
   - Import approved-for-review candidates to `assistant.reference_documents` with `status='in_review'`.
   - Do not create final `assistant.knowledge_documents` yet.
   - Store legacy origin details in `metadata_json`.

3. **Human review and decision**
   - Legal reviewer handles law/Majalla/binding material.
   - Fiqh reviewer handles jurisprudence.
   - Ministry/domain owner handles administrative/procedural material.
   - Knowledge admin records completeness, duplicates, and source quality.

4. **Derived knowledge creation**
   - Only after reference approval, create `assistant.knowledge_documents` as a derived/citable record.
   - Initial derived status may be `draft` or `in_review`, never directly `approved` unless a formal approval event exists.

5. **Chat eligibility gate**
   - Chat visibility requires both:
     - `status='approved'`
     - `is_chat_eligible=true`
   - Supporting/historical records must be clearly labelled as non-binding context.

## Non-goals

- No Supabase DML applied.
- No schema change.
- No production approval.
- No RBAC/RLS staging evidence intake.
- No Mega Batch 30.

## Outputs

- `knowledge_batch_04_review_queue/review_queue_import_candidates_v1.csv`
- `knowledge_batch_04_review_queue/review_queue_import_candidates_v1.json`
- `knowledge_batch_04_review_queue/review_queue_bucket_summary_v1.csv`
- `knowledge_batch_04_review_queue/review_queue_summary_v1.json`
- `KNOWLEDGE_BATCH_04_HUMAN_APPROVAL_MATRIX_2026_06_18.md`
- `KNOWLEDGE_BATCH_04_SUPABASE_IMPORT_OPERATOR_RUNBOOK_2026_06_18.md`
