# دليل التشغيل

```powershell
& "$pkgDefaultAclLocal\RUN_00_HARNESS_SELF_TEST.cmd"
& "$pkgDefaultAclLocal\RUN_01_WHATIF.cmd"
```

توقف بعد WhatIf. التطبيق محمي بالمتغير:

```text
PALWAKF_ASSISTANT_DEFAULT_PRIVILEGES_LOCAL_HARDENING_LIVE_WRITE_APPROVED=YES
```

الحدود: لا تغيير Global، لا تغيير صلاحيات الكائنات الحالية، لا تعديل معرفة، لا Chat، لا Production.
