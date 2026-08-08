# SESSION UPDATE — Assistant Profiles داخل المسار المحلي الحالي

## ما أُغلق في هذه الدفعة
- تمكين حفظ `assistantProfiles` داخل `localRuntimeStore`
- إضافة `activeAssistantProfileId`
- جعل القيم العليا `llm*` تمثل المساعد النشط دائمًا
- تمكين إدارة عدة مساعدين من صفحة `AdminSystemSettings`
  - إضافة مساعد جديد
  - اختيار المساعد النشط
  - تعديل الاسم والوصف
  - حذف المساعد المحدد
  - جعل المساعد افتراضيًا
- الإبقاء على نفس المسار المحلي الحالي دون DB جديدة

## الملفات المعدلة
- `client/src/pages/AdminSystemSettings.tsx`
- `server/localRuntimeStore.ts`
- `server/_core/systemSettingsRouter.ts`

## السلوك الحالي
- كل Assistant Profile يملك:
  - `name`
  - `description`
  - `llmEnabled`
  - `llmProvider`
  - `llmBaseUrl`
  - `llmApiKey`
  - `llmModel`
  - `llmTimeoutSeconds`
  - `isEnabled`
  - `isDefault`
- عند اختيار مساعد نشط من الصفحة، تصبح القيم العليا في النموذج ممثلة له
- عند الحفظ، تُحفظ جميع البروفايلات داخل `.palwakf/runtime/local_runtime_store.json`
- يستخدم النظام تشغيليًا المساعد النشط فقط حاليًا
