# Error Record — Knowledge Batch 03

**Date:** 2026-06-18  
**Baseline in:** v43  
**Last stable baseline before this batch:** `waqf_ai_model_hybrid_llm_admin_v43_sovereign_batch_02_knowledge_uplift_review_approval_closure_2026_06_18.zip`

## 1) Issue

في الفحص الأولي تم النظر إلى `knowledge_data.zip` فقط، وظهر أنه يحتوي ملفين مطابقين لما هو موجود داخل v43.  
تنبيه المستخدم أوضح أن سجل المعرفة موجود أيضًا داخل ملفات/سجلات قاعدة البيانات السابقة قبل التحول إلى Supabase.

## 2) السبب

نطاق الفحص الأولي كان محدودًا بمدخل الرفع المباشر، ولم يشمل `.manus/db/` ولا ملفات seed/source القديمة.

## 3) الملفات التي عولجت/راجعت

- `.manus/db/db-query-*.json`
- `new_references.json`
- `scripts/basic_references.json`
- `scripts/additional_references.json`
- `research_data/knowledge_base.json`
- `research_data/jerusalem_land_references.json`
- `insert_jerusalem_refs.sql`
- `scripts/seed-knowledge.sql`

## 4) ما فشل

لا يوجد فشل compile أو runtime.  
الفشل كان **نطاق فحص غير كافٍ** قبل توجيه المستخدم.

## 5) الحل

- توسيع الفحص ليشمل سجلات DB القديمة قبل Supabase.
- استخراج Register مطهّر ومصنف.
- عدم استخدام error query logs كمدخل اعتماد.
- تحويل المخرجات إلى backlog مراجعة وليس معرفة معتمدة.

## 6) القرار

```text
OLD_DB_SCOPE_MISSED_IN_INITIAL_SCAN_CORRECTED
SANITIZED_REGISTER_EXTRACTED
NO_DB_APPLY
PRODUCTION_NOT_APPROVED
```
