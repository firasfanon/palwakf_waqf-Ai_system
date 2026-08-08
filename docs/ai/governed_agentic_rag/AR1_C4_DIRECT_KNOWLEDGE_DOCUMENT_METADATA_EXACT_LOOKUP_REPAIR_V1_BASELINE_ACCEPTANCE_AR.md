# قبول Baseline R3 محليًا — AR1/C4 Exact Knowledge Document Lookup

## القرار

```text
BASELINE_ID=PALWAKF_ASSISTANT_SOURCE_PROVENANCE_AR1_RESOLUTION_BASELINE_R3_ACCEPTED_LOCAL_20260712
STATUS=ACCEPTED_LOCAL_ONLY
BATCH=MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1
```

## أدلة التطبيق

- WhatIf: PASS، بلا source drift وبلا ملفات معدلة.
- Apply: PASS، مع نسخة احتياطية محلية.
- Static verifier: PASS.
- Postimage hashes: PASS لجميع الملفات.
- إصلاح `node_modules`: PASS باستخدام `pnpm@10.4.1`.
- `tsx v4.20.6`: قابل للتشغيل.
- Runtime UAT: PASS.

## أدلة Runtime

```text
C3.completed=true
C3.requestedChecks=30
C3.noDatabaseWrite=true
C4.status=READY_FOR_OPERATOR_BINDING
C4.candidateCount=2
C4.directC4MaterialReferences=2
nextAction=REVIEW_ONE_DETERMINISTIC_CANDIDATE
AR1.activeSessions=0
LLM.enabled=false
```

## تفسير النتيجة

أثبت الاختبار أن C4 يمرر UUID سياديًا موجودًا إلى AR1، وأن `runtimeRepository.assistant_knowledge_documents_uuid_exact_lookup` يعيد صف الوثيقة الأساسي دون أن تحجب الجداول المرافقة المادة. لا توجد مطابقة تقريبية أو دلالية، ولا تم إنشاء أي علاقة دائمة.

## حدود القبول

- محلي فقط.
- لا Staging ولا Production.
- لا اعتماد حقوق أو مصدر.
- لا نشر Chat/RAG.
- لا بدء جلسة AR1.
- مراجعة مادة واحدة هي الخطوة التالية، وتتطلب تفويضًا مستقلًا.
