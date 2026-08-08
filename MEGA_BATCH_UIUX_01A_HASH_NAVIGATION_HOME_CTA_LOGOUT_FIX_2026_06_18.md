# Mega Batch UI/UX 01A — Hash Navigation + Home CTA + Logout Fix

Date: 2026-06-18
Baseline: v52
New baseline: v53
Scope: Assistant-only / UI-UX-only / Light-comfort-first / No governance expansion / No production gate

## Arabic summary
هذه دفعة تصحيح تشغيلية داخل نفس مرحلة UI/UX الواحدة. تم قبول لقطات المتصفح التي أظهرت أن روابط الصفحة الرئيسية بعد v52 تتعامل مع مسارات غير منضبطة:

- `http://localhost:3000/knowledge#/knowledge` قد يصل إلى 404.
- زر `ابدأ من البحث الذكي` لا يحافظ على hash routing.
- زر `استعراض المعرفة` يستخدم مسارًا ملتبسًا بين mount path `/knowledge` وصفحة المعرفة الداخلية.
- تسجيل الخروج يعتمد على `window.location.reload()` وقد ينتهي إلى صفحة 404 في بعض حالات المسار.

## Decision
`MEGA_BATCH_UIUX_01A_HASH_NAVIGATION_HOME_CTA_LOGOUT_FIX_APPLIED_BROWSER_RETEST_REQUIRED`

## What changed
1. Added canonical internal public knowledge route: `/knowledge-base`.
2. Kept legacy aliases `/knowledge` and `/knowledge/:id` to avoid breaking server/DB generated links.
3. Hardened hash route normalization against accidental full hash URLs such as `/knowledge#/knowledge#/`.
4. Updated Home CTA buttons to use `getAppHref()`:
   - Search: `/knowledge#/search` when hash routing is active.
   - Knowledge browser: `/knowledge#/knowledge-base` when hash routing is active.
5. Replaced Home logout reload with explicit safe redirect to app home through `getAppHref("/")`.
6. Updated footer, navbar, command palette, breadcrumbs, chat quick links, bookmarks, and details navigation to prefer `/knowledge-base`.

## Non-goals
- No DB schema change.
- No Supabase write.
- No governance expansion.
- No RBAC/RLS change.
- No production promotion.

## Acceptance criteria
- `/knowledge#/` renders the assistant home page.
- `/knowledge#/chat` renders chat.
- `/knowledge#/search` renders search.
- `/knowledge#/knowledge-base` renders knowledge browser.
- `/knowledge#/knowledge` remains accepted as legacy alias and does not 404.
- Home CTA `ابدأ من البحث الذكي` opens search, not Home.
- Home CTA `استعراض المعرفة` opens the knowledge browser, not Home.
- Logout returns to `/knowledge#/` or equivalent home route without a 404.
