# Consolidated Error Record — Mega Batch 26 to 29A

**Date:** 2026-06-18

## Stable baseline

```text
waqf_ai_model_hybrid_llm_admin_v42_mb29a_remote_staging_deployment_evidence_rbac_rls_negative_uat_2026_06_18.zip
SHA256: e866da03ba70dd566cf8d7de962c84d8e55ae89e06b1d085b04d66c5b80c240c
```

## Current final handoff baseline

```text
waqf_ai_model_hybrid_llm_admin_v42_final_comprehensive_handoff_baseline_2026_06_18.zip
```

## Repeated/important errors and resolutions

### 1. Node/pnpm not available

- **Cause:** Local Windows environment missing Node/pnpm or PATH not updated.
- **Resolution:** Install Node, use `npm.cmd`/`pnpm.cmd`, optionally Corepack.
- **Status:** Resolved locally.

### 2. PowerShell `npm.ps1` execution policy

- **Cause:** PowerShell blocked scripts.
- **Resolution:** Use `.cmd` executables or set `RemoteSigned` for current user.
- **Status:** Resolved.

### 3. TypeScript `skipped` property mismatch

- **File:** `server/routers.ts`
- **Cause:** `safeDbRead` fallback returned `{ success, skipped }` while success path returned only `{ success }`.
- **Resolution:** Normalize response shape.
- **Stable baseline:** v36a.

### 4. ManageKnowledge TDZ runtime crash

- **File:** `client/src/pages/ManageKnowledge.tsx`
- **Cause:** helper functions called before initialization.
- **Resolution:** Move helpers to module scope.
- **Stable baseline:** v38a.

### 5. Ollama connection refused

- **Cause:** `127.0.0.1:11434` unavailable.
- **Resolution:** Safe Arabic fallback added; later Ollama evidence accepted.
- **Stable baseline:** v38b+.

### 6. Database readiness false despite Supabase configured

- **Cause:** MB28/28A health gate checked MySQL/Drizzle only.
- **Resolution:** MB28B added Supabase/PostgreSQL health adapter and corrected readiness.
- **Stable baseline:** v40b.

### 7. Production not approved

- **Cause:** Remote staging and RBAC/RLS negative UAT evidence not supplied.
- **Resolution:** MB29A prepared evidence matrices; production remains blocked until evidence intake.
- **Stable baseline:** v42.

