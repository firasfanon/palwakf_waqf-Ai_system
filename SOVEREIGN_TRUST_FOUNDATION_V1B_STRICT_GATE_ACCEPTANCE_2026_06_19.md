# Sovereign Trust Foundation v1B — Strict Retrieval Gate Acceptance
**Date:** 2026-06-19  
**Baseline:** v60  
**Nature:** Supabase apply-evidence intake / strict public-chat retrieval safety acceptance  
**Scope:** Assistant-only; no new code, DDL, DML, RLS, production or UI mutation in this intake.

## Accepted evidence
The operator executed the corrected post-apply verification and returned:

| Metric | Accepted value |
|---|---:|
| `unverified_authority_chat_visible` | 0 |
| `source_not_verified_chat_visible` | 0 |
| `no_verified_citation_chat_visible` | 0 |
| `strict_public_chat_candidates` | 0 |

## Decision
```text
SOVEREIGN_TRUST_FOUNDATION_V1B_STRICT_RETRIEVAL_GATE_ACCEPTED
UNVERIFIED_PUBLIC_CHAT_EXPOSURE=ZERO
STRICT_PUBLIC_CHAT_CANDIDATES=ZERO
HUMAN_VERIFICATION_WORKFLOW_REMAINS_OPEN
TRUST_FOUNDATION_SAFETY_CLOSURE_ACCEPTED
CONTENT_TRUST_CLOSURE_PENDING_HUMAN_REVIEW
PRODUCTION_NOT_APPROVED
```

## Meaning
1. No document with `authority_level=unverified` remains exposed to the public chat retrieval surface.
2. No chat-eligible document remains connected to a source that is not human-verified.
3. No chat-eligible document remains without at least one human-verified citation.
4. The current strict public retrieval candidate count is zero. This is an expected fail-closed state while the reviewer queue is processed. The public chat must not manufacture an answer from unverified legacy records.

## Human-review backlog retained
Previously accepted review queue evidence remains active:

| Workflow stage | Priority | Status | Tasks |
|---|---|---|---:|
| `citation_verification` | high | open | 55 |
| `citation_verification` | normal | open | 97 |
| `content_classification` | high | open | 6 |
| `source_verification` | high | open | 41 |
| `source_verification` | normal | open | 105 |

**Total:** 304 open review tasks.

## Non-negotiable rules
- A record being stored in Supabase is not equivalent to being a trusted public-chat source.
- A record may return to public-chat retrieval only after documented source and citation verification, scope eligibility and an explicit reviewer release.
- Test, duplicate, quarantined and legacy-unverified records remain retained in the database but excluded from public chat retrieval.
- `strict_public_chat_candidates=0` is safe. It is not an error, a content loss event or a reason to bypass the verifier.

## What this closes
- Strict retrieval safety gate: **accepted**.
- Unverified legacy content exposure to public chat: **blocked**.

## What this does not close
- Human verification of sources and citations.
- Reviewer work queue operations/UI.
- Legacy staging/P1 promotion evidence for Knowledge Batch 08.
- Page binding and real operations enablement (KB09).
- Browser evidence for answer/citation display (KB06C).
- Remote staging/RBAC/RLS evidence (29A).
- Production promotion.
