
---

## MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1 — 2026-07-06

### Status

```text
ACCEPTED_LOCAL_ONLY
STATIC_VERIFY=PASS
PATCH_APPLY=PASS
BROWSER_UAT=PASS
STAGING_NOT_APPROVED
PRODUCTION_NOT_APPROVED
```

### Purpose

This batch refines the operational UX of the assistant page:

`/knowledge#/admin/source-provenance-rights`

The operator now sees the real workflow order before configuration fields:

`C3 → C4 → candidate eligibility → internal-use/rights acknowledgment → AR1 session`.

### Accepted runtime evidence

- Initial hold state correctly directed the operator to run C3 then C4.
- Completed C3/C4 state with `C4 linkable materials = 0` correctly moved the current action to candidate eligibility.
- The AR1 session form remained unavailable and the page explicitly explained the deterministic eligibility rules.
- The route rendered locally after restoration of private local runtime configuration. Private `.env` values are not part of the baseline.

### Non-negotiable controls preserved

- No fuzzy, semantic, vector, author-only, publisher-only, or partial URL matching.
- No automatic source/rights inference.
- No source-link, rights, document, chunk, embedding, vector, Chat, release, or production write.
- Maximum session limit remains five documents and thirty minutes when a session becomes eligible.
- `source_provenance_supporting_read_failed:PGRST205` remains a known expected state when Mega Batch C support-layer SQL is intentionally not applied; it is not repaired or bypassed by this batch.

### Baseline hygiene note

The clean source baseline remains secret-free. `.env`, `node_modules`, `dist`, and development caches are excluded. The original clean candidate exposed a `package.json` / `pnpm-lock.yaml` mismatch under `--frozen-lockfile`; local reconciliation used non-frozen installation. Strict frozen-lock revalidation should be run in a future dependency-hygiene gate if the updated lockfile is retained.

### Exact next functional step

Do not add AR1 capabilities. Perform only C4 candidate-eligibility triage when a real current deterministic candidate exists. Otherwise the current zero-candidate state is accepted and requires no UI repair.
