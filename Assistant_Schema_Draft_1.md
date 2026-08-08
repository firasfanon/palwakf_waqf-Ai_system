# Assistant Schema Draft 1
## PalWakf Local Assistant / Supabase Draft
## Based on Current Assistant Data Audit

### Purpose
This draft defines the **first practical database schema proposal** for the assistant layer inside the unified PalWakf database.

It is based on:
- current active project services
- current runtime entities
- current local runtime store structure
- current governance direction
- current hybrid LLM direction

It intentionally does **not** attempt to model every inherited page or every speculative future feature.

---

# 1) Core Design Decision

## Decision
Use a **single unified database** with a dedicated assistant schema:

```sql
assistant
```

This schema will contain assistant-owned data only.

It must **not** duplicate sovereign platform data such as:
- platform users as source of truth
- org units as source of truth
- waqf assets as source of truth
- endowments as source of truth
- geography as source of truth

Instead, it may reference those systems when needed.

---

# 2) Data Layers Inside `assistant`

## 2.1 Reference Layer (must be retained)
These are original source materials and reference records that knowledge is derived from.

### Includes
- source documents
- source files
- source registries
- fetched raw content
- approval/review records
- provenance metadata

These are **not temporary**.

---

## 2.2 Derived Knowledge Layer (must be stored)
These are meaningful knowledge outputs derived from reference materials.

### Includes
- approved knowledge documents
- summaries
- extracted structured fields
- classifications
- citations
- FAQ candidates that become approved knowledge later

These are important data, not mere cache.

---

## 2.3 Operational Layer (must be stored)
These are day-to-day assistant runtime records.

### Includes
- conversations
- messages
- settings
- ratings
- logs
- review actions
- tool runs

---

## 2.4 Technical Derived Layer (can be rebuilt later)
These are important for performance but are not the first sovereign layer.

### Includes
- chunks
- embeddings
- vector/index data
- retrieval caches

These should be deferred or treated as rebuildable.

---

# 3) Phase 1 Tables (Build First)

These are the first tables recommended for Supabase implementation.

---

## 3.1 `assistant.system_settings`
### Role
Assistant runtime settings and hybrid provider configuration.

### Type
Operational / configuration

### Suggested columns
- `id` uuid pk
- `key` text unique
- `value_json` jsonb
- `description` text null
- `updated_by` uuid null
- `updated_at` timestamptz not null default now()

### Notes
Store hybrid LLM config here, for example:
- provider mode
- base URL
- API key
- model
- timeout
- enabled flag

This should remain compatible with current runtime fallback logic.

---

## 3.2 `assistant.knowledge_sources`
### Role
Registry of knowledge sources.

### Type
Reference / governance

### Suggested columns
- `id` uuid pk
- `name` text not null
- `type` text not null
- `base_url` text null
- `description` text null
- `is_active` boolean not null default true
- `authority_level` text null
- `created_by` uuid null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
Represents configured sources such as:
- manual source
- seeded source
- fetched external source
- internal reference source

---

## 3.3 `assistant.reference_documents`
### Role
Canonical original reference documents from which knowledge may be derived.

### Type
Reference / sovereign inside assistant domain

### Suggested columns
- `id` uuid pk
- `source_id` uuid null references `assistant.knowledge_sources(id)`
- `title` text not null
- `document_type` text null
- `language` text null
- `status` text not null default 'draft'
- `authority_level` text not null default 'unverified'
- `domain_scope` text not null default 'other'
- `source_type` text not null default 'manual'
- `summary` text null
- `content_text` text null
- `content_hash` text null
- `effective_from` timestamptz null
- `effective_to` timestamptz null
- `approval_version` integer not null default 1
- `review_notes` text null
- `review_decision` text null
- `reviewed_by` uuid null
- `reviewed_at` timestamptz null
- `created_by` uuid null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
This is the long-lived assistant reference layer.
This table should hold the canonical text/metadata of the original document as retained record.

---

## 3.4 `assistant.reference_files`
### Role
Binary/file attachment registry for reference documents.

### Type
Reference / retained

