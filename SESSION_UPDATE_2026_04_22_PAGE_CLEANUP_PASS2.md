# Session Update — Page Cleanup Pass 2

## الملفات المعدلة
- `client/src/pages/KnowledgeDetails.tsx`
- `client/src/pages/admin/KnowledgeSourcesManagement.tsx`
- `client/src/pages/FetchedContentReview.tsx`
- `client/src/components/BulkUpload.tsx`
- `client/src/components/DocumentFilesManager.tsx`
- `client/src/styles/admin.css`

## ما تم في هذه الدفعة
- إزالة الخلفيات والسطوح المحلية المتناثرة من الصفحات المستهدفة
- تحويل الأسطح إلى الاعتماد على الثيم المركزي والتوكنات الموحدة
- إضافة `admin-page-cleanup` على الصفحات/المكونات المستهدفة
- توحيد نوافذ الإدخال والحوارات داخل مصادر المعرفة والرفع والمرفقات
- تخفيف ألوان التوجيه في `FetchedContentReview` وربطها بأسطح موحدة بدل ألوان light/dark المتضاربة
- تحسين معاينة PDF والبطاقات الثانوية داخل `KnowledgeDetails`
- تحسين بطاقات `BulkUpload` و `DocumentFilesManager` لتتسق مع الثيم المركزي

## ملاحظة
هذه الدفعة لا تُنهي تنظيف كل المشروع، لكنها تُغلق Pass 2 على الصفحات الأشد تأثرًا في مسار المعرفة والمراجعة والرفع.
