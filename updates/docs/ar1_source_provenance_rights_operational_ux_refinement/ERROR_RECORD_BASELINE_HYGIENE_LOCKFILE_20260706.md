# Error Record — Baseline Hygiene / Lockfile Reconciliation

## المعرف

`BASELINE_HYGIENE_PACKAGE_LOCKFILE_RECONCILIATION_20260706`

## العرض

فشل الأمر التالي داخل النسخة النظيفة المرشحة:

```text
pnpm install --frozen-lockfile
ERR_PNPM_OUTDATED_LOCKFILE
```

ثم فشل `pnpm run check` بصورة تبعية لأن `node_modules` لم يكن موجودًا بعد.

## السبب المرجح المثبت من المخرجات

`package.json` تضمن specifiers لا يطابقها `pnpm-lock.yaml` الموروث في النسخة النظيفة؛ ظهرت ضمن الفروقات حزم مرتبطة ببيئة المنصة مثل `@supabase/supabase-js` و`vite-plugin-manus-runtime`.

## الملفات المتأثرة

- `package.json`
- `pnpm-lock.yaml`
- `node_modules/` — عنصر قابل لإعادة البناء وغير جزء من baseline

## ما فشل

- strict reproducible install باستخدام `--frozen-lockfile` قبل reconciliation.
- فحص TypeScript قبل تثبيت dependencies.

## المعالجة المحلية المنفذة

- تشغيل `pnpm install --no-frozen-lockfile` محليًا لإعادة مواءمة lockfile مع manifest.
- تشغيل الخادم المحلي بنجاح لاحقًا وفتح مسار AR1 المصقول.
- لم يُعد `.env` إلى baseline ولم تُنقل أسرار.

## الحالة

```text
LOCAL_RUNTIME_RECOVERED
STRICT_FROZEN_LOCK_REVALIDATION=NOT_RE-EVIDENCED_IN_THIS_CLOSURE
NO_SOURCE_LOGIC_CHANGE
NO_SQL_CHANGE
```

## آخر baseline مستقر قبل الإغلاق

`PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706`

## الإجراء الوقائي التالي

في أول دورة dependency-hygiene مستقلة فقط: شغّل `pnpm install --frozen-lockfile` بعد حفظ lockfile المعاد توليده، ثم `pnpm run check` و`pnpm run build`. لا تخلط هذه الصيانة مع AR1 أو Mega Batch C.
