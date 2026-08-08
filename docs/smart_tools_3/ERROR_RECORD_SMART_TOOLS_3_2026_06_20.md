# Error / Gate Record — Smart Tools 3

> هذا السجل لا يختلق أخطاء تشغيل حي. يسجل القيود والبوابات المعروفة من مرحلة التحضير.

| رقم | الحالة أو سبب الإيقاف | الملفات/المسار | ما الذي لا يجوز فعله | العلاج / قرار التشغيل | آخر baseline مستقر |
|---|---|---|---|---|---|
| ER-ST3-01 | مهام `content_classification` التاريخية الست لم تظهر في ملخص v62 التفصيلي | `00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY.sql` | لا إنشاء بدائل ولا إلغاء/حذف بالافتراض | شغّل reconciliation read-only، طابق المهمة/الهدف/الدليل، ثم سجل قرارًا بشريًا لكل صف | KB08A Accepted 2026-06-20 |
| ER-ST3-02 | لا يجوز تحرير المعرفة لمجرد ربط citation أو تسجيل source | `01_HUMAN_REVIEW_OPERATIONS_V1_OPERATOR_APPLY.sql` | لا تغيير `is_chat_eligible=true` خارج RPC التحرير | يشترط مصدر رسمي verified + reference verified + citation verified + `assistant.publish` | KB08A Accepted 2026-06-20 |
| ER-ST3-03 | سجل KB08B قد ينقصه عنوان/محتوى/مصدر صالح | `02_KB08B_MAPPING_RESOLUTION_OPERATOR_APPLY.sql` | لا `promote_review` ببيانات ناقصة | اختر `map_existing` أو `defer` أو `quarantine` وسجل السند | KB08A Accepted 2026-06-20 |
| ER-ST3-04 | FAQ/Templates/Settings لا تملك owner binding canonical بعد | `03_KB09_PAGE_BINDING_REAL_OPERATIONS_OPERATOR_APPLY.sql` | لا تفعيلها من legacy staged | تبقى `prepared` أو `blocked` حتى ربط canonical معتمد | KB08A Accepted 2026-06-20 |
| ER-ST3-05 | لا تتوفر أدلة Supabase/Browser/RBAC في بيئة التجهيز | كل الحزمة | لا وسم الحزمة بأنها applied أو production-approved | تنفيذ operator sequence وحفظ أدلة SQL + UAT قبل تغيير القرار | Smart Tools 3 Pre-Apply 2026-06-20 |
| ER-ST3-06 | لا يوجد node_modules في الحزمة المؤرشفة | فحص build الكامل | لا الادعاء بأن `pnpm check` الكامل تم هنا | تم فحص syntax بـ TypeScript runtime؛ نفذ `pnpm.cmd run check` في بيئة المشروع بعد الاستعادة | Smart Tools 3 Pre-Apply 2026-06-20 |
