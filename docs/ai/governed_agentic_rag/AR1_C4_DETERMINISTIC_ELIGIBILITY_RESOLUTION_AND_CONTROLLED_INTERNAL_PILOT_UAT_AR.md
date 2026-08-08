# UAT — AR1 C4 Deterministic Eligibility and Controlled Internal Pilot

## قبل البدء

- بيئة محلية فقط.
- `.env` محلي غير مدرج في baseline.
- لا تفعّل طبقة الحقوق ولا تنفذ SQL.
- شغّل `pnpm.cmd run check` و`pnpm.cmd run build` و`pnpm.cmd run verify:mega-batch-ar1-c4-deterministic-eligibility` أولًا.

## UAT إيجابي

1. شغّل C3 ثم افتح C4 في **نفس عملية الخادم**.
2. افتح `/knowledge#/admin/source-provenance-rights`.
3. تحقق من أحد المسارات الحتمية الظاهرة في بطاقة مادة مرشحة:
   - مرجع C4 مباشر للمعرفة، أو
   - إحالة C4 مباشرة عبر الوثيقة المرجعية، أو
   - مطابقة حتمية للعنوان/الرابط.
4. تحقق من `READY_FOR_OPERATOR_BINDING` ومرشح واحد على الأقل.
5. ابدأ بمادة واحدة، أدخل مرجع استخدام داخلي ومرجع حقوق/استخدام للجلسة، واختر T3 أو T4، ثم أنشئ جلسة AR1.
6. اسأل سؤالًا واضحًا من النص؛ النتيجة يجب أن تكون evidence-only مع citation أو تصعيد محكوم.
7. اسأل سؤالًا بلا دليل؛ المتوقع `INSUFFICIENT_EVIDENCE` وامتناع.
8. اضغط `إلغاء الجلسة ومسح الذاكرة` وتحقق من أن الجلسات النشطة تعود إلى صفر.

## UAT سلبي

- C3/C4 غير حديثين: `C3_C4_FRESH_EVIDENCE_REQUIRED_HOLD`.
- reference_document مرتبط بأكثر من معرفة واحدة: لا ينشئ مرشحًا من هذا المسار وتزداد `rejectedAmbiguousDirectAssociations` فقط.
- اختيار document ليس من C4 cohort: `AR1_BINDING_NOT_IN_CURRENT_C4_SELECTED_COHORT`.
- أكثر من 5 مواد، أو T2/T5، أو غياب المرجع/الإقرارات: رفض.
- لا توجد Network requests لكتابة source/rights/document/chunk/embedding/vector أو نشر Chat.

## قرار الإغلاق

نجاح UAT يعني `LOCAL_INTERNAL_AR1_PILOT_ACCEPTED` فقط. لا يعني Staging أو Production أو Chat عام أو تفعيل طبقة الحقوق.
