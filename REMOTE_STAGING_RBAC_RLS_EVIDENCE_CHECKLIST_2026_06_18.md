# Remote Staging + RBAC/RLS Evidence Checklist

**Purpose:** Close Mega Batch 29A Evidence Intake.

## Required staging URLs

```text
https://<staging-domain>/api/health/database-config
https://<staging-domain>/api/health/supabase
https://<staging-domain>/api/health/readiness
```

## Required readiness result

```json
{
  "server": true,
  "database": true,
  "llm": true,
  "ready": true,
  "productionBlockers": []
}
```

## Required browser routes

```text
/knowledge#/admin/dashboard
/knowledge#/admin/maintenance
/knowledge#/admin/security
/knowledge#/admin/reports
/knowledge#/admin/tools
/knowledge#/admin/tools/runs
/knowledge#/admin/knowledge
/knowledge#/chat
/chat
```

## RBAC negative tests

| Test | Expected |
|---|---|
| Anonymous opens `/knowledge#/admin/dashboard` | blocked/redirected |
| Viewer opens `/knowledge#/admin/users` | denied |
| Employee opens `/knowledge#/admin/tools` | denied or scoped |
| Non-admin approval attempt | denied |
| Admin/super_admin permitted flow | allowed |

## RLS negative tests

| Test | Expected |
|---|---|
| anonymous direct read sensitive assistant tables | denied |
| browser direct write to `assistant.ai_tool_runs` | denied |
| non-admin modifies approval/review | denied |
| scoped user reads out-of-scope content | denied/scoped |

## Service-role leakage test

Search in browser/network/storage/bundles for:

```text
PLATFORM_SUPABASE_SERVICE_ROLE_KEY
PWF_SUPABASE_SERVICE_ROLE_KEY
SUPABASE_SERVICE_ROLE_KEY
sb_secret_
```

Expected: not found.
