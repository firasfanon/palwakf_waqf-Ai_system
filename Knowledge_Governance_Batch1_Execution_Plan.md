# Knowledge Governance — Batch 1 Execution Plan
## PalWakf Local Assistant / Chat + Knowledge
## الحالة المعتمدة
هذه الوثيقة تمثل مخطط التنفيذ المعتمد لدفعة **حوكمة المعرفة 1** فوق الوضع الحالي للمشروع، حيث:
- الشات يعمل فوق مزود LLM هجين
- المعرفة مخزنة محليًا مؤقتًا داخل:
  - `.palwakf/runtime/local_runtime_store.json`
- لا توجد في هذه المرحلة جداول Supabase/Postgres سيادية جديدة للمعرفة
- المطلوب الآن هو **حوكمة المعرفة** قبل أي توسع لاحق في الجداول أو التعلم المستمر

---

# 1) الهدف التنفيذي
تحويل طبقة المعرفة من:
- مستندات خام قابلة للعرض والاستهلاك

إلى:
- مستندات محكومة lifecycle واضح
- قابلة للمراجعة والاعتماد
- ويُسمح للشات بالقراءة من **المعتمد فقط**

---

# 2) القاعدة الحاكمة الأساسية
## Rule 01
**الشات لا يقرأ إلا من المعرفة المعتمدة (`approved`)**

أي عنصر غير معتمد:
- لا يدخل في الإجابة المباشرة
- لا يعتبر مرجعًا نهائيًا
- يمكن استخدامه لاحقًا فقط في أوضاع تحليلية أو إدارية منفصلة، وليس في رد الشات المباشر

---

# 3) المخطط المفاهيمي للحقول
## 3.1 الكيان الحالي المستهدف
الكيان الحالي الذي سنطوره في التخزين المحلي هو:
- `knowledgeDocuments`

مع دعم لاحق لربط:
- `documentFiles`
- `knowledgeSources`
- `fetchedContent`
- `fetchedContentReviewEvents`

---

## 3.2 الحقول الأساسية الحالية التي يجب الإبقاء عليها
يفترض أن تبقى الحقول الحالية الموجودة/المستخدمة في النظام مثل:
- `id`
- `title`
- `content`
- `category`
- `summary`
- `tags`
- `createdAt`
- `updatedAt`
- `fileUrl`
- `fileName`
- `fileType`
- `fileSize`
- `language`
- `sourceId` أو ما يقابله عند الحاجة
- `isOcr`
- `extractedText`

---

## 3.3 الحقول الجديدة المطلوبة لدفعة الحوكمة 1
### أ) حقول الحالة والحوكمة
- `status`
  - نوعه: enum string
  - القيم:
    - `draft`
    - `in_review`
    - `approved`
    - `rejected`
    - `archived`

- `authorityLevel`
  - نوعه: enum string
  - القيم:
    - `official`
    - `semi_official`
    - `reference`
    - `unverified`

- `domainScope`
  - نوعه: enum string
  - القيم:
    - `waqf_law`
    - `fiqh`
    - `administrative`
    - `historical`
    - `public_info`
    - `internal_procedure`
    - `other`

- `sourceType`
  - نوعه: enum string
  - القيم:
    - `manual`
    - `pdf_upload`
    - `external_fetch`
    - `system_generated`
    - `seeded`

### ب) حقول المراجعة
- `reviewNotes`
  - نوعه: string nullable
- `reviewDecision`
  - نوعه: enum string nullable
  - القيم:
    - `approve`
    - `reject`
    - `archive`
    - `send_back`
- `reviewedBy`
  - نوعه: string nullable
  - المرحلة الحالية:
    - يمكن أن يكون `userId` النصي/الرقمي القادم من السياق الحالي
- `reviewedAt`
  - نوعه: ISO datetime nullable

### ج) حقول الصلاحية والإصدار
- `approvalVersion`
  - نوعه: number
  - القيمة الافتراضية: `1`
