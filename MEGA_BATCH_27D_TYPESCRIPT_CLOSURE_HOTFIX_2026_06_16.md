# MEGA BATCH 27D — TypeScript Closure Hotfix

**المشروع:** PalWakf Assistant / waqf_ai_model  
**التاريخ:** 2026-06-16  
**Baseline السابق:** `waqf_ai_model_hybrid_llm_admin_v36_mb27d_remaining_backend_pending_closure_2026_06_16.zip`  
**Baseline الجديد:** `waqf_ai_model_hybrid_llm_admin_v36a_mb27d_typescript_closure_hotfix_2026_06_16.zip`  
**نوع الإجراء:** Hotfix موضعي داخل 27D بعد نتيجة تشغيل محلية فعلية.

---

## القرار التنفيذي

```text
MEGA_BATCH_27D_TYPESCRIPT_CLOSURE_HOTFIX_APPLIED_ROUTER_STATIC_CHECK_PASSED_LOCAL_PNPM_RETEST_REQUIRED
```

---

## سبب الدفعة

أرسل المشغّل نتيجة محلية من PowerShell تفيد بفشل:

```powershell
pnpm.cmd run check
```

بسبب خطأ TypeScript في:

```text
server/routers.ts:2407:202 - error TS2353
Object literal may only specify known properties, and 'skipped' does not exist in type '{ success: boolean; }'.
```

السبب التقني أن `safeDbRead<T>` استنتج النوع `T` من دالة النجاح كـ:

```ts
{ success: boolean }
```

بينما fallback كان يحتوي على خاصية إضافية:

```ts
{ success: true, skipped: true }
```

وهذا تسبب في رفض TypeScript للخاصية `skipped` داخل fallback.

---

## التعديل المطبق

تم تعديل مسار:

```text
server/routers.ts
```

داخل `faqsRouter.incrementView` بحيث تعيد دالة النجاح نفس شكل fallback:

```ts
return { success: true, skipped: false };
```

وبذلك يصبح النوع المستنتج لـ `safeDbRead` متسقًا:

```ts
{ success: boolean; skipped: boolean }
```

بدل وجود mismatch بين success path وfallback path.

---

## أثر التعديل

- لا يوجد تغيير في DB schema.
- لا يوجد تغيير في صلاحيات أو RLS.
- لا يوجد تغيير في behavior الإنتاجي المقصود.
- عند نجاح increment view ستعود النتيجة: `skipped: false`.
- عند fallback ستعود النتيجة: `skipped: true`.
- التعديل موضعي ومحصور في endpoint واحد.

---

## الفحص المنجز داخل الحاوية

تم بنجاح:

```bash
node --experimental-strip-types --check server/routers.ts
```

لم يتم تشغيل `pnpm run check` داخل الحاوية لعدم توفر dependencies الكاملة، لذلك يلزم إعادة تشغيله محليًا على Windows بعد استبدال الملف أو استخدام baseline الجديد.

---

## أمر إعادة الاختبار المحلي

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
```

ثم:

```powershell
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```
