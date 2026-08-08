# AR1 — Governed Agentic RAG Internal Pilot Vertical Slice

## القرار التنفيذي

```text
AR1B_STANDALONE=SUPERSEDED_BY_AR1_INTEGRATED_VERTICAL_SLICE
AR1_CONTROLLED_CORPUS_BINDING=INCLUDED_AS_EPHEMERAL_INTERNAL_SUBSURFACE
PUBLIC_CHAT_RELEASE=BLOCKED
PRODUCTION=NOT_AUTHORIZED
```

AR1 يجمع، في دفعة تنفيذية واحدة، ربط corpus صغير، الاسترجاع المقيد، التوليد الداخلي المشروط، الاستشهادات، الامتناع، سجل التنفيذ المؤقت، والـrollback. لا يغيّر الحدود الجوهرية التي حددتها AR1A.

## النطاق

- نطاق المجال: بحث قانوني ووقفي داخلي فقط.
- Cohort: حتى 5 مواد `knowledge_document` مرتبطة في الجولة الحالية بـC4 selected cohort.
- المستوى: `T3_CONTROLLED_INTERNAL_EVIDENCE` أو `T4_VERIFIED_CITATION_EVIDENCE` كتعيين مؤقت داخل الجلسة فقط.
- الوصول: `adminProcedure` فقط.
- العمر: جلسة في ذاكرة الخادم لمدة 30 دقيقة، أو حتى rollback/restart.

## عقد الإدخال

لا تبدأ الجلسة إلا إذا قدم المشغّل لكل مادة:

1. `clusterKey` من C4 cohort الحالية.
2. `documentId` من المادة المرتبطة بذلك العنقود.
3. مستوى T3 أو T4 للجلسة.
4. `internalUseApprovalRef`.
5. مرجع اعتماد على مستوى الجلسة `rightsApprovalRef`.
6. إقرار استخدام داخلي وإقرار حدود مزود النموذج.

هذه المراجع **إثبات تشغيل للجلسة** وليست منحًا آليًا لحقوق، ولا تعديلًا دائمًا للمصدر أو الترخيص.

## مسار الوكيل

```text
C3 evidence fresh
  → C4 selected cohort current
  → operator-selected bindings (max 5)
  → scoped keyword retrieval from bound existing documents
  → citation package
  → optional governed internal LLM synthesis
  → citation / abstention / escalation gate
  → internal result only
```

## التوليد الداخلي

التوليد النصي معطّل افتراضيًا. التفعيل يتطلب:

```text
AR1_INTERNAL_PILOT_LLM_ENABLED=1
```

ولا يجوز ضبطه إلا بعد اعتماد أن مزود النموذج محلي أو داخلي معتمد. عند عدم التفعيل أو تعذر النموذج، يعيد AR1 حزمة أدلة واستشهادات فقط.

## القيود غير القابلة للتجاوز

```text
NO_EXTERNAL_WEB_AGENT
NO_DATABASE_WRITE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_DOCUMENT_COPY
NO_FULL_TEXT_RETENTION
NO_CHUNK_OR_EMBEDDING_WRITE
NO_VECTOR_INDEXING
NO_AUTOMATIC_T2_TO_T3_T4_PROMOTION
NO_AUTONOMOUS_LEGAL_CONCLUSION
NO_PUBLIC_CHAT_RELEASE
NO_PUBLIC_RELEASE
NO_PRODUCTION
```

## مخرجات الجلسة

- الإجابة أو الامتناع/التصعيد.
- درجة ثقة محدودة.
- استشهادات `AR1P:*` قابلة للتتبع إلى documentId وclusterKey.
- مسار الأدوات والبوابات.
- سجل أحداث مؤقت لا يحفظ نص السؤال، بل hash وطول السؤال ومؤشرات التنفيذ.

## rollback

زر rollback يحذف الربط وسجل التنفيذ من ذاكرة الخادم. لا توجد عملية rollback لقواعد البيانات لأن AR1 لا يكتب قاعدة بيانات.
