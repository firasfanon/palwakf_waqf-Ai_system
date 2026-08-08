# Error Record — Mega Batch 27F

**التاريخ:** 2026-06-16

## الخطأ / الملاحظة

Runtime console noise:

```text
[MB27D] safe read fallback Error: Database not available
```

## السبب

`safeDbRead` كان يطبع كائن الخطأ كاملًا، ما يؤدي إلى stack trace طويل لحالة محلية متوقعة عند غياب اتصال DB.

## الملفات

- `server/routers.ts`

## ما فشل

لم يفشل السيرفر ولم تفشل الصفحات؛ المشكلة ضجيج console فقط.

## الحل

- إضافة `getRuntimeErrorMessage`.
- إضافة `isExpectedLocalDbUnavailable`.
- إضافة `warnSafeDbReadFallback`.
- كتم التكرار بعد ظهور متكرر.
- الإبقاء على fallback دون تغيير منطق القراءة الآمنة.

## آخر baseline مستقر قبل الحل

`waqf_ai_model_hybrid_llm_admin_v37_mb27e_runtime_evidence_targeted_ux_stabilization_2026_06_16.zip`

## baseline بعد الحل

`waqf_ai_model_hybrid_llm_admin_v38_mb27f_runtime_console_noise_reduction_final_admin_ux_sweep_2026_06_16.zip`
