# Knowledge Batch 05 — Operator Runbook

## الهدف

إدخال كل السجلات المستردة من قاعدة المعرفة القديمة إلى Supabase.

## الخيار الأساسي — حسب طلب المالك

شغّل الملف:

```text
sql_sandbox/knowledge_batch_05_full_database_import_approval_chat_pack/knowledge_batch_05_full_import_APPROVED_CHAT_VISIBLE_primary_operator_apply.sql
```

هذا ينفذ:

1. إنشاء/استرجاع source باسم KB05.
2. إدخال كل السجلات الـ 138 إلى `assistant.reference_documents`.
3. إنشاء `assistant.knowledge_documents` مشتقة لكل سجل.
4. ضبط `status='approved'`.
5. ضبط `is_chat_eligible=true`.
6. إنشاء citation ذاتي بين المعرفة والمرجع حيث يتوفر جدول `assistant.knowledge_citations`.

## خيار احتياطي آمن

شغّل الملف التالي فقط إذا قرر المشغّل عدم فتح الشات فورًا:

```text
sql_sandbox/knowledge_batch_05_full_database_import_approval_chat_pack/knowledge_batch_05_full_import_REVIEW_ONLY_safe_fallback_operator_apply.sql
```

هذا يدخل الجميع إلى DB، لكنه لا ينشر للشات.

## تحقق بعد التشغيل

شغّل:

```text
sql_sandbox/knowledge_batch_05_full_database_import_approval_chat_pack/knowledge_batch_05_post_apply_read_only_verification.sql
```

## شرط قبول الدفعة بعد التطبيق

يُقبل التطبيق إذا أعاد التحقق:

```text
kb05_reference_documents = 138
kb05_knowledge_documents = 138 في وضع primary
approved + is_chat_eligible=true = 138 في وضع primary
```

في وضع safe fallback:

```text
kb05_reference_documents = 138
kb05_knowledge_documents = 0
```
