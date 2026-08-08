# Mega Batch 28 Changelog — 2026-06-17

## Added
- Database health probe module.
- LLM provider health probe module.
- Unified readiness builder.
- Raw `/api/health/readiness` endpoint.
- TRPC health router.

## Changed
- Admin dashboard now shows Database Health and Provider Health.
- Maintenance page now exposes DB/LLM state.
- Security page now includes readiness gates.
- Reports page now shows production blocked/ready status.
- Chat page now shows LLM provider status before sending.

## Not changed
- No production approval.
- No destructive DB operation.
- No RLS/RBAC bypass.
- No secrets are rendered in UI.
