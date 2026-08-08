# Local Sovereignty Decoupling Notes

This baseline removes the hard runtime dependency on Manus for local development.

## Applied in this baseline
- Removed `vite-plugin-manus-runtime` from `package.json`
- Removed Manus runtime plugin and Manus-only allowed hosts from `vite.config.ts`
- Added local auth mode in `server/_core/oauth.ts` via `/api/auth/dev-login`
- Added local auth bootstrap envs in `.env.example`
- Updated `client/src/const.ts` to use local auth route when external OAuth is not configured
- Renamed localStorage key from `manus-runtime-user-info` to `palwakf-user-info`
- Removed fallback to `https://forge.manus.im` in `server/_core/llm.ts`
- Genericized provider env usage in:
  - `server/_core/llm.ts`
  - `server/_core/dataApi.ts`
  - `server/_core/imageGeneration.ts`
  - `server/_core/voiceTranscription.ts`
  - `server/_core/map.ts`
  - `server/storage.ts`
  - `server/_core/notification.ts`
- Updated frontend map proxy env usage in `client/src/components/Map.tsx`

## Still worth cleaning later
- Documentation and reports that mention Manus historically
- Test fixtures with `loginMethod: "manus"`
- Type file naming like `types/manusTypes.ts`

## New local env path
Use `.env.example` as the local sovereign template.
