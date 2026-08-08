# MEGA_BATCH_AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_V1

## الهدف
تحويل تشغيل AR1 من تنقل يدوي بين C3 ثم C4 ثم أهلية المادة إلى زر تشغيلي واحد، يطلق دورة حتمية داخل العملية الخادمية نفسها:

```text
بدء دورة التحقق
→ C3: فحص خارجي محدود بالبيانات الوصفية
→ C4: قراءة cohort الحالية
→ حسم أهلية المعرفة بمطابقة حتمية
→ مراجعة مادة واحدة عند وجود مرشح
→ إظهار مراجع الجلسة وإنشائها مؤقتًا
```

## ما يتغير

- إضافة mutation إدارية صريحة: `agenticRagPilot.runSingleFlowReadinessCycle`.
- لا تُشغّل عند فتح الصفحة؛ تبدأ فقط بضغط المشغّل على زر `بدء دورة التحقق`.
- تستدعي C3 أولًا، ثم تبني C4 والـ deterministic eligibility داخل العملية الخادمية نفسها.
- تعرض للمشغّل نتيجة واحدة فقط: مرشح واحد أو أكثر للمراجعة، أو HOLD واضح بلا إجراء إضافي.
- تفرض الواجهة اختيار مادة واحدة فقط في أول Pilot، وتخفي مراجع الحقوق/الاستخدام وإنشاء الجلسة إلى أن يحدد المشغّل مادة واحدة.
- تبقي تفاصيل C3/C4 والضوابط التقنية ثانوية وقابلة للعرض، لا مسارًا إلزاميًا للمشغّل.

## الحدود السيادية

```text
NO_SQL
NO_SCHEMA_OR_RLS_CHANGE
NO_DATABASE_WRITE
NO_SOURCE_OR_RIGHTS_WRITE
NO_DOCUMENT_CHUNK_EMBEDDING_OR_VECTOR_WRITE
NO_FUZZY_OR_SEMANTIC_OR_VECTOR_MATCHING
NO_AUTHOR_ONLY_OR_PUBLISHER_ONLY_MATCHING
NO_PUBLIC_CHAT_RELEASE
NO_KNOWLEDGE_RELEASE
NO_STAGING_PROMOTION
NO_PRODUCTION
```

## شرط الجلسة

لا تظهر مراجع الاستخدام الداخلي والحقوق أو زر إنشاء جلسة AR1 إلا بعد أن يختار المشغّل مادة واحدة من المرشحين الحتميين في دورة C3/C4 الحالية.
