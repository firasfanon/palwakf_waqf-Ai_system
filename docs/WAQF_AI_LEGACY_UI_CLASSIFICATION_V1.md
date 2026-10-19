# WAQF_AI Legacy UI Classification V1

## Purpose

Prevent historical compatibility files/routes from becoming competing product authority.

## Classified artifacts

### client/src/pages/ManageKnowledge_old.tsx
Status: DEPRECATED_COMPATIBILITY_ARTIFACT
New consumers: prohibited.
Canonical knowledge/review surfaces are the current admin registry pages and Knowledge Operations Workspace.

### client/src/pages/ManageUsers_Old.tsx
Status: DEPRECATED_COMPATIBILITY_ARTIFACT
New consumers: prohibited.

### /admin/users-old
Status: DEPRECATED_COMPATIBILITY_ROUTE
Retained temporarily for compatibility evidence. It must not be used for new navigation or new integration.

## Lifecycle

These artifacts follow CONTRACT_LIFECYCLE_V1:
DEPRECATED → MIGRATION_WINDOW → NO_NEW_CONSUMERS → RETIREMENT_READY → RETIRED.

Removal requires confirmation that no admitted consumer depends on them. DESIGN-ARCH-001 does not destroy historical compatibility evidence without that proof.

### client/src/pages/admin/AdminMustakshifAi.tsx
Status: DEPRECATED_UNREGISTERED_ARTIFACT
New consumers: prohibited.
Canonical deferred surface: client/src/pages/admin/MustakshifAiPage.tsx.

### client/src/pages/ComponentShowcase.tsx
Status: DEPRECATED_UNREGISTERED_DEMO_ARTIFACT
New consumers: prohibited.
Canonical governed component catalog: /admin/design-system.

### /admin/billing and client/src/pages/admin/Billing.tsx
Status: DEFERRED_PRODUCT_SURFACE
The route is retained as an internal compatibility surface and explicitly states that no billing service is active. It must not be counted as complete until a separate product and security authorization exists.
