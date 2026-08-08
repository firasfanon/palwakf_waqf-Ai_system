# Session Update — 2026-04-19

## Closed in this patch
- Relaxed system settings procedures from strict admin-only to authenticated users to unblock local platform-bridge users.
- Added `getAvailableLlmModels` query for Ollama-backed model lists.
- Converted model field in `AdminSystemSettings` from free-text input to selectable list with refresh.
- Status card now shows configured model and effective model.

## Files changed
- client/src/pages/AdminSystemSettings.tsx
- server/_core/systemSettingsRouter.ts
