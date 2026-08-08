# UAT — MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1

## أوامر ما قبل المتصفح

من مجلد الحزمة المفكوكة:

```powershell
$src = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"

powershell -ExecutionPolicy Bypass -File ".\01_APPLY_MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1.ps1" -SourceRoot $src

powershell -ExecutionPolicy Bypass -File ".\02_VERIFY_MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1.ps1" -SourceRoot $src

cd $src
pnpm.cmd run check
pnpm.cmd run build
```

## إعادة تشغيل الخادم المحلي

أوقف dev server الحالي:

```text
Ctrl + C
```

ثم:

```powershell
cd "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"
pnpm.cmd run dev
```

## UAT من المتصفح

افتح:

```text
http://localhost:3000/knowledge#/admin/source-provenance-rights
```

ثم:

```text
F12 → Network → Clear → اضغط "بدء دورة التحقق" مرة واحدة فقط
```

انسخ Response لطلب:

```text
agenticRagPilot.runSingleFlowReadinessCycle
```

## قبول UAT

المطلوب:

```text
c3.status = completed
c4.status = READY_FOR_OPERATOR_BINDING
c4.candidateCount > 0
c4.corpusResolution.directC4MaterialReferences > 0
```

## ممنوع أثناء UAT

```text
NO startSession
NO ask
NO source upsert
NO rights assignment
NO Ledger decision
NO Chat/RAG
```
