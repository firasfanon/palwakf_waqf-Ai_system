# Error Record — Mega Batch 29A v65

## Record 1 — Broad application-level admin admission

- **Cause:** `hasAdminToolsAccess` accepted `manager`, `employee`, and `editor`, while `adminProcedure` used the same broad check. A non-admin internal role could therefore enter `/admin` and invoke server admin procedures.
- **Affected files:** `server/_core/access.ts`, `server/_core/trpc.ts` (by dependency), `client/src/lib/access.ts`, `client/src/components/admin/AdminLayoutV2.tsx`.
- **Why prior controls were insufficient:** Supabase RLS protected direct table operations, but application-level tRPC could still act with the server service role after passing broad admin admission.
- **Resolution in v65:** administrative admission is now explicit-only; manager/employee/editor are denied `/admin` and `adminProcedure` paths until a future scoped internal console exists.
- **Verification required:** remote staging anonymous/non-admin route and Network negative evidence.

## Record 2 — Knowledge operations server router lacked scope guard on reads

- **Cause:** `knowledgeTrust` used `adminProcedure`, while the UI assumed review-only access. A generic admin could obtain review queue/mapping/binding reads without `assistant.review`.
- **Affected files:** `server/routers.ts`, `server/knowledgeOperations.ts`, `client/src/pages/admin/KnowledgeReviewOperations.tsx`.
- **Resolution in v65:** server-side access snapshot and guard require `assistant.review` for all operational reads/actions; `assistant.publish` is required before release or binding mutation; denied operations receive best-effort audit event.
- **Verification required:** reviewer positive test, non-reviewer admin negative test, reviewer-only publish negative test.

## Last stable accepted baseline

`v64_5_smart_tools_3_review_tasks_acl_contract_correction_preapply_2026_06_20` with live Staging SQL governance evidence accepted in the current session.

## Current state

```text
CODE_HARDENING_PREPARED_NOT_REMOTE_DEPLOYED
REMOTE_STAGING_EVIDENCE_PENDING
PRODUCTION_NOT_APPROVED
```
