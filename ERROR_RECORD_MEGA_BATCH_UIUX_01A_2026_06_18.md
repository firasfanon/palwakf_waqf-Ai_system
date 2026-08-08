# Error Record — Mega Batch UI/UX 01A

## Error
Hash routing/navigation regression after v52 comfort-light UI rework.

## Symptoms
- `/knowledge#/knowledge` can show 404.
- Home CTA `ابدأ من البحث الذكي` can route outside the hash-mounted app context.
- Home CTA `استعراض المعرفة` uses the ambiguous `/knowledge` internal route while `/knowledge` is also the application mount path.
- Logout reloads the current path and can surface a 404.

## Root cause
- Raw root-relative anchors remained in Home CTAs and Footer.
- The app used `/knowledge` both as mount path and internal Knowledge page route.
- Route normalization did not strip accidental nested hash fragments.
- Logout used `window.location.reload()` rather than a canonical app-home redirect.

## Fix
- Canonical internal Knowledge page route changed to `/knowledge-base`.
- Legacy `/knowledge` route preserved as alias.
- Home CTA anchors now use `getAppHref()`.
- Logout now redirects to `getAppHref("/")`.
- `normalizeAppPath` and `useHybridLocation` now sanitize full hash URLs.

## Stable baseline after fix
v53 — `MEGA_BATCH_UIUX_01A_HASH_NAVIGATION_HOME_CTA_LOGOUT_FIX_APPLIED_BROWSER_RETEST_REQUIRED`
