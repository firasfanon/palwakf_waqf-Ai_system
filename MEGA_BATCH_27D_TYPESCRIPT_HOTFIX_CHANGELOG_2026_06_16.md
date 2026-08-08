# CHANGELOG — MEGA BATCH 27D TYPESCRIPT CLOSURE HOTFIX

**التاريخ:** 2026-06-16

## Changed

- تعديل `server/routers.ts` في `faqsRouter.incrementView` لتوحيد نوع نتيجة `safeDbRead` بين success path وfallback path.

## Fixed

- إصلاح خطأ TypeScript:

```text
TS2353: 'skipped' does not exist in type '{ success: boolean; }'
```

## Not Changed

- لا تغيير في schema.
- لا تغيير في RLS.
- لا تغيير في مسارات الإدارة المفعّلة ضمن 27D.
- لا إعادة فتح لـ Mega Batch 26/27A/27B/27C.
