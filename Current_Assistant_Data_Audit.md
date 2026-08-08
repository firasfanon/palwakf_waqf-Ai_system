# Current Assistant Data Audit
## PalWakf Local Assistant
## Practical Audit Before Supabase Schema Build

### Scope
This audit is based on the **actual current project files**, specifically:
- `drizzle/schema.ts`
- `server/localRuntimeStore.ts`
- `server/runtimeRepository.ts`
- `server/routers.ts`

The purpose is to identify the **real assistant data core** that should drive the first Supabase/Postgres schema build.

---

# 1) Executive Reading

The current assistant stack already has a clear active data core.

Today, the project is not relying on Supabase tables for assistant data yet.
Instead, it is operating through a **temporary sovereign local runtime store** and optional DB fallback.

This means the next DB step should **not** start from the whole sidebar or all inherited admin pages.
It should start from the **actual active assistant entities** used by:
- Chat
- Knowledge
- References
- Fetching / Review / Governance
- Hybrid LLM runtime settings

---

# 2) Actual Current Persistence Model

## 2.1 Current temporary persistence layer
Current active temporary persistence is stored in:

```text
.palwakf/runtime/local_runtime_store.json
```

This local store currently contains these active collections:
- `systemSettings`
- `knowledgeDocuments`
- `documentFiles`
- `conversations`
- `messages`
- `knowledgeSources`
- `fetchedContent`
- `fetchLogs`
- `classificationRatings`
- `fetchedContentReviewEvents`

---

## 2.2 Runtime bridge model
`server/runtimeRepository.ts` confirms the project already follows a dual runtime model:

- If DB exists and is available:
  - use DB functions from `server/db.ts`
- otherwise:
  - use local runtime store functions from `server/localRuntimeStore.ts`

This is important because it means the assistant domain already has a **clean migration seam**:
we can move entities one by one from local runtime to Supabase without redesigning the whole app.

---

# 3) Current Real Assistant Entities

## 3.1 Core Active Entities (should drive the first schema build)

| Current Runtime Entity | Present in Local Runtime | Present in Drizzle Schema | Active in Current Product Flow | Recommended Future Supabase Status |
|---|---:|---:|---:|---|
| `systemSettings` | Yes | Yes (`system_settings`) | Yes | Build / adopt early |
| `knowledgeDocuments` | Yes | Yes (`knowledge_documents`) | Yes | Build / adopt early |
| `documentFiles` | Yes | Yes (`document_files`) | Yes | Build / adopt early |
| `knowledgeSources` | Yes | Yes (`knowledge_sources`) | Yes | Build / adopt early |
| `fetchedContent` | Yes | Yes (`fetched_content`) | Yes | Build / adopt early |
| `fetchLogs` | Yes | Yes (`fetch_logs`) | Yes | Build / adopt early |
| `classificationRatings` | Yes | Yes (`classification_ratings`) | Yes | Build / adopt early |
| `fetchedContentReviewEvents` | Yes | Yes (`fetched_content_review_events`) | Yes | Build / adopt early |
| `conversations` | Yes | Yes (`conversations`) | Yes | Build / adopt early |
| `messages` | Yes | Yes (`messages`) | Yes | Build / adopt early |
| `messageRatings` | No local collection today | Yes (`message_ratings`) | Conceptually yes | Build after chat core or with chat if needed |
| `knowledgeChunks` | No active local persistence today | Yes (`knowledge_chunks`) | Not core to first runtime stability | Defer or treat as derived layer |

---

## 3.2 Secondary but relevant entities

| Entity | Why relevant | Recommendation |
|---|---|---|
| `bookmarks` | User knowledge interaction/supporting retrieval UX | Can follow after chat/knowledge core |
| `favoriteConversations` | Chat UX support | Can follow after conversations/messages |
| `cachedResponses` | Optimization only | Do not treat as first schema priority |
| `searchLogs` | Helpful for analytics later | Not first migration priority |
| `feedback` / `ratings` / `comments` | Useful later for eval/governance | Do not block first assistant schema build |

---

## 3.3 Non-driving entities for current assistant schema
These exist in `drizzle/schema.ts` but should **not** drive the first assistant DB batch:
- `waqf_properties`
- `waqf_cases`
- `waqf_deeds`
- `judicial_rulings`
- `legal_precedents`
- `ministerial_instructions`
- `waqf_categories`
- broader admin/CMS tables
- roles/permissions/page settings/site settings legacy layers

