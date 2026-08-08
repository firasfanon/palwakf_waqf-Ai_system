# MEGA_BATCH_C2 — AUTONOMOUS_PROVENANCE_AUDIT_AND_FINAL_DISPOSITION

## نبذة عربية
هذه دفعة **تطوير قرائي وتحليلي فقط**. تحول أدلة منشأ Manus/KB08 الخام إلى عناقيد موحدة وقرارات تشغيلية قابلة للعرض، بحيث لا يراجع المشغّل مئات الصفوف واحدًا واحدًا.

## ما تضيفه
- خدمة `server/autonomousProvenanceAudit.ts` تعتمد فقط على طبقة C1 القرائية.
- endpoint جديد: `sourceProvenance.autonomousAudit` عبر `adminProcedure.query` فقط.
- لوحة `تدقيق C2 الآلي وقرار التصرف النهائي` في `/knowledge#/admin/source-provenance-rights`.
- تجميع حسب الرابط المعياري ثم العنوان/المؤلف ثم العنوان.
- عزل تلقائي للمؤشرات التقنية مثل `legacy_source_file` و`old_db_select_row`.
- حجر تلقائي لنطاقات اختبار مثل `example.com`.
- قرارات تشغيلية محدودة:
  - `OFFICIAL_SOURCE_CANDIDATE`
  - `ACADEMIC_SOURCE_CANDIDATE`
  - `SAFE_URL_CANDIDATE`
  - `AUTHOR_ONLY_RETAIN`
  - `TITLE_ONLY_RETAIN`
  - `TECHNICAL_MARKER_EXCLUDE`
  - `TEST_OR_INVALID_URL_QUARANTINE`
  - `AMBIGUOUS_NO_LINK`
  - `MISSING_RAW_PROVENANCE`

## الحدود الحاكمة
```text
NO_ROW_BY_ROW_HUMAN_REVIEW
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_AUTOMATIC_PROVENANCE_INFERENCE
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PRODUCTION
```

## ما يعنيه «القرار النهائي» هنا
هو قرار **تشغيلي لإدارة دليل المنشأ**: كيف يُحتفظ بالدليل وهل يعزل أو يبقى مرشحًا للتحقق لاحقًا. لا يشكل إثباتًا قانونيًا للترخيص أو لحق عرض النص الكامل، ولا يربط أي مصدر فعليًا بالجداول الأساسية.

## نطاق التطبيق
- لا توجد SQL كتابة.
- لا تعديل في `assistant.knowledge_sources` أو `reference_documents` أو `knowledge_documents`.
- لا تعديل في الصلاحيات أو RLS أو Chat/RAG.
