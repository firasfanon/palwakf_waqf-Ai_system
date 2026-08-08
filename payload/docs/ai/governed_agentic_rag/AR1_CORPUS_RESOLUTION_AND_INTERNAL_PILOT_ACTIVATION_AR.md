# MEGA_BATCH_AR1 — Corpus Resolution and Internal Pilot Activation

## طبيعة الإجراء

دفعة تنفيذية ضيقة لإغلاق فجوة التكامل بين `C4 selected cohort` ومواد `knowledge_document` القائمة، ضمن جلسة AR1 داخلية مؤقتة فقط.

لا تُنشئ هذه الدفعة أي مصدر أو حق أو رابط مصدر دائم أو نسخة وثيقة أو chunks أو embeddings أو vectors. ولا تفتح Chat أو نشرًا عامًا أو Production.

## قاعدة الحل

يستطيع AR1 عرض مادة قائمة فقط بإحدى الطريقتين الحتميتين التاليتين:

1. `C4_DIRECT_MATERIAL_REFERENCE`: كان `knowledge_document` ظاهرًا أصلًا في `candidateMaterials` للعنقود المختار.
2. تطابق حتمي في الحالة الحالية فقط:
   - `DETERMINISTIC_TITLE_EXACT`: العنوان الطبيعي للـknowledge document يساوي عنوان C4.
   - `DETERMINISTIC_URL_EXACT`: الرابط القانوني الحالي للوثيقة يساوي رابط C4 المفحوص.
   - `DETERMINISTIC_TITLE_AND_URL_EXACT`: الشرطان معًا.

الممنوع صراحةً: التطابق التقريبي، الدلالي، التعلم الآلي، التشابه المتجهي، مطابقة المؤلف/الناشر وحدهما، أو إنشاء رابط دائم في قاعدة البيانات.

## حدود الاستخدام

- تكون النتيجة قائمة اختيار للمشغل فقط، ولا تنشئ `source_link` أو `rights_assignment`.
- يلزم اختيار المشغل للمادة مع مستوى T3 أو T4 وإدخال مرجع الاستخدام الداخلي ومرجع حقوق/استخدام للجلسة.
- يبقى النص في مصدره القائم ولا يُستنسخ. لا يقرأ AR1 المحتوى إلا عند سؤال جلسة نشطة.
- الاسترجاع داخل الجلسة مقيد بالـ1–5 مواد المختارة، مع citations أو abstention/escalation.
- التراجع يمسح الجلسة وسجلها من ذاكرة الخادم فقط.

## قرار الإتاحة

```text
INTERNAL_PILOT_ONLY
NO_DATABASE_WRITE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_DOCUMENT_COPY
NO_CHUNK_OR_EMBEDDING_WRITE
NO_VECTOR_INDEXING
NO_FUZZY_OR_SEMANTIC_CORPUS_LINKING
NO_PUBLIC_CHAT_RELEASE
NO_PUBLIC_RELEASE
NO_PRODUCTION
```

## UAT المقصود

1. شغّل C3 ثم C4 في نفس عملية الخادم.
2. تحقق من أن AR1 تعرض مادة أو أكثر مع `حل corpus: مطابقة حتمية...` أو `مرجع C4 مباشر`.
3. ابدأ جلسة T3 واحدة مع مراجع اعتماد تجريبية قابلة للتتبع.
4. اسأل سؤال evidence-only يطابق النص، ثم سؤالًا بلا دليل لإثبات abstention.
5. عند تفعيل LLM الداخلي فقط، اختبر مسار escalation الناتج عن غياب الاستشهاد أو أي توصية قانونية.
6. نفذ rollback وتحقق من أن عدد الجلسات النشطة يعود إلى صفر.
