# Mega Batch 28A — Database Connectivity Remediation

## Baseline

`waqf_ai_model_hybrid_llm_admin_v40_mb28_controlled_staging_readiness_provider_database_health_gate_2026_06_17.zip`

## Decision

`MEGA_BATCH_28A_DATABASE_CONNECTIVITY_REMEDIATION_APPLIED_STATIC_CHECKS_PASSED_LOCAL_PNPM_BROWSER_DB_RETEST_REQUIRED`

## Evidence accepted

The user supplied `/api/health/readiness` evidence showing:

```json
{
  "server": true,
  "database": false,
  "llm": true,
  "ready": false,
  "productionBlockers": ["database_unavailable"],
  "details": {
    "database": {
      "reason": "database_not_configured"
    },
    "llm": {
      "available": true,
      "provider": "ollama",
      "model": "qwen2.5:3b",
      "mode": "connected"
    }
  }
}
```

This means the LLM gate is accepted and the remaining blocker is database connectivity/configuration.

## What changed

### New configuration resolver

Added:

`server/config/databaseConfig.ts`

This file resolves database configuration from the following supported sources:

1. `DATABASE_URL`
2. `MYSQL_DATABASE_URL`
3. `DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD`
4. `MYSQL_HOST + MYSQL_PORT + MYSQL_DATABASE + MYSQL_USER + MYSQL_PASSWORD`

It also redacts URLs for diagnostics and detects incompatible dialects.

### Updated runtime database access

Updated:

- `server/db.ts`
- `server/health/databaseHealth.ts`
- `server/_core/env.ts`
- `drizzle.config.ts`

The runtime no longer depends only on `DATABASE_URL`. It now uses the centralized resolver and explains why a DB is blocked.

### Safe diagnostics endpoint

Updated:

- `server/_core/index.ts`
- `server/routers.ts`

Added raw HTTP diagnostic endpoint:

`/api/health/database-config`

Added TRPC endpoint:

`health.databaseConfig`

No secrets are returned; URL output is redacted.

### Environment template

Updated:

`.env.example`

It now documents MySQL runtime requirements and accepted DB configuration forms.

## Important runtime boundary

The assistant project currently uses:

- `drizzle-orm/mysql2`
- `drizzle-orm/mysql-core`
- `drizzle.config.ts` dialect `mysql`

Therefore PostgreSQL/Supabase URLs are intentionally detected but not accepted by this runtime. A future migration to PostgreSQL requires a separate adapter/migration batch; it must not be hidden inside a DB connectivity fix.

## Static verification

Passed inside the container:

```bash
node --experimental-strip-types --check server/config/databaseConfig.ts
node --experimental-strip-types --check server/health/databaseHealth.ts
node --experimental-strip-types --check server/_core/env.ts
node --experimental-strip-types --check server/db.ts
node --experimental-strip-types --check server/_core/index.ts
node --experimental-strip-types --check server/routers.ts
```

Full `pnpm.cmd run check` must be rerun locally after applying v40a.

## Required local retest

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```

Then open:

```text
http://localhost:3000/api/health/database-config
http://localhost:3000/api/health/readiness
http://localhost:3000/knowledge#/admin/dashboard
http://localhost:3000/knowledge#/admin/maintenance
http://localhost:3000/knowledge#/admin/security
http://localhost:3000/knowledge#/admin/reports
http://localhost:3000/chat
```

## Expected outcomes

### If no DB is configured

`/api/health/database-config` returns:

```json
{
  "configured": false,
  "reason": "database_not_configured"
}
```

### If a PostgreSQL/Supabase URL is supplied to the current MySQL runtime

It returns:

```json
{
  "configured": true,
  "runtimeCompatible": false,
  "reason": "database_dialect_mismatch_mysql_runtime_required"
}
```

### If a valid MySQL database URL is supplied

`/api/health/readiness` may become:

```json
{
  "server": true,
  "database": true,
  "llm": true,
  "ready": true
}
```

Only then can Mega Batch 29 be opened as a staging/production promotion assessment.
