# Latest Baseline Pointer — Mega Batch 27B

**Current stable baseline candidate:**

`waqf_ai_model_hybrid_llm_admin_v34_mb27b_wider_admin_backend_activation_2026_06_16.zip`

**Previous baseline:**

`waqf_ai_model_hybrid_llm_admin_v33_mb27a_smart_tools_admin_backend_activation_2026_06_15.zip`

**Decision:**

`MEGA_BATCH_27B_WIDER_ADMIN_BACKEND_ACTIVATION_APPLIED_STATIC_SYNTAX_CHECKS_PASSED_BROWSER_EVIDENCE_PENDING`

**Scope:**

Wider admin backend activation for `admin.*`, `analytics.*`, and operation pages Cache/Backup/Integrations/Webhooks.

**Required local verification:**

```powershell
pnpm.cmd install
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```
