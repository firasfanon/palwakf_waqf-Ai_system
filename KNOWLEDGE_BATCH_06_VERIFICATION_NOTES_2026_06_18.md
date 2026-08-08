# Knowledge Batch 06 — Verification Notes

## Static/runtime-code review

Inspected runtime paths:

- `server/runtimeRepository.ts`
  - Supabase assistant schema client uses `db: { schema: 'assistant' }`.
  - `runtimeGetKnowledgeDocuments({ isActive: 1 })` filters to `status='approved'` and `is_chat_eligible=true`.
  - citations are loaded from `assistant.knowledge_citations` and mapped into each knowledge document.

- `server/rag.ts`
  - `buildGroundingReferences()` emits reference/citation fields.
  - `extractRelevantContext()` prefers citation excerpts and locators when present.

- `server/routers.ts`
  - `chat.sendMessage` retrieves relevant documents, builds grounding references, stores assistant message `sources` as JSON.
  - KB06 fixes `knowledgeSearch.search` payload/response contract.

## Compile verification

Attempted:

```bash
tsc --noEmit
```

Result in this sandbox:

```text
TS2688: Cannot find type definition file for 'node'.
TS2688: Cannot find type definition file for 'vite/client'.
```

Reason: extracted sandbox does not contain full dependency/type installation. This is an environment dependency issue, not a KB06 source-code syntax finding. Run `pnpm.cmd run check` in the Windows project environment used for prior Mega Batches.

## SQL verification

Prepared read-only SQL:

```text
sql_sandbox/knowledge_batch_06_chat_retrieval_citation_admin_search_verification/knowledge_batch_06_post_apply_runtime_read_only_verification.sql
```

## Decision

```text
KNOWLEDGE_BATCH_06_CHAT_RETRIEVAL_CITATION_AND_ADMIN_SEARCH_VERIFICATION_PACK_PREPARED_TARGETED_ADMIN_SEARCH_FIX_APPLIED_RUNTIME_BROWSER_EVIDENCE_PENDING
```
