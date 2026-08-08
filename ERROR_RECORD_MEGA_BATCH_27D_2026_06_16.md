# Error Record — Mega Batch 27D

## Error / Gap 1 — Missing TRPC Root Routers

**Symptom:** Multiple pages used `trpc.<root>.*` while `appRouter` did not expose those roots.  
**Cause:** Legacy/admin surfaces were registered in the UI registry but not completed in the backend router.  
**Affected area:** `server/routers.ts`, admin pages under `client/src/pages` and `client/src/pages/admin`.  
**Resolution:** Added/registered the missing roots and safe read/write procedures.  
**Status:** Resolved statically; browser evidence pending.

## Error / Gap 2 — Placeholder Admin Security/Operations Pages

**Symptom:** `/admin/audit-logs`, `/admin/security`, `/admin/api-keys`, `/admin/maintenance`, and `/admin/reports` rendered static placeholder/simulated content.  
**Cause:** Pages existed but had no backend snapshots.  
**Resolution:** Added backend snapshots under `admin.operations.*` and replaced placeholder pages with connected views.  
**Status:** Resolved statically; browser evidence pending.

## Error / Gap 3 — Container Cannot Run Full `pnpm run check`

**Symptom:** Running `tsc --noEmit` in the container failed with missing type definition files for `node` and `vite/client`.  
**Cause:** The container copy has no `node_modules` and no pnpm environment.  
**What failed:** Full TypeScript check inside container.  
**What passed:** `node --experimental-strip-types --check server/routers.ts` and `node --experimental-strip-types --check client/src/config/adminRegistryV2.ts`.  
**Resolution:** Local Windows check required with `pnpm.cmd run check`.  
**Last stable baseline:** `waqf_ai_model_hybrid_llm_admin_v35_mb27c_runtime_evidence_intake_2026_06_16.zip`.

## Error / Gap 4 — TSX Syntax Check Limitation

**Symptom:** `node --experimental-strip-types --check *.tsx` returns `ERR_UNKNOWN_FILE_EXTENSION`.  
**Cause:** Node syntax check does not directly process `.tsx` in this container mode.  
**Resolution:** Use project TypeScript/Vite toolchain locally.
