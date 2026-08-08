# STRICT APPLY — Phase P1 (Polish) + Phase 4 (Knowledge Sources)

## Rules
1) Overwrite الملفات التالية **كما هي** وبنفس المسارات. ممنوع Skip.
2) لا تغيّر أي منطق tRPC / mutations / dialogs.
3) Restart بعد النسخ.

## Files to overwrite
- client/src/components/admin/ui/AdminEmptyState.tsx
- client/src/components/admin/ui/AdminTable.tsx
- client/src/styles/admin.css
- client/src/pages/ManageUsers.tsx
- client/src/pages/FilesManagement.tsx
- client/src/pages/admin/KnowledgeSourcesManagement.tsx

## Smoke Tests
1) /#/admin/users
   - أزرار الفلاتر بنفس الارتفاع
   - Empty state موحد إن كانت القائمة فارغة
   - عمود الإجراءات محاذاة ثابتة

2) /#/admin/files
   - فلاتر البحث بنفس الارتفاع
   - Empty state يظهر بشكل موحد
   - footer المساحة المستخدمة ثابت

3) /#/admin/knowledge-sources
   - الصفحة داخل AdminPage
   - الجدول داخل AdminTable
   - Empty state موحد + زر إضافة مصدر

## Background (white fix)
- في Light mode الخلفية ليست أبيض صافي (أصبحت #EEF6FF مع تدرجات)
- في Dark mode الخلفية تبقى #0B1220
