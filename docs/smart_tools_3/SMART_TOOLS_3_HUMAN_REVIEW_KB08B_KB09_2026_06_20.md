# Smart Tools 3 — Human Review Operations v1 + KB08B + KB09

**التاريخ:** 2026-06-20  
**المرجع السابق المقبول:** `Knowledge Batch 08A — Supabase Apply Result Intake + Trust-Aligned P1 Promotion Acceptance`  
**حالة هذه الحزمة:** `IMPLEMENTATION_PREPARED_STATICALLY_VALIDATED / LIVE_SUPABASE_APPLY_PENDING / PRODUCTION_NOT_APPROVED`

## 1) النطاق التنفيذي

هذه الحزمة تحوّل المرحلة التالية بعد KB08A من خطة مراجعة إلى مسار تشغيلي خاضع للحوكمة. وهي لا تنفذ اعتمادًا جماعيًا، ولا تتيح الدردشة تلقائيًا، ولا تحذف أو تستبدل السجلات الموروثة.

تشمل ثلاثة مسارات مترابطة:

1. **Human Review Operations v1**
   - تسوية قراءة فقط للمهام التاريخية الست من `content_classification` قبل إنشاء أي بديل أو إغلاق أو إلغاء.
   - استلام مهمة مراجعة باسم مراجع مصادق عليه.
   - توثيق المصدر الرسمي لكل `reference_document`.
   - توثيق الاستشهاد المرتبط بكل `knowledge_document`.
   - تحرير وثيقة واحدة فقط بعد تحقق مصدر رسمي + استشهاد موثق + نطاق `assistant.publish`.

2. **KB08B — Mapping Resolution**
   - معالجة قرارات بشرية قابلة للتدقيق لسجلات `needs_mapping` البالغ عددها 296 وفق دليل KB08A.
   - دعم `map_existing` و`promote_review` و`defer` و`quarantine`.
   - `promote_review` ينشئ فقط المرجع/المعرفة/الاستشهاد في حالة مراجعة؛ ولا يعتمد أو ينشر للدردشة.

3. **KB09 — Page Binding + Real Operations Enablement**
   - عقود تشغيل موثقة لصفحات FAQ وKnowledge Base وSearch وFiles وTemplates وSettings.
   - تفعيل القراءة السيادية لـ Knowledge Base/Search/Files فقط.
   - إبقاء FAQ/Templates/Settings في `prepared` حتى تحديد مالك بيانات canonical واعتماد الربط.

## 2) ما الذي لا يتغير

- يبقى مسار الاسترجاع العام للدردشة fail-closed.
- لا تصبح الوثيقة `is_chat_eligible=true` إلا في RPC إصدار منفصلة وبعد تحقق رسمي كامل.
- لا تُحذف سجلات `assistant.legacy_import_register` ولا تتحول بيانات `needs_mapping` إلى موافق عليها تلقائيًا.
- لا يملك العميل المتصفح DML مباشر على جداول المعرفة أو الربط أو المطابقة.
- لا يتغير قرار الإنتاج: **غير معتمد**.

## 3) العقود الجديدة

### SQL / RPC

| العقد | الغرض | الصلاحية اللازمة |
|---|---|---|
| `assistant.rpc_claim_knowledge_review_task_v1` | إسناد مهمة مراجعة لمراجع واحد | `assistant.review` أو أعلى |
| `assistant.rpc_verify_official_reference_source_v1` | توثيق مصدر رسمي محفوظ للمرجع | `assistant.review` أو أعلى |
| `assistant.rpc_verify_knowledge_citation_v1` | توثيق موضع/مقتطف الاستشهاد | `assistant.review` أو أعلى |
| `assistant.rpc_release_official_knowledge_document_v1` | تحرير وثيقة رسمية محددة للدردشة | `assistant.publish` أو أعلى |
| `assistant.rpc_kb08b_mapping_queue_v1` | قراءة طابور KB08B | service role |
| `assistant.rpc_kb08b_resolve_mapping_v1` | تسجيل قرار مطابقة بشري | `assistant.review` أو أعلى |
| `assistant.rpc_kb09_set_page_operation_binding_v1` | تغيير حالة عقد صفحة KB09 | `assistant.publish` أو أعلى |

### واجهة الإدارة

أضيف المسار:

```text
/admin/knowledge-review-operations
```

ويتضمن ثلاث تبويبات:

- المراجعة البشرية مع تسوية مهام `content_classification` الست وPaging لطابور المهام.
- KB08B مع Paging لكل سجلات `needs_mapping` الـ296.
- KB09 مع عرض عقود الصفحات والسماح بالحظر التشغيلي فقط من الشاشة؛ أي تفعيل مستقبلي يتطلب عقد canonical يمر عبر RPC وصلاحية نشر.

## 4) ترتيب التطبيق الإلزامي

1. شغّل `00_PREFLIGHT_READ_ONLY.sql`.
2. شغّل `00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY.sql` واحفظ نتيجة كل مهمة تاريخية قبل أي تعديل.
3. طبّق `01_HUMAN_REVIEW_OPERATIONS_V1_OPERATOR_APPLY.sql`.
4. طبّق `02_KB08B_MAPPING_RESOLUTION_OPERATOR_APPLY.sql`.
5. طبّق `03_KB09_PAGE_BINDING_REAL_OPERATIONS_OPERATOR_APPLY.sql`.
6. شغّل `04_POST_APPLY_READ_ONLY_VERIFICATION.sql`.
7. انشر server/client، ثم نفذ UAT موجب وسلبي وفق الملف `00_OPERATOR_SEQUENCE.md`.

## 5) بوابات قبول UAT

### إيجابي

- مراجع يحمل `assistant.review` يستطيع استلام مهمة مفتوحة.
- توثيق المصدر يغيّر المصدر/المرجع إلى verified لكنه لا ينشر للدردشة.
- توثيق الاستشهاد يكمل مهمة citation فقط ولا ينشر.
- ناشر يحمل `assistant.publish` يستطيع تحرير وثيقة واحدة بعد المصدر الرسمي والاستشهاد الموثق.
- `map_existing` و`promote_review` يسجلان أثرًا في `legacy_mapping_resolutions`.

### سلبي / Fail-closed

- لا يجوز لمستخدم بلا `assistant.review` استلام مهمة أو توثيق مصدر أو استشهاد.
- لا يجوز لمستخدم بلا `assistant.publish` تحرير وثيقة أو تغيير عقد صفحة KB09.
- لا يجوز تحرير وثيقة غير رسمية أو بلا استشهاد verified.
- لا يجوز تفعيل FAQ/Templates/Settings ما دامت مربوطة بـ `legacy_operational_records`.
- لا يجوز تنفيذ DML مباشر من المتصفح على `assistant.knowledge_*` أو `assistant.page_operation_bindings`.

## 6) مخرجات التطبيق المطلوب حفظها

- نسخة SQL results للملفات `00` و`00A` و`04`.
- لقطات/Network evidence لمسار `/admin/knowledge-review-operations`.
- أربعة اختبارات RLS/RBAC سالبة على الأقل.
- قائمة القرارات للسجلات الـ296: القرار، المراجع، الدليل، التاريخ، والـUUID الناتج عند وجوده.
- دليل أن `non_official_released_chat_eligible_should_be_zero = 0`.

## 7) حالة الموافقة

هذه الحزمة **جاهزة للتطبيق المراقب فقط**. لا تساوي قبول تطبيق حي أو قبول إنتاجي إلى أن تصل أدلة SQL وBrowser وRBAC/RLS.
