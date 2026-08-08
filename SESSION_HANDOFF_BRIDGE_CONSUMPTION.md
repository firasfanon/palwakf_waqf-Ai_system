# Session Handoff — Local Assistant Bridge Consumption

## What was completed

1. Added a new helper layer at `server/platform/assistantContext.ts`.
   - Builds read-only platform context for assistant workflows.
   - Pulls best-effort matches for:
     - org_units
     - waqf_assets
     - endowment_names
   - Includes current authenticated platform scope (`platformRole`, `unitId`, matched org unit).

2. Injected platform context into chat assistant workflow.
   - Updated `server/routers.ts` chat `sendMessage` mutation.
   - Assistant prompt now includes:
     - retrieved knowledge context
     - platform user scope
     - best-effort matched waqf assets / endowments / org units
   - This is read-only and does not write to platform tables.

3. Added fetched-content platform context resolver.
   - New query: `trpc.fetchedContent.resolvePlatformContext`
   - Uses fetched content title / docNumber / issuer / keywords / tags / content snippet.
   - Purpose: bridge consumption inside review workflow without schema changes.

4. Updated `FetchedContentReview.tsx` UI.
   - Added a new "سياق المنصة المرتبط" block in preview dialog.
   - Shows:
     - current reviewer platform role + unit context
     - matched waqf assets
     - matched endowments
     - matched org units
   - Also fixed original-link display to use `url || sourceUrl` instead of only `sourceUrl`.

5. Updated system prompt generator in `server/rag.ts`.
   - `generateSystemPrompt(context, { platformContext })`
   - Keeps knowledge context primary.
   - Uses platform context as contextual support only.

## Files changed

- `server/platform/assistantContext.ts` (new)
- `server/routers.ts`
- `server/rag.ts`
- `client/src/pages/FetchedContentReview.tsx`

## Important architectural note

This patch keeps the bridge read-only and localized.
No DB migrations were added.
No platform write path was introduced.
No re-engineering of auth/session was done.

## Current limitation

I could not run full `pnpm install / pnpm check` inside the container because network access to npm registry is unavailable in this environment.
So the patch was verified by code-level inspection only, not by full local package-based typecheck/build.

## Exact next step

Run locally on your machine:

1. `pnpm install` (if needed)
2. `pnpm check`
3. `pnpm exec tsx watch server/_core/index.ts`
4. Verify:
   - login still works
   - `/admin/platform-bridge`
   - `/admin/fetched-content` preview dialog shows the new platform context block
   - chat answers still work and benefit from platform-aware context

## If a compile/runtime issue appears next

Treat this patch as the active baseline and fix only the failing file/line locally:
- first priority: `FetchedContentReview.tsx`
- second priority: `server/routers.ts`
- third priority: `server/platform/assistantContext.ts`
