# Knowledge Batch 05 — Approval + Chat Visibility Policy

## القاعدة بعد تصحيح الطلب

كل السجلات المستردة تدخل قاعدة البيانات.

حسب طلب المالك، تم توفير ملف primary يجعل السجلات:

```text
stored_in_db=true
reference_status=approved
knowledge_status=approved
is_chat_eligible=true
```

## ضبط المخاطر

حتى عند نشرها للشات، كل سجل يحمل `metadata_json` يتضمن:

```text
batch=knowledge_batch_05
legacy_registry_key=<key>
db_record_kind=review_import_record
original_hold_or_triage_bucket=<bucket>
original_kb04_status=pending_human_approval
operator_warning=<warning>
```

هذا يعني أن السجل ظاهر للشات، لكنه يبقى قابلًا للتتبع والتمييز كمسترد من قاعدة قديمة.

## توصية تشغيلية

إذا كان الهدف سرعة تفعيل الشات الداخلي: استخدم primary.
إذا كان الهدف بوابة إنتاج عامة أو UAT سلبي: استخدم safe fallback أو فعّل primary على staging فقط أولًا.

## أثر Mega Batch 30

هذه الدفعة لا تفتح Mega Batch 30 وحدها. ما زال مطلوبًا:

```text
REMOTE_STAGING_EVIDENCE_PENDING
RBAC_RLS_NEGATIVE_UAT_PENDING
POST_APPLY_KB05_SQL_RESULT_PENDING
PRODUCTION_NOT_APPROVED
```