### Suggested columns
- `id` uuid pk
- `reference_document_id` uuid not null references `assistant.reference_documents(id)` on delete cascade
- `storage_path` text not null
- `original_filename` text null
- `mime_type` text null
- `file_size_bytes` bigint null
- `file_hash` text null
- `is_primary` boolean not null default true
- `ocr_text` text null
- `extracted_text` text null
- `created_at` timestamptz not null default now()

### Notes
The file binary itself should go to storage, not into table rows.
The table stores metadata and extracted text.

---

## 3.5 `assistant.knowledge_documents`
### Role
Derived knowledge items used by the assistant.

### Type
Derived knowledge / governed

### Suggested columns
- `id` uuid pk
- `reference_document_id` uuid null references `assistant.reference_documents(id)`
- `source_id` uuid null references `assistant.knowledge_sources(id)`
- `title` text not null
- `category` text null
- `status` text not null default 'draft'
- `authority_level` text not null default 'unverified'
- `domain_scope` text not null default 'other'
- `source_type` text not null default 'manual'
- `summary` text null
- `content` text not null
- `tags` jsonb null
- `is_chat_eligible` boolean not null default false
- `chat_priority` integer not null default 50
- `grounding_weight` numeric not null default 1.0
- `approval_version` integer not null default 1
- `review_notes` text null
- `review_decision` text null
- `reviewed_by` uuid null
- `reviewed_at` timestamptz null
- `effective_from` timestamptz null
- `effective_to` timestamptz null
- `supersedes_document_id` uuid null references `assistant.knowledge_documents(id)`
- `created_by` uuid null
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Critical rule
Chat must only retrieve from rows where:
- `status = 'approved'`
- `is_chat_eligible = true`

---

## 3.6 `assistant.knowledge_citations`
### Role
Link derived knowledge to original reference documents/files.

### Type
Derived / governance

### Suggested columns
- `id` uuid pk
- `knowledge_document_id` uuid not null references `assistant.knowledge_documents(id)` on delete cascade
- `reference_document_id` uuid not null references `assistant.reference_documents(id)` on delete cascade
- `reference_file_id` uuid null references `assistant.reference_files(id)` on delete set null
- `citation_type` text null
- `locator` text null
- `excerpt` text null
- `created_at` timestamptz not null default now()

### Notes
This table is essential for grounding and future citation-first chat.

---

## 3.7 `assistant.fetched_content`
### Role
Raw fetched or imported material awaiting governance decisions.

### Type
Reference input / operational

### Suggested columns
- `id` uuid pk
- `source_id` uuid null references `assistant.knowledge_sources(id)`
- `title` text null
- `content` text null
- `source_url` text null
- `category` text null
- `relevance_score` numeric null
- `status` text not null default 'draft'
- `fetched_at` timestamptz not null default now()
- `metadata_json` jsonb null
- `created_at` timestamptz not null default now()

### Notes
This is not yet approved knowledge.
It is intake material.

---

## 3.8 `assistant.fetch_logs`
### Role
Operational logs for fetching/import activity.

### Type
Operational

### Suggested columns
- `id` uuid pk
- `source_id` uuid null references `assistant.knowledge_sources(id)`
- `status` text not null
- `items_count` integer not null default 0
- `error_message` text null
- `details_json` jsonb null
- `started_at` timestamptz null
- `finished_at` timestamptz null
- `created_at` timestamptz not null default now()

---

## 3.9 `assistant.classification_ratings`
### Role
Human scoring/feedback on classification outcomes.

### Type
Operational / governance

### Suggested columns
- `id` uuid pk
- `target_type` text not null
- `target_id` uuid not null
- `rating` integer not null
- `notes` text null
- `created_by` uuid null
- `created_at` timestamptz not null default now()

### Notes
Needed because tool outputs are data too.

---

## 3.10 `assistant.review_events`
### Role
Audit trail for review and approval actions.

### Type
Governance / operational

### Suggested columns
- `id` uuid pk
- `target_type` text not null
- `target_id` uuid not null
- `event_type` text not null
- `decision` text null
- `notes` text null
- `performed_by` uuid null
- `performed_at` timestamptz not null default now()
- `metadata_json` jsonb null

### Notes
This should be used for:
- knowledge review
- fetched content review
- approval changes
- archive/reject actions
- human overrides of AI outputs

---

