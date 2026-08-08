# Session Handoff — Mega Batch 29A v65

## 1) Authoritative current state

The Staging database governance sequence for Smart Tools 3 has been applied and evidence accepted in this session:

```text
STAGING_SQL_APPLY_AND_GOVERNANCE_VERIFIED
HUMAN_REVIEW_OPERATIONS_V1_VERIFIED
KB08B_MAPPING_RESOLUTION_VERIFIED
KB09_PAGE_BINDING_VERIFIED
NO_AUTOMATIC_MAPPING_OR_CHAT_RELEASE_CONFIRMED
PRODUCTION_NOT_APPROVED
```

Known Staging facts:

- Reviewer assignment exists for `96f6cdc2-67f9-4352-b9f8-775ef509fed8` with `assistant.review/review` only.
- KB58 duplicate classification tasks: 6 cancelled, linked to 6 active KB08 tasks.
- `assistant.knowledge_review_tasks` has RLS enabled; direct CRUD is revoked from `anon` and `authenticated`.
- Human Review RPCs and KB08B RPCs are service-role only.
- `needs_mapping=296` (276 `legacy_json_content`, 20 `knowledge_documents`), zero mapping decisions.
- KB09: files/knowledge_base/search active server-RPC-only; faq/templates/settings prepared with writes disabled.
- Official released chat eligible = 0; non-official released chat eligible = 0.

## 2) v65 delivered code hardening

1. `/api/health/staging-evidence` for safe health/deployment snapshot.
2. `/admin/staging-evidence` evidence UI.
3. Explicit-only admin access policy for `/admin` and `adminProcedure`.
4. Server-side scoped guard for all `knowledgeTrust` reads/actions.
5. `assistant.review` required for review/KB08B/KB09 reads/actions.
6. `assistant.publish` required before official release or KB09 binding mutation.
7. Denied scope calls are best-effort auditable through `assistant.knowledge_access_events`.

## 3) Mandatory operator sequence

1. In an environment with dependencies, run `pnpm.cmd run check` then `pnpm.cmd run build`.
2. Configure Staging server labels `PALWAKF_DEPLOYMENT_ENV=staging`, deployment ref, and baseline ID.
3. Deploy only to remote Staging.
4. Run `scripts/mb29a_capture_remote_staging_evidence.ps1`.
5. Capture `/admin/staging-evidence` with an explicit admin.
6. Run SQL `00_MB29A...SERVER_CONTRACT...` read-only.
7. Perform full Browser RBAC/RLS negative UAT using the Arabic runbook.
8. Run SQL `01_MB29A...POST_BROWSER_UAT...` read-only.
9. Fill Evidence Intake template and supply it with redacted screenshots/log excerpts.

## 4) Acceptance gate

Only then may a result be considered for:

```text
STAGING_RUNTIME_AND_NEGATIVE_UAT_VERIFIED
PRODUCTION_PROMOTION_ASSESSMENT_READY
```

Production remains blocked until a separate explicit decision after evidence intake. Mega Batch 30 must not be started before that decision.

## 5) Error record

Read `ERROR_RECORD_MEGA_BATCH_29A_V65_2026_06_20.md`. It documents the two actual vulnerabilities corrected in code: broad app-admin access and unscoped knowledgeTrust reads.