They matter to the broader platform, but not to the immediate **assistant-first DB migration**.

---

# 4) Architectural Classification of Assistant Data

## 4.1 Reference / Source Layer (must be retained)
These are long-lived and must be preserved:
- `knowledgeDocuments`
- `documentFiles`
- `knowledgeSources`

These represent:
- source references
- reference files
- extracted/stored text
- provenance

This layer must be treated as **retained assistant source data**, not temporary cache.

---

## 4.2 Governance / Review Layer (must be retained)
These are also important records:
- `fetchedContent`
- `fetchLogs`
- `classificationRatings`
- `fetchedContentReviewEvents`

These are not just technical logs.
They are part of:
- input review workflow
- approval/rejection trace
- quality measurement
- future knowledge governance

---

## 4.3 Chat Operational Layer
These are active operational entities:
- `conversations`
- `messages`
- `messageRatings` (or equivalent rating path)

These are part of the real active assistant product and should be modeled explicitly in DB.

---

## 4.4 Runtime / Configuration Layer
- `systemSettings`

This is especially important now because:
- Hybrid LLM provider settings were adopted
- provider mode is selected from admin first, env second
- connection testing and runtime configuration are now core operational needs

---

## 4.5 Derived / Rebuildable Technical Layer
- `knowledgeChunks`
- future embeddings / vector layer
- retrieval cache
- generated technical indices

These are important, but should be treated as **derived/rebuildable**, not as the first sovereign assistant layer.

---

# 5) What the files tell us concretely

## 5.1 `server/localRuntimeStore.ts`
Confirms that the live temporary store already includes:
- chat
- knowledge
- files
- fetched content
- review events
- provider-aware system settings

This means the assistant is already operating as a coherent data domain.

## 5.2 `server/runtimeRepository.ts`
Confirms a migration-friendly pattern:
- runtime-prefers DB when present
- falls back to local storage otherwise

This is exactly the seam we should use for Supabase rollout.

## 5.3 `server/routers.ts`
Confirms that the active assistant flows today are driven by:
- chat
- knowledge
- fetched content review
- system settings / hybrid llm
- platform bridge
not by the whole inherited admin/CMS surface.

## 5.4 `drizzle/schema.ts`
Confirms that most of the assistant entities already exist conceptually in legacy MySQL/Drizzle form.
This reduces uncertainty and makes migration/design easier.

---

# 6) Practical recommendation for Supabase Build Order

## Phase A — Assistant Core Tables First
Build or adopt first:

1. `assistant.system_settings`
2. `assistant.knowledge_documents`
3. `assistant.document_files`
4. `assistant.knowledge_sources`
5. `assistant.fetched_content`
6. `assistant.fetch_logs`
7. `assistant.classification_ratings`
8. `assistant.fetched_content_review_events`
9. `assistant.conversations`
10. `assistant.messages`

## Phase B — Chat/UX support
11. `assistant.message_ratings`
12. `assistant.bookmarks`
13. `assistant.favorite_conversations`

## Phase C — Derived technical layer
14. `assistant.knowledge_chunks`
15. embeddings / vector / retrieval cache

---

# 7) Important design rule
The first Supabase assistant schema should be based on **actual active assistant entities**, not on:
- broad inherited admin tables
- future domain CRUD
- CMS sprawl
- speculative analytics modules

---

# 8) Immediate next implementation step
The next practical build step should be:

## `Assistant Schema Draft 1`
A focused schema for:
- references
- knowledge
- governance/review
- chat
- runtime settings

This should come **before**:
- chunks/embeddings
- full analytics
- non-core admin layers
- wider platform domain CRUD integration

---

# 9) Decision
This audit approves the following direction:

### Build Supabase assistant schema around:
- `systemSettings`
- `knowledgeDocuments`
- `documentFiles`
- `knowledgeSources`
- `fetchedContent`
- `fetchLogs`
- `classificationRatings`
- `fetchedContentReviewEvents`
- `conversations`
- `messages`

### Defer for later:
- `knowledgeChunks`
- embeddings/vector layer
- broad legacy admin/CMS tables
- domain CRUD not part of current active assistant core

---

# 10) Final note
Because the current project already uses a runtime repository pattern,
the migration from local storage to Supabase can be done incrementally and safely.

That means the agreed practical path is now:

1. **Current Assistant Data Audit** ✅
2. **Assistant Schema Draft 1**
3. **Supabase SQL for active assistant core**
4. **Switch runtimeRepository entity-by-entity from local to Supabase**
