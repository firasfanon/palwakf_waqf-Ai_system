# Mega Batch 27A — Smart Tools Admin Backend Activation + Arabic Quality Guard

**التاريخ:** 2026-06-15  
**النطاق:** المساعد الذكي / PalWakf Assistant  
**Baseline السابق:** `waqf_ai_model_hybrid_llm_admin_v32_mb26_precedents_predict_backend_closure.zip`  
**القرار:** `MEGA_BATCH_27A_SMART_TOOLS_ADMIN_BACKEND_ACTIVATION_APPLIED_LOCAL_SYNTAX_VERIFIED_FULL_PNPM_CHECK_PENDING_ENV`

---

## 1) طبيعة العمل

هذه دفعة تطوير فعلية داخل كود الأدوات الذكية، وليست إجراء حوكمة فقط.  
الهدف هو فتح Mega Batch 27 من زاوية الأدوات الذكية نفسها، عبر تحويل صفحة `/admin/tools` وسجل `/admin/tools/runs` من عرض تشغيلات فقط إلى مركز تفعيل backend يقرأ من الجداول السيادية ويستخرج حالة جاهزية كل أداة.

---

## 2) ما تم تنفيذه

### أ) Backend Activation Snapshot

أُضيفت قراءة backend جديدة داخل `server/runtimeRepository.ts`:

- `runtimeGetAiToolBackendActivationSnapshot()`

تقرأ من:

- `assistant.ai_tool_runs`
- `assistant.ai_tool_run_links`
- `assistant.ai_tool_run_events`

وتنتج لكل أداة من الأدوات الست:

- عدد التشغيلات الكلي
- عدد التشغيلات المكتملة
- عدد التشغيلات الفاشلة
- عدد التشغيلات بانتظار الاعتماد
- عدد روابط المعرفة
- وجود أحداث `created/completed/failed/linked_to_knowledge`
- آخر تشغيل
- القرار التشغيلي:
  - `active`
  - `active_with_warnings`
  - `degraded`
  - `pending_evidence`

### ب) TRPC Endpoint جديد

أُضيف داخل `aiToolsRouter`:

- `getBackendActivationSnapshot`

حتى تصبح لوحة الأدوات الذكية قادرة على قراءة حالة backend الحقيقية بدل الاعتماد على عدّاد عام فقط.

### ج) لوحة تفعيل Backend داخل صفحة الأدوات

تم تحديث:

- `client/src/pages/AITools.tsx`

لإضافة لوحة باسم:

- **لوحة تفعيل Backend للأدوات**

تعرض:

- عدد الأدوات المفعلة سياديًا
- عدد الأدوات المفعلة مع ملاحظات
- عدد الأدوات بانتظار دليل تشغيل
- عدد الأدوات المتدهورة/المتعطلة
- بطاقة تفصيلية لكل أداة مع الإجراء التالي

### د) فحص جودة التشغيل داخل سجل التشغيل والاعتماد

تم تحديث:

- `client/src/pages/AIToolRuns.tsx`

لإظهار فحص جودة آلي للتشغيل المحدد:

- درجة الجاهزية من 100
- حالة الأثر السيادي
- حالة اللغة العربية
- وجود/غياب رابط معرفة
- تحذيرات مثل:
  - التشغيل فاشل
  - الناتج مكتمل لكنه فارغ
  - الناتج يبدو غير عربي
  - حدث `created` غير موجود
  - لا يوجد حدث نهائي
  - التشغيل بانتظار الاعتماد

### هـ) Arabic Quality Guard لأداة compare

تم تحديث:

- `server/legal-analysis.ts`

لإغلاق ملاحظة الجودة اللغوية السابقة في `compare` عبر:

1. تشديد prompt المقارنة بحيث تكون كل القيم النصية في JSON بالعربية حصراً.
2. إضافة fallback عربي احتياطي عند عودة JSON غير عربي أو غير مطابق للبنية المتوقعة.
3. إبقاء الناتج الاحتياطي واضحًا كمسودة مراجعة لا كاعتماد نهائي.

---

## 3) الملفات المعدلة

- `server/runtimeRepository.ts`
- `server/routers.ts`
- `server/legal-analysis.ts`
- `client/src/pages/AITools.tsx`
- `client/src/pages/AIToolRuns.tsx`

## 4) الملفات المضافة/المحدثة للتوثيق

- `MEGA_BATCH_27A_SMART_TOOLS_ADMIN_BACKEND_ACTIVATION_2026_06_15.md`
- `MEGA_BATCH_27A_CHANGELOG_2026_06_15.md`
- `ERROR_RECORD_MEGA_BATCH_27A_2026_06_15.md`
- `SESSION_HANDOFF_MEGA_BATCH_27A_TO_27B_2026_06_15.md`
- `LATEST_BASELINE_MEGA_BATCH_27A_2026_06_15.md`
- `PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md`
- `MEGA_BATCH_27A_CHANGED_FILES_2026_06_15.txt`

---

## 5) التحقق الفني

تم تنفيذ فحص syntax للملفات TypeScript المعدلة بنجاح:

```bash
node --experimental-strip-types --check server/runtimeRepository.ts
node --experimental-strip-types --check server/routers.ts
node --experimental-strip-types --check server/legal-analysis.ts
```

لم يتم تشغيل `pnpm run check` داخل هذه البيئة لأن `pnpm` غير متوفر داخل الحاوية ولا توجد `node_modules` مرفقة داخل baseline. لذلك يبقى فحص TypeScript الكامل مطلوبًا في بيئة Windows/PowerShell المعتمدة بعد `pnpm install`.

---

## 6) ما لم يتم فعله

- لم يتم تنفيذ SQL إنتاجي.
- لم يتم إنشاء جداول جديدة.
- لم يتم تعديل RLS أو GRANT/REVOKE.
- لم يتم المساس بالجداول القديمة محل الجرد.
- لم يتم اعتماد production.
- لم يتم إعادة فتح نجاح Mega Batch 26.

---

## 7) نقطة الاستئناف التالية

**Mega Batch 27B — Admin Backend Activation Wider Admin Pages**

الخطوة التالية هي تطبيق نفس منهج التفعيل على صفحات الإدارة المصنفة:

- `backend_pending`
- `stub_page`
- `access_restricted`

مع أولوية الصفحات الأعلى قيمة تشغيلية، خصوصًا:

1. سجل النشاط
2. التحليلات والتقييمات
3. إدارة المعرفة/المكتبة/الملفات
4. إعدادات الموقع المتبقية
5. الصفحات التشغيلية مثل Cache / Integrations / Webhooks بعد تقرير تفعيل أو تأجيل رسمي
