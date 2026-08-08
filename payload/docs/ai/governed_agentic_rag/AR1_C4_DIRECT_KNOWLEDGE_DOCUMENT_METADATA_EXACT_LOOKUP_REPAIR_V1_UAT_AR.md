# UAT — إصلاح القراءة المباشرة لوثيقة C4

## طبيعة الاختبار

اختبار تشغيل محلي للقراءة فقط. لا يحتاج SQL ولا ينشئ جلسة AR1 ولا يكتب مصدرًا أو حقوقًا أو وثيقة.

## الخطوات

1. شغّل verifier ثم TypeScript check والبناء.
2. شغّل التطبيق محليًا وافتح:
   `/knowledge#/admin/source-provenance-rights`
3. اضغط **بدء دورة التحقق** مرة واحدة.
4. لا تفتح C3 أو C4 يدويًا ولا تبدأ جلسة AR1.
5. التقط لقطة واحدة للبطاقة التشغيلية ولقطة Console واحدة بعد انتهاء الدورة.

## شروط القبول

```text
C3_STATUS=completed
C3_REQUESTED_CHECKS=30
C3_NO_DATABASE_WRITE=true
C4_STATUS=READY_FOR_OPERATOR_BINDING
candidateCount > 0
directC4MaterialReferences > 0
NEXT_ACTION=REVIEW_ONE_DETERMINISTIC_CANDIDATE
AR1_SESSION_AUTO_START=NO
DATABASE_WRITE=NO
```

## شروط الرفض الآمن

- UUID غير صالح: لا يُرسل استعلام بعيد ولا يظهر مرشح.
- UUID صحيح لكنه غير موجود: لا يظهر مرشح ولا يجري fallback تقريبي.
- فشل قراءة `knowledge_documents`: تبقى الحالة Hold ولا تبدأ جلسة.
- تعطل جدول مرافق مثل `reference_files`: يجب ألا يخفي UUID الموجود عند نجاح القراءة المباشرة لـ`knowledge_documents`.

## Evidence المطلوب

- `01_AR1_C4_DIRECT_LOOKUP_RUNTIME_UI.png`
- `02_AR1_C4_DIRECT_LOOKUP_CONSOLE.png`
- مخرجات `02_VERIFY_...ps1` النصية.
