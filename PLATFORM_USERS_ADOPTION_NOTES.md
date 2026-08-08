# Platform Users Adoption Notes

## Local `users` table vs Platform `admin_users`

### Local project table: `users`
Legacy assistant table used historically for local auth and foreign keys. Fields include:
- `id` (auto increment int)
- `openId`
- `name`
- `email`
- `loginMethod`
- `role`
- `createdAt`
- `updatedAt`
- `lastSignedIn`
- `isActive`

### Platform source-of-truth: `admin_users`
Sovereign platform identity / admin scope source. Consumed through the platform bridge. Expected fields include:
- `id`
- `auth_user_id`
- `email`
- `name` / `display_name` / `full_name`
- `role` / `platform_role`
- `unit_id`
- `is_active`

## Adoption decision
- Identity source of truth moved to platform `admin_users`.
- Local auth no longer creates users in local `users` for platform mode.
- Session is built from platform identity and returned to internal pages with:
  - `platformUserId`
  - `authUserId`
  - `platformRole`
  - `unitId`
  - `source=platform_admin_users`
- Local `users` remains a legacy projection only for transitional compatibility with older local database foreign keys.
