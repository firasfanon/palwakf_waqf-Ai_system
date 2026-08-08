# Error Record — Mega Batch 27F-1 Knowledge Runtime TDZ

## Error ID

`MB27F1-KNOWLEDGE-TDZ-GET-RESOLVED-STATUS`

## Reported Evidence

المستخدم أرسل لقطة Runtime لصفحة:

`/knowledge#/admin/knowledge`

مع رسالة:

```text
ReferenceError: Cannot access 'getResolvedStatus' before initialization
at ManageKnowledge.tsx:88:79
```

كما أرسل نتيجة:

```powershell
pnpm.cmd run check
```

وقد انتهت دون أخطاء TypeScript.

## Root Cause

داخل `ManageKnowledge.tsx` كان `useMemo` الخاص بحساب `counts` يستدعي:

- `getResolvedStatus`
- `isReadOnlyDoc`

قبل تهيئة هذه الثوابت داخل component body. وبسبب استخدام `const`، دخلت الدوال في Temporal Dead Zone عند runtime.

## Failed Area

- `client/src/pages/ManageKnowledge.tsx`
- Route: `/knowledge#/admin/knowledge`

## Fix

رفع helper functions إلى module scope قبل تعريف component، بحيث تصبح جاهزة قبل أول render.

## Stable Baseline Before Error

`waqf_ai_model_hybrid_llm_admin_v38_mb27f_runtime_console_noise_reduction_final_admin_ux_sweep_2026_06_16.zip`

## Stable Baseline After Fix

`waqf_ai_model_hybrid_llm_admin_v38a_mb27f1_knowledge_runtime_tdz_hotfix_2026_06_17.zip`

## Retest Required

- `pnpm.cmd run check`
- تشغيل السيرفر
- فتح `/knowledge#/admin/knowledge`
- التأكد من عدم ظهور Error Boundary
