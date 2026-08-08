# Mega Batch 29A — RBAC/RLS Negative UAT Matrix

Date: 2026-06-18  
Purpose: Required matrix before production promotion.  
Arabic brief: هذه المصفوفة لإثبات أن الصلاحيات وRLS تعمل ضد محاولات الوصول غير المصرح، ولا تكفي لقطات localhost لاعتماد الإنتاج.

---

## Role matrix

| Actor | Expected access | Admin dashboard | Tools admin | Users/settings | Chat | Expected result |
|---|---|---:|---:|---:|---:|---|
| `super_admin` | Full admin | PASS required | PASS required | PASS required | PASS required | Allowed |
| `admin` | Admin scoped | PASS required | PASS required | PASS/Scoped required | PASS required | Allowed according to permission scope |
| `manager/employee` | Limited internal | BLOCK/PARTIAL required | BLOCK/PARTIAL required | BLOCK required | PASS required | No privilege escalation |
| `viewer` | Read-limited | BLOCK/PARTIAL required | BLOCK required | BLOCK required | PASS/limited required | Read-only/limited |
| Anonymous | Public only | BLOCK required | BLOCK required | BLOCK required | Public/chat only if allowed | Admin denied |

---

## Negative UAT cases

| ID | Case | Actor | Steps | Expected result | Evidence required | Status |
|---|---|---|---|---|---|---:|
| 29A-RBAC-N01 | Anonymous admin route access | Anonymous | Open `/knowledge#/admin/dashboard` | Redirect/blocked/unauthorized | Screenshot + network status | Pending |
| 29A-RBAC-N02 | Anonymous tools admin access | Anonymous | Open `/knowledge#/admin/tools` | Blocked | Screenshot | Pending |
| 29A-RBAC-N03 | Non-admin users page access | Non-admin | Open `/knowledge#/admin/users` | Blocked | Screenshot + actor role | Pending |
| 29A-RBAC-N04 | Non-admin settings mutation | Non-admin | Attempt admin settings update | Denied | Network request + response | Pending |
| 29A-RBAC-N05 | Non-admin tool approval | Non-admin | Attempt approve generated knowledge/tool result | Denied | UI + network response | Pending |
| 29A-RLS-N01 | Direct browser write to `assistant.ai_tool_runs` | Browser client | Attempt write without server procedure | Denied by RLS/API policy | Network response | Pending |
| 29A-RLS-N02 | Direct browser read of sensitive assistant rows | Browser client | Attempt direct REST read beyond allowed scope | Denied/scoped | Network response | Pending |
| 29A-SEC-N01 | Service-role key exposure | Browser | Search network/localStorage/bundle for service-role token | Not found | Screenshot / grep output with redaction | Pending |
| 29A-SEC-N02 | Supabase anon key scope | Browser | Confirm anon key only where intended | No service-role exposure | Screenshot / logs | Pending |
| 29A-AUDIT-N01 | Denied action auditability | Non-admin | Trigger denied action | Audit/console/server evidence exists without secrets | Server log excerpt | Pending |

---

## Acceptance rule

Production promotion requires:

- All required positive role tests passed.
- All negative tests blocked as expected.
- No service-role key exposed client-side.
- No unsafe browser direct mutation to sovereign assistant tables.
- Evidence is from remote staging, not localhost only.

Decision until filled:

`RBAC_RLS_NEGATIVE_UAT_PENDING_PRODUCTION_BLOCKED`