## 3.11 `assistant.conversations`
### Role
Chat session header table.

### Type
Operational

### Suggested columns
- `id` uuid pk
- `user_id` uuid null
- `title` text null
- `context_json` jsonb null
- `is_archived` boolean not null default false
- `created_at` timestamptz not null default now()
- `updated_at` timestamptz not null default now()

### Notes
If current auth user ids are not yet normalized to uuid in all contexts, transitional compatibility may be needed.

---

## 3.12 `assistant.messages`
### Role
Messages inside conversations.

### Type
Operational

### Suggested columns
- `id` uuid pk
- `conversation_id` uuid not null references `assistant.conversations(id)` on delete cascade
- `role` text not null
- `content` text not null
- `model_name` text null
- `grounding_json` jsonb null
- `message_metadata` jsonb null
- `created_at` timestamptz not null default now()

### Notes
This should later support:
- grounding references
- citations used
- latency
- provider metadata
- token usage if needed

---

# 4) Phase 2 Tables (Build After Phase 1 Stabilizes)

## 4.1 `assistant.message_ratings`
Rate answers and later connect to evaluation loop.

## 4.2 `assistant.bookmarks`
User bookmarks for documents/messages/entities.

## 4.3 `assistant.favorite_conversations`
Favorite or pinned conversations.

## 4.4 `assistant.tool_runs`
Track execution of extraction/classification/summarization/etc.

## 4.5 `assistant.tool_outputs`
Store governed outputs from smart tools when they must persist.

---

# 5) Phase 3 Technical Derived Tables

These are useful but should not lead the first migration.

## 5.1 `assistant.knowledge_chunks`
Chunk table for retrieval.

### Suggested columns
- `id` uuid pk
- `knowledge_document_id` uuid not null references `assistant.knowledge_documents(id)` on delete cascade
- `chunk_index` integer not null
- `content` text not null
- `token_count` integer null
- `metadata_json` jsonb null
- `created_at` timestamptz not null default now()

## 5.2 `assistant.embeddings`
Only if we decide to store vectors in Postgres later.

## 5.3 `assistant.retrieval_cache`
Rebuildable performance layer.

---

# 6) Governance Rules

## Rule A
Reference documents are retained.

## Rule B
Knowledge documents are governed artifacts derived from references.

## Rule C
Chat reads only from approved and chat-eligible knowledge.

## Rule D
AI tool outputs are data records when they affect governance, review, or retrieval.

## Rule E
Technical retrieval artifacts are rebuildable and should not dominate the first DB migration.

---

# 7) Migration Direction from Current Local Runtime

## First migration target mapping
- `systemSettings` -> `assistant.system_settings`
- `knowledgeSources` -> `assistant.knowledge_sources`
- `knowledgeDocuments` -> split into:
  - `assistant.reference_documents`
  - `assistant.knowledge_documents`
  - plus `assistant.knowledge_citations` where possible
- `documentFiles` -> `assistant.reference_files`
- `fetchedContent` -> `assistant.fetched_content`
- `fetchLogs` -> `assistant.fetch_logs`
- `classificationRatings` -> `assistant.classification_ratings`
- `fetchedContentReviewEvents` -> `assistant.review_events`
- `conversations` -> `assistant.conversations`
- `messages` -> `assistant.messages`

### Important note
The current runtime model may not yet distinguish perfectly between:
- original reference documents
- derived knowledge documents

This distinction should be normalized during migration planning, not ignored.

---

# 8) Why This Draft Avoids DB Bloat

It avoids DB bloat by:
- storing file metadata in tables and file binaries in storage
- separating retained references from rebuildable technical artifacts
- deferring chunks/embeddings as later technical layer
- avoiding duplication of sovereign PalWakf master data
- separating governance records from search/index implementation details

---

# 9) Recommended Immediate Next Step

After approving this draft, the next concrete step should be:

## `Assistant Schema SQL Draft 1`
A first SQL package that creates only Phase 1 tables inside:
```sql
assistant
```

This SQL should be written for Supabase/Postgres and should not yet include:
- embeddings
- vector schema
- complex retention automation
- speculative domain tables

---

# 10) Approval Status
This document is the current draft baseline for assistant DB design unless superseded by a newer approved schema draft.
