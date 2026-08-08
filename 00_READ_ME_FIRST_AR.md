# MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1

## نبذة الإجراء

هذه حزمة **تطوير فعلي موضعي** لإغلاق فجوة حسم UUID بين مواد C4 وAR1. تضيف قراءة حتمية للقراءة فقط من `assistant.knowledge_documents.id` قبل الحزمة المركبة. لا SQL ولا كتابة قاعدة بيانات ولا تفعيل حقوق ولا نشر Chat/RAG.

## الحالة

```text
SOURCE_PATCH_BUILT=YES
STATIC_VERIFICATION=PASS
TARGETED_TYPESCRIPT_DELTA_CHECK=PASS_NO_NEW_ERRORS
USER_WORKSPACE_APPLY=PENDING
RUNTIME_UAT=PENDING
BASELINE=CANDIDATE_NOT_PROMOTED
```

## التنفيذ

من PowerShell 5.1:

```powershell
$pkg = "<مسار فك الحزمة>"
$src = "D:\PALWAKF_ASSISTANT_SOURCE_BASELINE_CLEAN_CANDIDATE_20260706"
& "$pkg\01_APPLY_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1.ps1" -SourceRoot $src
& "$pkg\02_VERIFY_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1.ps1" -SourceRoot $src
```

يمكن تنفيذ preflight فقط دون تعديل:

```powershell
& "$pkg\01_APPLY_MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1.ps1" -SourceRoot $src -WhatIf
```

بعد PASS شغّل التطبيق محليًا ونفذ UAT الموضح في `03_RUNTIME_UAT_AR.md`. لا تبدأ جلسة AR1 تلقائيًا أو يدويًا قبل مراجعة الاستجابة.
