# Error Record — Knowledge Batch 04

**Date:** 2026-06-18

## Error / risk addressed

Recovered old DB knowledge records could be mistaken for approved/current Supabase knowledge.

## Cause

Batch 03 confirmed that substantial knowledge existed in the pre-Supabase database and source files. Without a review queue and approval matrix, these records could be imported too broadly, mixed with approved records, or exposed to chat before source verification.

## Affected files / scope

- `knowledge_batch_03_old_db_extracted/old_db_knowledge_register_extracted_sanitized.csv`
- `assistant.reference_documents`
- `assistant.knowledge_documents`
- `knowledge` chat visibility policy

## What failed or was intentionally blocked

- Direct import to Supabase: blocked.
- Automatic approval: blocked.
- Automatic chat eligibility: blocked.
- Production promotion: blocked.

## Resolution

Created a fail-closed review queue import plan and human approval matrix. All recovered records remain `pending_human_approval` and `is_chat_eligible=false` by default.

## Last stable baseline before this batch

`waqf_ai_model_hybrid_llm_admin_v44_knowledge_batch_03_old_db_reference_intake_2026_06_18.zip`
