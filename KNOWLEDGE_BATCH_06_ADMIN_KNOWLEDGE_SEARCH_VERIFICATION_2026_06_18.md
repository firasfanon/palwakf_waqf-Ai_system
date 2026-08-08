# Knowledge Batch 06 — Admin Knowledge Search Verification

## Issue found

The admin search page was not aligned with the router contract:

| Surface | Before KB06 | Impact |
|---|---|---|
| UI input | sends `q` | router ignored `q` |
| Router output | returned raw array | UI expected `data.results` |
| Row display | expected `chunkText` | runtime docs mainly provide `content/summary` |
| Action | always opened `/admin/fetched-content` | imported knowledge rows should open `/knowledge/{id}` |

## Fix

The router now accepts `q`, applies category/source/tags filters, and returns `results` with search metadata. The UI now displays status, chat visibility, and citation counts.

## UAT probes

| Probe | Expected |
|---|---|
| `الأراضي الأميرية` | one or more approved/chat-visible rows |
| `تعليمات لجان رعاية المساجد` | imported instructions record appears |
| `الوقف الذري` | legal/fiqh record appears |
| `الانتداب البريطاني` | historical waqf administration records appear |

## Gate status

```text
ADMIN_SEARCH_CONTRACT_FIXED
BROWSER_SEARCH_EVIDENCE_PENDING
```
