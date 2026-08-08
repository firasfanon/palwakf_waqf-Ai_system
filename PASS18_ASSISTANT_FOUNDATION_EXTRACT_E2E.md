# Pass 18 — Assistant Foundation Closure (Extract End-to-End)

## Scope
Batch سيادي 01 — ربط أول أداة فعليًا على schema assistant.

## What changed

### Server
- Added sovereign persistence helpers in `server/runtimeRepository.ts`:
  - `runtimeCreateAiToolRun`
  - `runtimeCreateAiToolRunLink`
  - `runtimeCreateAiToolRunEvent`
- Switched `runtimeCreateKnowledgeDocumentFromTool()` from local storage to `assistant.knowledge_documents` via Supabase assistant client.
- Linked saved knowledge draft back to the originating tool run through:
  - `assistant.ai_tool_run_links`
  - `assistant.ai_tool_run_events`

### Router
- Updated `server/routers.ts` so `aiTools.extract` now:
  - runs extraction
  - persists a row in `assistant.ai_tool_runs`
  - writes lifecycle events in `assistant.ai_tool_run_events`
  - returns `toolRunId` to the client
- On extract failure, a failed run is also persisted.
- Updated `saveAsKnowledgeDraft` to accept `toolRunId` and persist the generated knowledge draft in assistant schema.

### Client
- Updated `client/src/pages/ExtractTool.tsx` to send `toolRunId` when saving the draft.

## Governance alignment
- Uses platform-governed identity field `platformUserId` where available.
- Stores audit ownership as `created_by_admin_user_id` / `approved_by_admin_user_id` on tool runs.
- Avoids local operational persistence for this extract flow.

## Expected verification after running Extract
1. `assistant.ai_tool_runs` gets a new row with `tool_key = 'extract'`.
2. `assistant.ai_tool_run_events` gets `created` and `completed` (or `failed`).
3. Saving as knowledge draft inserts into `assistant.knowledge_documents`.
4. `assistant.ai_tool_run_links` gets `generated_knowledge_draft`.
5. `assistant.ai_tool_run_events` gets `linked_to_knowledge`.

## Verification SQL
```sql
select id, tool_key, run_status, approval_status, created_at
from assistant.ai_tool_runs
order by created_at desc
limit 10;
```

```sql
select tool_run_id, event_type, created_at
from assistant.ai_tool_run_events
order by created_at desc
limit 20;
```

```sql
select tool_run_id, link_type, knowledge_document_id, created_at
from assistant.ai_tool_run_links
order by created_at desc
limit 20;
```
