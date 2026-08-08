# أوامر التنفيذ

بعد فك الحزمة، افتح PowerShell داخل مجلد الحزمة، ثم نفّذ:

```powershell
$src = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"

powershell -ExecutionPolicy Bypass -File ".\01_APPLY_MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1.ps1" -SourceRoot $src

powershell -ExecutionPolicy Bypass -File ".\02_VERIFY_MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1.ps1" -SourceRoot $src

cd $src
pnpm.cmd run check
pnpm.cmd run build
```

إذا ظهر:

```text
ALREADY_APPLIED
```

لا تعيد التطبيق. انتقل إلى التحقق وUAT.

إذا ظهر:

```text
PREIMAGE_MISMATCH
```

توقف ولا تنسخ الملف يدويًا.
