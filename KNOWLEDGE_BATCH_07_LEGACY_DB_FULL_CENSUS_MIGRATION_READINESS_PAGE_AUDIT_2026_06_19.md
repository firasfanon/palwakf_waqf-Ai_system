# Knowledge Batch 07 — Legacy DB Full Census + Migration Readiness + Page Operations Audit

## Nature
This batch is a **deep legacy database/content review and migration-readiness batch** over v55.

It is not a live Supabase import. It does not approve production. It does not change governance.

## Why this batch exists
The earlier KB05 import moved 138 recovered records, but the old database evidence shows more assistant data existed before the Supabase transition. The old DB reached at least **307 knowledge_documents**, while the accepted Supabase import covered **138** records. Therefore, there is a minimum historical count gap of **169** records before dedupe/review.

## Evidence reviewed
- `.manus/db/*.json` old DB query logs
- old seed/import SQL under `scripts/`, `insert_jerusalem_refs.sql`, `drizzle/`
- JSON registries under `new_references.json`, `research_data/`, `knowledge_batch_*`
- current React routes/pages under `client/src/pages`, `client/src/App.tsx`, `adminRegistryV2.ts`

## Headline findings
| Item | Count / Status |
|---|---:|
| old DB query-log files reviewed | 100 |
| canonical old DB tables observed | 47 |
| legacy seed/alias table objects observed | 5 |
| tables from old `SHOW TABLES` evidence | 47 |
| raw INSERT rows extracted from SQL/logs | 490 |
| JSON content records extracted | 520 |
| old max `knowledge_documents` observed | 307 |
| KB05A records already imported/approved/chat-visible | 138 |
| minimum old knowledge count gap | 169 |
| fetched_content old observed total | 28 |
| knowledge_sources old observed rows | 8 |
| suggested_questions seed records observed | 8 |
| page files statically audited | 82 |

## Critical conclusion
The old assistant database contained more than `knowledge_documents` only. It also had operational and UX-supporting data such as:

- `faqs`
- `suggested_questions`
- `fetched_content`
- `fetch_logs`
- `knowledge_sources`
- `page_settings`
- `home_sections`
- `home_section_items`
- `content_templates`
- `files` / `document_files`
- `bookmarks` / `favorite_conversations`
- `conversations` / `messages`
- `feedback` / `ratings`
- `legal_precedents` / `judicial_rulings` / `ministerial_instructions`

## Recommended migration sequence
1. Stage all old records in `assistant.legacy_import_register` so nothing is lost.
2. Promote P1 data to final assistant tables.
3. Rebind pages that currently show UI without real operations.
4. Run browser UAT for every public/admin page.
5. Then continue UI/UX behavior polish.
6. Then return to Knowledge 06C evidence.

## Decision
`LEGACY_DB_FULL_CENSUS_COMPLETED_IMPORT_NOT_APPLIED_P1_MIGRATION_BACKLOG_PREPARED_PAGE_OPERATIONS_STATIC_AUDIT_COMPLETED_BROWSER_UAT_REQUIRED`

## Operator staging SQL added
A full staging SQL was added:

```text
sql_sandbox/knowledge_batch_07_legacy_db_census_migration_readiness/knowledge_batch_07_legacy_import_register_bulk_insert_all_payloads_OPERATOR_APPLY.sql
```

It stages all extracted legacy payloads into `assistant.legacy_import_register` without promoting them to final operational tables yet.

Expected extracted staging payload rows: **929** after internal dedupe.

This is the safest first database move because it preserves old records inside Supabase while keeping promotion/page-binding controlled.