- `effectiveFrom`
  - نوعه: ISO datetime nullable
- `effectiveTo`
  - نوعه: ISO datetime nullable
- `supersedesDocumentId`
  - نوعه: number|string nullable

### د) حقول الضبط التشغيلي للشات
- `isChatEligible`
  - نوعه: boolean
  - القاعدة:
    - تحسب تلقائيًا من:
      - `status === approved`
      - و `authorityLevel !== unverified`
- `chatPriority`
  - نوعه: number
  - افتراضي: `50`
  - يستخدم لاحقًا لترتيب الاسترجاع
- `groundingWeight`
  - نوعه: number
  - افتراضي: `1.0`

---

# 4) القيم الافتراضية المقترحة
عند إنشاء أي وثيقة معرفة جديدة:
- `status = draft`
- `authorityLevel = unverified`
- `domainScope = other`
- `sourceType = manual | pdf_upload | external_fetch | seeded` بحسب المصدر
- `approvalVersion = 1`
- `isChatEligible = false`
- `chatPriority = 50`
- `groundingWeight = 1.0`

---

# 5) Workflow الحوكمة
## 5.1 دورة الحياة الأساسية
```text
draft -> in_review -> approved
draft -> in_review -> rejected
approved -> archived
approved -> superseded لاحقًا عبر supersedesDocumentId
```

---

## 5.2 تعريف كل حالة
### draft
- تم إنشاؤها أو رفعها
- لم تدخل مراجعة فعلية بعد
- لا يقرأ منها الشات

### in_review
- تنتظر فحصًا إداريًا/معرفيًا
- لا يقرأ منها الشات

### approved
- معتمدة
- صالحة لاستهلاك الشات والبحث المعتمد

### rejected
- مرفوضة
- لا يقرأ منها الشات
- تبقى كسجل/أثر إداري

### archived
- كانت معتمدة أو محفوظة سابقًا ثم أُخرجت من النطاق النشط
- لا يقرأ منها الشات

---

## 5.3 العمليات المسموحة
### من draft
- إرسال للمراجعة -> `in_review`
- تعديل metadata
- حذف (بحسب الصلاحيات)

### من in_review
- اعتماد -> `approved`
- رفض -> `rejected`
- إرجاع إلى مسودة -> `draft`

### من approved
- أرشفة -> `archived`
- تحديث إصدار لاحقًا
- تعديل محدود إذا سمحت الحوكمة

### من rejected
- إعادة فتح للمراجعة -> `in_review`
- أرشفة

### من archived
- إعادة تنشيط للمراجعة -> `in_review` لاحقًا عند الحاجة

---

# 6) قواعد الاستهلاك في الشات
## 6.1 قاعدة الاسترجاع
عند بناء سياق RAG أو أي search context للشات:
- يتم التصفية أولًا على:
  - `status === approved`
- ثم تفضيل العناصر حسب:
  1. `authorityLevel`
  2. `chatPriority`
  3. الصلة النصية
  4. الحداثة
  5. `groundingWeight`

---

## 6.2 قواعد الحماية من الهلوسة
### يجب أن يلتزم الشات بما يلي:
- إذا لم يجد مستندات معتمدة كافية:
  - لا يخترع
  - بل يصرح بعدم كفاية المعرفة المعتمدة
- إذا وجد مرجعًا من نوع `reference`:
  - يمكنه استخدامه مع التنبيه أنه مرجعي
- لا يبني إجابة مباشرة من:
  - `draft`
  - `in_review`
  - `rejected`
  - `archived`

---

# 7) الواجهة الإدارية المطلوبة في دفعة 1
## 7.1 في صفحات المعرفة الحالية
يجب إظهار الأعمدة/العناصر التالية لكل وثيقة:
- الحالة `status`
- مستوى الاعتماد `authorityLevel`
- النطاق `domainScope`
- نوع المصدر `sourceType`
- آخر مراجعة
- ملاحظات المراجعة المختصرة

