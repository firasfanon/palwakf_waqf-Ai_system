# Knowledge Batch 04 — Human Approval Matrix

**Date:** 2026-06-18  
**Decision:** `KNOWLEDGE_BATCH_04_HUMAN_APPROVAL_MATRIX_PREPARED_NO_APPROVAL_GRANTED`

## Arabic brief

هذه مصفوفة اعتماد بشرية لسجلات المعرفة المستردة من قاعدة البيانات القديمة. كل السجلات تبدأ من `pending_human_approval`. لا يوجد اعتماد تلقائي، ولا يوجد سجل chat-visible في هذه الدفعة.

## Approval roles

| Role | Scope | Can approve? | Can make chat eligible? |
|---|---|---:|---:|
| `knowledge_admin` | completeness, duplicates, metadata, queue movement | no alone | no |
| `legal_reviewer` | laws, Majalla, court/legal references | yes for legal accuracy | no alone |
| `fiqh_reviewer` | jurisprudence and doctrinal material | yes for fiqh accuracy | no alone |
| `ministry_domain_owner` | ministry/admin/procedural records | yes for administrative accuracy | no alone |
| `historical_reviewer` | archival/historical context | yes as historical/supporting | no alone |
| `senior_knowledge_approver` | final sovereign approval | yes | yes, with explicit flag |
| `source_verification_reviewer` | uncertain web/public references | no alone | no |

## Decision states

| State | Meaning | Database implication |
|---|---|---|
| `pending_human_approval` | queued only | no approved status |
| `in_review` | accepted into review queue/reference document | `reference_documents.status='in_review'` |
| `send_back` | source/title/content incomplete | keep not chat eligible |
| `reject` | not suitable or unreliable | `status='rejected'` or queue hold |
| `archive` | historically useful but not active answer source | `status='archived'` |
| `approve_reference_only` | source/reference approved | may cite; no derived chat answer yet |
| `approve_derived_knowledge` | derived knowledge approved | may become candidate for chat gate |
| `approve_chat_eligible` | final chat gate approval | requires `status='approved'` and `is_chat_eligible=true` |

## Bucket-level approval matrix

| Bucket | Count | Minimum reviewer chain | Approval floor | Chat eligibility rule |
|---|---:|---|---|---|
| `HOLD_EXCLUDED_DO_NOT_IMPORT` | 2 | knowledge_admin → senior_knowledge_approver override | hold/reject unless explicit override | blocked |
| `P1_LEGAL_PRIMARY_REFERENCE_REVIEW` | 35 | knowledge_admin → legal_reviewer → senior_knowledge_approver | approve_reference_only after legal force/source/effective-date checks | allowed only by senior approval and explicit `is_chat_eligible=true` |
| `P2_FIQH_AUTHORITY_REVIEW` | 2 | knowledge_admin → fiqh_reviewer → senior_knowledge_approver | approve_reference_only with non-binding fiqh label where applicable | allowed only with doctrinal context and explicit senior approval |
| `P2_MINISTRY_ADMINISTRATIVE_REVIEW` | 14 | knowledge_admin → ministry_domain_owner → senior_knowledge_approver | approve_reference_only after currentness/ownership check | allowed only if procedure is current or clearly labelled archival |
| `P2_OFFICIAL_REFERENCE_REVIEW` | 4 | knowledge_admin → domain_reviewer → senior_knowledge_approver | approve_reference_only after source verification | senior approval required |
| `P3_HISTORICAL_SUPPORTING_REVIEW` | 5 | knowledge_admin → historical_reviewer | supporting/historical approval only | normally context-only, not binding guidance |
| `P3_SUPPORTING_REFERENCE_REVIEW` | 17 | knowledge_admin → domain_reviewer | supporting reference only | blocked unless backed by a primary source |
| `P4_PUBLIC_WEB_TRIAGE_REQUIRED` | 1 | knowledge_admin → triage/source verification | no approval before reclassification | blocked |
| `P4_TRIAGE_REQUIRED` | 58 | knowledge_admin → triage/source verification | no approval before reclassification | blocked |

## Universal blockers

A record must not be approved if any of these remain unresolved:

- Missing or placeholder source.
- Test/minimal document title.
- Unclear legal force or jurisdiction.
- Duplicate of an already approved reference without supersession metadata.
- Historical/supporting content presented as binding legal answer.
- Derived AI/tool output without cited source material.

## Final chat gate

```text
APPROVED_REFERENCE does not equal CHAT_ELIGIBLE_KNOWLEDGE.
CHAT_ELIGIBLE requires explicit senior approval, review trail, citation trail, and status='approved'.
```
