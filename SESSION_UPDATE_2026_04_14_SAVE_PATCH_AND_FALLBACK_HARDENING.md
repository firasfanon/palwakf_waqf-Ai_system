# Session Update — Save Patch and Ollama Fallback Hardening

## What changed
- Hardened Admin System Settings save UX with a global save/reset action bar and persisted save timestamp.
- Sanitized local runtime system settings on read/write so saved values remain valid and stable.
- Improved LLM settings test route to detect available Ollama models and report the effective model that will be used.
- Hardened Ollama fallback so only actually available local models are used, and the runtime throws a clear error if neither configured nor fallback models are installed.

## Files updated
- client/src/pages/AdminSystemSettings.tsx
- server/localRuntimeStore.ts
- server/_core/systemSettingsRouter.ts
- server/_core/llm.ts
