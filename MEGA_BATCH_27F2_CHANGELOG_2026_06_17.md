# Changelog — Mega Batch 27F-2 — 2026-06-17

## Changed

- Hardened `chat.sendMessage` in `server/routers.ts` against local Ollama provider connection failures.
- Added targeted detection for `ECONNREFUSED`, `fetch failed`, and local `11434` provider availability failures.
- Added Arabic safe assistant fallback message instead of surfacing raw provider errors to the UI.

## Preserved

- No database schema changes.
- No RLS changes.
- No admin router changes.
- No production approval.
- No change to the selected LLM provider/model settings.

## Verification

- `node --experimental-strip-types --check server/routers.ts` passed in container.
- Local `pnpm.cmd run check` and browser retest are required after applying v38b.
