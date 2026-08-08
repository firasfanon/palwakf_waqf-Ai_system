# إصلاح مُشغّل الحزمة فقط

**طبيعة الإصلاح:** إصلاح نحوي في `apply.ps1` فقط.

لم تتغير ملفات التطبيق أو ملفات CSS/TSX أو نصوص التحقق مقارنة بحزمة
`ADMIN_MOBILE_SINGLE_SIDEBAR_RENDER_AND_NAV_CONTAINMENT_CLOSURE` السابقة.

## العيب المصحح

كان مصفوفة `$entries` في PowerShell تنتهي بفاصلة بعد آخر عنصر قبل إغلاق `)`. في PowerShell 5.1 تسبب ذلك في:

```text
Missing expression after ','
```

تمت إزالة الفاصلة النهائية فقط.

## الأثر

- لا توجد أي عملية SQL.
- لا يوجد تعديل بيانات معرفية.
- لا يوجد Mapping أو Promotion أو Release.
- التطبيق السابق لم ينسخ أي ملف، لأن PowerShell توقف في مرحلة parsing قبل التنفيذ.


## Parser/Parameter-Block Fix
This package places the PowerShell `param(...)` block before executable statements. The previous runner could not bind `-ProjectRoot` because `Set-StrictMode` preceded `param`. Payload files are unchanged.
