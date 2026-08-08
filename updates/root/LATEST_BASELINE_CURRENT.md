# Latest Baseline Current — PalWakf Assistant

**Pointer:** `PALWAKF_ASSISTANT_SOURCE_BASELINE_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_20260706`

```text
BASELINE_CLOSURE_ACCEPTED_LOCAL_ONLY
AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_ACCEPTED
STATIC_VERIFY=PASS
PATCH_APPLY=PASS
BROWSER_UAT=PASS
C3_C4_PRIORITY_FLOW=PASS
C4_ZERO_CANDIDATE_FAIL_CLOSED=PASS
RIGHTS_LAYER_SQL_NOT_APPLIED
STAGING_NOT_APPROVED
PRODUCTION_NOT_APPROVED
```

## Scope

- Operational UX refinement of `/knowledge#/admin/source-provenance-rights`.
- No SQL, Schema/RLS/RPC, rights activation, source mutation, Chat release, or production promotion.
- Baseline archive is intentionally secret-free and excludes `.env`, `node_modules`, `dist`, and development caches.

## Exact resumption point

Do not reopen the AR1 UX work unless a regression is observed. The next functional gate is C4 candidate eligibility: obtain a current deterministic direct material reference, exact normalized title match, exact canonical URL match, or exact title-and-URL match. Fuzzy, semantic, vector, author-only, and publisher-only matching remain forbidden.
