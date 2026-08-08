# ملف توريث شامل — MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1

## 1. نقطة الاستئناف

تم بناء إصلاح المصدر وتحقق verifier منه. لم يُطبق بعد على مساحة عمل المستخدم ولم يُنفذ Runtime UAT، لذلك baseline الحالي **مرشح R3 وليس مقبولًا**.

## 2. السبب الجذري

C4 يعرض `candidateMaterials[].id` كـUUID لوثيقة معرفة موجودة. AR1 كان يمر عبر aggregate مركب؛ فشل أي companion table أو circuit breaker كان يعيد fallback لا يرى UUID. إصلاح حقل `id` السابق لم يكن كافيًا.

## 3. ما تغير

- `runtimeGetKnowledgeDocumentByExactUuid`: exact UUID، جدول واحد، قراءة فقط.
- استدعاؤه قبل resolver العام في AR1.
- الحفاظ على UUID السيادي كـ`id` الأساسي حتى عند وجود `metadata_json.legacy_id`.
- توحيد قائمة أعمدة `knowledge_documents` في ثابت واحد دون تغيير مضمون القراءة المركبة.
- verifier ووثائق عقد/UAT/State/Error Record وتحديث Guide/Changelog/Current Task/State.

## 4. ما لم يتغير

لا SQL، لا Supabase write، لا source link، لا rights assignment، لا نشر Chat/RAG، لا Public/Production، لا fuzzy/semantic/vector، ولا بدء جلسة AR1.

## 5. التحقق المنجز

```text
STATIC_VERIFIER=PASS
TARGETED_TYPESCRIPT_PRE_POST_ERRORS_IDENTICAL=YES
TARGET_FILES_NEW_ERRORS=0
PREEXISTING_BASELINE_ERRORS=server/legacyManusProvenance.ts:316 (2)
RUNTIME_UAT=PENDING
```

## 6. معيار القبول

```text
C3.status=completed
requestedChecks=30
noDatabaseWrite=true
C4.status=READY_FOR_OPERATOR_BINDING
candidateCount>0
directC4MaterialReferences>0
nextAction=REVIEW_ONE_DETERMINISTIC_CANDIDATE
AR1_SESSION_AUTO_START=NO
```

## 7. بعد نجاح UAT

1. حفظ لقطتي UI/Console ومخرجات verify.
2. تحديث Guide وState من `PENDING` إلى `ACCEPTED_LOCAL_ONLY`.
3. ترقية baseline المرشح R3 إلى baseline مقبول، وإضافة Evidence hashes.
4. عدم بدء جلسة AR1 إلا بعد مراجعة المرشح واعتماد المستخدم الصريح للمرحلة التالية.

## 8. الخطأ المستقل المؤجل

تحذير React عن key مكرر `الأدوات الذكية` مستقل عن resolver. لا يُخلط بهذا patch؛ يعالج لاحقًا بتتبع registry key واستخدام معرف فريد.
