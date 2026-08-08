# Error Record — Mega Batch 27F-2 — Chat LLM Local Provider Fallback

## Error

`chat.sendMessage` failed at runtime with:

```text
TypeError: fetch failed
connect ECONNREFUSED 127.0.0.1:11434
```

## Surface

- Route: `/knowledge#/chat`
- Server log area: `server/routers.ts` → `chat.sendMessage`
- Provider: local Ollama-compatible endpoint
- Model: `qwen2.5:3b`

## Root cause

The configured local LLM provider was unavailable at `127.0.0.1:11434`. The server propagated the provider exception to TRPC, causing the UI to show `fetch failed` rather than a controlled assistant fallback.

## Fix

Added targeted local-provider failure handling inside the chat mutation. When the local provider is down, the server now creates a controlled assistant message explaining the provider availability issue and returns the mutation successfully.

## Stable baseline after fix

`waqf_ai_model_hybrid_llm_admin_v38b_mb27f2_chat_llm_local_provider_fallback_hardening_2026_06_17.zip`
