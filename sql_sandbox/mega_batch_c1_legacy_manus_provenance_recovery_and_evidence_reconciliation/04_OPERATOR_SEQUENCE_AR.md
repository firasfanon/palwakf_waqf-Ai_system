# MEGA_BATCH_C1 — استعادة منشأ Manus القديمة وتسوية الأدلة

## طبيعة العمل

هذه المرحلة **قرائية فقط**. هدفها استخراج دليل المنشأ الخام المحفوظ في سجل ترحيل Manus القديم، وإظهار علاقته المحتملة بالمراجع الحالية. لا تنشئ مصدرًا جديدًا، ولا تعدّل رابطًا، ولا تضبط حقوق نشر، ولا تغير حالة مراجعة أو أهلية RAG/Chat.

## الترتيب الإلزامي

1. نفّذ `00_C1_PREFLIGHT_READ_ONLY.sql` في Staging فقط، واحفظ النتيجة.
2. نفّذ `01_C1_LEGACY_PROVENANCE_FIELD_CENSUS_READ_ONLY.sql`، واحفظ قائمة الحقول ومساراتها.
3. نفّذ `02_C1_EVIDENCE_RECONCILIATION_REGISTER_READ_ONLY.sql`، وصدّر النتيجة CSV.
4. ضع النتيجة داخل `03_C1_MAPPING_REVIEW_TEMPLATE.csv` أو أرفقها كدليل للمراجعة.
5. لا تنتقل إلى C1-C أو أي SQL كتابة قبل اعتماد Review Matrix بشريًا.

## بوابات حاكمة

```text
NO_INSERT_UPDATE_DELETE
NO_SOURCE_CONTAINER_AS_PUBLISHER
NO_AUTOMATIC_PROVENANCE_INFERENCE
NO_OVERWRITE_OF_RAW_LEGACY_VALUE
NO_AUTOMATIC_RIGHTS_STATUS
NO_AUTOMATIC_REFETCH
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PRODUCTION
```

## معيار الاكتمال

تعتبر C1-A/C1-B مكتملة عندما يوجد Evidence Register يبين لكل سجل قديم: عنوانه، المصدر الخام، الرابط، PDF إن وجد، المؤلف/الناشر، مسار الحقل، وطريقة المطابقة/درجة الثقة. لا يعتبر أي رابط أو ناشر «موثقًا» لمجرد ظهوره في السجل؛ ذلك قرار مراجعة لاحق.
