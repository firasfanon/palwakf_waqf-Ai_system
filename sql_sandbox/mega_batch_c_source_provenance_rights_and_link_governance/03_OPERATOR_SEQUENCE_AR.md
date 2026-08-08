# Mega Batch C — تسلسل التطبيق الحاكم

## طبيعة الحزمة

هذه الحزمة تبني طبقة **سجل مصادر، إثبات منشأ، حقوق، وتاريخ روابط** داخل مخطط `assistant` فقط. لا تنشئ جداول في `public` ولا تعدل أي مصدر قائم تلقائيًا.

## الترتيب الإلزامي

1. طبّق حزمة الكود فقط، ثم نفذ `pnpm check` و`pnpm build` وفاحص Mega Batch C.
2. افتح صفحة `/admin/source-provenance-rights`: ستعمل للقراءة وتعرض أن طبقة الحقوق غير مفعلة.
3. نفذ `00_MEGA_BATCH_C_PREFLIGHT_READ_ONLY.sql` في Staging فقط واحفظ الناتج.
4. بعد مراجعة الناتج واعتماد منفصل، ينفذ المشغل `01_SCHEMA_RLS_RPC_OPERATOR_APPLY.sql` في Staging فقط.
5. نفذ `02_POST_APPLY_READ_ONLY_VERIFICATION.sql`.
6. تحقق من الصفحة: يجب أن تصبح عمليات الإضافة والتعديل والأرشفة متاحة فقط لصاحب `assistant.source.manage` أو Super Admin.
7. لا يتم تنفيذ Promotion أو Fetch أو Chat Release من هذه الحزمة.

## حظر ثابت

```text
NO_AUTOMATIC_REFETCH
NO_AUTOMATIC_RIGHTS_INFERENCE
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_HARD_DELETE_OF_REFERENCED_SOURCE
NO_PRODUCTION
```
