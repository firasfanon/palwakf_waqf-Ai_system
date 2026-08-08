# Pass 20 — Big Batch Smart Tools Operations Center

التاريخ: 2026-06-08

## الهدف
تنفيذ دفعة كبيرة على الأدوات الذكية نفسها، لا على الواجهة فقط، بحيث تصبح الأدوات:
- محفوظة سياديًا في `assistant.ai_tool_runs`
- قابلة للمراجعة والاعتماد
- مرتبطة بمسار تشغيل موحد داخل `/admin/tools`
- مزودة بمركز تشغيل وسجل نتائج بدل أن تبقى مخرجات متفرقة داخل الصفحات

## ما تم تنفيذه

### 1) توسيع التخزين السيادي للأدوات
تم توسيع الحفظ ليشمل الأدوات التالية:
- `extract`
- `summarize`
- `classify`
- `compare`
- `precedents`
- `predict`

كل أداة أصبحت تحفظ:
- `ai_tool_runs`
- `ai_tool_run_events`

أما الربط بـ `knowledge_documents` فما زال عبر `saveAsKnowledgeDraft` للأدوات المناسبة (`extract`, `summarize`, `classify`) باستخدام `ai_tool_run_links`.

### 2) إضافة مركز تشغيل سيادي جديد
تم إنشاء صفحة جديدة:
- `client/src/pages/AIToolRuns.tsx`

وتعرض:
- قائمة التشغيلات
- فلاتر حسب الأداة/الحالة/الاعتماد
- تفاصيل التشغيل المحدد
- الأحداث المرتبطة
- الروابط المرتبطة
- اعتماد أو رفض التشغيل

### 3) توسيع واجهات الـ API
أضيفت داخل `aiToolsRouter`:
- `listRuns`
- `getRunDetails`
- `reviewRun`

وأضيفت في `runtimeRepository`:
- `runtimeListAiToolRuns`
- `runtimeGetAiToolRunDetails`
- `runtimeUpdateAiToolRunReview`

### 4) تحسين صفحات الأدوات نفسها
تم تحديث الصفحات التالية:
- `ExtractTool`
- `SummarizeTool`
- `ClassifyTool`
- `CompareTool`
- `PrecedentsTool`
- `PredictTool`

بحيث تعرض بعد النجاح:
- رسالة أن التشغيل حُفظ سياديًا
- `toolRunId`
- زرًا مباشرًا إلى سجل التشغيل والاعتماد

### 5) توسيع الـ routing
تمت إضافة route جديد:
- `/admin/tools/runs`

مع ربطه في:
- `APP_ROUTES`
- `adminRegistryV2`
- `AITools`

### 6) تحديث نقطة الدخول للأدوات
تمت إضافة بطاقة جديدة في صفحة `AITools`:
- **سجل التشغيل والاعتماد**

كما تم تحديث `ToolsGuide` ليشير إلى وجود سجل تشغيل سيادي للأدوات.

## الملفات المعدلة
- `server/runtimeRepository.ts`
- `server/routers.ts`
- `client/src/lib/appRoutes.ts`
- `client/src/config/adminRegistryV2.ts`
- `client/src/pages/AITools.tsx`
- `client/src/pages/AIToolRuns.tsx` (جديد)
- `client/src/pages/ExtractTool.tsx`
- `client/src/pages/SummarizeTool.tsx`
- `client/src/pages/ClassifyTool.tsx`
- `client/src/pages/CompareTool.tsx`
- `client/src/pages/PrecedentsTool.tsx`
- `client/src/pages/PredictTool.tsx`
- `client/src/pages/ToolsGuide.tsx`

## تحقق فني
تم التحقق نحويًا من الملفات غير TSX عبر:
- `node --experimental-strip-types --check server/routers.ts`
- `node --experimental-strip-types --check server/runtimeRepository.ts`
- `node --experimental-strip-types --check client/src/config/adminRegistryV2.ts`
- `node --experimental-strip-types --check client/src/lib/appRoutes.ts`

أما ملفات `.tsx` فتمت مراجعتها يدويًا في هذه البيئة لأن `tsc` الكامل غير متاح محليًا داخل الحزمة الحالية.

## الخطوة التالية الصحيحة
1. تشغيل الأدوات الست فعليًا من `/admin/tools`
2. فحص جدول `assistant.ai_tool_runs`
3. تجربة اعتماد تشغيل واحد ورفض تشغيل واحد من `/admin/tools/runs`
4. بعد ذلك الانتقال إلى دفعة:
   - Tool Stability + Review Closure
   - أو Knowledge Uplift Phase 1
