# WAQF_AI Component Pattern Catalog V1

Canonical live catalog: `#/admin/design-system`

## Governed foundations

The application uses a shadcn/Radix-style reusable component foundation with 53 UI primitive files measured before DESIGN-ARCH-001.

Primary families:
- Button
- Input / Textarea
- Select / Radio / Checkbox / Switch
- Dialog / Drawer / Sheet
- Card
- Table
- Tabs
- Sidebar / Navigation
- Badge / Status
- Alert / Tooltip
- Pagination
- Skeleton / Spinner
- Form primitives

## WAQF_AI semantic patterns

### StatusBadge
File: `client/src/components/ui/status-badge.tsx`

Tones:
success, warning, danger, info.

Contract:
icon + text + semantic token + `role=status`.

### Evidence / reference content
Evidence-heavy surfaces must keep source, citation, locator, verification and rights state visible to authorized reviewers. Development/reviewer visibility is independent from public publication eligibility.

### Deferred product surface
A deferred feature must say it is deferred and why. It must not silently render a generic placeholder and must not be counted as complete.

Mustakshif AI is currently classified `deferred`, not `stub_page`.

### Responsive table shell
Wide evidence/token tables use a bounded internal overflow container rather than causing page-level horizontal overflow.

### Bidi evidence identifiers
Hashes, URLs, IDs and citations use LTR isolation within Arabic RTL layouts.

## Required product states

Async operational surfaces must support the states relevant to their workflow:
loading, empty, success, error, degraded, permission-denied, conflict/blocked.

No UI-only successful save is accepted when persistence failed.
