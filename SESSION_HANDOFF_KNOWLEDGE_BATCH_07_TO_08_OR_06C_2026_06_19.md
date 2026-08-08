# Session Handoff — Knowledge Batch 07 to Migration Batch 08 / Page Binding / Knowledge 06C

## Current baseline
v56 — Legacy DB Full Census + Migration Readiness + Page Operations Audit.

## Current decision
`LEGACY_DB_FULL_CENSUS_COMPLETED_IMPORT_NOT_APPLIED_P1_MIGRATION_BACKLOG_PREPARED_PAGE_OPERATIONS_STATIC_AUDIT_COMPLETED_BROWSER_UAT_REQUIRED`

## What is now known
- KB05A imported 138 records successfully.
- Old DB evidence shows at least 307 knowledge_documents historically.
- Old DB had 47 tables, including FAQs, suggested questions, page settings, home sections, fetched content, files and operational logs.
- Therefore, the assistant migration is incomplete if judged against the full old DB.

## Next correct batch
Knowledge Batch 08 — Legacy DB Staging Import + P1 Data Promotion Pack.

## After Batch 08
- Rebind pages with real operations.
- Continue UI/UX behavior polish.
- Return to Knowledge Batch 06C chat/citation runtime evidence.

## Do not do yet
- Mega Batch 30.
- Production promotion.
- RBAC/RLS closure claims without 29A evidence.

## Added staging operator SQL
`sql_sandbox/knowledge_batch_07_legacy_db_census_migration_readiness/knowledge_batch_07_legacy_import_register_bulk_insert_all_payloads_OPERATOR_APPLY.sql`

This can stage 929 extracted legacy payloads into `assistant.legacy_import_register` if the operator approves DB apply.
