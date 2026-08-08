# Error Record — Mega Batch UI/UX 01 / v52

## Error 1 — Black-heavy UI discomfort

- Category: UX discomfort / visual system regression.
- Cause: Theme was frozen to `.dark` at early bootstrap and in ThemeProvider.
- Affected files:
  - `client/src/main.tsx`
  - `client/src/contexts/ThemeContext.tsx`
  - `client/src/index.css`
  - `client/src/styles/admin.css`
- Fix:
  - Changed default runtime to `pwf-comfort-light`.
  - Removed forced `.dark` class injection.
  - Rebuilt default HSL tokens as light-first.
  - Added final admin/chat comfort-light CSS override layer.

## Error 2 — Sandbox TypeScript verification blocked

- Category: Environment / dependency availability.
- Command: `npx tsc --noEmit`.
- Result: Missing `node` and `vite/client` type definitions.
- Cause: Extracted baseline in sandbox does not contain complete dependency installation.
- Fix / next action:
  - Run `pnpm.cmd run check` in Windows project root.
  - Accept only if `tsc --noEmit` exits successfully.

## Last stable baseline before this batch

`v51 — Knowledge Batch 06B-1 Admin Knowledge Search Evidence + SQL Verification Fix`

## New candidate baseline

`v52 — Mega Batch UI/UX 01 Assistant Comfort Light Rework`
