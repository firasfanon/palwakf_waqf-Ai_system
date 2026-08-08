# Error Record — Mega Batch 27E

## 1) Closed Error From Prior Batch

**Error:** `TS2353 skipped does not exist in type { success: boolean }`  
**Source:** `server/routers.ts` / `faqsRouter.incrementView`  
**Status:** Closed by 27D TypeScript hotfix and verified locally by user via `pnpm.cmd run check`.

## 2) Non-blocking Warning

**Warning:** `pnpm` field in package.json no longer read by pnpm for `patchedDependencies/overrides`.  
**Impact:** Non-blocking. `tsc --noEmit` completed without error.  
**Recommended future handling:** Move pnpm settings to the new supported location in a dedicated maintenance batch.

## 3) Runtime UX Note Addressed

**Note:** Arabic/RTL date display in activity/admin pages was visually unstable.  
**Cause:** Direct use of `toLocaleString("ar"/"ar-EG")` in multiple pages with mixed RTL punctuation and browser-dependent rendering.  
**Solution:** Shared formatter added in `client/src/lib/dateFormat.ts`; critical admin pages updated.

## 4) Current Baseline

`waqf_ai_model_hybrid_llm_admin_v37_mb27e_runtime_evidence_targeted_ux_stabilization_2026_06_16.zip`
