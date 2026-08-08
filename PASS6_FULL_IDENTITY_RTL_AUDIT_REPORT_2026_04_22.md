# Pass 6 — Full Identity + RTL Audit Closure

## Scope
دفعة شاملة على مستوى المشروع لإغلاق:
- أي مخرجات هوية بصرية غير مرتبطة بالمصدر المركزي.
- أي اتجاهات كتابة LTR صريحة داخل التطبيق.
- ألوان charts والحوارات وبعض defaults التي كانت خارجة عن الهوية المعتمدة.
- توحيد اتجاه الصفحات والجداول والبطاقات والعناصر التفاعلية إلى RTL من الجذر.

## What Was Applied

### 1) Global RTL lock
- تم فرض `dir="rtl"` و `lang="ar"` من `ThemeContext` على مستوى الجذر.
- تم إضافة طبقة RTL عامة في `client/src/index.css` تشمل:
  - `html, body, #root`
  - `main, section, article, nav, aside, form`
  - dialogs / popovers / sheets / dropdowns
  - `input, textarea, select, button`
  - `table, thead, tbody, tr, th, td`
- تم عمل override لـ `text-left` ليصبح `start/right` فعليًا داخل التطبيق.

### 2) Central identity enforcement
- تمت إضافة طبقة مركزية في `client/src/index.css` تلتهم utility color classes المنتشرة في المشروع وتحولها إلى tokens مركزية فقط:
  - neutral -> `--card / --foreground / --muted-foreground / --border`
  - blue/indigo/sky/cyan -> `--primary`
  - emerald/green/teal/yellow/amber/orange -> `--secondary`
  - purple/violet/fuchsia/pink -> `--accent`
  - red/rose -> `--destructive`
- تمت إضافة override مركزي للـ gradients أيضًا (`from/via/to-*`) حتى لا يبقى أي gradient فعّال خارج tokens المركزية.

### 3) Admin hard-stop overrides
- تمت إضافة طبقة إغلاق نهائية في `client/src/styles/admin.css` لإجبار admin chrome على الاعتماد على tokens فقط:
  - topbar
  - actions
  - path badges
  - sidebar boxes
  - nav items
  - hover/active/disabled states
  - admin meta / kicker / section titles
- تم تحويل أي `direction: ltr` داخل admin CSS إلى RTL.

### 4) Files patched directly
- `client/src/contexts/ThemeContext.tsx`
- `client/src/index.css`
- `client/src/styles/admin.css`
- `client/src/lib/themes.ts`
- `client/src/pages/SiteSettings.tsx`
- `client/src/components/LivePreview.tsx`
- `client/src/components/ManusDialog.tsx`
- `client/src/components/DashboardLayout.tsx`
- `client/src/components/admin/AdminLayoutV2.tsx`
- `client/src/components/admin/AdminSidebarV2.tsx`
- `client/src/pages/CacheAnalytics.tsx`
- `client/src/pages/admin/KnowledgeDashboard.tsx`
- `client/src/pages/AdminDashboard.tsx`

### 5) Chart color centralization
تم تحويل الألوان الصريحة في charts إلى tokens:
- primary
- secondary
- accent
- destructive
- muted/border

### 6) Defaults normalization
تم توحيد defaults في `SiteSettings` إلى الهوية المعتمدة:
- Primary: `#4C7DDA`
- Secondary: `#E2C766`
- Background: `#0B1220`
- Text: `#F9FAFB`
- Accent: `#B22222`

## Audit Result After Patch

### Explicit LTR markers
- النتيجة بعد التدقيق: لا يوجد `dir="ltr"` أو `direction: ltr` فعّال داخل ملفات التطبيق بعد Pass 6.

### Remaining raw hex colors
المتبقي بعد الإغلاق يقتصر عمليًا على:
- defaults الرسمية داخل `SiteSettings.tsx`
- الثيم المرجعي داخل `lib/themes.ts`
- قيم داخل `components/ui/chart.tsx` مرتبطة بانتقاء selectors داخل Recharts وليس بهوية الصفحات نفسها

## Important Note
ما زالت هناك utility classes قديمة داخل بعض الصفحات/المكونات في source code، لكن تم إبطال أثرها البصري عبر طبقة مركزية واحدة في `index.css` بحيث تصبح الهوية الفعلية وقت التشغيل صادرة من tokens المركزية فقط.

## Verification Performed Here
- تدقيق نصي شامل للـ `dir="ltr"` و `direction: ltr`
- تدقيق raw hex المتبقي بعد التعديل
- فحص توازن الأقواس/البنية للملفات المعدلة مباشرة

## Constraint
تعذر تشغيل TypeScript build/typecheck الكامل داخل هذه البيئة لأن snapshot المرفوع لا يحتوي أداة TypeScript التنفيذية نفسها داخل `node_modules`، لذلك تم الاعتماد هنا على:
- التحقق النصي البنيوي
- مراجعة الملفات المعدلة مباشرة
- تدقيق بقايا LTR والألوان الصريحة بعد الإغلاق
