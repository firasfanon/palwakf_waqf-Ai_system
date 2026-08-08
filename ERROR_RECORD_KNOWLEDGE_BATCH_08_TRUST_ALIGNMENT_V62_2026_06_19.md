# Error Record — KB08 Trust-Alignment Correction (v62)

## Trigger
KB08 staging evidence showed 876 main P1 candidates and 20 observed P1 knowledge-document candidates still staged. Inspection of the historical step 04 SQL showed an obsolete pre-Trust behavior: it would have marked P1 records `approved` and `is_chat_eligible=true` while creating an `unverified` source and unverified citations.

## Root cause
KB08 was prepared before the accepted Sovereign Trust Foundation v1/v1A contract. Its promotion behavior was not revised after strict verified retrieval was introduced.

## Impact
No harmful promotion occurred: evidence confirms P1 knowledge/reference rows remained staged. Auxiliary records promoted by step 05 do not constitute public chat release.

## Correction
v62 replaces KB08 step 04 with review-only promotion:
- `reference_documents.status='in_review'`, `verification_status='pending'`
- `knowledge_documents.status='in_review'`, `is_chat_eligible=false`, `requires_human_review=true`
- citations use `verification_status='linked'`
- source/citation/classification tasks are opened automatically
- incomplete candidates stay in staging as `needs_mapping`

## Last stable baseline
v61 — Strict Retrieval Gate Accepted.
