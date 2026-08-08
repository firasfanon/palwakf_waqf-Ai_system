# SESSION UPDATE — Review + Approval Trace / Grounding + Citations / Smart Tools

## ما أُغلق في هذه الدفعة

### 1) Review + Approval Trace — إغلاق عملي
- جعل إنشاء وثائق المعرفة الجديدة يتم محليًا عبر `localRuntimeStore` للحفاظ على أثر المراجعة الكامل.
- دمج الوثائق المحلية مع وثائق DB fallback بدل الاعتماد على مسار واحد فقط.
- تحسين أثر التعديل في `updateKnowledgeDocument` بإضافة trace عند تعديل الحقول الأساسية.
- إضافة إنشاء وثيقة معرفة من أدوات ذكية مباشرة إلى مسار `review_only` مع trace واضح.
- إظهار منشأ الوثيقة في `ManageKnowledge` و`KnowledgeDetails` عندما تكون آتية من أداة ذكية.

### 2) Grounding + Citations — تقوية عملية
- تقوية `buildGroundingReferences` لاختيار ملف/اقتباس أولي أفضل.
- تقوية `extractRelevantContext` لتقديم مقتطفات الاستشهاد قبل غيرها.
- إضافة `ensureGroundedAnswer` لضمان وجود:
  - إحالات داخل النص مثل `[مرجع 1]`
  - قسم `المراجع المعتمدة` حتى لو لم يلتزم النموذج تلقائيًا.
- إضافة `grounding boost` يرفع الوثائق ذات الاقتباسات والملفات ونسخ الاعتماد الأعلى.

### 3) ربط Smart Tools بمسار المعرفة
- إضافة `aiToolsRouter` فعليًا داخل `server/routers.ts`.
- دعم:
  - `aiTools.classify`
  - `aiTools.extract`
  - `aiTools.summarize`
  - `aiTools.saveAsKnowledgeDraft`
- تحديث صفحات:
  - `ClassifyTool`
  - `ExtractTool`
  - `SummarizeTool`
  بحيث يمكن حفظ ناتج الأداة كوثيقة معرفة بحالة `review_only`.

## الملفات المعدلة
- `server/localRuntimeStore.ts`
- `server/runtimeRepository.ts`
- `server/rag.ts`
- `server/routers.ts`
- `client/src/pages/ClassifyTool.tsx`
- `client/src/pages/ExtractTool.tsx`
- `client/src/pages/SummarizeTool.tsx`
- `client/src/pages/ManageKnowledge.tsx`
- `client/src/pages/KnowledgeDetails.tsx`

## نقطة الاستئناف التالية
- اختبار عملي لمسار:
  Smart Tool -> Knowledge Draft -> Review/Approval -> Chat Usage
- ثم تحسين واجهات المراجعة والاعتماد على مستوى التفاصيل الدقيقة.
