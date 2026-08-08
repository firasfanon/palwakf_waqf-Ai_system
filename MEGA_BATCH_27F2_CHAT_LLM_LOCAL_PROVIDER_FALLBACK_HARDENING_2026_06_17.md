# Mega Batch 27F-2 — Chat LLM Local Provider Fallback Hardening

**Date:** 2026-06-17  
**Baseline in:** `waqf_ai_model_hybrid_llm_admin_v38a_mb27f1_knowledge_runtime_tdz_hotfix_2026_06_17.zip`  
**Baseline out:** `waqf_ai_model_hybrid_llm_admin_v38b_mb27f2_chat_llm_local_provider_fallback_hardening_2026_06_17.zip`

## Runtime evidence received

The user supplied a local browser/runtime trace for `/knowledge#/chat` showing:

- Server started successfully on `http://localhost:3000/`.
- TypeScript check passed before runtime.
- Chat request started:
  - `conversationId: 14`
  - local LLM provider configured at `http://127.0.0.1:11434/v1/chat/completions`
  - model `qwen2.5:3b`
- Request failed with:
  - `TypeError: fetch failed`
  - `connect ECONNREFUSED 127.0.0.1:11434`
- UI displayed `تعذر إكمال الطلب / fetch failed`.

## Diagnosis

This is not an admin backend regression and not a TypeScript failure. It is a runtime local-provider availability problem:

- The assistant is configured to call a local Ollama-compatible endpoint.
- The Ollama server is not listening on `127.0.0.1:11434`, or the local service/model is unavailable.
- The previous behavior propagated the raw provider failure to the chat mutation and UI.

## Applied hardening

Updated `server/routers.ts` in the `chat.sendMessage` flow:

1. Added `isLocalLlmProviderUnavailable(error)` to detect local provider connection failures such as:
   - `ECONNREFUSED`
   - `fetch failed`
   - `127.0.0.1:11434`
   - `localhost:11434`
2. Added `buildLocalLlmUnavailableMessage(query, docsCount)` to create an Arabic operational fallback answer.
3. Wrapped `invokeLLM(...)` inside a targeted inner `try/catch`.
4. If the local provider is unavailable:
   - The user message remains saved.
   - A safe assistant fallback message is created and saved.
   - Grounding references are preserved when present.
   - The chat mutation returns successfully instead of throwing raw `fetch failed`.
5. Non-local-provider errors are still rethrown and handled by the existing outer error path.

## Verification performed in container

```bash
node --experimental-strip-types --check server/routers.ts
```

Result: passed.

## Decision

`MEGA_BATCH_27F2_CHAT_LLM_LOCAL_PROVIDER_FALLBACK_HARDENING_APPLIED_ROUTER_STATIC_CHECK_PASSED_LOCAL_BROWSER_RETEST_REQUIRED`

## Required local retest

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
$env:NODE_ENV="development"
pnpm.cmd exec tsx watch server/_core/index.ts
```

Then open:

```text
http://localhost:3000/knowledge#/chat
```

Test while Ollama is still stopped. Expected behavior:

- No Error Boundary.
- No raw `fetch failed` UI failure.
- A saved assistant message appears explaining that the local Ollama provider is unavailable and how to proceed.

Optional production/local-provider retest:

```powershell
ollama serve
ollama pull qwen2.5:3b
```

Then resend a chat message. Expected behavior: generated answer from the configured local model.
