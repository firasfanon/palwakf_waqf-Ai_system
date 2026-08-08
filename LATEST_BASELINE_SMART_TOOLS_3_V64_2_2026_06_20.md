# Latest Baseline — Smart Tools 3 v64.2

## Baseline state
- **Version:** v64.2
- **Date:** 2026-06-20
- **Type:** additive pre-apply corrective patch
- **Parent:** v64.1 Smart Tools 3 Reconciliation Gate Correction
- **Live status:** not applied
- **Production status:** not approved

## Correction
Adds the missing first-reviewer scope bootstrap that was intentionally absent from the initial trust-foundation DDL but required before the KB58→KB08 task consolidation may run.

## Fixed account and minimum authority
- User UUID: `96f6cdc2-67f9-4352-b9f8-775ef509fed8`
- `assistant.review` / `review` only
- Does not grant publish, admin, or universal assistant access.

## Required evidence chain
1. 00AA applied successfully.
2. 00AB says `BOOTSTRAP_VERIFIED_REVIEW_ONLY`.
3. 00B V2 returns 6 cancelled KB58 duplicates and 6 active KB08 tasks.
4. v64.1 00C says `RECONCILIATION_APPLIED_AND_VERIFIED`.
5. v64 continue from 01, then runtime / Browser / RBAC-RLS UAT.

## Current gate
```text
BOOTSTRAP_PATCH_PREPARED_NOT_APPLIED
RECONCILIATION_NOT_APPLIED
LIVE_APPLY_PENDING
PRODUCTION_NOT_APPROVED
```
