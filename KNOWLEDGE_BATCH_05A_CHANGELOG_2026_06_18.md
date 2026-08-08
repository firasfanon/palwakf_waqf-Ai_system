# Knowledge Batch 05A Changelog — 2026-06-18

## Added

- Supabase apply evidence intake for Knowledge Batch 05.
- Primary import result acceptance for 138 recovered records.
- Second-run/no-op interpretation to avoid misclassifying zero insertions as failure.
- Chat visibility and approval sample evidence table.
- Updated platform comprehensive guide.
- Updated latest baseline pointer.
- New handoff toward runtime chat verification or Mega Batch 29A.

## Changed

- Knowledge state changed from `IMPORT_PACK_PREPARED` to `PRIMARY_IMPORT_APPLY_ACCEPTED`.
- Knowledge corpus status changed from prepared-only to DB-imported according to supplied operator evidence.

## Not changed

- No application source code changed.
- No additional SQL was executed from the sandbox.
- No production promotion approved.
- No RBAC/RLS negative UAT closed.
