# Hybrid LLM Provider Handoff

## What was implemented
- Added a top-level `systemSettings` tRPC router with:
  - `get`
  - `update`
  - `testLlmConnection`
- Added hybrid LLM fields managed through admin settings:
  - `llmEnabled`
  - `llmProvider`
  - `llmBaseUrl`
  - `llmApiKey`
  - `llmModel`
  - `llmTimeoutSeconds`
  - last test status/message/time
- Implemented runtime/local storage for system settings in:
  - `.palwakf/runtime/local_runtime_store.json`
- Updated `invokeLLM()` to read provider settings dynamically from admin settings first, then env fallback.
- Updated Admin System Settings page to expose hybrid provider controls and a connection test button.

## Current provider resolution order
1. Admin system settings (runtime local store for current phase)
2. Environment variables fallback
3. Safe errors instead of silent failures

## Current default hybrid mode
- Provider: `ollama`
- Base URL: `http://127.0.0.1:11434`
- Model: `qwen2.5:3b`
- Timeout: `90s`

## Files touched
- `server/localRuntimeStore.ts`
- `server/runtimeRepository.ts`
- `server/_core/systemSettingsRouter.ts`
- `server/_core/llm.ts`
- `server/routers.ts`
- `client/src/pages/AdminSystemSettings.tsx`
- `.env.example`

## Expected next test
1. Open `/admin/system-settings`
2. Save Ollama settings
3. Run provider connection test
4. Retry `/chat`
5. Inspect PowerShell logs after `[invokeLLM] request`

## Important note
This phase intentionally avoids changing sovereign DB tables for system settings. Hybrid LLM settings are currently persisted in local runtime storage until the DB-backed settings phase is explicitly activated.
