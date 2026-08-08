# Error Record — Source Provenance Rights / AR1 Runtime Findings

## ER-AR1-UX-20260706-01

### العرض

ظهور رسالة:

`source_provenance_supporting_read_failed:PGRST205`

ضمن صفحة سجل المصادر وحقوق النشر، مع قدرة صحيحة على قراءة المصادر والمواد المرتبطة، وتعطيل عمليات إضافة/تعديل/أرشفة الحقوق.

### السبب الجذري

طبقة Schema/RLS/RPC الخاصة بـ Mega Batch C لسجل الروابط وملفات الحقوق لم تطبق على البيئة المحلية الحالية. القراءة الأساسية من المصادر والمواد متاحة، لكن الكائنات الداعمة لملفات الحقوق غير موجودة أو غير مكشوفة ضمن schema cache.

### الملفات/المسارات ذات الصلة

- `client/src/pages/admin/SourceProvenanceRightsRegistry.tsx`
- `server/sourceProvenanceRights.ts`
- `sql_sandbox/mega_batch_c_source_provenance_rights_and_link_governance/01_SCHEMA_RLS_RPC_OPERATOR_APPLY.sql`

### ما فشل

قراءة الطبقة الداعمة فقط. لم يفشل مسار تسجيل الدخول المحلي، ولا تحميل الصفحة، ولا قراءة المصادر الأساسية، ولا بوابة AR1.

### المعالجة في هذه الدفعة

لا SQL ولا إصلاح Schema. تم تصنيف الحالة بصيغة تشغيلية واضحة: قراءة فقط، مع نقل المعرف التقني إلى تفاصيل دعم قابلة للطي.

### الحل/الخطوة اللاحقة

تنفيذ Preflight ثم قرار Staging منفصل لتطبيق Mega Batch C، خارج نطاق AR1 UX refinement.

### آخر baseline مستقر

`PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706`

### حالة الإغلاق

```text
OPEN_AS_GOVERNANCE_DEPENDENCY
NOT_A_CODE_REGRESSION
NOT_A_REASON_TO_BYPASS_RIGHTS_LAYER
```
