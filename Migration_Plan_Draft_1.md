# Migration Plan Draft 1
## نقل البيانات من `.palwakf/runtime/local_runtime_store.json` إلى `assistant.*`
## PalWakf Local Assistant

### Purpose
هذه الوثيقة تضع خطة ترحيل مرحلية ومنضبطة لنقل البيانات الحالية من المخزن المحلي المؤقت:

- `.palwakf/runtime/local_runtime_store.json`

إلى الجداول السيادية الجديدة داخل:

- `assistant.*`

مع الحفاظ على:
- استمرارية التشغيل
- عدم كسر الشات أو المعرفة
- عدم فقدان البيانات
- إمكانية rollback
- الترحيل التدريجي بدل النقل الكبير دفعة واحدة

---

# 1) المبدأ الحاكم

## القاعدة الأساسية
**لا ننتقل من local runtime إلى database mode دفعة واحدة.**

بل نعتمد:

1. DB-first read/write للكيانات المرحّلة فقط
2. fallback إلى local runtime للكيانات غير المرحلة بعد
3. migration batches صغيرة وواضحة
4. verification بعد كل دفعة
5. cutover نهائي فقط بعد إغلاق التحقق

---

# 2) الحالة الحالية

## المصدر الحالي
البيانات الحالية محفوظة داخل:
- `.palwakf/runtime/local_runtime_store.json`

## الكيانات الحالية في التخزين المحلي
- `systemSettings`
- `knowledgeSources`
- `knowledgeDocuments`
- `documentFiles`
- `fetchedContent`
- `fetchLogs`
- `classificationRatings`
- `fetchedContentReviewEvents`
- `conversations`
- `messages`

## الوجهة الجديدة
داخل Supabase/Postgres:
- `assistant.system_settings`
- `assistant.knowledge_sources`
- `assistant.reference_documents`
- `assistant.reference_files`
- `assistant.knowledge_documents`
- `assistant.knowledge_citations`
- `assistant.fetched_content`
- `assistant.fetch_logs`
- `assistant.classification_ratings`
- `assistant.review_events`
- `assistant.conversations`
- `assistant.messages`

---

# 3) مبادئ الترحيل

## Principle 1
كل دفعة ترحيل يجب أن تكون:
- صغيرة
- قابلة للاختبار
- قابلة للrollback

## Principle 2
لا يتم حذف البيانات المحلية الأصلية أثناء الترحيل الأول.

## Principle 3
يجب أخذ snapshot من `local_runtime_store.json` قبل أي عملية.

## Principle 4
أي كيان يتم ترحيله يجب أن يملك:
- Mapping واضح
- قواعد تحويل
- قواعد تحقق
- خطة fallback

## Principle 5
`reference_documents` و`knowledge_documents` يبقيان منفصلين من البداية.

---

# 4) Pre-Migration Checklist

قبل أي دفعة:

- [ ] تأكيد نجاح SQL Draft 1
- [ ] تأكيد نجاح RBAC/RLS Draft 1
- [ ] أخذ نسخة snapshot من:
  - `.palwakf/runtime/local_runtime_store.json`
- [ ] التأكد من وجود service role/server connection صالح للكتابة إلى `assistant.*`
- [ ] التأكد من أن runtimeRepository يمكنه القراءة من DB للكيانات المهاجرة
- [ ] تجهيز migration script منفصل وغير مدمج مع runtime code العادي

---

# 5) Snapshot Policy

## المطلوب
قبل الترحيل:
- إنشاء نسخة باسم زمني مثل:
  - `.palwakf/runtime/backups/local_runtime_store_YYYYMMDD_HHMMSS.json`

## الهدف
- حفظ المصدر الأصلي
- دعم rollback
- مقارنة ما قبل وما بعد

---

# 6) Strategy Overview

## Phase 0 — Safe Migration Mode
إضافة طور migration في التطبيق:
- `ASSISTANT_STORAGE_MODE=hybrid`
- بحيث:
  - الكيانات المرحّلة تقرأ من DB
  - غير المرحّلة تبقى local
  - والكتابة تكون إما dual-write أو DB-first حسب المرحلة

## Phase 1 — Low-risk foundation
ترحيل:
1. `systemSettings`
2. `knowledgeSources`

## Phase 2 — Governance intake layer
ترحيل:
3. `fetchedContent`
4. `fetchLogs`
5. `classificationRatings`
6. `fetchedContentReviewEvents` -> `assistant.review_events`

## Phase 3 — Knowledge layer
ترحيل:
7. `knowledgeDocuments`
8. `documentFiles`

