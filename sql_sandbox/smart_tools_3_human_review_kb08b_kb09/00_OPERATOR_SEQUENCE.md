# Smart Tools 3 — Operator Sequence

## Purpose

مسار تطبيق محكوم لحزمة Human Review Operations v1 وKB08B وKB09. لا تنفذ أي ملف خارج الترتيب.

## Preconditions

- نسخة احتياطية/restore point مصدق للـSupabase staging.
- PWF service role متاح على server فقط.
- حساب Reviewer مخصص يحمل `assistant.review`.
- حساب Publisher منفصل أو موثق يحمل `assistant.publish`.
- حفظ مخرجات SQL في مجلد evidence غير قابل للتعديل العرضي.

## Sequence

1. `00_PREFLIGHT_READ_ONLY.sql` — تحقق من وجود الجداول والأرقام.
2. `00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY.sql` — طابق المهام الست.
3. أوقف التطبيق إن لم توجد نتيجة صفية موثقة لكل مهمة تاريخية.
4. `01_HUMAN_REVIEW_OPERATIONS_V1_OPERATOR_APPLY.sql`.
5. `02_KB08B_MAPPING_RESOLUTION_OPERATOR_APPLY.sql`.
6. `03_KB09_PAGE_BINDING_REAL_OPERATIONS_OPERATOR_APPLY.sql`.
7. `04_POST_APPLY_READ_ONLY_VERIFICATION.sql`.
8. انشر runtime ثم نفذ browser + RBAC/RLS UAT.

## Mandatory Negative Tests

- Reviewer بلا scope: claim/source/citation ترفض.
- Publisher بلا scope: release/page binding ترفض.
- Source غير official أو citation غير verified: release يرفض.
- FAQ/templates/settings: activation ترفض إذا بقي domain legacy.
- Browser: لا direct REST write إلى `assistant.*` من مركز العمليات.

## Stop Conditions

- أي تغيير يجعل unverified أو non-official content chat-visible.
- اختلاف غير مفسر في reconciliation للست مهام.
- وجود DML من browser إلى جداول المعرفة.
- تطبيق SQL مع خطأ transaction أو اختلاف schema.

## Required Result Files

- `00_preflight_result.txt`
- `00a_content_classification_reconciliation_result.txt`
- `04_post_apply_verification_result.txt`
- `rbac_rls_negative_uat.md`
- `browser_network_evidence.md`
- `kb08b_resolution_register.csv`
