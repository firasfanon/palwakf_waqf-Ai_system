# Knowledge RTL Hotfix — 2026-04-23

تم تنفيذ إصلاح موضعي لمشكلة ظهور البطاقة/النافذة التوضيحية في مسار Knowledge باتجاه يسار-يمين.

## ما تم
- تقوية RTL داخل `client/src/pages/Knowledge.tsx` للنافذة التي تظهر عند الضغط على البطاقة.
- إضافة `text-right` و`dir="rtl"` وwrapper داخلي واضح للمحتوى داخل Dialog.
- جعل رابط `المصدر الأصلي` ومحاذاة metadata داخل النافذة متوافقة مع RTL.
- تقوية RTL داخل المكونات العامة التي قد تُستخدم لبطاقات/نوافذ توضيحية مشابهة:
  - `client/src/components/ui/dialog.tsx`
  - `client/src/components/ui/popover.tsx`
  - `client/src/components/ui/tooltip.tsx`

## الهدف
إغلاق المشكلة من مصدرين معًا:
1. نافذة Knowledge نفسها.
2. مكونات العرض العامة التي تنشئ المحتوى عبر Portal خارج شجرة الصفحة.
