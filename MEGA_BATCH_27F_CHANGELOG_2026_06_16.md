# Mega Batch 27F — Changelog

**التاريخ:** 2026-06-16

## Changed

- Updated `server/routers.ts` safe read fallback logging.
- Replaced noisy stack-trace logging for expected local DB-unavailable reads with compact MB27F runtime messages.
- Added fallback repetition suppression to prevent console flooding during local bootstrap.

## Evidence accepted

- `pnpm.cmd run check` passed after 27D TypeScript hotfix.
- Browser evidence accepted for:
  - audit logs
  - security
  - api keys
  - maintenance
  - reports

## Not changed

- No DB schema changes.
- No destructive operations.
- No secret exposure.
- No production approval.
