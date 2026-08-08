# Smart Tools 3 — Changelog

## Added

- `server/knowledgeOperations.ts`: طبقة server/service-role لعمليات المراجعة، KB08B، وKB09.
- `client/src/pages/admin/KnowledgeReviewOperations.tsx`: مركز إداري جديد للمراجعة البشرية والمطابقة وربط الصفحات.
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/01_HUMAN_REVIEW_OPERATIONS_V1_OPERATOR_APPLY.sql`.
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/02_KB08B_MAPPING_RESOLUTION_OPERATOR_APPLY.sql`.
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/03_KB09_PAGE_BINDING_REAL_OPERATIONS_OPERATOR_APPLY.sql`.
- تقرير تسوية read-only صريح لمهام `content_classification` الست.

## Changed

- أضيف `/admin/knowledge-review-operations` إلى Admin Registry والبريدكرمبس.
- توسع `knowledgeTrust` router بعقود محكومة لخدمة server فقط.
- أضيف paging لطابور المراجعة وطابور KB08B لتغطية العمل على نطاق كبير بدل أول 100 صف فقط.
- تم تحديث الدليل الشامل للمنصة بهذه الحزمة بوصفها pre-apply baseline لا قبولًا حيًا.

## Security / Governance

- لا نشر تلقائي.
- لا اعتماد جماعي.
- لا حذف للسجلات الموروثة.
- تحرير الدردشة مشروط بـ official source verified + citation verified + human publish scope.
- FAQ/Templates/Settings لا تتحول إلى active من وضع legacy staged.

## Validation

- فحص `TypeScript.transpileModule` للملفات الجديدة والمعدلة: ناجح.
- فحص ساكن يؤكد غياب DML مباشر من صفحة الإدارة الجديدة: ناجح.
- فحص ساكن يؤكد وجود شرط المصدر الرسمي والاستشهاد الموثق قبل التحرير: ناجح.
- لم ينفذ apply على Supabase ولم ينفذ UAT متصفح من هذه البيئة.
