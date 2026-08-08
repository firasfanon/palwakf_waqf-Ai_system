# Mega Batch C — Source Provenance, Rights and Link Governance

## نبذة عربية

تضيف هذه الدفعة صفحة إدارية اسمها **سجل المصادر وحقوق النشر**. تعرض المصدر، الرابط الحالي، تاريخ الروابط، حالة الحقوق، وسياسة الاستخدام، ثم تعرض تحت المصدر قائمة المواد المرجعية والمعرفة المشتقة المرتبطة به بالمعرف السيادي `source_id`.

## ما يفعله تطبيق الكود

- يضيف route: `/admin/source-provenance-rights`.
- يضيف صفحة قراءة إدارية تجمع `assistant.knowledge_sources` مع `reference_documents` و`knowledge_documents`.
- يضيف محرك تواصل server-side فقط مع Supabase.
- يضيف SQL جاهزًا للتطبيق الحاكم لاحقًا في `sql_sandbox/mega_batch_c_source_provenance_rights_and_link_governance/`.

## ما لا يفعله تطبيق الكود

- لا ينفذ SQL.
- لا يضيف أو يغير أو يؤرشف مصدرًا تلقائيًا.
- لا يجلب صفحات خارجية.
- لا يستنتج تراخيص أو أذونات تلقائيًا.
- لا يغير حالة مراجعة أو اعتماد أو أهلية Chat/RAG.
- لا يحذف أي مصدر أو مادة.

## بوابة الحالة

قبل SQL، تعمل الصفحة في وضع **قراءة فقط** وتعرض أن طبقة الحقوق غير مفعلة. بعد تنفيذ SQL في Staging وتوثيق نجاحه، تصبح الأزرار متاحة فقط لصاحب `assistant.source.manage` أو Super Admin.

## اختبار الكود

```powershell
pnpm.cmd run check
pnpm.cmd run build
pnpm.cmd run verify:mega-batch-c-source-provenance-rights
```

## التطبيق الحاكم للبيانات

لا تنفذ `01_SCHEMA_RLS_RPC_OPERATOR_APPLY.sql` إلا بعد تنفيذ ملف preflight وحفظ دليل Staging مستقل. انظر `03_OPERATOR_SEQUENCE_AR.md`.
