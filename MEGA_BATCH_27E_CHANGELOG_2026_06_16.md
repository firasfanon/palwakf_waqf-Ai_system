# Mega Batch 27E Changelog — 2026-06-16

## Added

- Added `client/src/lib/dateFormat.ts` with shared Arabic runtime date formatting helpers.

## Changed

- Stabilized date/time rendering in admin activity, tools, tool runs, users, audit logs, reports, and backup manifest pages.
- Normalized `admin.activityLog` server output to ISO when possible.
- Replaced textual date sorting in activity log with numeric timestamp sorting.

## Evidence Intake

- Accepted local evidence that `pnpm.cmd run check` passed after Mega Batch 27D TypeScript hotfix.

## Not Changed

- No database schema changes.
- No production SQL.
- No destructive admin actions.
