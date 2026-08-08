# MEGA_BATCH_C1 — LEGACY_MANUS_PROVENANCE_RECOVERY_AND_EVIDENCE_RECONCILIATION

## النطاق

إضافة طبقة عرض **قرائية فقط** داخل صفحة «سجل المصادر وحقوق النشر» لقراءة أدلة منشأ Manus القديمة من `assistant.legacy_import_register.payload_json` على مستوى المادة. تفصل الطبقة بين مصدر الجلب/الوعاء التشغيلي وبين منشأ المادة الببليوغرافي والحقوقي.

## لا يشمل

- لا إنشاء أو تعديل `knowledge_sources`.
- لا كتابة `source_rights_profiles` أو `source_url_history`.
- لا تحديث مرجع أو معرفة مشتقة.
- لا تحديد حقوق أو ترخيص تلقائي.
- لا إعادة جلب، ولا ترقية، ولا نشر، ولا إتاحة Chat/RAG.

## مخرجات C1

- `sourceProvenance.legacyManusReconciliation` — قراءة أدلة metadata فقط.
- واجهة إدارية تعرض المصدر/الرابط/PDF/المؤلف/الناشر الخام ومسارات الدليل.
- SQL Read-only مستقل لاستخراج سجل تسوية قابل للمراجعة.

## البوابات

```text
C1_READ_ONLY_ONLY
RAW_LEGACY_VALUE_PRESERVED
KB08_CONTAINER_NOT_PUBLISHER
MATCHING_IS_A_CANDIDATE_NOT_A_WRITE
NO_AUTOMATIC_RIGHTS_CONCLUSION
NO_AUTOMATIC_CHAT_RELEASE
```
