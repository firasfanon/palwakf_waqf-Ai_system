# Changelog — Mega Batch 27F-1

## Added

- توثيق Hotfix runtime لصفحة إدارة المعرفة.
- تحديث baseline pointer إلى v38a.
- تحديث PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.

## Changed

- `client/src/pages/ManageKnowledge.tsx`:
  - رفع `getResolvedStatus` إلى module scope.
  - رفع `getDocumentStorageKind` إلى module scope.
  - رفع `isReadOnlyDoc` إلى module scope.

## Fixed

- إغلاق الخطأ:

```text
ReferenceError: Cannot access 'getResolvedStatus' before initialization
```

## Not Changed

- لا تعديل على database.
- لا تعديل على TRPC backend.
- لا تعديل على RLS.
- لا تعديل على أي صفحة خارج إدارة المعرفة.
