# UAT — AR1 Deterministic Candidate Review and Ephemeral Session Authority Prep V1

## طبيعة الاختبار

اختبار محلي داخلي لتحضير صلاحية جلسة AR1 فقط. لا يبدأ جلسة، ولا ينفذ سؤالًا، ولا يقرأ النص الكامل، ولا يكتب قاعدة بيانات.

## UAT إيجابي

1. شغّل المشروع محليًا.
2. افتح صفحة سجل المصادر والحقوق.
3. نفّذ دورة C3/C4 مرة واحدة للحصول على دليل حديث.
4. تحقق من `C4.status = READY_FOR_OPERATOR_BINDING` ووجود مرشح أو أكثر.
5. اختر مرشحًا واحدًا فقط.
6. اختر T3 أو T4.
7. أدخل مرجع اعتماد الاستخدام الداخلي.
8. أدخل مرجع اعتماد الحقوق/الاستخدام للتحضير.
9. اكتب مبررات اختيار لا تقل عن 12 حرفًا.
10. فعّل الإقرارات الثلاثة.
11. اضغط **تحضير صلاحية جلسة AR1**.

## النتيجة المطلوبة

```text
authorityPreparation.status = prepared
authorityPreparation.id startsWith AR1A-
authorityPreparation.sessionStarted = false
authorityPreparation.databaseWrites = 0
authorityPreparation.sourceOrRightsWrites = 0
authorityPreparation.nextAction = SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED
activeSessions = 0
sessionStartButton = disabled
```

## UAT سلبي

- دون C3 حديث: يرفض التحضير.
- مرشح غير موجود في cohort C4 الحالية: يرفض التحضير.
- اختيار أكثر من مرشح: الواجهة تمنع الاستمرار.
- T2 أو T5: يرفض الإدخال.
- مرجع استخدام داخلي فارغ: يرفض التحضير.
- مرجع حقوق/استخدام فارغ: يرفض التحضير.
- مبررات أقل من 12 حرفًا: زر التحضير معطل والـAPI يرفض.
- إقرار واحد غير محدد: زر التحضير معطل والـAPI يرفض.
- محاولة استخدام تحضير من مشغّل آخر: `AR1_AUTHORITY_PREPARATION_OPERATOR_MISMATCH`.
- انتهاء C3 أو تحضير الصلاحية: `AR1_AUTHORITY_PREPARATION_NOT_ACTIVE_OR_EXPIRED` أو `AR1_AUTHORITY_PREPARATION_C3_EVIDENCE_EXPIRED`.

## دليل عدم بدء الجلسة

بعد نجاح التحضير يجب أن تبقى القيم:

```text
activeSessions = 0
sessionStarted = false
NO_SESSION_AUTO_START
```

لا تضغط أي endpoint خارجي لبدء الجلسة. زر البدء في الواجهة محجوب ميكانيكيًا ضمن هذه الدفعة.

## إلغاء التحضير

اضغط **إلغاء التحضير** وتحقق من مسحه من ذاكرة الخادم، ومن عودة `activeAuthorityPreparations` إلى صفر بعد تحديث الحالة.

---

## نتيجة Runtime UAT الفعلية — PASS

### التحضير

```text
id=AR1A-92ea2179-e49b-43f1-896d-84ec3654315e
status=prepared
authorityStorage=process_memory_only
createdAt=2026-07-12T21:22:23.734Z
expiresAt=2026-07-12T21:32:23.734Z
ttlMinutes=10
sessionStarted=false
activeSessions=0
databaseWrites=0
sourceOrRightsWrites=0
consumedAt=null
sessionId=null
```

### الإبطال

```text
status=revoked
revoked=true
activeAuthorityPreparations=0
sessionStarted=false
consumedAt=null
sessionId=null
databaseWrites=0
sourceOrRightsWrites=0
nextAction=NONE
```

### الحالة بعد الإبطال

```text
status=READY_FOR_OPERATOR_BINDING
activeSessions=0
activeAuthorityPreparations=0
sessionStartRequiresAuthorityPreparation=true
sessionStartPolicy=SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED
llmGenerationEnabled=false
```

النتيجة: تم إثبات دورة التحضير والإبطال دون بدء جلسة أو أي كتابة سيادية.
