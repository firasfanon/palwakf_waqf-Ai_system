# Changelog — Mega Batch 27B

## Added

- Added `adminRouter` under root `appRouter.admin`.
- Added `analyticsRouter` under root `appRouter.analytics`.
- Added admin dashboard endpoints: `systemStats`, `charts.userGrowth`, `charts.conversationActivity`, `charts.faqDistribution`.
- Added admin activity endpoint: `activityLog`.
- Added admin users endpoints for list, activity, role update, status toggle, soft delete, and bulk actions.
- Added admin content endpoints for FAQs and knowledge documents with safe disable semantics.
- Added analytics endpoints for rating stats, negative analysis, frequent questions, best answers, and improvement suggestions.
- Added operations endpoints for Cache, Backup, Integrations, Webhooks, and backend activation snapshot.

## Changed

- Replaced placeholder Cache page with backend-connected operational snapshot.
- Replaced placeholder Integrations page with backend-connected integration matrix.
- Replaced placeholder Webhooks page with internal event map.
- Replaced placeholder Backup page with safe backup manifest flow.
- Updated Admin Pages Classification to consume `admin.backendActivationSnapshot`.
- Updated Admin Registry statuses for activated pages.

## Governance

- User delete actions are implemented as safe deactivation (`isActive = 0`).
- Document delete is implemented as safe deactivation (`isActive = 0`).
- Backup is manifest-only; no dump/restore.
- Webhooks are internal event mapping only; no external dispatch.

## Verification

- `node --experimental-strip-types --check server/routers.ts` passed.
- `node --experimental-strip-types --check client/src/config/adminRegistryV2.ts` passed.
- Full `pnpm run check` remains pending local environment because dependencies are not installed in the execution container.
