# Mega Batch 26 — precedents + predict backend closure

## طبيعة العمل
هذه الدفعة ليست تجميل واجهات، بل إغلاق backend للأداتين القانونيتين:
- precedents
- predict

## المشكلة التي عالجتها
الأداتان كانتا تعتمدان مباشرة على `getDb()` ثم تتوقفان فورًا عند غياب قاعدة البيانات المحلية برسالة:
`Database not available`

هذا كان يمنع:
- تشغيل الأداة
- حفظ run ناجح
- الانتقال إلى الربط المعرفي

## المعالجة
تم تعديل `server/legal-analysis.ts` بحيث يصبح تسلسل العمل كالتالي:
1. محاولة استخدام قاعدة البيانات المحلية إن كانت متاحة.
2. إذا لم تكن متاحة، يتم fallback إلى المعرفة السيادية المخزنة في `assistant.knowledge_documents` عبر `runtimeGetKnowledgeDocuments(...)`.
3. إذا لم تتوفر مواد داعمة كافية، تستمر الأداة في التحليل الحذر اعتمادًا على وصف القضية بدل الفشل المباشر.

## الملفات المعدلة
- `server/legal-analysis.ts`

## الهدف المتوقع بعد التطبيق
- `precedents` تنتقل من `failed` إلى `completed` بدل التوقف على Database not available.
- `predict` تنتقل من `failed` إلى `completed` على نفس النمط.
- بعد نجاح التشغيل يمكن اختبار `saveAsKnowledgeDraft` ثم التحقق من:
  - `assistant.ai_tool_runs`
  - `assistant.ai_tool_run_events`
  - `assistant.ai_tool_run_links`

## ملاحظة
هذه الدفعة تركز فقط على إغلاق backend للأداتين داخل نفس Mega Batch 26، دون فتح مسارات جانبية.
