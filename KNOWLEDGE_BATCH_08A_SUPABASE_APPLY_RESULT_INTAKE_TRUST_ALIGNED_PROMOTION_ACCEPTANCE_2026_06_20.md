# Knowledge Batch 08A — Supabase Apply Result Intake + Trust-Aligned P1 Promotion Acceptance
**التاريخ:** 2026-06-20  
**Baseline السابق:** v62  
**طبيعة الدفعة:** استيعاب دليل تطبيق حي + قبول ترحيل/ترقية P1 بصيغة review-only.  
**نطاقها:** Assistant knowledge/data فقط. لا UI، لا توسعة RBAC/RLS، لا production gate.

## القرار السيادي

```text
KNOWLEDGE_BATCH_08A_STAGING_AND_TRUST_ALIGNED_REVIEW_ONLY_P1_PROMOTION_ACCEPTED
P1_MAPPING_BACKLOG_RETAINED_FOR_HUMAN_REVIEW_AND_DOMAIN_MAPPING
PUBLIC_CHAT_RELEASE_NOT_APPROVED
PRODUCTION_NOT_APPROVED
```

## الأدلة المقبولة

### 1) Staging
- `assistant.legacy_import_register` موجود.
- سجلات الدفعة الرئيسية: **929**.
- السجلات المرصودة الإضافية: **66**.

### 2) مراجعة/ترقية P1 عبر v62
نتيجة مشغل SQL:

| المؤشر | القيمة |
|---|---:|
| staged_p1_rows_considered | 896 |
| valid_review_candidates | 600 |
| needs_mapping_rows | 296 |
| reference_documents_mapped | 600 |
| knowledge_documents_mapped | 600 |
| linked_review_citations_total | 600 |
| register_rows_marked_promoted | 600 |
| approved_on_promotion | 0 |
| chat_visible_on_promotion | 0 |

### 3) فحص ما بعد التطبيق
- `knowledge_documents` الجديدة/المرئية في شريحة legacy: **462** بسمة `in_review`, `is_chat_eligible=false`, `content_status=legacy`, `authority_level=unverified`.
- `reference_documents` الجديدة/المرئية في شريحة legacy: **462** بسمة `in_review`, `verification_status=pending`.
- `knowledge_citations`: **600** بسمة `verification_status=linked`.
- `v62_approved_chat_visible = 0`.
- `v62_review_only_not_chat_visible = 462`.

> ملاحظة reconciliation: ملخص المشغل يثبت 600 mapping operations، بينما شريحة `content_status=legacy` تعرض 462 سجلًا جديدًا فقط. لا تُفسَّر الفجوة 138 كسجل مفقود؛ توجد سجلات سابقة/مطابقة في canonical corpus من مراحل KB05/المعالجة السابقة. يجب إبقاءها كبند reconciliation read-only ضمن Human Review Operations قبل أي إزالة/دمج.

## تقسيم حالة الترحيل

| المصدر المسترد | الحالة | العدد |
|---|---|---:|
| knowledge_documents (main) | promoted | 344 |
| land_references | promoted | 12 |
| legacy_json_content | promoted | 244 |
| legacy_json_content | needs_mapping | 276 |
| knowledge_documents (observed) | needs_mapping | 20 |
| content_templates | promoted | 10 |
| page_settings | promoted | 7 |
| fetch_logs | promoted | 6 |
| fetched_content | promoted | 25 |
| knowledge_sources | promoted | 8 |
| messages | promoted / P2 | 6 |
| site_settings | promoted / P2 | 1 |
| migration metadata / ownership-mapped rows | retained in staging | 46 |

## ملاحظة مراجعة صفّ المهام

أعاد فحص ما بعد التطبيق فقط صفوف `citation_verification` و`source_verification` بإجمالي **1,073** مهمة مفتوحة (`473` citation + `600` source). لم يظهر صف `content_classification` الذي كان مرصودًا سابقًا بعدد 6 في نتائج v58/v61. لا يؤثر ذلك في قبول الترحيل review-only، لكنه بند reconciliation إلزامي في Human Review Operations: التحقق read-only من حالة مهام التصنيف الست قبل إنشاء أي مهام جديدة أو إغلاق/دمج مهام.

## القيود التي تم احترامها

```text
NO_AUTO_APPROVAL=true
NO_AUTO_CHAT_PUBLICATION=true
NO_DELETE=true
NO_DATA_LOSS_ACCEPTED=true
STRICT_RETRIEVAL_GATE_PRESERVED=true
```

## الحالة الفعلية الآن

- تم إنقاذ وإدخال سجل الإرث كاملاً في staging.
- تم تحويل 600 مرشح صالح إلى canonical references/knowledge/citations بصورة review-only.
- بقي 296 سجلًا يحتاج domain mapping أو مراجعة تركيبية قبل الترقية.
- لا توجد أي وثيقة تمت ترقيتها تلقائيًا إلى `approved` أو `is_chat_eligible=true`.
- الشات العام يبقى fail-closed إلى أن تستوفي السجلات: مصدر موثق + استشهاد موثق + نطاق صلاحية + تحرير بشري.

## الخطوة التالية

1. **Human Review Operations v1**: معالجة source/citation verification على 600 سجل مروج وفتح release تدريجي للمصادر الرسمية فقط.
2. **KB08B — Mapping Resolution**: معالجة 296 سجل `needs_mapping`، خصوصًا 276 `legacy_json_content` و20 observed knowledge documents.
3. **KB09 — Page Binding + Real Operations Enablement** بعد تثبيت canonical mappings والـ review queue.
