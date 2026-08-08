# Error Record — Mega Batch 28B

## Issue

MB28/28A reported `database=false` and `database_not_configured` even though the operator confirmed Supabase platform bridge keys exist in `.env`.

## Root cause

The health gate treated MySQL/Drizzle as the only runtime-compatible database path. Existing Supabase bridge configuration was present in code and `.env`, but not included in the MB28/28A database readiness decision.

## Affected files

- `server/config/databaseConfig.ts`
- `server/health/databaseHealth.ts`
- `server/_core/index.ts`
- `server/routers.ts`

## Resolution

- Added Supabase health probe.
- Corrected database configuration to treat Supabase/PostgreSQL as the sovereign readiness target.
- Kept MySQL as local/legacy fallback.
- Added `/api/health/supabase` for direct evidence.

## Stable baseline before fix

`waqf_ai_model_hybrid_llm_admin_v40a_mb28a_database_connectivity_remediation_2026_06_18.zip`

## New baseline

`waqf_ai_model_hybrid_llm_admin_v40b_mb28b_supabase_postgres_runtime_adapter_readiness_gate_correction_2026_06_18.zip`
