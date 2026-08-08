# Assistant Schema SQL Draft 1 — Notes

This package contains the first practical SQL draft for the assistant schema in Supabase/Postgres.

## Included
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

## Intentionally deferred
- `assistant.message_ratings`
- `assistant.bookmarks`
- `assistant.favorite_conversations`
- `assistant.tool_runs`
- `assistant.tool_outputs`
- `assistant.knowledge_chunks`
- embeddings / vector / retrieval cache

## Important
RLS is enabled in this draft, but detailed policies are intentionally deferred to a dedicated RBAC/RLS pass.

## Architectural guardrails
- Keep sovereign platform data outside `assistant`
- Retain original references and files
- Store files in storage, not inside table rows
- Treat technical retrieval artifacts as rebuildable later
