# Change Log — Mega Batch A (Candidate / Pre-Apply)

## Runtime reliability
- Added a safe, in-memory diagnostics contract for knowledge reads.
- Added a 30-second retry backoff after a primary or required companion read fails.
- Rejects partial knowledge bundles rather than returning documents with missing references/files/citations as if they were complete.

## Human review operations
- Added canonical review queue metrics from the same task dataset.
- Added an authorized server-side Review Case Context endpoint.
- Added tRPC-side explicit task claim checks before source/citation action calls.
- Added the constrained content classification containment route.
- Removed mutation affordances for KB08B, page bindings, and official release from the review screen.
- Added server-side phase locks for those deferred operations.

## Local UX/runtime
- Hardened Dialog stacking, height containment, scroll isolation, and long-text wrapping.
- Added a local read-only site settings fallback for local bootstrap only; writes still require the primary database.

## Governance
- This candidate is not an SQL apply result, not a review completion record, and not a production approval.
