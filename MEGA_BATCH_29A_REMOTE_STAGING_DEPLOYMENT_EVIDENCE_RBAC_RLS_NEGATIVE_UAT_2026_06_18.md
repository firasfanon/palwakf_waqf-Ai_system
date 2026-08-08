# Mega Batch 29A — Remote Staging Deployment Evidence + RBAC/RLS Negative UAT

Date: 2026-06-18  
Baseline in: `waqf_ai_model_hybrid_llm_admin_v41_mb29_staging_verification_production_promotion_assessment_2026_06_18.zip`  
Batch type: Governance / remote staging evidence gate / RBAC-RLS UAT gate  
Arabic brief: هذه الدفعة ليست تطوير ميزة جديدة، بل بوابة تحقق سيادية تقرر هل توجد أدلة كافية من بيئة staging فعلية لاعتماد الترقية الإنتاجية لاحقًا. نطاقها فحص الرابط البعيد، readiness من staging، أدوار الوصول، RLS، ومنع تسريب أسرار Supabase.

---

## Executive decision

`MEGA_BATCH_29A_REMOTE_STAGING_DEPLOYMENT_EVIDENCE_GATE_PREPARED_REMOTE_STAGING_EVIDENCE_NOT_SUPPLIED_PRODUCTION_NOT_APPROVED`

Mega Batch 29A is prepared as the official remote staging and RBAC/RLS gate. It does **not** approve production because no remote staging URL or authenticated RBAC/RLS evidence was supplied in this session.

The latest accepted baseline remains a strong local/staging-candidate baseline because MB28B and MB29 accepted:

- Supabase/PostgreSQL database health: `available=true`.
- LLM provider health: `available=true`.
- Aggregate readiness: `ready=true`.
- Production blockers in local readiness: `[]`.

However, local readiness is not the same as deployed staging readiness.

---

## Accepted carry-forward evidence

From MB28B and MB29:

| Gate | Evidence | Accepted result |
|---|---|---:|
| Database config | `/api/health/database-config` | `configured=true`, `provider=supabase_postgresql`, `runtimeCompatible=true` |
| Supabase health | `/api/health/supabase` | `available=true`, probe `assistant.ai_tool_runs` |
| Aggregate readiness | `/api/health/readiness` | `server=true`, `database=true`, `llm=true`, `ready=true` |
| LLM | Ollama / `qwen2.5:3b` | Connected in local environment |
| TypeScript | `pnpm.cmd run check` | Passed in prior operator evidence |

---

## Remote staging evidence status

| Required evidence | Current status | Decision |
|---|---:|---|
| Remote staging URL | Not supplied | Required |
| `/api/health/readiness` from remote staging | Not supplied | Required |
| `/api/health/supabase` from remote staging | Not supplied | Required |
| `/api/health/database-config` from remote staging | Not supplied | Required |
| Admin dashboard smoke from staging | Not supplied | Required |
| Chat smoke from staging | Not supplied | Required |
| Browser console screenshot from staging | Not supplied | Required |
| Server logs from staging | Not supplied | Required |

Decision: `REMOTE_STAGING_EVIDENCE_PENDING`.

---

## RBAC/RLS UAT gate status

| Test class | Required evidence | Current status |
|---|---|---:|
| Positive admin access | `super_admin/admin` can open admin dashboard/tools/users/settings | Pending |
| Positive normal user access | normal user can use allowed chat/public surfaces only | Pending |
| Negative anonymous access | unauthenticated user blocked from admin routes | Pending |
| Negative non-admin access | non-admin blocked from admin tools/users/settings | Pending |
| RLS read/write separation | browser cannot directly write sovereign assistant tables | Pending |
| Service-role isolation | no service-role key in browser bundle, network payloads, localStorage/sessionStorage | Pending |
| Audit trace | rejected/allowed actions are logged or observable | Pending |

Decision: `RBAC_RLS_NEGATIVE_UAT_PENDING`.

---

## Production promotion decision

Production remains blocked.

`PRODUCTION_NOT_APPROVED_REMOTE_STAGING_RBAC_RLS_NEGATIVE_UAT_REQUIRED`

Production cannot be approved until all of the following are provided and accepted:

1. Remote staging deployment URL.
2. Remote staging health endpoint results:
   - `/api/health/database-config`
   - `/api/health/supabase`
   - `/api/health/readiness`
3. Authenticated browser screenshots for admin and non-admin roles.
4. RBAC positive and negative matrix results.
5. RLS negative proof that direct browser access cannot mutate sovereign `assistant.*` tables.
6. Proof that `PLATFORM_SUPABASE_SERVICE_ROLE_KEY` is server-only and absent from browser bundles/network payloads.
7. Rollback plan and deployment hash.

---

## Operator evidence required to close 29A

### A. Remote staging readiness

Provide screenshots or copied JSON from the staging domain:

```text
https://<staging-domain>/api/health/database-config
https://<staging-domain>/api/health/supabase
https://<staging-domain>/api/health/readiness
```

Expected readiness:

```json
{
  "server": true,
  "database": true,
  "llm": true,
  "ready": true,
  "productionBlockers": []
}
```

### B. Admin route smoke

Provide staging browser screenshots for:

```text
/knowledge#/admin/dashboard
/knowledge#/admin/maintenance
/knowledge#/admin/security
/knowledge#/admin/reports
/knowledge#/admin/tools
/knowledge#/admin/tools/runs
/knowledge#/admin/knowledge
```

### C. Chat smoke

Provide staging browser screenshots for:

```text
/chat
/knowledge#/chat
```

with at least one successful message and server log that does not expose secrets.

### D. RBAC/RLS negative matrix

Provide the filled matrix from:

`MEGA_BATCH_29A_RBAC_RLS_NEGATIVE_UAT_MATRIX_2026_06_18.md`

---

## Final 29A state

This batch creates the official 29A gate and handoff, but does not close production promotion.

Current state:

`CONTROLLED_STAGING_CANDIDATE_LOCAL_READY_REMOTE_STAGING_EVIDENCE_REQUIRED`

Next valid actions:

1. Supply remote staging evidence and rerun 29A evidence intake.
2. If 29A evidence passes, proceed to `Mega Batch 30 — Controlled Production Promotion Pack`.
3. If 29A evidence fails, open a targeted remediation batch for the failed gate only.
