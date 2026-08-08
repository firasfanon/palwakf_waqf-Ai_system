# Local Bootstrap Hardening

This baseline disables Manus-era operational assumptions for local development by default.

## Defaults
- Local auth is the default path unless `EXTERNAL_OAUTH_ENABLED=1`.
- Publish scheduler is disabled unless `PUBLISH_SCHEDULER_ENABLED=1`.
- Owner notifications are disabled unless `OWNER_NOTIFICATIONS_ENABLED=1`.

## Recommended local `.env`
```env
LOCAL_AUTH_ENABLED=1
EXTERNAL_OAUTH_ENABLED=0
PUBLISH_SCHEDULER_ENABLED=0
OWNER_NOTIFICATIONS_ENABLED=0
```

## Notes
- This hardening does not remove Drizzle/MySQL from the project.
- It prevents local startup from depending on external OAuth and noisy scheduler/notification flows.
- Supabase/PalWakf platform bridge remains optional and read-only until a later cutover phase.
