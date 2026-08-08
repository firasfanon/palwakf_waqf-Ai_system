# Error Record — Baseline Closure PowerShell Here-String Parse Failure

## المعرف

`BASELINE_CLOSURE_HERESTRING_TERMINATOR_PARSE_FIX_20260706`

## العرض

فشل سكربت إغلاق baseline الأول قبل أي تعديل أو أرشفة بسبب الخطأ:

```text
The string is missing the terminator: "@.
```

## السبب

استخدم السكربت الأصلي Here-String موسعًا في PowerShell لتوليد ملف الفهرس. احتوى النص على backticks خاصة بـ Markdown في نهاية أسطر، مثل:

```text
- Batch: `$BatchId`
```

في PowerShell، backtick في نهاية السطر يدمج السطر التالي، ولذلك لم يعد محدد الإغلاق `"@` في بداية سطر مستقلة ولم يتعرف عليه المحلل.

## الملفات المتأثرة

- `01_APPLY_BASELINE_CLOSURE_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1.ps1`

## ما فشل

- تحليل السكربت قبل التنفيذ.
- لم يبدأ تحديث الدليل الحاكم أو CHANGELOG أو Handoff.
- لم ينشأ ZIP baseline أو updates-only من محاولة V1 الأولى.

## المعالجة

- استبدال Here-String ببناء مصفوفة أسطر ثم دمجها بـ `Environment.NewLine`.
- استبدال صيغ `Write-Status (if ...)` بصياغة متغيرات واضحة قبل الطباعة.
- إضافة تنظيف `finally` لمجلدات staging المؤقتة.
- تنفيذ حزمة V1.1 من مجلد منفصل عن `ProjectRoot` لمنع إدخال بقايا حزمة الإغلاق ضمن baseline.

## آخر baseline مستقر قبل الإغلاق

`PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706`

## الحالة

```text
CLOSURE_AUTOMATION_V1=REJECTED_PARSE_ERROR
CLOSURE_AUTOMATION_V1_1=PREPARED
NO_APPLICATION_SOURCE_LOGIC_CHANGE
NO_SQL_CHANGE
```
