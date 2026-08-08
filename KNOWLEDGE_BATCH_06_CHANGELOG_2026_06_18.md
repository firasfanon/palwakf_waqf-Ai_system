# Knowledge Batch 06 — Changelog

## Added

- Runtime evidence template for chat/citation verification.
- Browser UAT matrix CSV.
- Read-only SQL verification for imported records, citations, search probes, and orphan checks.
- Chat retrieval/citation UAT runbook.
- Admin Knowledge Search verification documentation.

## Changed

- `server/routers.ts`
  - Fixed Admin Knowledge Search input/output mismatch.
  - Search now accepts `q`, `query`, or `text`.
  - Search now returns `results`, `total`, `returned`, `filters`, and `mode`.

- `client/src/pages/admin/KnowledgeSearch.tsx`
  - Shows returned/total counts.
  - Shows status, chat visibility, and citation counts.
  - Opens `/knowledge/{id}` for imported knowledge rows.

- `PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md`
  - Updated with KB06 decision and next gate.

## No changes

- No new knowledge import.
- No approval-state mutation.
- No production approval.
- No RBAC/RLS closure.
