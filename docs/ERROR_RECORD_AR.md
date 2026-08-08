# Error Record — Wave 1 Post-Apply Verification Gates

## الحالة المثبتة

```text
SOURCE_APPLY=PASS
TARGET_FILES_APPLIED=10
PROJECT_POSTIMAGE_HASHES=PASS
STATIC_ASSERTIONS=53_PASS
FULL_TYPESCRIPT_CHECK=PASS
ROLLBACK_REQUIRED=NO
```

## الخطأ الأول: Targeted Verify

استُخدم:

```text
corepack pnpm exec esbuild
```

فنفّذ pnpm Dependency Status Check وحاول تشغيل `pnpm install`. فشل التثبيت بسبب:

```text
EPERM: operation not permitted, open 'C:\_tmp_*'
```

هذا فشل في Harness لا في ملف `SourceInventoryPreview.tsx`.

## الخطأ الثاني: Full Project Gates

نجح:

```text
FULL_PROJECT_TYPESCRIPT_CHECK_EXIT_CODE=0
```

لكن مجموعة Vitest الكاملة فشلت داخل اختبارات خادم وقاعدة بيانات وعقود Router قديمة، ومنها:

- `Database not available`.
- `No procedure found on path`.
- توقعات Seed وبيانات غير متوفرة.
- عقود Validation قديمة.

لم يظهر في قسم فشل الاختبارات أي مرجع إلى ملفات Wave 1 العشرة.

كما أن Windows PowerShell 5.1 حوّل stderr الصادر من Vitest إلى `NativeCommandError` لأن الحزمة استخدمت `$ErrorActionPreference="Stop"` حول الأمر الأصلي.

## الإصلاح

الحزمة V1.0.1:

- لا تعيد Apply.
- تستخدم `node_modules\.bin\esbuild.cmd` مباشرة.
- تستخدم `tsc.cmd` مباشرة.
- تستخدم `vite.cmd` لبناء Client داخل `%TEMP%`.
- لا تستخدم Corepack أو `pnpm exec` أو Install.
- تتعامل مع stderr للأوامر الأصلية دون إنهاء زائف.
- تصنّف فشل الاختبارات الكاملة كدين منفصل دون الادعاء بأن Full Test Suite ناجحة.
