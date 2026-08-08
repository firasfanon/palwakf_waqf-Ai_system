# Changelog — Sovereign Trust Foundation v1

- Added deterministic Assistant trust assessment for source authority, citation state, content classification and visibility scope.
- Added runtime chat retrieval filtering for test/duplicate/quarantined content, unusable citations and insufficient user scope.
- Added ranking preference for verified citations and official/semi-official sources.
- Added scope assignment resolver backed by `assistant.knowledge_scope_assignments`, fail-closed until the table/assignment exists.
- Added `knowledgeTrust.snapshot` and `knowledgeTrust.reviewQueue` administrative read contracts.
- Extended reference cards with authority and citation-state indicators.
- Added operator SQL for scope/workflow/audit schema, deterministic legacy classification, review-task creation, read-only candidate view and server-only RPC.
- Updated platform guide, error record, handoff and baseline pointer.
