# Runbook - دليل التشغيل

دليل شامل لتشغيل المشروع محلياً أو على Manus.

---

## 📋 المتطلبات الأساسية

### 1. البرمجيات المطلوبة
- **Node.js**: v22.13.0 أو أحدث
- **pnpm**: مثبت تلقائياً مع Node.js
- **MySQL/TiDB**: قاعدة بيانات متوافقة مع MySQL

### 2. الحسابات المطلوبة
- حساب Manus (للحصول على OAuth credentials)
- قاعدة بيانات MySQL/TiDB (يمكن استخدام TiDB Serverless المجاني)

---

## 🚀 التشغيل على Manus (موصى به)

المشروع مُحسّن للعمل على منصة Manus بشكل كامل.

### الخطوات:
1. افتح المشروع في Manus
2. جميع المتغيرات البيئية مُعدّة تلقائياً
3. السيرفر يبدأ تلقائياً على `https://3000-{project-id}.manus.computer`
4. استخدم `/#/admin/dashboard` للوصول للوحة التحكم

### الميزات المتاحة على Manus:
- ✅ OAuth authentication (تلقائي)
- ✅ Database (TiDB Serverless)
- ✅ File Storage (S3)
- ✅ LLM Integration
- ✅ Voice Transcription
- ✅ Image Generation
- ✅ Maps Integration

---

## 💻 التشغيل المحلي (Local Development)

### 1. استنساخ المشروع
```bash
# إذا كان لديك Git repository
git clone <repository-url>
cd waqf_ai_model

# أو فك ضغط الملف المُصدّر
unzip palwaqf_ai_modle_FULL_EXPORT.zip
cd waqf_ai_model
```

### 2. تثبيت Dependencies
```bash
pnpm install
```

### 3. إعداد المتغيرات البيئية

راجع `.env.example` للحصول على قائمة كاملة بالمتغيرات المطلوبة.

### 4. إعداد قاعدة البيانات

```bash
# Push schema to database
pnpm db:push
```

### 5. تشغيل السيرفر

#### Development Mode
```bash
pnpm dev
```
السيرفر سيعمل على: `http://localhost:3000`

#### Production Build
```bash
# Build
pnpm build

# Start
pnpm start
```

---

## 🔧 الأوامر المتاحة

### Development
```bash
pnpm dev          # تشغيل Development server
pnpm build        # بناء المشروع للإنتاج
pnpm start        # تشغيل Production server
pnpm preview      # معاينة Production build محلياً
```

### Database
```bash
pnpm db:push      # Push schema changes to database
pnpm db:studio    # فتح Drizzle Studio (GUI لقاعدة البيانات)
```

### Testing
```bash
pnpm test         # تشغيل جميع الاختبارات (Vitest)
pnpm test:watch   # تشغيل الاختبارات في Watch mode
```

### Linting & Type Checking
```bash
pnpm lint         # فحص الكود (ESLint)
pnpm typecheck    # فحص الأنواع (TypeScript)
```

---

## 🌐 الوصول للتطبيق

### الصفحات العامة
- **الصفحة الرئيسية**: `http://localhost:3000/` أو `/#/`
- **المحادثة**: `/#/chat`
- **قاعدة المعرفة**: `/#/knowledge`
- **من نحن**: `/#/about`
- **اتصل بنا**: `/#/contact`

### لوحة التحكم (Admin)
- **Dashboard**: `/#/admin/dashboard`
- **إدارة المستخدمين**: `/#/admin/users`
- **إدارة الصلاحيات**: `/#/admin/roles`
- **قاعدة المعرفة**: `/#/admin/knowledge-dashboard`

**ملاحظة**: استخدم `/#/` بدلاً من `/` للتوافق مع Hash routing.

---

## 🔐 تسجيل الدخول

### على Manus
- التسجيل تلقائي عبر Manus OAuth
- انقر على "تسجيل الدخول" في الصفحة الرئيسية

### محلياً
- تحتاج إلى Manus OAuth credentials صالحة

---

## 📊 قاعدة البيانات

### Schema
- **40+ جدول** معرّفة في `drizzle/schema.ts`
- تشمل: المستخدمين، الأدوار، الصلاحيات، المحادثات، الرسائل، المراجع، الأوقاف، القضايا، إلخ

### إدارة Schema
```bash
# تطبيق التغييرات على قاعدة البيانات
pnpm db:push

# فتح Drizzle Studio لإدارة البيانات
pnpm db:studio
```

---

## 🐛 استكشاف الأخطاء

### المشكلة: السيرفر لا يبدأ
**الحل**:
1. تأكد من تثبيت Dependencies: `pnpm install`
2. تأكد من صحة المتغيرات البيئية (خاصة `DATABASE_URL`)
3. تأكد من عمل قاعدة البيانات

### المشكلة: أخطاء TypeScript (181 خطأ)
**الحل**:
- هذه أخطاء معروفة في `server/db.ts` (مشكلة في Schema types)
- لا تؤثر على عمل التطبيق في Runtime
- تم الإبلاغ عن المشكلة لفريق Manus

### المشكلة: Routing لا يعمل (يعرض Home بدلاً من Admin)
**الحل**:
- تأكد من استخدام `/#/admin/...` بدلاً من `/admin/...`
- تأكد من وجود `VITE_FORCE_HASH_ROUTING=1` في المتغيرات البيئية

---

## 📝 ملاحظات مهمة

### Hash Routing
- المشروع يستخدم Hash routing (`/#/...`) للتوافق مع بيئة Manus
- جميع الروابط الداخلية يجب أن تبدأ بـ `/#/`

### RTL Support
- التطبيق يدعم RTL (من اليمين لليسار) بشكل كامل
- اللغة الافتراضية: العربية

### Admin Access
- الوصول للوحة التحكم يتطلب تسجيل دخول
- يمكن إدارة الصلاحيات من `/#/admin/roles`

---

## 🔗 روابط مفيدة

- [Manus Documentation](https://docs.manus.im)
- [tRPC Documentation](https://trpc.io)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Vite Documentation](https://vitejs.dev)
- [React Documentation](https://react.dev)

---

## 📞 الدعم

للحصول على المساعدة:
1. راجع `MANUS_REPORT.md` للأخطاء المعروفة
2. راجع `CHANGELOG.md` لآخر التحديثات
3. تواصل مع فريق Manus: https://help.manus.im
