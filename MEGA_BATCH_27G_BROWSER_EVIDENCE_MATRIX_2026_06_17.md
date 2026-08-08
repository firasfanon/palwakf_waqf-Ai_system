# Mega Batch 27G — Browser / Runtime Evidence Matrix

**Date:** 2026-06-17  
**Baseline:** `v38b_mb27f2`  
**Scope:** Final local retest for admin/chat readiness gate.

| Evidence item | User-supplied proof | Status | Notes |
|---|---|---:|---|
| `pnpm.cmd run check` | PowerShell output reached `tsc --noEmit` with no errors shown | Accepted | TypeScript clean locally |
| Server bootstrap | `Server running on http://localhost:3000/` | Accepted | Runtime active |
| Local DB fallback | `[MB27F] Local bootstrap DB read fallback...` | Accepted | Expected without DB |
| Chat provider request | Request attempted `127.0.0.1:11434` with `qwen2.5:3b` | Accepted | Ollama route detected |
| Offline Ollama behavior | `[MB27F2] Chat local LLM provider unavailable; returning safe assistant fallback` | Accepted | No crash |
| Chat success path | `[chat.sendMessage] success ... assistantMessageId: 31` | Accepted | Controlled fallback saved assistant message |
| Browser chat display | Arabic safe response shown in chat | Accepted | Screenshot archived |
| Production gate | No staging/production evidence | Deferred | No production approval |

## Screenshot evidence

```text
evidence/mega_batch_27g/chat_safe_fallback_ollama_offline_2026_06_17.png
```
