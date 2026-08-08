# PASS 23 — Settings + Access Closure

التاريخ: 2026-06-14

## طبيعة العمل
هذه دفعة تشغيل/ربط وحوكمة، وليست دفعة واجهات. الهدف منها إغلاق مشكلتين تشغيليتين واضحتين:
1. صفحة إعدادات الموقع كانت تستدعي `trpc.siteSettings.update` دون وجود router فعلي لهذا المسار.
2. بعض صفحات الإدارة كانت تتحقق من `user.role === "admin"` فقط، مما يكسر التوافق مع مستخدمي المنصة القادمين عبر `platform_admin_users` أو أدوار منصة أوسع.

## ما تم تنفيذه

### 1) إضافة Site Settings Router فعلي
تم إنشاء:
- `server/_core/siteSettingsRouter.ts`

ويشمل:
- `siteSettings.get` كقراءة عامة مع `initializeSiteSettings()` عند عدم وجود صف إعدادات.
- `siteSettings.update` كمسار إداري محمي عبر `adminProcedure`.
- تطبيع `showSocialLinks` بين boolean في الواجهة و tinyint في التخزين.
- تمرير `updatedBy` من المستخدم الحالي.

### 2) ربط router الرئيسي
تم تسجيل:
- `siteSettings: siteSettingsRouter`
داخل `appRouter` في `server/routers.ts`.

### 3) إغلاق مشكلة الثيمات الجاهزة
تم تحديث:
- `client/src/lib/themes.ts`
بحيث تبقى الهوية المركزية المجمدة هي الأصل، لكن أسماء الثيمات القديمة/المستخدمة في الواجهة تُعامل كـ aliases آمنة:
- `ministry-classic`
- `light`
- `islamic-light`
- `islamic-dark`

وهذا يغلق رسالة:
- `الثيم المطلوب غير موجود: light`

### 4) توحيد Access Guard في صفحات الإدارة الأساسية
تم استبدال الفحص الضيق:
- `user.role !== "admin"`
بفحص موحد يعتمد على:
- `hasAdminToolsAccess()`

في الملفات:
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/PropertiesManagement.tsx`
- `client/src/pages/DigitalLibrary.tsx`
- `client/src/components/Navbar.tsx`

### 5) توسيع منطق الصلاحيات
تم توسيع helper في:
- `client/src/lib/access.ts`
- `server/_core/access.ts`

ليقبل بالإضافة إلى admin التقليدي أدوار منصة شائعة مثل:
- `manager`
- `owner`
- `employee`
- `editor`
- `administrator`
مع الحفاظ على منع أدوار القراءة/الضيف.

## الملفات المعدلة
- `server/_core/siteSettingsRouter.ts` (جديد)
- `server/routers.ts`
- `client/src/lib/themes.ts`
- `client/src/pages/SiteSettings.tsx`
- `client/src/lib/access.ts`
- `server/_core/access.ts`
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/PropertiesManagement.tsx`
- `client/src/pages/DigitalLibrary.tsx`
- `client/src/components/Navbar.tsx`

## النتيجة المتوقعة
- الحفظ في صفحة إعدادات الموقع لم يعد يصطدم بمسار TRPC مفقود.
- أزرار الثيمات الجاهزة لم تعد تكسر الصفحة بسبب أسماء غير موجودة.
- الصفحات الإدارية الأساسية أصبحت أكثر اتساقًا مع هوية مستخدم المنصة الفعلية.

## ما بقي خارج هذه الدفعة
- صفحات الإدارة التي تفتح كـ stub/placeholder ما زالت تحتاج backend لاحقًا.
- أي بوابات وصول أخرى مبنية محليًا داخل صفحات إدارية فرعية ستُراجع في دفعات الاستقرار اللاحقة.
