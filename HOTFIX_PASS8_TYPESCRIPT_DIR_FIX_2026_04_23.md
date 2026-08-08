# Hotfix — Radix RTL TypeScript dir Fix

## Problem
`tsc --noEmit` failed because `dir` was passed directly to several Radix content/subcontent components whose prop types do not expose `dir`.

Affected files:
- `client/src/components/ui/context-menu.tsx`
- `client/src/components/ui/dropdown-menu.tsx`
- `client/src/components/ui/menubar.tsx`

## Fix Applied
- Removed invalid `dir` prop usage from unsupported Radix content/subcontent components.
- Replaced it with inline style merging:
  - `style={{ direction: "rtl", ...style }}`
- Preserved existing RTL behavior for popup/menu surfaces.
- Kept valid `dir="rtl"` only where the component type accepts it.

## Notes
- No broad refactor.
- Local environment snapshot did not include a runnable TypeScript binary, so full project typecheck was not executed here.
- The reported six errors are addressed by this hotfix.
