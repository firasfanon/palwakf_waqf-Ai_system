# Error Record — AR1 Candidate Review and Authority Preparation Gap

## السبب

كان `startSession` يجمع مراجعة المرشح، ومراجع الاستخدام، وإقرارات المشغّل، وبدء الجلسة في طلب واحد. لم توجد مرحلة مستقلة ذات TTL وبصمة وسلطة مرتبطة بالمشغّل يمكن التحقق منها وإلغاؤها قبل تشغيل AR1.

## الملفات

- `server/governedAgenticRagPilot.ts`
- `server/routers.ts`
- `client/src/pages/admin/SourceProvenanceRightsRegistry.tsx`
- `package.json`

## ما فشل أو كان ناقصًا

- لا يوجد `authorityPreparationId` مستقل.
- لا يوجد فصل قابل للتدقيق بين مراجعة المرشح وبدء الجلسة.
- مبررات المراجع كانت اختيارية.
- لا يوجد إقرار صريح بأن التحضير لا يمنح حقوقًا.
- `startSession` لم يكن يتطلب تصريحًا مؤقتًا سابقًا.

## الحل

إضافة تحضير صلاحية مؤقت في ذاكرة الخادم، مرتبط بالمشغّل ومرشح C4 واحد ودليل C3 الحديث، مع مراجع T3/T4 واستخدام داخلي ومبررات إلزامية وإقرارات صريحة. أصبح `startSession` يتطلب معرف التحضير ويعيد التحقق من المرشح عند الاستهلاك، بينما يبقى زر بدء الجلسة محجوبًا في هذه الدفعة.

## ما لم يتغير

- لا قاعدة بيانات.
- لا مصدر أو حقوق.
- لا نسخ وثيقة أو chunks أو embeddings أو vectors.
- لا تشغيل نموذج أثناء التحضير.
- لا Chat عام أو Production.

## آخر baseline مستقر

```text
PALWAKF_ASSISTANT_SOURCE_PROVENANCE_AR1_RESOLUTION_BASELINE_R3_ACCEPTED_LOCAL_20260712
```

## baseline المرشح بعد الإصلاح

```text
PALWAKF_ASSISTANT_AR1_AUTHORITY_PREP_BASELINE_R4_CANDIDATE_20260712
```

---

## حالة الإغلاق — 2026-07-13

```text
SOURCE_APPLY=PASS
STATIC_VERIFICATION=PASS
RUNTIME_UAT=PASS
AUTHORITY_PREPARATION=PASS
AUTHORITY_REVOCATION=PASS
SESSION_AUTO_START=NO
DATABASE_WRITE=NO
SOURCE_OR_RIGHTS_WRITE=NO
ACTIVE_SESSIONS=0
ACTIVE_AUTHORITY_PREPARATIONS=0
```

تم إغلاق سجل الخطأ/المخاطر الخاص بهذه الدفعة بعد إثبات التحضير والإبطال في Runtime. بقي بدء الجلسة محجوبًا ويتطلب تفويضًا صريحًا منفصلًا.
