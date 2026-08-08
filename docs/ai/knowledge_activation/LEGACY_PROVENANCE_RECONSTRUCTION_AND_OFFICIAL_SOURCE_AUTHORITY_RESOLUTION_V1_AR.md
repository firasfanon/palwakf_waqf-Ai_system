# MEGA_BATCH_ASSISTANT_LEGACY_PROVENANCE_RECONSTRUCTION_AND_OFFICIAL_SOURCE_AUTHORITY_RESOLUTION_V1

## العقد
المصدر الحالي `Recovered legacy corpus` و`Old pre-Supabase recovered knowledge register` يمثلان provenance containers فقط. لا يثبتان الجهة الرسمية، ولا يصح ترقية أي منهما إلى official أو verified.

## المخرجات
- Reconstruction Run قابل للإعادة ومرتبط بـ Activation Run معروف.
- Item لكل knowledge document في `source_verification_required`.
- Grouping بالـ candidate fingerprint.
- قرارات مراجع غير مدمرة ومؤرشفة.
- سجل تسويات مهام citation المكررة.

## قرار الترقية اللاحق
`official_source_candidate_confirmed` هو **قرار دليل مرشح**، وليس ترقية canonical source. الترقية الفعلية إلى `knowledge_sources/reference_documents` ستأتي في حزمة Promotion لاحقة بعد فهم schema الحالي والتحقق من الدليل، ولن تُستنتج تلقائيًا من هذه الدفعة.

## ممنوعات ثابتة
لا تعديل تلقائي للوثائق المرجعية أو المصادر أو الاستشهادات. لا Chat eligibility. لا release.
