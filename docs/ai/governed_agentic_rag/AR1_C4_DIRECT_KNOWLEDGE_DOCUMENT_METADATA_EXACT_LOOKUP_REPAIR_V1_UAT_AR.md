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


## نتيجة التنفيذ الفعلية — PASS

```text
C3_STATUS=completed
C3_REQUESTED_CHECKS=30
C3_EXTERNAL_CANDIDATES=30
C3_NO_DATABASE_WRITE=true
C4_STATUS=READY_FOR_OPERATOR_BINDING
C4_REASON=null
C4_CANDIDATE_COUNT=2
DIRECT_C4_MATERIAL_REFERENCES=2
DIRECT_REFERENCE_DOCUMENT_ASSOCIATIONS=0
DETERMINISTIC_EXACT_MATCHES=0
REJECTED_FUZZY_OR_AMBIGUOUS_MATCHES=0
NEXT_ACTION=REVIEW_ONE_DETERMINISTIC_CANDIDATE
AVAILABLE_CANDIDATE_DOCUMENTS=2
AR1_ACTIVE_SESSIONS=0
AR1_AUTOMATIC_SESSION_START=NO
LLM_GENERATION_ENABLED=false
RUNTIME_UAT=PASS
```

### المرشحان

1. `3aa89035-a436-4883-92b8-eeb394582bcd` — الإشراف المعاصر على العقارات الوقفية.
2. `c3ebc0f4-fc16-4e49-bb25-4f87b9d63f88` — مهام وزارة الأوقاف والشؤون الدينية الفلسطينية.

كلاهما حُسم عبر `C4_DIRECT_MATERIAL_REFERENCE`، مع تسجيل exact UUID lookup في `assistant.knowledge_documents`.

### ملاحظة

`source` و`sourceUrl` بقيا `null`، وهذا متوقع لأن هذا المسار لا ينشئ source links أو rights. دليل C3 مؤقت ويجب تجديده قبل أي جلسة لاحقة بعد انتهاء صلاحيته.
