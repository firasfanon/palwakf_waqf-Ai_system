# أوامر التطبيق والتحقق

نفذ بعد فك الحزمة من داخل مجلد الحزمة:

```powershell
$src = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"

powershell -ExecutionPolicy Bypass -File ".\01_APPLY_MEGA_BATCH_AR1_C4_UUID_KNOWLEDGE_DOCUMENT_RESOLUTION_REPAIR_V1.ps1" -SourceRoot $src

powershell -ExecutionPolicy Bypass -File ".\02_VERIFY_MEGA_BATCH_AR1_C4_UUID_KNOWLEDGE_DOCUMENT_RESOLUTION_REPAIR_V1.ps1" -SourceRoot $src

cd $src
pnpm.cmd run check
pnpm.cmd run build
```

ثم نفذ UAT كما في `03_UAT_RUNBOOK_AR.md`.

إذا ظهر `PREIMAGE_MISMATCH` توقف ولا تطبق يدويًا.
