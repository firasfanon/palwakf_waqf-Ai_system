# PalWakf Platform Bridge (Preparation Layer)

This project remains operational on its local Drizzle/MySQL database for the current AI workflows.
The purpose of this bridge layer is to prepare **safe read-only connectivity** to the unified PalWakf database
without prematurely moving the runtime source-of-truth.

## What this layer does
- Reads Supabase/PalWakf connection settings from `.env`
- Provides server-side connectivity checks
- Provides read-only preview of key platform source-of-truth objects:
  - `admin_users`
  - `core.org_units`
  - `waqf.waqf_assets`
  - `waqf.endowment_names`
  - `public.land_references` (configurable)

## What this layer does NOT do yet
- No write-back to the platform DB
- No migration/cutover
- No replacement of the local Drizzle runtime
- No source-of-truth takeover

## Next intended step
Use the `platformBridge` tRPC router to verify readiness and confirm table mappings against the real PalWakf database.
Then choose the first shared bridge (recommended: `awqaf_system` / source-of-truth entities).

## Source of Truth Mapping

The bridge now exposes two additional read-only capabilities:

- `platformBridge.sourceOfTruthMatrix`
  - returns the assistant integration classification matrix for core entities
  - classifies each entity as `direct_link`, `transform`, `centralize`, `local_only`, or `defer`

- `platformBridge.previewMappedSourceOfTruth`
  - returns raw platform samples plus normalized mapped samples for the main platform source-of-truth objects
  - helps compare platform rows against assistant-local expectations before any cutover

This is intentionally read-only and designed for integration planning, not migration.
