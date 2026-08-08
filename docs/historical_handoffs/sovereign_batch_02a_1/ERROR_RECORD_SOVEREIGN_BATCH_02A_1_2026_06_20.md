# Error Record — Sovereign Batch 02A.1

## Triggering evidence
Browser evidence showed review-case content visually escaping its dialog surface and the background review queue remaining visually/scroll-wise active. Runtime logs also repeated companion table `fetch failed` messages for `reference_documents`, `reference_files`, and `knowledge_citations`.

## Root cause classification
1. **UI containment:** The generic dialog grid/scroll structure was insufficient for a long workflow case inside the admin shell's independent scroll container.
2. **Trust-safe runtime degradation:** Companion reads could fail after the root knowledge-document read, leaving a possibility of rendering a partial knowledge bundle without linked evidence.

## Corrective control
- Dedicated review-case containment layout and background scroll lock.
- No partial bundle after a companion read failure; short backoff with a single bounded warning and fallback to existing safe store.

## Non-goals
No production approval. No official knowledge release. No write to review tasks by this patch.
