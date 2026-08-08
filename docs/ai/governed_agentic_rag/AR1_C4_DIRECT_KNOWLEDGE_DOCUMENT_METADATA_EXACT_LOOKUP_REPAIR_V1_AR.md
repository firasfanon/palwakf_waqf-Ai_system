# MEGA BATCH AR1 — إصلاح القراءة المباشرة الحتمية لوثيقة C4

## النبذة

هذه دفعة **تطوير فعلي موضعي** لمسار `C4 → AR1`. لا تبني مرحلة جديدة ولا تغيّر نموذج الحقوق. تضيف قراءة مباشرة، للقراءة فقط، لمعرف UUID الموجود أصلًا في `assistant.knowledge_documents` عندما تختار C4 مادة من نوع `knowledge_document`.

## المشكلة

كان AR1 يحاول حل UUID عبر `runtimeGetKnowledgeDocuments()`، وهي قراءة مركبة تشترط نجاح جداول مرافقة للمصادر والمراجع والملفات والاستشهادات. فشل أي companion read أو فتح circuit breaker كان يخفي وثيقة C4 الموجودة ويُبقي:

```text
candidateCount = 0
directC4MaterialReferences = 0
C4_CANDIDATE_MATERIAL_NOT_FOUND_HOLD
```

## الإصلاح

- إضافة `runtimeGetKnowledgeDocumentByExactUuid(id)` في `server/runtimeRepository.ts`.
- رفض أي قيمة ليست UUID قبل الاتصال البعيد.
- تنفيذ `eq('id', exactUuid)` و`maybeSingle()` على `assistant.knowledge_documents` فقط.
- إعادة استعمال mapper الحالي بسياق مرافق فارغ؛ لا إنشاء روابط ولا استنتاج مصدر أو حقوق.
- استعمال القراءة المباشرة في `server/governedAgenticRagPilot.ts` قبل fallback المركب/المحلي.
- إبقاء fallback الرقمي القديم للتوافق فقط.

## الحدود السيادية

```text
READ_ONLY
EXACT_UUID_ONLY
CURRENT_C4_SELECTED_COHORT_ONLY
NO_DATABASE_WRITE
NO_SQL
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_DOCUMENT_OR_CHUNK_WRITE
NO_EMBEDDING_OR_VECTOR_WRITE
NO_FUZZY_OR_SEMANTIC_MATCHING
NO_TITLE_OR_URL_FALLBACK_IN_DIRECT_LOOKUP
NO_CHAT_OR_PUBLIC_RELEASE
NO_PRODUCTION
FAIL_CLOSED
```

## الملفات الوظيفية

- `server/runtimeRepository.ts`
- `server/governedAgenticRagPilot.ts`

## معيار النجاح التشغيلي

```text
C3.status = completed
requestedChecks = 30
noDatabaseWrite = true
C4.status = READY_FOR_OPERATOR_BINDING
candidateCount > 0
directC4MaterialReferences > 0
nextAction = REVIEW_ONE_DETERMINISTIC_CANDIDATE
AR1 session = not started automatically
```
