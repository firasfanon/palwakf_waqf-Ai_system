# Error Record — AR1/C4 Direct Knowledge Document Exact Lookup

## العرض

أظهرت دورة Single Flow أن C3 نفّذ 30 فحصًا وأن C4 يملك مواد مرشحة من نوع `knowledge_document`، لكن AR1 بقي عند:

```text
candidateCount=0
directC4MaterialReferences=0
C4_CANDIDATE_MATERIAL_NOT_FOUND_HOLD
```

## السبب الجذري

`getPilotKnowledgeDocumentById()` كان يمر عبر `runtimeGetKnowledgeDocumentById()` ثم `runtimeGetKnowledgeDocuments()` ثم `tryGetAssistantKnowledgeDocumentBundle()`. الحزمة المركبة تعتمد على نجاح `knowledge_sources` و`reference_documents` و`reference_files` و`knowledge_citations`. فشل أي جدول مرافق أو فتح circuit breaker يعيد `null` للحزمة كلها، فيختفي UUID موجود أصلًا في `assistant.knowledge_documents`.

## الملفات

- `server/runtimeRepository.ts`
- `server/governedAgenticRagPilot.ts`

## ما فشل

1. إصلاح قراءة `candidateMaterials[].id` نجح ساكنًا لكنه لم يغلق العطل التشغيلي.
2. إعادة المحاولة عبر resolver العام بقيت مقيدة بالحزمة المركبة.
3. fallback المحلي/القديم لا يضمن وجود UUID السيادي المحدد في C4.

## الحل

إضافة exact UUID lookup للقراءة فقط على `assistant.knowledge_documents.id` واستدعاؤه قبل resolver العام. لا تُستخدم مطابقة عنوان أو URL أو fuzzy أو semantic أو vector، ولا تُنشأ أي علاقة أو حالة حقوق.

## الوقاية

- لا تربط identity lookup حتميًا بتحميل aggregate كامل.
- افصل exact entity read عن companion enrichment.
- اجعل verifier يثبت ترتيب direct exact lookup قبل fallback.
- احتفظ بالـfail-closed عند فشل صف الوثيقة الأساسي نفسه.

## آخر baseline مستقر

```text
PALWAKF_ASSISTANT_SOURCE_PROVENANCE_AR1_RESOLUTION_HANDOFF_BASELINE_R2_20260709
server/governedAgenticRagPilot.ts SHA-256=6C78DAF6D613A10F60AA26CC5E28FBB7DE7CF7A4064BECA72D68CA04E00EF92B
```

## حالة الإغلاق

```text
SOURCE_REPAIR_BUILT=YES
STATIC_VERIFICATION=PASS
RUNTIME_UAT=PENDING
BASELINE_PROMOTION=PENDING
```
