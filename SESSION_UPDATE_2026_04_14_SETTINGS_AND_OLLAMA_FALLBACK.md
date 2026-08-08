# Session Update — 2026-04-14

## What was closed in this patch

### 1) Admin System Settings Save Patch
- `client/src/pages/AdminSystemSettings.tsx`
  - synced form state from saved values on success
  - added `baselineFormData` and `isDirty`
  - enabled save UX only when there are actual changes
  - updated local Ollama defaults to:
    - `llmModel = qwen2.5:3b`
    - `llmTimeoutSeconds = 180`
  - clarified in UI that runtime can switch operationally between `qwen2.5:3b` and `qwen2.5:7b`

### 2) Ollama Available/Fallback Patch
- `server/_core/llm.ts`
  - added local Ollama model discovery via `/api/tags`
  - added runtime fallback order across:
    - configured model
    - `qwen2.5:3b`
    - `qwen2.5:7b`
  - added retry on `model not found` and timeout cases for Ollama
  - logs now show:
    - configured model
    - effective model
    - fallback attempt index
    - whether fallback happened

### 3) Default Settings Alignment
- `server/localRuntimeStore.ts`
  - aligned local runtime defaults to `qwen2.5:3b` and `180` seconds
- `server/_core/systemSettingsRouter.ts`
  - aligned schema default timeout to `180`
- `server/_core/env.ts`
  - aligned env fallback model to `qwen2.5:3b`

## Intent
- keep local runtime as the primary writable settings source for now
- keep env as fallback only
- keep both `qwen2.5:3b` and `qwen2.5:7b` supported operationally
- avoid broad refactors
