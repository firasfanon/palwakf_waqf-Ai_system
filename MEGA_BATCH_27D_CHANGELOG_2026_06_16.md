# Changelog — Mega Batch 27D

## Added

- Added broad TRPC root coverage for previously missing admin/public surfaces.
- Added operational routers for waqf legacy admin surfaces, content templates, home sections, notifications, comments, reports, files, fetch logs, fetcher, knowledge search, roles, permissions, page settings, and cache analytics actions.
- Added `interaction` alias over `interactionStats` to close `InteractionAnalytics` runtime calls.
- Added admin operations snapshots: audit, security, API keys, maintenance.

## Changed

- Converted `/admin/audit-logs`, `/admin/security`, `/admin/api-keys`, `/admin/maintenance`, and `/admin/reports` from placeholder/simulated screens to backend-connected read surfaces.
- Updated `AdminPagesClassification` labels from Backend 27B to Backend 27B/27D.
- Updated `adminRegistryV2` classifications: 50 operational, 1 static stub, 0 backend pending.

## Preserved

- Mega Batch 26 tool closure remains closed.
- Mega Batch 27A/27B/27C remain valid baselines.
- No destructive SQL or production approval was introduced.
- API key screens expose metadata only, not secret values.
