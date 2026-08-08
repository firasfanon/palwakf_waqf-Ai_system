# أوامر التنفيذ

```powershell
$pkg = "<مسار الحزمة بعد فك الضغط>"
$src = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"

# 1) فحص ما قبل التطبيق دون تغيير
& "$pkg\01_APPLY_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1.ps1" -SourceRoot $src -WhatIf

# 2) التطبيق الفعلي
& "$pkg\01_APPLY_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1.ps1" -SourceRoot $src

# 3) التحقق المستقل
& "$pkg\02_VERIFY_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1.ps1" -SourceRoot $src

# 4) التشغيل المحلي
Set-Location $src
npm run dev
```

ثم افتح `http://localhost:3000/knowledge#/admin/source-provenance-rights` ونفذ دورة واحدة فقط.