مع تحويل منطقي إلى:
- `reference_documents`
- `reference_files`
- `knowledge_documents`
- وربما `knowledge_citations` في حدود الممكن

## Phase 4 — Chat operational layer
ترحيل:
9. `conversations`
10. `messages`

## Phase 5 — Final cutover
- قراءة كاملة من DB
- local runtime يصبح fallback read-only أو archive only
- إيقاف الكتابة المحلية تدريجيًا

---

# 7) Detailed Migration Batches

# Batch 1 — system_settings + knowledge_sources
## Scope
- `systemSettings` -> `assistant.system_settings`
- `knowledgeSources` -> `assistant.knowledge_sources`

## لماذا نبدأ هنا؟
- منخفضة الخطورة
- سهلة التحقق
- مهمة لتشغيل LLM + ingestion + runtime control

## Mapping
### systemSettings
- key -> `key`
- value -> `value_json`
- description -> `description`

### knowledgeSources
- `id` -> يمكن حفظه داخل metadata_json إن تعذر reuse
- `name` -> `name`
- `type` -> `type`
- `baseUrl/base_url/url` -> `base_url`
- `description` -> `description`
- `isActive` -> `is_active`
- بقية الحقول -> `metadata_json`

## Verification
- count local == count db
- عينة سجلات متطابقة
- صفحة system settings تظل تعمل
- صفحة knowledge sources تظل تعمل

## Cutover after batch
- runtimeRepository:
  - read system settings from DB
  - read knowledge sources from DB
- local fallback remains available

---

# Batch 2 — fetched content + review/governance intake
## Scope
- `fetchedContent` -> `assistant.fetched_content`
- `fetchLogs` -> `assistant.fetch_logs`
- `classificationRatings` -> `assistant.classification_ratings`
- `fetchedContentReviewEvents` -> `assistant.review_events`

## الهدف
إغلاق intake/governance layer مبكرًا

## Mapping
### fetchedContent
- title -> `title`
- content -> `content`
- sourceUrl/source_url -> `source_url`
- sourceId/source_id -> `source_id`
- category -> `category`
- relevanceScore -> `relevance_score`
- status -> `status`
- fetchedAt -> `fetched_at`
- rest -> `metadata_json`

### fetchLogs
- sourceId -> `source_id`
- status -> `status`
- itemsCount -> `items_count`
- error -> `error_message`
- details -> `details_json`
- startedAt -> `started_at`
- finishedAt -> `finished_at`

### classificationRatings
- targetType -> `target_type`
- targetId -> `target_id`
- rating -> `rating`
- notes -> `notes`

### fetchedContentReviewEvents
- targetType -> `target_type`
- targetId -> `target_id`
- eventType -> `event_type`
- decision -> `decision`
- notes -> `notes`
- performedBy/reviewedBy -> `performed_by`
- performedAt/reviewedAt -> `performed_at`
- rest -> `metadata_json`

## Verification
- Fetched Content page still reads correctly
- review actions still display historically
- no missing records in counts

## Cutover after batch
- fetched content and related review/history pages read from DB
- local remains read-only snapshot/fallback

---

# Batch 3 — Knowledge migration
## Scope
- `knowledgeDocuments`
- `documentFiles`

## هذه أهم دفعة
لأنها تحتاج فصلًا منطقيًا بين:
- المرجع الأصلي
- المعرفة المشتقة

## Current reality
الكيان المحلي الحالي `knowledgeDocuments` قد يحتوي مزيجًا من:
- seeded references
- uploaded documents
- derived knowledge entries
- documents already used directly by chat

## Migration rule
قبل الإدخال، يجب تصنيف كل سجل إلى أحد مسارين:

### Track A — Reference-first
يوضع في:
- `assistant.reference_documents`
- وربطه بـ `assistant.reference_files` عند وجود ملف

### Track B — Derived knowledge
يوضع في:
- `assistant.knowledge_documents`

### Transitional rule
إذا تعذر الجزم أثناء الترحيل الأول:
- نحفظ السجل أولًا في `assistant.reference_documents`
- ثم ننشئ `assistant.knowledge_documents` مشتقًا منه إذا كان مستخدمًا فعليًا في الشات/المعرفة
- ونربط بينهما عبر `reference_document_id`

## documentFiles mapping
- document local reference -> `reference_document_id`
- fileUrl -> `storage_path` **بعد نقل الملفات إلى storage**
- fileName -> `original_filename`
- fileType -> `mime_type`
- fileSize -> `file_size_bytes`
- extractedText -> `extracted_text`
- ocrText/isOcr -> `ocr_text`/metadata_json

