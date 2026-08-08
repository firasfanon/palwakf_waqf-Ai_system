# MEGA_BATCH_AR1_C4_CANDIDATE_MATERIAL_ID_FIELD_NORMALIZATION_REPAIR_V1

## نبذة عربية

هذه دفعة إصلاح مكملة وضيقة جدًا بعد أن أثبت UAT أن:

```text
C3 = completed
C4 = available
controlledMetadataPilotCandidates = 2
controlledMetadataCandidateMaterials = 16
AR1 directC4MaterialReferences = 0
```

أي أن C4 يعرض مواد `candidateMaterials` فعليًا، لكن AR1 لا يقرأ معرف مادة المعرفة من الشكل التشغيلي الظاهر في Response:

```text
candidateMaterials[].id
candidateMaterials[].materialKind = knowledge_document
```

## طبيعة الدفعة

- Patch مصدر واحد فقط: `server/governedAgenticRagPilot.ts`.
- لا SQL.
- لا Supabase write.
- لا source registry write.
- لا rights assignment.
- لا Ledger decision.
- لا Chat/RAG.
- لا AR1 startSession تلقائي.

## ما يصلحه

1. توحيد قراءة معرف مادة C4 من:
   - `id`
   - `uuid`
   - `materialId`
   - `material_id`
   - `documentId`
   - `document_id`
   - `knowledgeDocumentId`
   - `knowledge_document_id`
   - `knowledgeDocumentUuid`
   - `knowledge_document_uuid`

2. قبول هذه الحقول فقط عندما:
   ```text
   materialKind = knowledge_document
   ```

3. توحيد قراءة `reference_document` بالحقول نفسها عند الربط المرجعي.

4. جعل Resolver يطابق الوثيقة عبر:
   - `document.id`
   - `document.uuid`
   - `knowledgeDocumentUuid`
   - `knowledge_document_uuid`
   - `knowledgeDocumentId`
   - `knowledge_document_id`

5. حفظ مبدأ الحوكمة:
   - لا fuzzy.
   - لا semantic.
   - لا vector.
   - لا source/right write.
   - لا Chat/RAG.

## Hash anchors

```text
PREIMAGE server/governedAgenticRagPilot.ts = E7EDE391B6C5B759086E539E9A289FC7EA01795B4483DB40BC37BB783A94CC9D
POSTIMAGE server/governedAgenticRagPilot.ts = 6C78DAF6D613A10F60AA26CC5E28FBB7DE7CF7A4064BECA72D68CA04E00EF92B
ROUTER_EXPECTED_READONLY server/routers.ts = 8E058D6C376B7DDBFD6DAC6B37EBA3E6D5B660D3AAA5FABB98422C8E08163B95
```
