# Pass 24/25 TypeScript Hotfix — server/routers.ts

التاريخ: 2026-06-15

## السبب
أثناء تشغيل:

```bash
pnpm run check
```

ظهر انهيار TypeScript في `server/routers.ts` بسبب:
- regular expression مكسور في `split(/\r?\n/)`
- سلاسل نصية مكسورة في عدة مواضع من `join('\n')`

## ما تم إصلاحه
- إصلاح `fallbackTitle` ليستخدم:
  - `trimmedText.split(/\r?\n/)`
- إصلاح جميع المواضع المكسورة التي كانت مكتوبة فعليًا كسطرين بدل `join('\n')` الصحيح.

## النطاق
الإصلاح موضعي في:
- `server/routers.ts`

## الأثر المتوقع
- اختفاء أخطاء `Unterminated regular expression literal`
- اختفاء أخطاء `Unterminated string literal`
- السماح بإكمال فحص TypeScript إلى الأخطاء التالية إن وجدت
