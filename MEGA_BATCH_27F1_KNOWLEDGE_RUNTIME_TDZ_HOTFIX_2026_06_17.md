# Mega Batch 27F-1 — Knowledge Runtime TDZ Closure Hotfix

**التاريخ:** 2026-06-17
**baseline السابق:** `waqf_ai_model_hybrid_llm_admin_v38_mb27f_runtime_console_noise_reduction_final_admin_ux_sweep_2026_06_16.zip`
**baseline الناتج:** `waqf_ai_model_hybrid_llm_admin_v38a_mb27f1_knowledge_runtime_tdz_hotfix_2026_06_17.zip`

## القرار التنفيذي

`MEGA_BATCH_27F1_KNOWLEDGE_RUNTIME_TDZ_HOTFIX_APPLIED_LOCAL_BROWSER_RETEST_REQUIRED`

## سبب الدفعة

أرسل المستخدم دليل runtime من المتصفح لصفحة:

`/knowledge#/admin/knowledge`

وتضمن الخطأ:

```text
ReferenceError: Cannot access 'getResolvedStatus' before initialization
at ManageKnowledge.tsx:88:79
```

هذا الخطأ لم يظهر في `pnpm.cmd run check` لأن TypeScript لا يمنع هذا النمط دائمًا عند وجود `const` داخل component واستخدامه قبل التهيئة أثناء render، لكنه يظهر في runtime بسبب Temporal Dead Zone.

## التعديل المطبق

تم تعديل:

`client/src/pages/ManageKnowledge.tsx`

بنقل/رفع helper functions التالية إلى مستوى module scope قبل component render:

- `getResolvedStatus`
- `getDocumentStorageKind`
- `isReadOnlyDoc`

وبذلك أصبحت متاحة قبل تنفيذ `useMemo` الذي يحسب `counts`.

## الأثر

- إغلاق crash صفحة `/admin/knowledge`.
- عدم تعديل backend.
- عدم تعديل DB/RLS.
- عدم تعديل صلاحيات.
- عدم تغيير منطق حفظ/مراجعة/حذف المعرفة.

## الفحص المتاح داخل الحاوية

تم تنفيذ فحص diff/structure موضعي، وتم التأكد من أن التعريفات لم تعد داخل ترتيب render بعد `useMemo`.

الفحص المحلي المطلوب بعد التطبيق:

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```

ثم فتح:

```text
http://localhost:3000/knowledge#/admin/knowledge
```

## الحالة

الدفعة مطبقة كوديًا، وتحتاج فقط retest browser محلي لإثبات إغلاق صفحة إدارة المعرفة.
