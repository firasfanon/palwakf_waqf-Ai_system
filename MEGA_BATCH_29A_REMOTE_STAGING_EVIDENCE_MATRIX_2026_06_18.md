# Mega Batch 29A — Remote Staging Evidence Matrix

Date: 2026-06-18  
Baseline: `v41_mb29_staging_verification_production_promotion_assessment`  
Target next baseline: `v42_mb29a_remote_staging_deployment_evidence_rbac_rls_negative_uat`

## Arabic brief

هذه مصفوفة أدلة للـ staging البعيد. الهدف إثبات أن ما نجح محليًا في MB28B/MB29 يعمل أيضًا على رابط staging حقيقي وبأدوار مستخدمين فعلية.

---

## Required staging endpoints

| Endpoint | Expected result | Evidence | Status |
|---|---|---|---:|
| `/api/health/database-config` | `configured=true`, `provider=supabase_postgresql`, `runtimeCompatible=true` | JSON screenshot | Pending |
| `/api/health/supabase` | `available=true`, `mode=connected`, probe assistant schema | JSON screenshot | Pending |
| `/api/health/readiness` | `server=true`, `database=true`, `llm=true`, `ready=true` | JSON screenshot | Pending |

---

## Required browser routes

| Route | Expected result | Evidence | Status |
|---|---|---|---:|
| `/knowledge#/admin/dashboard` | Loads for admin | screenshot | Pending |
| `/knowledge#/admin/maintenance` | Shows Supabase/LLM health | screenshot | Pending |
| `/knowledge#/admin/security` | Shows gates without secrets | screenshot | Pending |
| `/knowledge#/admin/reports` | Shows read-only report summary | screenshot | Pending |
| `/knowledge#/admin/tools` | Loads tools admin | screenshot | Pending |
| `/knowledge#/admin/tools/runs` | Loads runs quality surface | screenshot | Pending |
| `/knowledge#/admin/knowledge` | Loads without TDZ/runtime crash | screenshot | Pending |
| `/chat` | Chat home loads | screenshot | Pending |
| `/knowledge#/chat` | Chat route loads and responds | screenshot + server log | Pending |

---

## Deployment metadata required

| Item | Required value | Status |
|---|---|---:|
| Staging domain | URL | Pending |
| Deployment hash / commit | hash | Pending |
| Baseline zip hash | SHA256 | Pending |
| Environment name | staging | Pending |
| Supabase project | redacted project ref only | Pending |
| LLM provider | staging provider/model | Pending |
| Rollback target | previous baseline/hash | Pending |

---

## Current 29A decision

`REMOTE_STAGING_EVIDENCE_MATRIX_PREPARED_PENDING_OPERATOR_EVIDENCE`
