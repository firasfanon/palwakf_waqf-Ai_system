# MEGA_BATCH_AR1_C4_DETERMINISTIC_ELIGIBILITY_RESOLUTION_AND_CONTROLLED_INTERNAL_PILOT_V1

## نبذة

دفعة تنفيذية ضيقة تعالج فجوة أهلية C4 قبل إنشاء أول جلسة AR1 داخلية. لا تستورد معرفة جديدة ولا تنشئ مصدرًا أو حقًا أو رابطًا دائمًا. وظيفتها قراءة العلاقات القائمة فقط، ثم عرض مرشح محدود للمشغّل إذا تحققت علاقة حتمية قابلة للتفسير.

## مسارات الحل الحتمية المسموح بها

1. `C4_DIRECT_MATERIAL_REFERENCE`: عنصر `knowledge_document` ظاهر أصلًا في `candidateMaterials` للـ cohort الحالي، باستخدام معرفه الحالي الرقمي أو UUID.
2. `C4_DIRECT_REFERENCE_DOCUMENT_ASSOCIATION`: عنصر `reference_document` ظاهر أصلًا في `candidateMaterials`، ويوجد **knowledge_document واحد فقط** يحمل `reference_document_id` مطابقًا له حرفيًا (`EXACT_REFERENCE_DOCUMENT_ID`).
3. `DETERMINISTIC_TITLE_EXACT`: عنوان C4 والعنوان الحالي للمعرفة متطابقان بعد التطبيع الحتمي المعتمد.
4. `DETERMINISTIC_URL_EXACT`: الرابط القانوني الحالي للمعرفة والرابط المفحوص في C4 متطابقان بعد canonicalization المعتمد.
5. `DETERMINISTIC_TITLE_AND_URL_EXACT`: تحقق العنوان والرابط معًا.

## قاعدة الغموض

إذا ربط `reference_document` أكثر من `knowledge_document` قابل للاستخدام، لا يختار النظام واحدًا منها. يسجل الرفض ضمن `rejectedAmbiguousDirectAssociations` ويبقى AR1 مقفلًا حتى تتوفر علاقة فريدة أو مسار حتمي آخر.

## حدود ثابتة

```text
NO_SQL
NO_DATABASE_WRITE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_RIGHTS_LAYER_ACTIVATION
NO_DOCUMENT_COPY
NO_CHUNK_OR_EMBEDDING_WRITE
NO_VECTOR_INDEXING
NO_FUZZY_MATCH
NO_SEMANTIC_MATCH
NO_VECTOR_MATCH
NO_AUTHOR_ONLY_MATCH
NO_PUBLISHER_ONLY_MATCH
NO_PUBLIC_CHAT_RELEASE
NO_PUBLIC_RELEASE
NO_STAGING_PROMOTION
NO_PRODUCTION
```

## مسار التشغيل

`C3 → C4 → deterministic eligibility → operator selection → session-level T3/T4 and internal-use references → AR1 internal session → evidence-only question/abstention → rollback`.

لا تظهر جلسة AR1 إلا بعد وجود 1–5 مرشحين حتميين. مراجع الحقوق والاستخدام تخص الجلسة المؤقتة فقط، ولا تعني تفعيل طبقة الحقوق أو منح ترخيص دائم.

## معيار القبول

```text
DETERMINISTIC_RESOLUTION = PASS
AR1_CANDIDATE_COUNT >= 1
SESSION_SCOPE = INTERNAL_ONLY
DATABASE_WRITES = 0
PUBLIC_CHAT_EXPOSURE = FALSE
KNOWLEDGE_RELEASE = FALSE
ROLLBACK = PASS
```