## 7.2 الإجراءات المطلوبة في الواجهة
لكل عنصر:
- إرسال للمراجعة
- اعتماد
- رفض
- أرشفة
- تعديل الحقول الحوكمية
- فتح التفاصيل

---

## 7.3 مؤشرات بصرية
### status badges
- `draft` = رمادي
- `in_review` = برتقالي
- `approved` = أخضر
- `rejected` = أحمر
- `archived` = داكن/محايد

### authority badges
- `official` = أخضر داكن
- `semi_official` = أزرق
- `reference` = بنفسجي
- `unverified` = أحمر/تحذيري

---

# 8) الملفات المستهدفة في المشروع الحالي
## Backend
- `server/localRuntimeStore.ts`
- `server/runtimeRepository.ts`
- `server/routers.ts`
- `server/_core/llm.ts`
- `server/_core/systemSettingsRouter.ts` (فقط إذا احتجنا ربطًا إضافيًا للسلوك)
- أي دوال search/retrieval خاصة بالمعرفة أو الـ chat context

## Frontend
- `client/src/pages/KnowledgeManagement.tsx`
- `client/src/pages/ManageKnowledge.tsx`
- `client/src/pages/FetchedContentReview.tsx`
- `client/src/pages/Chat.tsx`
- أي مكونات بطاقات/جداول تعرض `knowledgeDocuments`

---

# 9) خطة تنفيذ دفعة 1
## الخطوة 1 — توسيع نموذج التخزين المحلي
### المطلوب
إضافة الحقول الحوكمية إلى `knowledgeDocuments` في التخزين المحلي:
- `status`
- `authorityLevel`
- `domainScope`
- `sourceType`
- `reviewNotes`
- `reviewDecision`
- `reviewedBy`
- `reviewedAt`
- `approvalVersion`
- `effectiveFrom`
- `effectiveTo`
- `supersedesDocumentId`
- `isChatEligible`
- `chatPriority`
- `groundingWeight`

### ملاحظات تنفيذ
- يجب أن يتم backfill للقيم الافتراضية على الوثائق الموجودة
- seeded docs الحالية يمكن رفعها مبدئيًا إلى:
  - `status = approved`
  - `authorityLevel = reference` أو `official` حسب نوعها
  - `sourceType = seeded`

---

## الخطوة 2 — بناء repository operations للحالات
### مطلوب في `runtimeRepository`
إضافة دوال مثل:
- `submitKnowledgeDocumentForReview(id, userId, notes?)`
- `approveKnowledgeDocument(id, userId, notes?)`
- `rejectKnowledgeDocument(id, userId, notes?)`
- `archiveKnowledgeDocument(id, userId, notes?)`
- `updateKnowledgeGovernance(id, patch)`

### السلوك
كل عملية تحدث:
- `status`
- `reviewDecision`
- `reviewNotes`
- `reviewedBy`
- `reviewedAt`
- `isChatEligible`

---

## الخطوة 3 — تقييد الشات إلى المعتمد فقط
### مطلوب
في أي موضع يبني سياق المعرفة للشات:
- أضف فلترة:
  - `doc.status === "approved"`
  - `doc.isChatEligible === true`

### نتيجة
أي وثيقة غير معتمدة لا تدخل في الرد

---

## الخطوة 4 — تحديث صفحات الإدارة
### في Knowledge pages
إضافة:
- حقول الحوكمة في النموذج/التفاصيل
- أزرار workflow
- badges للحالة والاعتماد
- فلترة حسب status و authorityLevel

### في Fetched Content
إضافة/تأكيد أن تحويل العنصر إلى وثيقة معرفة يبدأ دائمًا كـ:
- `draft`
أو
- `in_review`
ولا يصبح `approved` تلقائيًا

---

## الخطوة 5 — Logging / audit محلي مرحلي
### مطلوب
إضافة audit مبسط داخل التخزين المحلي أو review events:
- من قام بالإجراء
- متى
- ما القرار
- ما الملاحظات

