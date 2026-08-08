# Changelog — Sovereign Batch 02A.1 (2026-06-20)

- Raised dialog overlay/content stacking for workflow-critical dialogs through explicit portal layers.
- Rebuilt the review-case dialog into an isolated header / scroll-body / fixed-footer layout.
- Added controlled lock of the admin internal scroll container while a review case is open.
- Hardened `runtimeRepository` bundle assembly: any companion read failure rejects the incomplete bundle and activates a short safe-fallback backoff.
- No SQL, RBAC/RLS, task status, KB08B mapping, publish scope, or chat-release changes.
