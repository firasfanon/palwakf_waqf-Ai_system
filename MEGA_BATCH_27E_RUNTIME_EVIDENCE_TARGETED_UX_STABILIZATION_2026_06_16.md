# Mega Batch 27E — Runtime Evidence Intake + Targeted UX Stabilization

**التاريخ:** 2026-06-16  
**Baseline المصدر:** `waqf_ai_model_hybrid_llm_admin_v36a_mb27d_typescript_closure_hotfix_2026_06_16.zip`  
**نوع الدفعة:** Runtime evidence intake + targeted UX/code stabilization  
**الحالة:** Applied locally in package; post-package local `pnpm.cmd run check` required.

---

## 1) القرار التنفيذي

```text
MEGA_BATCH_27E_RUNTIME_EVIDENCE_ACCEPTED_DATE_UX_STABILIZATION_APPLIED_SERVER_STATIC_CHECK_PASSED_LOCAL_POST_PATCH_CHECK_PENDING
```

تم قبول نتيجة المستخدم بأن `pnpm.cmd run check` مر بعد Hotfix 27D دون أخطاء TypeScript. هذا يغلق خطأ `TS2353` الذي ظهر في `faqsRouter.incrementView`.

ثم تم تطبيق تحسين موضعي ضمن 27E لمعالجة ملاحظة runtime غير الحاجبة التي ظهرت في 27C/27D حول تنسيق التواريخ في صفحات الإدارة، خصوصًا سجل النشاط ولوحات الأدوات.

---

## 2) الدليل المستوعب من المستخدم

الأمر:

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
```

النتيجة:

```text
> waqf_ai_model@1.0.0 check D:\waqf_ai_model
> tsc --noEmit
```

لم تظهر أخطاء بعد الأمر. التحذير الخاص بـ `pnpm` حول مكان إعدادات `patchedDependencies/overrides` غير حاجب ولا يمنع اعتماد الفحص.

---

## 3) ما تم تثبيته في UX

### 3.1 إنشاء formatter موحد للتواريخ

أضيف الملف:

```text
client/src/lib/dateFormat.ts
```

ويقدم:

- `parseRuntimeDate`
- `formatArabicDate`
- `formatArabicDateTime`
- `formatArabicMonthDay`
- `formatSortableDate`

الهدف: منع ظهور تنسيق تاريخ مختلط أو مربك في RTL مثل استخدام comma أو أرقام/اتجاهات غير مستقرة، واعتماد صيغة أوضح:

```text
15 يونيو 2026 — 05:46 م
```

### 3.2 الصفحات التي تم تثبيتها

تم ربط formatter الجديد في:

- `client/src/pages/AdminActivity.tsx`
- `client/src/pages/AIToolRuns.tsx`
- `client/src/pages/AITools.tsx`
- `client/src/pages/ManageUsers.tsx`
- `client/src/pages/AdminUsers.tsx`
- `client/src/pages/admin/AuditLogs.tsx`
- `client/src/pages/admin/Reports.tsx`
- `client/src/pages/admin/Backup.tsx`

### 3.3 تثبيت server-side للنشاط

تم تحسين `server/routers.ts` في مسار `admin.activityLog` عبر:

- جعل `safeDate` أكثر تحمّلًا لصيغ `YYYY-MM-DD HH:mm:ss`.
- إضافة `normalizeRuntimeDate` لإرجاع ISO ثابت حيث يمكن.
- فرز سجل النشاط بالتوقيت العددي بدل المقارنة النصية.

---

## 4) التحقق المنجز داخل الحاوية

تم بنجاح:

```bash
node --experimental-strip-types --check server/routers.ts
node --experimental-strip-types --check client/src/lib/dateFormat.ts
```

لم يتم تشغيل `pnpm.cmd run check` داخل الحاوية بسبب عدم توفر `node_modules` وتعريفات `node/vite`. يجب تشغيله محليًا بعد تطبيق v37.

---

## 5) أوامر التحقق المطلوبة محليًا

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```

ثم راجع الصفحات التالية:

```text
/knowledge#/admin/activity
/knowledge#/admin/tools
/knowledge#/admin/tools/runs
/knowledge#/admin/users
/knowledge#/admin/audit-logs
/knowledge#/admin/reports
/knowledge#/admin/backup
```

---

## 6) ما لم يتم تغييره

- لا schema changes.
- لا SQL إنتاجي.
- لا RLS/GRANT/REVOKE.
- لا hard delete.
- لا إعادة فتح Mega Batch 26 أو 27A أو 27B أو 27C.
- لا تغيير في حوكمة Mustakshif المؤجل رسميًا.

---

## 7) نقطة الاستئناف

**Mega Batch 27F — Post-27E Runtime Retest + Admin UX Final Sweep**

ابدأ من:

```text
waqf_ai_model_hybrid_llm_admin_v37_mb27e_runtime_evidence_targeted_ux_stabilization_2026_06_16.zip
```

المطلوب التالي:

1. تشغيل `pnpm.cmd run check` على v37.
2. تشغيل السيرفر.
3. التقاط أدلة للصفحات ذات التواريخ.
4. إغلاق أي ملاحظة UI فعلية متبقية.
