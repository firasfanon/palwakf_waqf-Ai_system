ضع الملف داخل:
scripts/migrations/export_assistant_batch3_from_source_files.ts

ثم شغّل:
$env:ASSISTANT_LOCAL_RUNTIME_FILE=".manus/db/local_runtime_store.json"
pnpm exec tsx scripts/migrations/export_assistant_batch3_from_source_files.ts
