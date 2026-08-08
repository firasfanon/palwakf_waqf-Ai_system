# ERROR RECORD — MEGA BATCH 27D TYPESCRIPT CLOSURE HOTFIX

**التاريخ:** 2026-06-16  
**المسار:** `server/routers.ts`  
**آخر baseline مستقر قبل الخطأ:** `waqf_ai_model_hybrid_llm_admin_v35_mb27c_runtime_evidence_intake_2026_06_16.zip`  
**baseline الذي ظهر فيه الخطأ:** `waqf_ai_model_hybrid_llm_admin_v36_mb27d_remaining_backend_pending_closure_2026_06_16.zip`  
**baseline المصحح:** `waqf_ai_model_hybrid_llm_admin_v36a_mb27d_typescript_closure_hotfix_2026_06_16.zip`

---

## الخطأ

```text
server/routers.ts:2407:202 - error TS2353:
Object literal may only specify known properties, and 'skipped' does not exist in type '{ success: boolean; }'.
```

---

## السبب

`safeDbRead<T>` يستقبل دالة نجاح وfallback من نفس النوع `T`.

في `faqsRouter.incrementView` كانت دالة النجاح تعيد:

```ts
{ success: true }
```

بينما fallback يعيد:

```ts
{ success: true, skipped: true }
```

لذلك استنتج TypeScript أن النوع هو `{ success: boolean }` ورفض الخاصية الإضافية `skipped`.

---

## ما فشل

- `pnpm.cmd run check`
- `tsc --noEmit`

---

## الحل

توحيد شكل return في success path وfallback path:

```ts
return { success: true, skipped: false };
```

مع بقاء fallback:

```ts
{ success: true, skipped: true }
```

---

## النتيجة المتوقعة بعد التصحيح

- `pnpm.cmd run check` يجب أن يتجاوز هذا الخطأ.
- إن ظهر خطأ جديد فهو مستقل عن هذا السجل ويجب تسجيله كسجل جديد.
