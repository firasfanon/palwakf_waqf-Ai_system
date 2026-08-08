# Knowledge Batch 06 — Chat Retrieval/Citation Runtime Evidence + Admin Knowledge Search Verification

## Nature

This batch is a **runtime verification and targeted admin-search stabilization batch** above v47.

It does not import new records, does not promote production, and does not close RBAC/RLS negative UAT.

## Prior evidence accepted

KB05A accepted operator evidence:

```text
reference_documents=138
knowledge_documents=138
knowledge_citations=138
status=approved
is_chat_eligible=true
```

## What changed in this batch

A targeted runtime fix was applied for the Admin Knowledge Search surface:

1. `server/routers.ts`
   - accepts the UI field `q` in addition to `query/text`.
   - returns a structured payload: `{ total, returned, results, filters, mode }`.
   - maps runtime documents to search result rows with `chunkText`, `status`, `isChatEligible`, and `citationsCount`.
   - keeps `generateChunksApproved` as a non-destructive deferred/no-op response, but returns both `created` and `generated` for UI compatibility.

2. `client/src/pages/admin/KnowledgeSearch.tsx`
   - displays returned/total result counts.
   - displays `status`, `chat visibility`, and `citations count` columns.
   - opens the knowledge document route instead of redirecting all rows to fetched-content.
   - reads `chunkText || content || summary`, preventing blank excerpts for runtime knowledge documents.

## Runtime evidence status

Browser evidence was not supplied in this turn. Therefore the batch prepares the verification gate and fixes the admin-search mismatch, but does not certify end-to-end browser retrieval.

## Decision

```text
KNOWLEDGE_BATCH_06_CHAT_RETRIEVAL_CITATION_AND_ADMIN_SEARCH_VERIFICATION_PACK_PREPARED_TARGETED_ADMIN_SEARCH_FIX_APPLIED_RUNTIME_BROWSER_EVIDENCE_PENDING
```

## Required acceptance evidence for closure

1. `/knowledge#/chat` answers at least 4 of the KB06 probes with non-empty `groundingReferences`.
2. Assistant message `sources` contains citation/reference JSON.
3. `/admin/knowledge-search` returns visible rows for `الأراضي الأميرية`, `تعليمات لجان رعاية المساجد`, `الوقف الذري`.
4. SQL read-only verification returns:
   - `kb05_reference_documents >= 138`
   - `kb05_knowledge_documents >= 138`
   - `kb05_citations >= 138`
   - `approved_chat_visible_documents >= 138`
   - no orphan citation/reference links.
