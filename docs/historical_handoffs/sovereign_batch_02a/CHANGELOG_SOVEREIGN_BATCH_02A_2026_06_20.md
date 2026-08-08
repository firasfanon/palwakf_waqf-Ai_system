# Change Log — Sovereign Batch 02A (Pre-apply)

- Added reviewer-only task case context through `knowledgeTrust.reviewTaskCase`.
- Added containment-only content classification decision through `knowledgeTrust.resolveContentClassificationContainment`.
- Added server-side RPC bridge for controlled classification decisions.
- Added SQL gate requiring the current reviewer to claim a source/citation task before verification.
- Removed release controls from the review operation surface for this phase.
- Disabled KB08B mutation controls from the review operation surface pending sample evidence.
- Added apply/read-only verification SQL and Arabic runbook.

No production approval, chat release, KB08B mapping, or page-binding mutation is included.
