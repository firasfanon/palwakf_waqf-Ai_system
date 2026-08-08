# Error Record — Knowledge Batch 07 — 2026-06-19

## Issue
Previous knowledge migration work focused on the 138 recovered reference/knowledge records. User clarified that the old pre-Supabase DB had many more tables and content domains that were not migrated.

## Cause
The earlier extraction scope prioritized known knowledge/reference JSON and selected old DB records, not the full old DB operational/content schema.

## Impact
Pages such as FAQs, search, sources, fetched content review, page/home management and other admin/public surfaces may exist visually but lack complete migrated data or operational binding.

## Fix in this batch
A full static census was generated across old DB query logs, seed SQL, JSON registries and React pages. Migration is now split into staging -> promotion -> page binding -> browser UAT.

## Stable baseline before issue
v55 — Mega Batch UI/UX 01C.

## New baseline
v56 — Knowledge Batch 07 legacy census and migration readiness.
