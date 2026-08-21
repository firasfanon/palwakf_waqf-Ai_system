# R9 Runtime UAT

بعد `pnpm.cmd run check` شغّل المشروع محليًا، وتحقق من `/api/health/supabase` و`/api/health/readiness`، ثم افتح `/knowledge#/admin/source-provenance-rights`.

تحقق من: ظهور طبقة الحقوق، Badge لحالة مراجعة الحقوق، أزرار «اعتماد الحقوق» و«رفض الحقوق» عند وجود Rights Profile، إلزام ملاحظة مراجعة لا تقل عن 8 محارف، تحديث الحالة إلى verified/rejected بعد الحفظ، وعدم وجود أي Release تلقائي إلى Chat/Public. لا تنفذ Release رسمي خلال هذا UAT.
