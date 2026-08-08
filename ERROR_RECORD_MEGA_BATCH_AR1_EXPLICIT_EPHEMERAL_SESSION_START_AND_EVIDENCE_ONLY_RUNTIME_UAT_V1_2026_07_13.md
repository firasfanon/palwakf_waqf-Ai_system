# Error Record / Risk Record — AR1 Evidence-only Session Start V1

## السبب

كان مسار بدء الجلسة موجودًا خلف تحضير Authority، لكن زر الواجهة محجوب ميكانيكيًا ولم يكن هناك عقد Runtime UAT يفرض Evidence-only وسؤالًا واحدًا وRollback.

## الملفات

- `server/governedAgenticRagPilot.ts`
- `server/routers.ts`
- `client/src/pages/admin/SourceProvenanceRightsRegistry.tsx`
- `package.json`

## الإصلاح

إضافة قرار بدء صريح، مرجع UAT، إقرارات تشغيل، نمط جلسة Evidence-only، حد سؤال واحد، حظر LLM، وتوجيه Rollback.

## الحالة

```text
STATIC=PASS
FUNCTIONAL_ISOLATED=PASS
RUNTIME_UAT=PENDING
LAST_STABLE_BASELINE=PALWAKF_ASSISTANT_AR1_AUTHORITY_PREP_BASELINE_R4_ACCEPTED_LOCAL_20260713
```

---

## حالة الإغلاق — 2026-07-13

```text
HARNESS_WINDOWS_POWERSHELL_5_1=PASS
SOURCE_APPLY=PASS
STATIC_VERIFICATION=PASS
FUNCTIONAL_ISOLATED_TEST=PASS
RUNTIME_UI_UAT=PASS
QUESTION_COUNT=1
LLM_CALLS=0
ROLLBACK_APPLIED=true
ACTIVE_SESSIONS=0
ACTIVE_AUTHORITY_PREPARATIONS=0
DATABASE_WRITE=NO
SOURCE_OR_RIGHTS_WRITE=NO
```

تم إغلاق عيوب المشغّل وأثبت Runtime الفعلي دورة البدء والسؤال الواحد والـRollback. لم يُلتقط طلب سؤال ثانٍ يدويًا من المتصفح؛ بوابة السؤال الثاني مثبتة بالاختبار الوظيفي المعزول وتحكم الواجهة الذي يمنع الإرسال المتكرر بعد النتيجة.
