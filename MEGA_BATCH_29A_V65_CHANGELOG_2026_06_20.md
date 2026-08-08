# Changelog — Mega Batch 29A v65

**Date:** 2026-06-20  
**Type:** Remote staging evidence + actual RBAC application hardening + negative-UAT pack.

## Actual code changes

- Added `GET /api/health/staging-evidence`, a secret-free server-side readiness/deployment snapshot that can only state readiness for browser UAT, never production approval.
- Added `/admin/staging-evidence` for an evidence screenshot surface.
- Replaced broad `/admin` admission for `manager`, `employee`, and `editor` with explicit administrative role admission only.
- Added server-side `assistant.review` / `assistant.publish` capability checks for all `knowledgeTrust` operations.
- Added best-effort denied-operation audit events for review/publish scope failures.
- Updated Knowledge Review Operations UI to hide publish actions when only review scope exists.
- Added read-only SQL contract and post-UAT governance intake queries.
- Added PowerShell remote-staging health evidence collector and Arabic UAT evidence pack.

## Not performed

- No production deployment.
- No production approval.
- No source/citation verification, mapping decision, binding mutation, or chat release was executed by this package.
- No service-role key was placed in client code.

## Decision

```text
MEGA_BATCH_29A_CODE_AND_EVIDENCE_PACK_PREPARED
REMOTE_STAGING_DEPLOYMENT_EVIDENCE_PENDING
RBAC_RLS_NEGATIVE_UAT_PENDING
PRODUCTION_NOT_APPROVED
```
