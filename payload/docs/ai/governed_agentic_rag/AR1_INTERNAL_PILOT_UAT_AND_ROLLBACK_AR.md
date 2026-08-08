# AR1 — Internal Pilot UAT and Rollback

## UAT إيجابي

1. نفّذ C3 من صفحة سجل المصادر.
2. افتح C4 وتأكد أن `selectedControlledMetadataPilot` غير فارغة ضمن TTL نفسه.
3. افتح سطح AR1 في صفحة سجل المصادر نفسها.
4. تحقق من ظهور `READY_FOR_OPERATOR_BINDING` و1–5 مواد مرتبطة من C4.
5. اختر مادة أو أكثر، وأدخل مراجع الاعتماد، وأكّد الاستخدام الداخلي وحدود النموذج.
6. أنشئ جلسة AR1.
7. اطرح سؤالًا له تطابق واضح مع عنوان/نص مادة مختارة.
8. تحقق من ظهور citation أو evidence-only response، ومن عدم وجود أي public release.

## UAT سلبي (Negative UAT)

- قبل C3/C4 الحديث: يجب إظهار `C3_C4_FRESH_EVIDENCE_REQUIRED_HOLD` وعدم إنشاء جلسة.
- محاولة اختيار document غير مرتبط بـC4 selected cohort: يجب رفضها بـ`AR1_BINDING_NOT_IN_CURRENT_C4_SELECTED_COHORT`.
- محاولة اختيار أكثر من 5 مواد: يجب رفضها.
- محاولة مستوى T2 أو T5: يجب رفضها.
- ترك `rightsApprovalRef` أو مرجع الاستخدام الداخلي فارغًا: يجب رفض بدء الجلسة.
- سؤال بلا تطابق: يجب إرجاع `INSUFFICIENT_EVIDENCE` مع امتناع.
- خروج النموذج عن الاستشهادات أو احتواؤه توصية/نتيجة قانونية: يجب تصعيده وتحويل الناتج إلى evidence-only.
- عدم تفعيل `AR1_INTERNAL_PILOT_LLM_ENABLED=1`: يجب أن يعمل المسار كـevidence-only دون اتصال Web.

## دليل Network/Console

- لا توجد DNS/HTTP C3 requests عند فتح أو بدء AR1؛ C3 لا يعمل إلا بزر C3 السابق.
- لا توجد requests لرفع ملفات أو كتابة مصدر/حق أو embedding/vector.
- Console بلا أخطاء عند فتح surface، وإنشاء الجلسة، والسؤال، والـrollback.

## Rollback

1. اضغط `إلغاء الجلسة ومسح الذاكرة`.
2. تحقق من رسالة نجاح rollback.
3. أعد طلب events أو سؤال لنفس `sessionId`; النتيجة المطلوبة `AR1_PILOT_SESSION_NOT_ACTIVE_OR_EXPIRED`.
4. أعد تحميل الصفحة أو أعد تشغيل الخادم؛ لا يجب أن تبقى الجلسة.

## عدم اعتبار UAT إذن إنتاج

نجاح AR1 لا يفتح Chat العام ولا يمثل promotion للإنتاج. المطلوب لاحقًا قرار مستقل لإطلاق داخلي مراقب ثم تقييم Production منفصل.
