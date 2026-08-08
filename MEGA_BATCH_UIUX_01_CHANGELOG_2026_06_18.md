# Changelog — Mega Batch UI/UX 01 / v52

## Changed

- `client/src/contexts/ThemeContext.tsx`
  - Changed frozen runtime theme from dark to comfort-light.
  - Removed forced `.dark` class injection.
  - Kept API compatibility for `setTheme` and `toggleTheme` as no-op comfort-light setters.

- `client/src/main.tsx`
  - Changed early theme bootstrap from `.dark + pwf-core` to `pwf-comfort-light`.

- `client/src/App.tsx`
  - Updated `ThemeProvider` call to `defaultTheme="comfort-light"` and storage key `pwf-theme-comfort-light-frozen`.

- `client/src/lib/themes.ts`
  - Updated central theme metadata and palette to a light comfort identity.

- `client/src/index.css`
  - Rebuilt central token defaults as light-first.
  - Preserved dark tokens under `.dark` only.

- `client/src/styles/admin.css`
  - Added v52 final comfort-light override layer for admin shell/sidebar/topbar/cards/forms/tables/dialog overlays.

- `client/src/pages/Chat.tsx`
  - Added `assistant-comfort-shell` root class.
  - Softened markdown pre/code block background.

## Added

- `MEGA_BATCH_UIUX_01_ASSISTANT_COMFORT_LIGHT_REWORK_2026_06_18.md`
- `MEGA_BATCH_UIUX_01_CHANGELOG_2026_06_18.md`
- `MEGA_BATCH_UIUX_01_CHANGED_FILES_2026_06_18.md`
- `MEGA_BATCH_UIUX_01_VERIFICATION_NOTES_2026_06_18.md`
- `ERROR_RECORD_MEGA_BATCH_UIUX_01_2026_06_18.md`
- `SESSION_HANDOFF_MEGA_BATCH_UIUX_01_TO_KNOWLEDGE_06C_OR_29A_2026_06_18.md`

## Decision

`MEGA_BATCH_UIUX_01_COMFORT_LIGHT_REWORK_APPLIED_RUNTIME_BROWSER_EVIDENCE_PENDING`
