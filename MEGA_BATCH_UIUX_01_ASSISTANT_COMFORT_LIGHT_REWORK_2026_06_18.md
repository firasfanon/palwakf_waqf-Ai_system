# Mega Batch UI/UX 01 — Assistant Comfort Light Rework + Light Visual System Closure

## Nature

This is a single, intentionally scoped UI/UX development batch.

Scope constraints:

- Assistant-only.
- UI/UX-only.
- Light-comfort-first.
- No governance expansion.
- No production gate.
- One big batch only, then return to the Knowledge/29A plan.

## Why

The previous Assistant admin experience was dark-frozen and visually heavy. The user explicitly reported discomfort from the black-dominant UI. This batch reorients the Assistant React interface toward a warm, official, light-first workspace.

## Implemented changes

### 1. Theme bootstrap

- Replaced early runtime `dark` bootstrap with `pwf-comfort-light`.
- Removed automatic `dark` class injection from `ThemeProvider`.
- Kept the old ThemeProvider API shape so existing components do not break.
- Preserved dark token definitions as an optional fallback only, not the default runtime.

### 2. Token system

- Rebuilt central tokens in `client/src/index.css` as warm light defaults.
- Kept PalWakf identity colors:
  - blue primary,
  - gold secondary,
  - royal red destructive/accent.
- Reduced black usage in background/card/sidebar/input/table surfaces.

### 3. Admin workspace comfort layer

- Added a final v52 override layer in `client/src/styles/admin.css`.
- Converted admin background to a warm light gradient.
- Converted sidebar from dark/navy-black to light official panel.
- Reworked topbar, nav items, active states, forms, cards, tables, and dialogs to light-comfort surfaces.

### 4. Chat workspace comfort layer

- Added `assistant-comfort-shell` to the chat root.
- Added targeted CSS for chat page container, aside, main conversation panel, header, muted surfaces, and code blocks.
- Replaced assistant markdown `pre` blocks from near-black to soft slate.

### 5. Theme selector metadata

- Updated the exposed central theme label and colors to describe the comfort-light identity.

## Non-goals

- No DB schema change.
- No SQL apply.
- No Supabase data mutation.
- No RBAC/RLS change.
- No knowledge import.
- No production promotion.
- No Mega Batch 30.

## Acceptance target

The batch is accepted when:

- The Assistant UI no longer defaults to black/dark-heavy mode.
- Admin pages render with light sidebar/topbar/cards.
- `/knowledge#/chat` or `/chat` render with a light, comfortable chat workspace.
- `pnpm.cmd run check` passes in the user's Windows environment.
- No functional regression is observed in smart tools, admin knowledge search, or chat routing.

## Status

Prepared as baseline v52. Runtime browser evidence is still recommended after applying/running locally.
