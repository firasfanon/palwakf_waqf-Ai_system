# Session Handoff — PRE-UAT

## الدفعة

`MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1`

## نقطة البداية

- Clean source baseline يعمل محليًا بعد إعادة توفير `.env` محلي غير قابل للمشاركة.
- تسجيل الدخول المحكوم وPlatform Bridge عملا على `localhost:3001`.
- صفحة `/knowledge#/admin/source-provenance-rights` فتحت.
- طبقة الحقوق عرضت `source_provenance_supporting_read_failed:PGRST205` كاعتماد Staging غير مطبق.
- AR1 ظهر بحالة `C3_C4_FRESH_EVIDENCE_REQUIRED_HOLD` و`C4=0`؛ وهذه حالة fail-closed صحيحة.

## التغيير المنفذ في الكود

ملف واحد وظيفي:

`client/src/pages/admin/SourceProvenanceRightsRegistry.tsx`

مع verifier مستقل ووثائق UAT/Error Record. لا تعديل لخادم AR1، ولا لخادم الحقوق، ولا Schema/RLS/RPC/SQL.

## فحوص الحزمة المنفذة

```text
AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_STATIC_VERIFY=PASS
TSX_SYNTAX=PASS
```

## ما يجب تنفيذه بعد التطبيق

1. تشغيل verifier.
2. `pnpm.cmd run check`.
3. `pnpm.cmd run build`.
4. Browser UAT للحالة الحالية: طبقة حقوق read-only + AR1 HOLD/C4=0 + انتقال زر C3.
5. لا تعتبر الدفعة baseline معتمدًا قبل نجاح هذه الأدلة.

## ممنوعات صريحة

- لا SQL.
- لا تعديل `.env` أو رفعه.
- لا تشغيل C3/C4 من أجل الاختبار إن لم يكن ذلك قرارًا تشغيليًا مقصودًا.
- لا إنشاء جلسة AR1 بلا مادة C4 حتمية.
- لا Release أو Chat عام أو Production.
