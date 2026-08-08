# Mega Batch 29A — Evidence Intake Template

**Staging URL:** `https://...`  
**Deployment ref:** `...`  
**Baseline ID:** `v65_mega_batch_29a_remote_staging_rbac_rls_uat_preapply_2026_06_20`  
**Operator:** `...`  
**Captured at:** `...`

## A. Remote health

| Evidence | Result | Attachment | Accepted |
|---|---|---|---:|
| database-config |  |  | ☐ |
| supabase |  |  | ☐ |
| readiness |  |  | ☐ |
| staging-evidence |  |  | ☐ |

## B. RBAC matrix

| Case | Actor | Expected | Actual | Attachment | Pass |
|---|---|---|---|---|---:|
| 29A-RBAC-P01 | admin | allowed |  |  | ☐ |
| 29A-RBAC-P02 | reviewer-only | review allowed / publish hidden |  |  | ☐ |
| 29A-RBAC-N01 | anonymous | admin denied |  |  | ☐ |
| 29A-RBAC-N02 | non-admin | admin denied |  |  | ☐ |
| 29A-RBAC-N03 | non-reviewer admin | knowledge operations denied |  |  | ☐ |
| 29A-RBAC-N04 | reviewer-only | publish denied |  |  | ☐ |
| 29A-RBAC-N05 | reviewer-only | binding mutation denied |  |  | ☐ |

## C. RLS and secret isolation

| Case | Expected | Actual | Attachment | Pass |
|---|---|---|---|---:|
| 29A-RLS-N01 direct write | denied; no inserted row |  |  | ☐ |
| 29A-RLS-N02 direct sensitive read | denied/scoped |  |  | ☐ |
| 29A-SEC-N01 service-role isolation | no secret in browser |  |  | ☐ |
| 29A-AUDIT-N01 denied auditability | 403 + audit/server evidence |  |  | ☐ |

## D. SQL results

- `00_MB29A...`: `...`
- `01_MB29A...`: `...`
- Official chat eligible: `...`
- Non-official chat eligible: `...`

## Decision

```text
[ ] STAGING_RUNTIME_AND_NEGATIVE_UAT_VERIFIED
[ ] REMEDIATION_REQUIRED
[ ] PRODUCTION_PROMOTION_ASSESSMENT_READY
[ ] PRODUCTION_NOT_APPROVED
```

> No production approval is inferred from a partial evidence set.
