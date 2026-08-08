# Mega Batch 28B — Supabase/PostgreSQL Runtime Adapter + Readiness Gate Correction

## Decision

`MEGA_BATCH_28B_SUPABASE_POSTGRES_READINESS_GATE_CORRECTION_APPLIED_STATIC_CHECKS_PASSED_LOCAL_PNPM_BROWSER_RETEST_REQUIRED`

## Baseline

Started from:

`waqf_ai_model_hybrid_llm_admin_v40a_mb28a_database_connectivity_remediation_2026_06_18.zip`

## Evidence intake

The operator confirmed that `.env` contains the PalWakf/Supabase bridge configuration:

- `PLATFORM_BRIDGE_ENABLED=1`
- `PLATFORM_SUPABASE_URL` is present
- `PLATFORM_SUPABASE_SERVICE_ROLE_KEY` is present
- `VITE_SUPABASE_URL` is present
- `VITE_SUPABASE_ANON_KEY` is present

This proves that the prior `database=false` result was caused by the MB28/28A readiness gate checking only the legacy MySQL/Drizzle runtime path, not by absence of the sovereign Supabase configuration.

## Scope

This batch corrects readiness semantics:

- Supabase/PostgreSQL becomes a valid sovereign database health target when platform Supabase environment keys exist.
- MySQL remains supported as legacy/local fallback only.
- `getEffectiveDatabaseUrl()` still returns only MySQL URLs for the legacy Drizzle runtime, avoiding accidental MySQL-driver attempts against Supabase/PostgreSQL.
- `/api/health/readiness` can now become ready when Supabase and LLM are both healthy.
- No DDL, no DML, no secret exposure, no production approval.

## Code changes

### Added

- `server/health/supabaseHealth.ts`
  - Safe Supabase/PostgreSQL health probe.
  - Detects Supabase URL/key sources without returning secret values.
  - Probes read-only surfaces using HEAD/count style reads.
  - Candidate probes:
    - `assistant.ai_tool_runs`
    - `assistant.knowledge_documents`
    - `assistant.conversations`
    - `public.land_references`

### Updated

- `server/config/databaseConfig.ts`
  - Added Supabase-aware database configuration resolution.
  - Accepts:
    - `PLATFORM_SUPABASE_URL + PLATFORM_SUPABASE_SERVICE_ROLE_KEY`
    - `PLATFORM_SUPABASE_URL + PLATFORM_SUPABASE_ANON_KEY`
    - `PWF_SUPABASE_URL + PWF_SUPABASE_SERVICE_ROLE_KEY`
    - `SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY`
    - `VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY`
  - Correctly identifies Supabase as `provider=supabase_postgresql`, `dialect=postgresql`, `runtimeCompatible=true` for readiness.
  - Keeps `getEffectiveDatabaseUrl()` restricted to MySQL only.

- `server/health/databaseHealth.ts`
  - Routes `supabase_postgresql` health checks through `checkSupabaseHealth()`.
  - Continues to use Drizzle/MySQL only for MySQL URLs.

- `server/_core/index.ts`
  - Added raw endpoint:
    - `/api/health/supabase`
  - Updated `/api/health/database-config` accepted keys to include Supabase.

- `server/routers.ts`
  - Added TRPC health endpoint:
    - `health.supabase`
  - Updated database-config accepted keys to include Supabase.

## Static checks

Passed in container:

```bash
node --experimental-strip-types --check server/health/supabaseHealth.ts
node --experimental-strip-types --check server/config/databaseConfig.ts
node --experimental-strip-types --check server/health/databaseHealth.ts
node --experimental-strip-types --check server/health/readiness.ts
node --experimental-strip-types --check server/_core/index.ts
node --experimental-strip-types --check server/routers.ts
```

Container `npm run check` was attempted but remains blocked by missing `node` and `vite/client` type definitions in the container runtime, same as prior batches. Local PowerShell check is required.

## Required local retest

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```

Open:

```text
http://localhost:3000/api/health/database-config
http://localhost:3000/api/health/supabase
http://localhost:3000/api/health/readiness
```

Expected after valid Supabase connectivity:

```json
{
  "server": true,
  "database": true,
  "llm": true,
  "ready": true
}
```

## Production decision

Production remains unapproved until browser evidence confirms:

- `/api/health/supabase` available.
- `/api/health/readiness` ready=true.
- Admin health cards show Supabase/PostgreSQL connected.
- Chat route remains operational with LLM connected.
- RBAC/RLS staging evidence is supplied.
