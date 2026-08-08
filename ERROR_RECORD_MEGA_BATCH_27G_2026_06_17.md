# Error Record — Mega Batch 27G

## Error / warning 1 — Local DB fallback

**Observed:**

```text
[MB27F] Local bootstrap DB read fallback: Database not available. A safe fallback response was returned.
```

**Classification:** Expected local bootstrap warning.  
**Cause:** The local environment does not expose a full DB connection for this read surface.  
**Impact:** Non-blocking. Server continues.  
**Resolution:** Already mitigated in 27F by reducing stack trace noise and preserving safe fallback.

---

## Error / warning 2 — Ollama provider unavailable

**Observed before 27F-2:**

```text
connect ECONNREFUSED 127.0.0.1:11434
```

**Observed after 27F-2:**

```text
[MB27F2] Chat local LLM provider unavailable; returning safe assistant fallback.
[chat.sendMessage] success
```

**Classification:** Runtime provider availability issue, now safely handled.  
**Cause:** Ollama service/model not running on local port 11434.  
**Impact after 27F-2:** Non-blocking. A controlled Arabic assistant message is returned.  
**Resolution:** Accepted in 27G local retest.

---

## Error / warning 3 — pnpm settings warning

**Observed:**

```text
The "pnpm" field in package.json is no longer read by pnpm.
```

**Classification:** Tooling deprecation warning.  
**Impact:** Non-blocking. `tsc --noEmit` passes.  
**Recommendation:** Move old `pnpm.patchedDependencies` / `pnpm.overrides` settings to the currently supported pnpm settings location in a future housekeeping batch.

---

## Last stable baseline

```text
waqf_ai_model_hybrid_llm_admin_v39_mb27g_final_runtime_retest_admin_chat_readiness_gate_2026_06_17.zip
```
