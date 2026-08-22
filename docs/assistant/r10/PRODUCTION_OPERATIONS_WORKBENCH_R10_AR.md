# R10 — Production Operations Workbench & UX

## الهدف

تحويل PalWakf Assistant من مجموعة صفحات إدارية متفرقة إلى مساحة عمل يومية
تُظهر المهام والنتائج التي تحتاج فعلًا إلى إجراء.

## الأسطح اليومية

1. **مركز العمل** `/admin/dashboard`
   - مهام المراجعة المفتوحة.
   - مراجع قيد التحقق.
   - معرفة قيد المراجعة.
   - تشغيلات أدوات بانتظار الاعتماد.
   - آخر تشغيلات الأدوات.
   - متابعة آخر مساحة عمل.

2. **المساعد** `/admin/assistant`
   - يستخدم Chat الحقيقي الموجود في المشروع داخل Admin shell.

3. **مساحة المعرفة** `/admin/knowledge-workspace`
   - طابور مراجعة حقيقي.
   - `claimReviewTask` من داخل الـWorkbench.
   - تشغيلات أدوات تحتاج متابعة.
   - انتقال مباشر لملف المراجعة أو Run details.

4. **استوديو الأدوات** `/admin/tools`
   - الأدوات الست.
   - النتائج التي تحتاج متابعة.
   - تفاصيل backend/الحوكمة داخل جزء قابل للفتح فقط.

5. **البحث الموحد** `/admin/operations-search`
   - Knowledge search.
   - Knowledge sources.
   - AI tool runs.

## الملاحة

الـSidebar اليومي لا يعرض كل صفحات الإدارة. يعرض:
- العمل اليومي.
- المعرفة.
- الأدوات الذكية.
- البيانات الوقفية.

بقية الصفحات موجودة خلف:
`الحوكمة والإدارة المتقدمة`.

## عدم إنشاء نجاح وهمي

- لا mock actions.
- لا fake toast بدون mutation.
- لا اعتماد معرفة تلقائي.
- لا تحويل Tool Result إلى معرفة تلقائي.
- زر استلام المهمة يستخدم `knowledgeTrust.claimReviewTask`.
- فتح تشغيل أداة يستخدم Run ID المحفوظ.
- البحث يستخدم endpoints الفعلية الموجودة.

## Browser UAT — بوابة R10 الحالية

الـUAT الأول لـR10 **Read-Only فقط**. لا تنفذ أي action يحتمل كتابة Live DB.

### Flow A — مركز العمل / المعرفة
Dashboard → مساحة المعرفة → اختر مهمة لعرض التفاصيل فقط.
لا تضغط `استلام المهمة` ولا Review/Approve/Reject.

### Flow B — Tool runs
استوديو الأدوات → افتح Run موجودًا مسبقًا → Refresh → افتح Run نفسه.
لا تشغّل أداة جديدة في هذه البوابة.

### Flow C — Search surface
افتح البحث الموحد وتحقق من تحميل الشاشة ومصادر/Run bindings.
لا تنفذ Search submit في هذه البوابة لأن endpoint الحالي ممثل كـ tRPC mutation إلى أن تُثبت read-only semantics منفصلًا.

### Flow D — Assistant
افتح المساعد داخل Admin shell وتحقق من تحميل Chat/input/references surfaces.
لا ترسل سؤالًا في هذه البوابة.

### Flow E — Resume
افتح مساحة يومية read-only → ارجع Dashboard →
زر «متابعة آخر عمل» يعيد المستخدم إلى آخر route يومي.

### بوابة mutations اللاحقة
`claimReviewTask`، تشغيل أداة جديدة، إرسال Chat، Review/Approve/Reject،
وأي action آخر يمكن أن يكتب Live DB تحتاج تفويضًا صريحًا منفصلًا.

## Acceptance

- `pnpm.cmd run check` PASS.
- static verifier PASS.
- runtime readiness PASS عبر smoke read-only.
- browser console errors = 0 في flows read-only المستهدفة.
- 404/500 = 0 في المسارات الأساسية.
- `pnpm-lock.yaml` unchanged.
- no Git commit/push until final diff + Browser UAT.
