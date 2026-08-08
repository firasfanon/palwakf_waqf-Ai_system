# Mega Batch 28A Changelog — 2026-06-18

- Accepted MB28 readiness evidence: LLM connected, database blocked.
- Added centralized DB configuration resolver.
- Added MySQL alias/component configuration support.
- Added safe database configuration diagnostics endpoint.
- Updated DB health gate to distinguish not configured, dialect mismatch, connection refused, timeout, and permission issues.
- Updated runtime DB initialization to use the centralized resolver.
- Updated Drizzle config to support aliases/components.
- Updated `.env.example` with database connection forms and runtime dialect warning.
- Updated PalWakf comprehensive guide.
