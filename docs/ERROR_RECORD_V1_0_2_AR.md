# Error Record — V1.0.1 Harness StrictMode Interpolation

## الخطأ

```text
The variable '$ProjectRoot' cannot be retrieved because it has not been set.
```

## السبب

داخل Harness وُضعت أنماط فحص نصية في double-quoted strings:

```powershell
"Copy-Item -LiteralPath $ProjectRoot"
"Move-Item -LiteralPath $ProjectRoot"
```

ومع `Set-StrictMode -Version Latest` حاول PowerShell توسيع `$ProjectRoot` قبل إجراء الفحص.

## الأثر

```text
HARNESS_FAILED_BEFORE_POST_APPLY_VERIFY
SOURCE_WRITE=NO
DATABASE_ACCESS=NO
POST_APPLY_VERIFY=NOT_STARTED
ROLLBACK_REQUIRED=NO
```

## الإصلاح V1.0.2

- تحويل الأنماط إلى single-quoted literals.
- إضافة فحص استباقي يمنع double-quoted literals ذات متغيرات غير مسموح بها.
- لا تغيير في منطق التحقق أو عقود Postimage.
