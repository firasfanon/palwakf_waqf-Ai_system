# Error Record — V1.0.3 Native Output Leaked into Function Return

## الخطأ الظاهر

رغم أن Static Verifier طبع:

```text
STATIC_ASSERTION_COUNT=53
PRODUCT_SURFACES_WAVE_1_STATIC_VERIFY=PASS
... 
0
```

فقد انتهى المسار بـ:

```text
STATIC_VERIFIER_FAILED::<all verifier output> 0
```

## السبب

داخل `Invoke-NativeCaptured` استُخدم:

```powershell
& $Executable @Arguments 2>&1 |
  Tee-Object ...
```

في PowerShell، كل ما يخرج عبر Success Pipeline يصبح جزءًا من قيمة إرجاع الدالة.

لذلك كانت قيمة:

```powershell
$exitCode = Invoke-NativeCaptured ...
```

مصفوفة تحتوي:

1. جميع سطور Static Verifier.
2. الرقم `0`.

ولم تكن Integer واحدة.

## الدليل

التحقق الساكن نفسه نجح بالكامل:

```text
STATIC_ASSERTION_COUNT=53
PRODUCT_SURFACES_WAVE_1_STATIC_VERIFY=PASS
DATABASE_CHANGE=NO
SERVER_API_CHANGE=NO
CHAT_RELEASE=NO
PRODUCTION=NO
```

إذًا الفشل كان في Wrapper فقط، لا في Source Patch أو Static Verifier.

## الإصلاح V1.0.4

- Buffer لمخرجات الأمر الأصلي.
- حفظ `$LASTEXITCODE` كـInteger.
- تمرير المخرجات إلى Evidence وConsole عبر `Out-Host`.
- إعادة Exit Code واحد فقط.
- إضافة Native Capture Harness تنفيذي يمنع تكرار المشكلة.

## الأثر

```text
POST_APPLY_VERIFY=STOPPED_AFTER_STATIC_VERIFY
SOURCE_WRITE=NO
DATABASE_ACCESS=NO
ROLLBACK_REQUIRED=NO
RERUN_APPLY=FORBIDDEN
```
