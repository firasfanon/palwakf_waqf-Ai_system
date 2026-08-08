# Runtime UAT — AR1 Evidence-only Session Start V1

## الخطوات

1. تشغيل C3 جديد.
2. اختيار مرشح C4 واحد.
3. تحضير Authority Preparation.
4. إدخال مرجع UAT وتفعيل الإقرارات الثلاثة.
5. بدء الجلسة.
6. تنفيذ سؤال واحد.
7. محاولة سؤال ثانٍ والتأكد من حجبه.
8. نسخ Events وStatus.
9. تنفيذ Rollback.
10. إثبات `activeSessions=0`.

## معيار النجاح

```text
sessionStarted=true
executionMode=evidence_only_runtime_uat
maxQuestions=1
questionsExecuted=0 ثم 1
llmGenerationEnabled=false
llmGenerationUsed=false
databaseWrites=0
sourceOrRightsWrites=0
secondQuestion=BLOCKED
rollbackApplied=true
activeSessions=0
```

---

## نتيجة Runtime UAT الفعلية — PASS

### السؤال

```text
action=answer
confidence=low
executionMode=evidence_only_runtime_uat
questionCount=1
maxQuestions=1
llmGenerationUsed=false
databaseWrites=0
sourceOrRightsWrites=0
nextAction=ROLLBACK_SESSION
publicRelease=blocked
chatRelease=blocked
production=not_authorized
```

### الاستشهاد

```text
documentId=c3ebc0f4-fc16-4e49-bb25-4f87b9d63f88
title=مهام وزارة الأوقاف والشؤون الدينية الفلسطينية
evidenceTier=T3_CONTROLLED_INTERNAL_EVIDENCE
resolutionMethod=C4_DIRECT_MATERIAL_REFERENCE
```

### Rollback

```text
status=rolled_back
questionsExecuted=1
llmGenerationUsed=false
rollbackApplied=true
activeSessions=0
sessionStarted=false
databaseWrites=0
sourceOrRightsWrites=0
nextAction=NONE
```

### الحالة النهائية

```text
status=READY_FOR_OPERATOR_BINDING
activeSessions=0
activeAuthorityPreparations=0
llmGenerationEnabled=false
```

ملاحظة: لم يُلتقط طلب سؤال ثانٍ يدويًا من المتصفح؛ بوابة السؤال الثاني مثبتة في الاختبار الوظيفي المعزول، والواجهة تمنع إعادة الإرسال بعد النتيجة.
