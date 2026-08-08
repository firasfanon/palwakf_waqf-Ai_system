# Knowledge Batch 05 — Full Recovered Records Database Import + Approval/Chat Publication Pack

## طبيعة الدفعة

هذه دفعة **تجهيز إدخال كامل إلى قاعدة البيانات + مسار اعتماد/ظهور للشات** فوق v45.

تم تعديل اتجاه Batch 04 بناءً على توجيه المالك: المطلوب ليس إبقاء السجلات في CSV/JSON فقط، بل إدخال **كل السجلات المستردة** داخل قاعدة البيانات كـ `review/import records`، مع توفير مسار صريح للاعتماد وظهور الشات.

## القرار

```text
KNOWLEDGE_BATCH_05_FULL_RECOVERED_RECORDS_DB_IMPORT_PACK_PREPARED
ALL_138_RECOVERED_RECORDS_INCLUDED_FOR_DATABASE_INSERT
PRIMARY_SQL_APPROVES_AND_MAKES_CHAT_VISIBLE_IF_OPERATOR_APPLIES_AS_IS
SAFE_FALLBACK_SQL_REVIEW_ONLY_INCLUDED
LIVE_SUPABASE_APPLY_NOT_EXECUTED_IN_CHATGPT_SANDBOX
PRODUCTION_NOT_APPROVED
```

## نطاق الإدخال

| البند | العدد |
|---|---:|
| إجمالي السجلات المستردة المضمنة في payload الإدخال | 138 |
| سجلات Hold السابقة المضمنة الآن | 2 |
| سجلات P4/Triage المضمنة الآن | 59 |
| SQL primary لإدخال + اعتماد + chat visibility | 1 |
| SQL safe fallback لإدخال فقط دون chat | 1 |
| تطبيق فعلي على Supabase من داخل هذه البيئة | 0 |

## الملفات التشغيلية

```text
sql_sandbox/knowledge_batch_05_full_database_import_approval_chat_pack/
  knowledge_batch_05_full_import_APPROVED_CHAT_VISIBLE_primary_operator_apply.sql
  knowledge_batch_05_full_import_REVIEW_ONLY_safe_fallback_operator_apply.sql
  knowledge_batch_05_post_apply_read_only_verification.sql
```

## تفسير مهم

ملف primary يحقق طلب الإدخال مع الاعتماد/الظهور:

```text
assistant.reference_documents.status='approved'
assistant.knowledge_documents.status='approved'
assistant.knowledge_documents.is_chat_eligible=true
```

أما ملف safe fallback فيدخل الجميع إلى `assistant.reference_documents` كـ `in_review` فقط ولا ينشئ `knowledge_documents`.

## لماذا لم يتم التطبيق الحي هنا؟

لا توجد في بيئة التنفيذ الحالية مفاتيح Supabase/Service Role أو اتصال مباشر بقاعدة PalWakf. لذلك تم تجهيز SQL تشغيل كامل، قابل للتطبيق بواسطة المشغّل على البيئة المقصودة، مع ملف تحقق read-only بعد التطبيق.
