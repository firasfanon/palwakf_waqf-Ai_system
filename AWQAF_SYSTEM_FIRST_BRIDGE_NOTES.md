# awqaf_system First Bridge (Read-Only Consumption)

This baseline adds the first real read-only bridge from the assistant project to PalWakf sovereign entities.

## Added
- Server-side read-only bridge list functions for:
  - admin_users
  - org_units
  - waqf_assets
  - endowment_names
- tRPC procedures under `platformBridge`:
  - adminUsers
  - orgUnits
  - waqfAssets
  - endowments
- Admin page:
  - `/admin/platform-bridge`
- Admin registry entry:
  - `جسر المنصة`

## Purpose
This phase does **not** cut over the project to the platform database.
It provides safe, read-only visibility into platform source-of-truth entities from within the assistant project.

## Scope
- Read only
- No writes to platform DB
- No cutover
- No replacement of local operational tables yet
