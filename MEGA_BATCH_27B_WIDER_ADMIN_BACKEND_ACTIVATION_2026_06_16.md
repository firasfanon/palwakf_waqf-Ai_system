# Mega Batch 27B — Wider Admin Backend Activation

**المشروع:** PalWakf Assistant / المساعد الذكي  
**التاريخ:** 2026-06-16  
**baseline السابق:** `waqf_ai_model_hybrid_llm_admin_v33_mb27a_smart_tools_admin_backend_activation_2026_06_15.zip`  
**baseline الناتج:** `waqf_ai_model_hybrid_llm_admin_v34_mb27b_wider_admin_backend_activation_2026_06_16.zip`  
**القرار:** `MEGA_BATCH_27B_WIDER_ADMIN_BACKEND_ACTIVATION_APPLIED_STATIC_SYNTAX_CHECKS_PASSED_BROWSER_EVIDENCE_PENDING`

---

## 1) طبيعة العمل

هذه الدفعة هي **تطوير فعلي + ربط backend إداري**، وليست تحسينًا شكليًا.

نطاقها المباشر كان إغلاق فجوة جوهرية ظهرت بعد Mega Batch 27A: وجود صفحات في الواجهة تستدعي `trpc.admin.*` و`trpc.analytics.*` دون وجود root routers مكافئة في `server/routers.ts`، إضافة إلى صفحات تشغيل كانت ما تزال placeholder مثل Cache/Backup/Integrations/Webhooks.

---

## 2) ما تم تفعيله

### 2.1 تفعيل root routers جديدة

أُضيفت داخل `server/routers.ts`:

- `admin: adminRouter`
- `analytics: analyticsRouter`

مع endpoints فعلية للصفحات التالية:

#### لوحة القيادة
- `admin.systemStats`
- `admin.charts.userGrowth`
- `admin.charts.conversationActivity`
- `admin.charts.faqDistribution`

#### سجل النشاط
- `admin.activityLog`

#### المستخدمون
- `admin.users.list`
- `admin.users.getActivity`
- `admin.users.updateRole`
- `admin.users.toggleStatus`
- `admin.users.delete`
- `admin.users.bulkUpdateRole`
- `admin.users.bulkToggleStatus`
- `admin.users.bulkDelete`

> ملاحظة حوكمة: delete/bulkDelete تم تنفيذهما كتعطيل آمن `isActive = 0` بدل حذف هدّام.

#### المحتوى
- `admin.content.faqs.list`
- `admin.content.faqs.update`
- `admin.content.faqs.delete` كتعطيل آمن
- `admin.content.documents.list`
- `admin.content.documents.update`
- `admin.content.documents.delete` كتعطيل آمن `isActive = 0`

#### التحليلات
- `analytics.getRatingStats`
- `analytics.analyzeNegativeRatings`
- `analytics.getFrequentQuestions`
- `analytics.getBestAnswers`
- `analytics.getImprovementSuggestions`

---

## 3) صفحات placeholder التي تحولت إلى backend-connected

تم استبدال صفحات placeholder بواجهات تقرأ backend فعليًا:

- `/admin/cache` عبر `admin.operations.cacheSnapshot`
- `/admin/backup` عبر `admin.operations.backupSnapshot` و`admin.operations.createBackupManifest`
- `/admin/integrations` عبر `admin.operations.integrationsSnapshot`
- `/admin/webhooks` عبر `admin.operations.webhooksSnapshot`

### حدود النسخ الاحتياطي

لم يتم تنفيذ dump أو restore من الواجهة. تم اعتماد نمط آمن فقط:

- قراءة snapshot للأعداد والنطاقات.
- إنشاء manifest حوكمي فقط.
- منع أي استعادة أو حذف أو ضغط قاعدة بيانات من الواجهة.

---

## 4) تحديث لوحة تصنيف صفحات الإدارة

تم تحديث `/admin/page-classification` لتقرأ backend snapshot جديد:

- `admin.backendActivationSnapshot`

وأصبحت تعرض بطاقة توضح عدد الصفحات التي تم تفعيل backend لها ضمن 27B، وتربط كل صفحة بمسار backend الخاص بها حيث ينطبق.

---

## 5) تحديث تصنيف Admin Registry

تم تحديث `client/src/config/adminRegistryV2.ts` لنقل الصفحات التالية إلى `operational / connected`:

- لوحة التحكم الرئيسية
- سجل النشاط
- التحليلات والتقييمات
- إدارة المحتوى
- إدارة المستخدمين
- إدارة Cache
- النسخ الاحتياطي
- التكاملات
- Webhooks

---

## 6) الملفات المعدلة

- `server/routers.ts`
- `client/src/config/adminRegistryV2.ts`
- `client/src/pages/admin/AdminPagesClassification.tsx`
- `client/src/pages/admin/Cache.tsx`
- `client/src/pages/admin/Integrations.tsx`
- `client/src/pages/admin/Webhooks.tsx`
- `client/src/pages/admin/Backup.tsx`
- `PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md`

---

## 7) التحقق المنجز داخل بيئة التنفيذ

تم تنفيذ فحص syntax ثابت للملفات TypeScript المعدلة:

```bash
node --experimental-strip-types --check server/routers.ts
node --experimental-strip-types --check client/src/config/adminRegistryV2.ts
```

النتيجة: **نجاح**.

لم يتم تشغيل `pnpm run check` داخل الحاوية بسبب عدم وجود `node_modules`/`pnpm` داخل بيئة التنفيذ. يجب تشغيله محليًا بعد تثبيت البيئة:

```powershell
cd D:\waqf_ai_model
pnpm.cmd install
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```

---

## 8) اختبارات المتصفح المطلوبة

افتح هذه الصفحات وتحقق من عدم ظهور أخطاء tRPC في Network/Console:

- `/knowledge#/admin/dashboard`
- `/knowledge#/admin/activity`
- `/knowledge#/admin/analytics`
- `/knowledge#/admin/content`
- `/knowledge#/admin/users`
- `/knowledge#/admin/cache`
- `/knowledge#/admin/backup`
- `/knowledge#/admin/integrations`
- `/knowledge#/admin/webhooks`
- `/knowledge#/admin/page-classification`

---

## 9) ما لم يتم اعتماده إنتاجيًا

- لا production approval.
- لا dump/restore.
- لا حذف هدّام للمستخدمين أو الوثائق.
- لا إرسال webhook خارجي تلقائي.
- لا تغيير في جداول منصة PalWakf السيادية خارج مساعد المعرفة.

