# UAT — دورة AR1 الواحدة

## قبل المتصفح

```powershell
pnpm.cmd run check
pnpm.cmd run build
pnpm.cmd run verify:mega-batch-ar1-single-flow-orchestration
```

## المتصفح

1. افتح `/knowledge#/admin/source-provenance-rights`.
2. لا تفتح C3 أو C4 يدويًا.
3. في بطاقة AR1 اضغط `بدء دورة التحقق` مرة واحدة.
4. انتظر حتى تظهر نتيجة واحدة من:
   - `تم العثور على مادة قابلة للربط` → اختر مادة واحدة فقط؛ تظهر مراجع الجلسة بعدها.
   - `لم يتم العثور على مادة قابلة للربط حتميًا` → لا إجراء إضافي، لا جلسة، لا كتابة.
5. عند ظهور مرشح، أدخل مراجع T3/T4 والحقوق/الاستخدام الداخلية، أنشئ جلسة واحدة، ثم ألغها وتحقق من `activeSessions = 0`.

## قبول

```text
ONE_BUTTON_C3_TO_C4_FLOW=PASS
NO_MANUAL_C3_C4_NAVIGATION_REQUIRED=PASS
NO_CANDIDATE_HOLD_IS_CLEAR=PASS
SINGLE_CANDIDATE_SELECTION_GATE=PASS
NO_DATABASE_OR_RIGHTS_WRITE=PASS
PUBLIC_CHAT_RELEASE=NOT_AUTHORIZED
```
