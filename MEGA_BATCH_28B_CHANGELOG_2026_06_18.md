# Mega Batch 28B Changelog

- Added Supabase/PostgreSQL health probe under `server/health/supabaseHealth.ts`.
- Corrected database configuration resolution to recognize PalWakf Supabase keys as a valid sovereign database target.
- Preserved MySQL-only `getEffectiveDatabaseUrl()` for legacy Drizzle runtime safety.
- Routed database readiness through Supabase health when `provider=supabase_postgresql`.
- Added `/api/health/supabase` safe diagnostic endpoint.
- Added `health.supabase` TRPC endpoint.
- Updated database-config accepted keys to include Supabase sources.
- No DDL/DML/secrets/destructive changes.
