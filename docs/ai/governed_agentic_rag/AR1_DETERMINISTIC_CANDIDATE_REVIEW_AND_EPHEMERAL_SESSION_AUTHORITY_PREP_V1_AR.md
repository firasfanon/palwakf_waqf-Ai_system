# MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1

## نبذة

دفعة تنفيذية ضيقة تضيف مرحلة مستقلة بين ظهور مرشح C4 الحتمي وبين بدء جلسة AR1. الهدف هو أن يراجع المشغّل **مرشحًا واحدًا فقط**، ويوثق مراجع الاستخدام الداخلي والحقوق ومبررات الاختيار، ثم ينشئ تحضير صلاحية مؤقتًا في ذاكرة الخادم دون بدء الجلسة.

## المشكلة التي تغلقها الدفعة

كان مسار `startSession` يقبل مراجع الجلسة والمرشحين مباشرة. ورغم أنه محكوم وداخلي، لم توجد طبقة مستقلة قابلة للتدقيق تفصل بين:

1. مراجعة المرشح.
2. إعداد سلطة الجلسة.
3. بدء الجلسة الفعلي.

هذه الدفعة تجعل المرحلتين الأولى والثانية عقدًا مستقلًا، وتمنع بدء الجلسة من الواجهة حتى تفويض تنفيذي منفصل.

## العقد الجديد

```text
C3 fresh evidence
→ C4 READY_FOR_OPERATOR_BINDING
→ review exactly one current deterministic candidate
→ T3/T4 + internal-use approval reference
→ session-level rights/use reference
→ mandatory review rationale
→ three explicit acknowledgements
→ operator-bound in-memory authority preparation
→ NO SESSION START
```

## خصائص تحضير الصلاحية

- معرف مؤقت بصيغة `AR1A-*`.
- مرتبط بالمشغّل المصادق عليه.
- يقبل مرشحًا واحدًا فقط من cohort C4 الحالية.
- صلاحيته القصوى عشر دقائق، ولا تتجاوز انتهاء دليل C3.
- يحمل بصمة حتمية لمراجع المراجعة والمرشح والمشغّل.
- يحفظ في ذاكرة العملية فقط.
- يمكن إلغاؤه ومسحه من الذاكرة.
- لا يبدأ جلسة AR1 تلقائيًا.
- لا يصبح قابلًا للاستهلاك إلا عبر `startSession` مستقل يتطلب معرف التحضير ويعيد التحقق من المرشح الحالي.

## الإقرارات المطلوبة

1. الاستخدام داخلي فقط.
2. التحضير لا يمنح ترخيصًا ولا يعيّن حقوقًا ولا ينشئ رابط مصدر.
3. أي توليد لاحق يقتصر على مزود محلي أو داخلي معتمد.

## الحدود الثابتة

```text
NO_SQL
NO_DATABASE_WRITE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_DOCUMENT_COPY
NO_CHUNK_OR_EMBEDDING_WRITE
NO_VECTOR_INDEXING
NO_FUZZY_OR_SEMANTIC_MATCHING
NO_MODEL_INVOCATION_DURING_PREP
NO_SESSION_AUTO_START
NO_PUBLIC_CHAT_RELEASE
NO_PUBLIC_RELEASE
NO_PRODUCTION
SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED
```

## قرار هذه الدفعة

```text
CANDIDATE_REVIEW=ENABLED
AUTHORITY_PREPARATION=ENABLED
AUTHORITY_STORAGE=PROCESS_MEMORY_ONLY
SESSION_START_UI=BLOCKED
SESSION_START_RUNTIME=REQUIRES_PREPARATION_ID
RUNTIME_UAT=PENDING
```
