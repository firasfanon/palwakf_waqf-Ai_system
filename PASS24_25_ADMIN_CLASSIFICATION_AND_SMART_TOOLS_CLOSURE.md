# Pass 24 + Pass 25 — Admin Pages Classification + Smart Tools Functional Closure

التاريخ: 2026-06-14

## الهدف
الاستمرار وفق الخطة المرسومة دون فتح مسارات جانبية، عبر دفعتين متتاليتين:
1. **Pass 24**: فرز صفحات الإدارة إلى صفحات عاملة، صفحات تعرض Empty State، صفحات Stub، وصفحات تحتاج Backend أو توحيد صلاحيات.
2. **Pass 25**: إغلاق تشغيلي أوسع للأدوات الذكية نفسها، خصوصًا سجل التشغيل، مؤشرات التشغيل، وإمكانية تحويل نتائج الأدوات القانونية إلى وثائق معرفة للمراجعة.

## ما تم في Pass 24

### 1) إضافة لوحة تصنيف صفحات الإدارة
أضيفت صفحة جديدة:
- `client/src/pages/admin/AdminPagesClassification.tsx`

ومسار جديد:
- `/admin/page-classification`

### 2) توسيع سجل الإدارة المركزي
تم توسيع `adminRegistryV2` ليصبح يحمل توصيفًا تشغيليًا لكل صفحة أو مجموعة صفحات عبر:
- `lifecycle`
- `dataState`
- `note`

مع تصنيفات مثل:
- `operational`
- `empty_state_ready`
- `backend_pending`
- `stub_page`
- `access_restricted`

### 3) إنتاج قائمة فرز مركزية
تم إنشاء مشتق مركزي:
- `adminPageClassificationRecords`

ليُستخدم داخل لوحة التصنيف دون تكرار بيانات خارج `adminRegistryV2`.

## ما تم في Pass 25

### 1) مؤشرات تشغيل مركزية للأدوات الذكية
أضيفت دالة backend:
- `runtimeGetAiToolRunMetrics`

وأضيف endpoint:
- `aiTools.getRunMetrics`

لعرض:
- إجمالي التشغيلات
- حسب الأداة
- حسب الاعتماد
- حسب حالة التشغيل

### 2) إعادة فتح تشغيل ذكي بعد الرفض/الاعتماد
أضيفت دالة backend:
- `runtimeReopenAiToolRun`

وأضيف endpoint:
- `aiTools.reopenRun`

بحيث يمكن إعادة أي تشغيل إلى `pending` مع تسجيل event من نوع `reopened`.

### 3) توسيع تحويل النتائج إلى مسودة معرفة
كان التحويل إلى مسار المعرفة محصورًا في:
- `extract`
- `classify`
- `summarize`

وأصبح الآن يدعم أيضًا:
- `compare`
- `precedents`
- `predict`

وتم توسيع `buildKnowledgeDraftPayloadFromTool()` لصياغة محتوى مناسب لكل أداة قانونية.

### 4) تحديث صفحات الأدوات الذكية
تم تحديث:
- `CompareTool`
- `PrecedentsTool`
- `PredictTool`

لإضافة:
- عنوان مقترح للمسودة
- زر حفظ في مسار المعرفة
- ربط `toolRunId` بالحفظ

### 5) تحديث مركز الأدوات الذكية
تم تحديث:
- `AITools`
- `AIToolRuns`

بحيث تعرض:
- مؤشرات التشغيل
- العدادات حسب الأداة
- الانتقال إلى سجل التشغيل
- زر إعادة فتح في صفحة السجل
- ربط واضح بلوحة تصنيف الصفحات الإدارية

## الملفات المعدلة
- `client/src/lib/appRoutes.ts`
- `client/src/config/adminRegistryV2.ts`
- `client/src/pages/admin/AdminPagesClassification.tsx`
- `client/src/pages/AITools.tsx`
- `client/src/pages/AIToolRuns.tsx`
- `client/src/pages/CompareTool.tsx`
- `client/src/pages/PrecedentsTool.tsx`
- `client/src/pages/PredictTool.tsx`
- `server/runtimeRepository.ts`
- `server/routers.ts`

## النتيجة العملية
بعد هذه الدفعة أصبح لدينا:
- خارطة تشغيل واضحة لصفحات الإدارة بدل التعامل مع كل صفحة على أنها "منجزة" لمجرد أنها تفتح.
- سجل تشغيل أدوات أذكى وظيفيًا مع مؤشرات وإعادة فتح.
- توسعة حقيقية في الربط بين الأدوات القانونية ومسار المعرفة.
- استمرار العمل ضمن الإطار السيادي الجديد دون المساس بالجداول القديمة محل الجرد.

## المرحلة التالية حسب الخطة
الخطوة التالية بعد هذا الباتش هي:
- **Pass 26 — Admin Backend Wiring Review**

وتركز على:
- صفحات الإدارة المصنفة `backend_pending`
- صفحات الصلاحيات المقيدة
- تثبيت الحفظ والتشغيل الفعلي بدل الاكتفاء بـ Empty State أو Stub