## Important note
إذا كانت الملفات الحالية مخزنة كـ:
- `data:application/pdf;base64,...`

فلا ننقلها كنص داخل الجدول.
بل:
1. نفكها
2. نرفعها إلى storage bucket
3. نحفظ المسار داخل `storage_path`

## knowledge_citations
في Batch 3 يمكن:
- إما تأجيل الإنشاء الفعلي
- أو إنشاء citations بسيطة عندما يكون reference_document_id واضحًا

## Verification
- counts
- sample documents
- knowledge list page
- knowledge details page
- chat retrieval from approved docs only

## Cutover after batch
- knowledge reads from DB
- document files read from DB/storage
- local knowledge becomes archive/fallback only

---

# Batch 4 — Conversations and messages
## Scope
- `conversations` -> `assistant.conversations`
- `messages` -> `assistant.messages`

## Notes
هذه دفعة مستقلة لأن:
- نوع ids قد يحتاج normalization
- الملكية مرتبطة بـ auth/admin_users context
- نحتاج ألا نكسر الشات أثناء النقل

## Mapping
### conversations
- id -> يمكن الاحتفاظ به محليًا في metadata أو إعادة توليد uuid
- userId -> `user_id` (بعد تحويله لصيغة متوافقة)
- title -> `title`
- context -> `context_json`
- isArchived -> `is_archived`

### messages
- conversationId -> `conversation_id`
- role -> `role`
- content -> `content`
- model/modelName -> `model_name`
- grounding -> `grounding_json`
- metadata -> `message_metadata`

## Verification
- user sees own conversations only
- messages load correctly
- new messages write to DB
- chat still works

## Cutover after batch
- chats become DB-first
- local conversations/messages archived

---

# 8) Dual-Write Strategy (Optional)
في بعض الدفعات يمكن اعتماد dual-write مؤقت:

## Example
عند حفظ knowledge document:
- يكتب إلى DB
- ويكتب أيضًا إلى local runtime مؤقتًا

## When to use
- only during risky transition windows
- for knowledge/chat batches
- not permanently

## Important
يجب أن تكون هذه المرحلة قصيرة.
الهدف النهائي هو DB-first مع local archive/fallback فقط.

---

# 9) Runtime Repository Refactor Plan

## Current advantage
`server/runtimeRepository.ts` هو seam ممتاز للترحيل.

## Migration implementation direction
إضافة resolver لكل كيان:

### Example
- `getSystemSettings()`
  - if DB mode and data exists -> read DB
  - else -> local runtime

- `listKnowledgeDocuments()`
  - if migrated -> DB
  - else -> local

وهكذا

## Suggested storage mode flags
- `local`
- `hybrid`
- `database`

### Recommended path
1. start with `hybrid`
2. move per batch
3. finish with `database`

---

# 10) Validation Matrix

لكل Batch يجب تنفيذ:

## 10.1 Structural validation
- target table exists
- inserted row count matches expected count
- required fields are populated
- foreign keys are valid

## 10.2 Functional validation
- page still loads
- create/edit/delete action still works
- read/search still works
- no silent regression

## 10.3 Data validation
- spot check 5–10 records manually
- verify dates
- verify status values
- verify source mappings
- verify content text preserved

---

# 11) Rollback Plan

## Per batch rollback
- keep original local runtime snapshot untouched
- if DB batch fails:
  - stop cutover
  - revert runtimeRepository to local for that entity
  - optionally delete inserted batch rows if needed
- continue only after fix

## Critical rule
Do not delete local source data during first migration cycle.

---

# 12) Recommended Execution Order

## Order
1. Batch 1 — systemSettings + knowledgeSources
2. Batch 2 — fetchedContent + governance intake
3. Batch 3 — knowledgeDocuments + documentFiles
4. Batch 4 — conversations + messages

This order is intentional:
- start with low-risk configuration
- then governance intake
- then core knowledge
- then live operational chat

---

# 13) Deliverables Needed Next

After approving this plan, the next implementation deliverables should be:

1. `Migration_SQL_Support_Draft_1`
   - helper SQL if needed
   - storage bucket assumptions
   - transitional columns if needed

2. `Migration_Script_Draft_1`
   - script to read `local_runtime_store.json`
   - transform records
   - insert into assistant tables

3. `RuntimeRepository_DB_Read_Patch_1`
   - DB-first reads for Batch 1 entities

---

# 14) Approval Status
This document is the current migration baseline draft unless replaced by a newer approved migration plan.
