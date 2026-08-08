# PALWAKF_ASSISTANT_SCHEMA_DEFAULT_PRIVILEGES_LOCAL_HARDENING_V1_0_1_20260716

## نبذة عربية

هذه الحزمة تقوّي Default Privileges المحلية داخل schema `assistant` فقط.

- تزيل المنح الافتراضية المباشرة لـ`anon` و`authenticated` على الجداول والمتتاليات والدوال المستقبلية داخل `assistant`.
- تبقي Default Privileges الخاصة بـ`service_role`.
- لا تغيّر الصلاحيات الحالية على الكائنات الموجودة.
- لا تغيّر `PUBLIC EXECUTE` العام للدوال؛ يبقى حجزًا أمنيًا منفصلًا لأنه تغيير Global عبر جميع schemas.

## التشغيل الآن

```text
RUN_00_HARNESS_SELF_TEST.cmd
RUN_01_WHATIF.cmd
```

توقف بعد WhatIf. لا تشغّل Apply قبل اعتماد حي صريح بعد مراجعة الدليل.
