# Knowledge Batch 07 Changelog — 2026-06-19

## Added
- legacy DB table inventory CSV/JSON.
- raw INSERT records register.
- JSON content register.
- legacy knowledge SQL candidate delta register.
- assistant page operations static audit.
- Supabase presence check SQL.
- legacy import register schema proposal.
- operator import sequence.

## Changed
- Updated platform guide and latest handoff to acknowledge that old DB migration is not complete after KB05A.

## Not done
- No live Supabase import.
- No production approval.
- No browser UAT acceptance.

## Added after audit
- Bulk operator SQL to stage all extracted legacy SQL/JSON payloads in `assistant.legacy_import_register`.
- Post-apply read-only check for the legacy import register.