يمكن في هذه المرحلة استخدام:
- `fetchedContentReviewEvents`
أو بنية مشابهة جديدة لاحقًا
أو توسيع وثيقة المعرفة نفسها بحقل `reviewHistory` إن لزم مرحليًا

---

# 10) معايير القبول
تعتبر دفعة 1 ناجحة إذا تحقق الآتي:

## تشغيل وظيفي
- يمكن إنشاء/رفع وثيقة معرفة جديدة
- تبدأ كـ `draft`
- يمكن إرسالها للمراجعة
- يمكن اعتمادها
- يمكن رفضها
- يمكن أرشفتها

## ضبط الشات
- الشات لا يقرأ من أي وثيقة غير `approved`
- إذا كانت كل الوثائق غير معتمدة:
  - الشات لا يهلوس
  - ويعرض رسالة مناسبة تفيد بعدم وجود معرفة معتمدة كافية

## وضوح الواجهة
- تظهر حالة الوثيقة بوضوح
- تظهر صلاحية الوثيقة للاستخدام في الشات بوضوح

## سلامة البيانات
- الوثائق الحالية يتم backfill لها بقيم افتراضية
- لا يحدث كسر لمسارات العرض الحالية

---

# 11) ما لن نقوم به في دفعة 1
- لا نبني جداول Supabase جديدة بعد
- لا ننفذ fine-tuning للنموذج المحلي
- لا نجعل المحادثات تعلم النموذج تلقائيًا
- لا نعتمد المحتوى المولد آليًا مباشرة
- لا نبني workflow متعدد المراجعين في هذه الدفعة
- لا ننقل storage إلى Supabase Storage بعد

---

# 12) التوصية التنفيذية التالية بعد دفعة 1
بعد إغلاق حوكمة المعرفة 1:
- دفعة 2 = Citation-first Chat
  - إظهار المستندات المستخدمة في الرد
  - عرض grounding level
- دفعة 3 = Review Workspace أوسع
  - dashboards
  - queue by status
  - review analytics
- دفعة 4 = migration design
  - نقل من التخزين المحلي المؤقت إلى جداول سيادية

---

# 13) القرار المعتمد
هذه الوثيقة تعتمد أن:
- المعرفة في هذه المرحلة **محكومة محليًا**
- الشات **مقيد بالمعتمد فقط**
- النموذج المحلي **يقترح ولا يعتمد**
- الحوكمة تسبق التوسع في التوليد أو التعلم أو النقل إلى قاعدة البيانات السيادية

---

# Addendum — Sovereign Batch 02 Knowledge Seed-8 Disclosure — 2026-06-18

## القرار

تم اعتماد أن العينات الثمانية الحالية في قاعدة المعرفة هي **دفعة أولى أثناء بناء قاعدة البيانات ومسار الربط** فقط، وليست corpus المعرفة الرسمي الكامل.

## العبارة الإلزامية

```text
العينات الثمانية كانت دفعة أولى أثناء بناء قاعدة البيانات ومسار الربط، ولم يتم بعد رفع باقي مصادر المعرفة والمراجع الرسمية. يبقى مطلوبًا رفع المصادر المتبقية، تصنيفها، مراجعتها، اعتمادها، وربطها بالشات والأدوات وفق سياسة approved-only.
```

## أثر ذلك على دفعة الحوكمة 1

- حوكمة review/approval تبقى معتمدة.
- الشات لا يقرأ إلا من approved/chat-eligible.
- لا يجوز اعتبار الـ 8 عينات جاهزية معرفية إنتاجية.
- الدفعات التالية يجب أن تكون رفع مصادر فعلية مع source register ومصفوفة مراجعة واعتماد.

## القرار المحدث

```text
KNOWLEDGE_GOVERNANCE_POLICY_ACCEPTED
SEED8_ONLY_CONTENT_SCOPE_DISCLOSED
OFFICIAL_KNOWLEDGE_CORPUS_UPLOAD_PENDING
```
