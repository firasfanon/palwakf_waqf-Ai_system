# U2.1 — Apply Theme Presets to Public Surfaces (Safe)

## What this bundle does
- Adds **Ministry Classic** + **Islamic (light/dark)** presets to `predefinedThemes`.
- Makes theme selection from `/admin/settings` **visibly affect the Public site** (homepage + public pages):
  - In **Light mode**: overrides `--background`, derives `--card`, `--muted`, `--border`, and light sidebar tokens.
  - In **Dark mode**: keeps dark surfaces stable (does not override `--background`/`--card`), only applies brand colors.
- Keeps Admin safe: under `/admin/*` we **clear overrides** (no DB color injection into Admin tokens).

## Files to overwrite
- `client/src/lib/themes.ts`
- `client/src/contexts/SiteSettingsContext.tsx`

## Steps (STRICT)
1) Overwrite the two files above exactly.
2) Restart dev server.
3) Open `/admin/settings` → Themes → apply one of:
   - **هوية الوزارة (رسمي)**
   - **ثيم إسلامي (فاتح/داكن)**
4) Open the public homepage `/` in a new tab and hard refresh.
   - Light: Background & card surfaces should change noticeably.
   - Dark: Surfaces remain dark/stable; brand colors may change.

## Notes
- No DB changes.
- No routing changes.
- No Supabase.
