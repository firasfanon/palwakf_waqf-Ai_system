# R9 — Live Remediation Acceptance + Source Sync

تم تطبيق `palwakf_assistant_r9_controlled_live_remediation_v1` بنجاح بتاريخ 2026-08-21.

هذا المجلد يوثق SQL المطبق بالفعل ويزامن المصدر مع العقد الحي. **لا تعِد تشغيل** `01_APPLIED_LIVE_MIGRATION.sql` من هذا المجلد.

النتائج المقبولة: إغلاق P0 لـ`document_can_write_v1()`، إزالة MAINTAIN/TRUNCATE/REFERENCES/TRIGGER من client roles على مجموعة 42 جدولًا، تضييق 7 Legacy Provenance RPCs إلى postgres/service_role، نشر طبقة الحقوق، وإضافة Rights Human Review + Release Rights Gate.
