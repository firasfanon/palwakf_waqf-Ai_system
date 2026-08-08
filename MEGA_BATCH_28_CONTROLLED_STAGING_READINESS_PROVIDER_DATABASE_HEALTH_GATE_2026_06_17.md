# Mega Batch 28 — Controlled Staging Readiness + Provider/Database Health Gate

## Decision
`MEGA_BATCH_28_CONTROLLED_STAGING_READINESS_GATE_APPLIED_STATIC_SERVER_CHECKS_PASSED_LOCAL_PNPM_BROWSER_EVIDENCE_PENDING`

## Baseline
Started from:
`waqf_ai_model_hybrid_llm_admin_v39_mb27g_final_runtime_retest_admin_chat_readiness_gate_2026_06_17.zip`

## Scope
This batch converts the assistant from `Local Bootstrap Candidate` toward `Controlled Staging Candidate` by adding explicit health gates for:

- Database availability.
- LLM provider availability.
- Unified readiness API.
- Admin health cards.
- Chat provider readiness visibility.

This batch does not approve production.

## Applied changes

### Backend
Added:

- `server/health/databaseHealth.ts`
- `server/health/readiness.ts`
- `server/llm/providerHealth.ts`

Updated:

- `server/routers.ts`
- `server/_core/index.ts`

New raw endpoint:

```text
/api/health/readiness
```

New TRPC endpoints:

```text
health.readiness
health.database
health.llm
```

### Frontend
Updated:

- `client/src/pages/AdminDashboard.tsx`
- `client/src/pages/admin/Maintenance.tsx`
- `client/src/pages/admin/Security.tsx`
- `client/src/pages/admin/Reports.tsx`
- `client/src/pages/Chat.tsx`

The UI now exposes:

- Database Health
- Provider Health
- Production-ready / Production-blocked status
- Chat LLM provider connectivity status

## Production gate rule
Production remains blocked if either of the following is false:

```text
database.available
llm.available
```

The readiness endpoint returns HTTP 503 when blocked.

## Static verification completed in container

```bash
node --experimental-strip-types --check server/health/databaseHealth.ts
node --experimental-strip-types --check server/llm/providerHealth.ts
node --experimental-strip-types --check server/health/readiness.ts
node --experimental-strip-types --check server/_core/index.ts
node --experimental-strip-types --check server/routers.ts
```

## Local verification required

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```

Browser/API checks:

```text
/admin
/admin/maintenance
/admin/security
/admin/reports
/chat
/api/health/readiness
```

## Final status
Controlled staging gate is implemented. Runtime evidence is pending from the user's local environment.
