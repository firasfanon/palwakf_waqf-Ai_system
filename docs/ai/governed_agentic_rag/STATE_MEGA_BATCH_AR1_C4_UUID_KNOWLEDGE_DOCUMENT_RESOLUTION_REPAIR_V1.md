# STATE — MEGA_BATCH_AR1_C4_UUID_KNOWLEDGE_DOCUMENT_RESOLUTION_REPAIR_V1

```text
BATCH = MEGA_BATCH_AR1_C4_UUID_KNOWLEDGE_DOCUMENT_RESOLUTION_REPAIR_V1
TYPE = CONTROLLED_SOURCE_PATCH
SCOPE = server/governedAgenticRagPilot.ts only
PREIMAGE_REQUIRED = 6F0B15D99679DB3D97089FC76627F814E94F3D598ADDE2FAE5EC396A936B3CD0
POSTIMAGE = E7EDE391B6C5B759086E539E9A289FC7EA01795B4483DB40BC37BB783A94CC9D
DB_WRITE = NONE
SQL = NONE
SOURCE_REGISTRY_WRITE = NONE
RIGHTS_ASSIGNMENT = NONE
LEDGER_DECISION = NONE
CHAT_RAG = BLOCKED
AR1_SESSION_AUTOSTART = BLOCKED
```

## سبب الدفعة

بعد تشغيل C3/C4 Single Flow محليًا، C3 نجح وC4 وجد مرشحين وصفيين، لكن AR1 بقي في:

```text
C4_CANDIDATE_MATERIAL_NOT_FOUND_HOLD
```

لأن resolver لم يحل UUID الخاص بـ `candidateMaterials.knowledge_document` إلى وثيقة معرفة قابلة للعرض في catalog.

## التصحيح

إضافة resolver حتمي لا يستخدم fuzzy/semantic/vector:
- يقبل UUID أو numeric id.
- يستخدم runtime direct lookup إن أمكن.
- يستخدم runtime list fallback إن تعذر direct lookup.
- يدعم referenceDocumentId و reference_document_id.
- يبقي content gate داخل السؤال والجلسة.
