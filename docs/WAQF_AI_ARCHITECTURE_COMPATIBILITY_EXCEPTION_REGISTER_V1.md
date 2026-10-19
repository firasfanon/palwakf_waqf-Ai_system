# WAQF_AI Architecture Compatibility Exception Register V1

Task: DESIGN-ARCH-001
Date: 2026-10-19

## Purpose

This register prevents legacy compatibility calls from being mistaken for the target architecture.

## Closed in DESIGN-ARCH-001

- Direct Drizzle select/insert/update/delete calls in server/routers.ts: **0**.
- Imports from server/infrastructure/** inside server/routers.ts: **0**.
- Supabase SDK creation inside server/runtimeRepository.ts: **0**.
- Supabase table/RPC query syntax inside server/runtimeRepository.ts: **0**.
- React business-page imports of client Supabase adapter: **0**.
- Router size reduced below the task budget of 4,000 lines.
- Application orchestration extracted to server/application/adminOperationsService.ts.
- Assistant runtime data access is behind AssistantDataPort with Supabase adapter implementation.

## Bounded legacy compatibility

server/routers.ts still contains **71 references to dbOps.*** from the historical server/db.ts compatibility boundary.

Classification: **BOUNDED_LEGACY_DATA_ACCESS_COMPATIBILITY**.

This is not direct Drizzle access and is not an infrastructure import. It remains admitted for this batch because blindly migrating every historical CRUD endpoint would expand DESIGN-ARCH-001 into a broad behavioral rewrite.

Rules:
1. No new dbOps.* consumer may be added without explicit justification.
2. New functionality must use application/port boundaries.
3. Existing dbOps.* calls should migrate domain-by-domain in later functional batches when that domain is touched.
4. The count must never increase above the DESIGN-ARCH-001 accepted value of 71 without a reviewed exception.
5. Direct DB/Drizzle code in the router remains prohibited.

## Acceptance impact

Architecture status for this batch:

**PASS_WITH_BOUNDED_LEGACY_COMPATIBILITY**

This is not a claim that the entire historical repository has been converted to pure hexagonal/clean architecture.
