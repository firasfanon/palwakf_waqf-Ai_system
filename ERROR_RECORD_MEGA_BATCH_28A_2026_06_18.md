# Error Record — Mega Batch 28A

## Error

`/api/health/readiness` returned:

```json
{
  "database": false,
  "llm": true,
  "ready": false,
  "productionBlockers": ["database_unavailable"],
  "details": {
    "database": {
      "reason": "database_not_configured"
    }
  }
}
```

## Cause

The Mega Batch 28 health gate worked correctly, but the runtime database resolver only relied on `DATABASE_URL` and could not expose safe diagnostics for alternative environment keys or dialect mismatches.

## Files involved

- `server/health/databaseHealth.ts`
- `server/db.ts`
- `server/_core/env.ts`
- `server/_core/index.ts`
- `server/routers.ts`
- `drizzle.config.ts`
- `.env.example`

## Fix

Added `server/config/databaseConfig.ts` as a central resolver that supports:

- `DATABASE_URL`
- `MYSQL_DATABASE_URL`
- decomposed `DB_*` variables
- decomposed `MYSQL_*` variables

It also redacts URLs and blocks incompatible PostgreSQL/Supabase URLs against the current MySQL runtime.

## Status

Static checks passed. Local browser retest is required after applying v40a.

## Last stable baseline before fix

`waqf_ai_model_hybrid_llm_admin_v40_mb28_controlled_staging_readiness_provider_database_health_gate_2026_06_17.zip`

## New baseline after fix

`waqf_ai_model_hybrid_llm_admin_v40a_mb28a_database_connectivity_remediation_2026_06_18.zip`
