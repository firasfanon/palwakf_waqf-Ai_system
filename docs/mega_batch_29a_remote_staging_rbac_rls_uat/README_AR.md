# Mega Batch 29A — دليل الحزمة

هذه الحزمة توسّع Smart Tools 3 بعد نجاح SQL governance على Staging. وهي لا تقوم بتطبيق SQL إضافي على الإنتاج ولا تعلن إنتاجًا معتمدًا.

ابدأ من:

1. `MEGA_BATCH_29A_REMOTE_STAGING_RBAC_RLS_NEGATIVE_UAT_RUNBOOK_AR.md`
2. شغّل `pnpm.cmd run check` و`pnpm.cmd run build` في بيئة المشروع الكاملة.
3. انشر إلى Staging فقط مع وسم النشر والـbaseline.
4. نفّذ PowerShell collector ثم Browser UAT.
5. شغّل SQL read-only قبل/بعد UAT.
6. املأ `MEGA_BATCH_29A_EVIDENCE_INTAKE_TEMPLATE_AR.md` وأرسل النتائج قبل أي تقييم إنتاج.
