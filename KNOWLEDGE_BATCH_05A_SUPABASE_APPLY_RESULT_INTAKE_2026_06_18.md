# Knowledge Batch 05A — Supabase Apply Result Intake + Approval/Chat Visibility Evidence Acceptance

Date: 2026-06-18  
Baseline input: `waqf_ai_model_hybrid_llm_admin_v46_knowledge_batch_05_full_recovered_records_db_import_approval_chat_pack_2026_06_18.zip`  
Baseline output: `waqf_ai_model_hybrid_llm_admin_v47_knowledge_batch_05a_supabase_apply_result_intake_approval_chat_visibility_2026_06_18.zip`

## Nature of this batch

This is an evidence-intake and baseline-update batch. It records the operator-supplied Supabase apply result for Knowledge Batch 05.

It is not a new SQL authoring batch, not a destructive migration, and not a production promotion.

## Operator-supplied primary apply evidence

| payload_records | newly_inserted_reference_documents | newly_inserted_knowledge_documents | newly_inserted_citations | chat_visible_on_import | approved_on_import |
|---:|---:|---:|---:|---|---|
| 138 | 138 | 138 | 138 | true | true |

## Operator-supplied second run / fallback / idempotency evidence

| payload_records | newly_inserted_reference_documents | newly_inserted_knowledge_documents | newly_inserted_citations | chat_visible_on_import | approved_on_import |
|---:|---:|---:|---:|---|---|
| 138 | 0 | 0 | 0 | false | false |

Interpretation: the first result is accepted as the successful primary import. The second result is accepted as a no-op follow-up/fallback/idempotency signal. It does not negate the primary import evidence.

## Sample chat visibility evidence supplied by operator

The operator supplied a sample of imported rows showing `status=approved` and `is_chat_eligible=true`, including:

| title | status | is_chat_eligible | legacy_registry_key |
|---|---|---|---|
| Minimal Test Document | approved | true | 611cb3c8f1b0 |
| إدارة الأوقاف في عهد الانتداب البريطاني | approved | true | 8e01286311db |
| نظام ملكية الأراضي في العهد العثماني | approved | true | 0e5facccad08 |
| إدارة وتنمية أموال الوقف - ماجد أبو رخية | approved | true | 76a27fa90a93 |
| الإشراف المعاصر على العقارات الوقفية | approved | true | 503e280d679e |
| الوقف الإسلامي: تطوره، إدارته، تنميته - منذر قحف | approved | true | 439f0f853ee9 |
| تعليمات لجان رعاية المساجد رقم (2) لسنة 2023م | approved | true | a1d9ff7de15e |
| مهام وزارة الأوقاف والشؤون الدينية الفلسطينية | approved | true | e6a43e67707f |
| قانون الأوقاف الأردني - المادة 3: الوقف الذري | approved | true | 606553700800 |
| نظام الأوقاف في التطبيق المعاصر - عبد الله بن ناصر السدحان | approved | true | fd24d717947c |
| إدارة الأوقاف في عهد الانتداب البريطاني | approved | true | a4459c8e000f |
| الأوقاف والسياسة في مصر - إبراهيم البيومي غانم | approved | true | 95100ac3c3f4 |
| تاريخ إدارة الأوقاف في فلسطين | approved | true | 730f90ef94c7 |
| أحكام الوقف في الشريعة الإسلامية - محمد عبيد الكبيسي | approved | true | 204d6aec31d2 |
| إحياء الوقف المتعطل - الأحكام | approved | true | 413fcc96ae46 |
| الوقف الإسلامي بين النظرية والتطبيق - حسن عبد الله الأمين | approved | true | a329b239daec |
| النظام القانوني للأراضي الأميرية في فلسطين | approved | true | 28a683b1ed0d |
| حق التصرف الوارد على الأراضي الأميرية وفقاً للتشريعات النافذة في فلسطين | approved | true | 812f3d50bc3c |
| ديار بئر السبع: جنوب فلسطين العثماني - الأرض والمجتمع والدولة | approved | true | a6c95a9cbd11 |
| سجلات الطابو العثماني - القدس | approved | true | 549f582fefcb |

## Accepted outcome

- `payload_records=138` accepted.
- `newly_inserted_reference_documents=138` accepted.
- `newly_inserted_knowledge_documents=138` accepted.
- `newly_inserted_citations=138` accepted.
- `approved_on_import=true` accepted for the primary import.
- `chat_visible_on_import=true` accepted for the primary import.
- No destructive SQL evidence was supplied or inferred.
- Production remains not approved.

## Decision

`KNOWLEDGE_BATCH_05A_SUPABASE_APPLY_EVIDENCE_ACCEPTED_APPROVED_CHAT_VISIBLE_138_CONFIRMED`

## Residual gates

- Remote staging evidence remains pending unless separately supplied.
- RBAC/RLS negative UAT remains pending unless separately supplied.
- Runtime `/knowledge#/chat` answer-quality evidence remains pending.
- Mega Batch 30 remains blocked until staging/RBAC/RLS and runtime knowledge behavior are accepted.
