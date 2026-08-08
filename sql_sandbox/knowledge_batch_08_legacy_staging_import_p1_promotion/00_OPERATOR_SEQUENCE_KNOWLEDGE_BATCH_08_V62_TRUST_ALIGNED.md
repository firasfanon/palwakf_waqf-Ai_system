# KB08 Operator Sequence — v62 Trust-Aligned Correction

## Why this correction exists
The original KB08 `04_promote_p1_knowledge_reference_documents_OPERATOR_APPLY.sql` was authored before Sovereign Trust Foundation v1/v1A was accepted. It would have inserted recovered P1 records as `approved` and `is_chat_eligible=true` while their source and citations remained unverified. That violates the accepted contract.

## Current accepted state
- `02` staging succeeded: `knowledge_batch_08 = 929` rows.
- `03` supplemental staging succeeded: `knowledge_batch_08_observed_rows = 66` rows.
- `05` auxiliary operational promotion has already promoted 63 operational records (17 main + 46 observed).
- **Do not run the old v57/v61 version of step 04.**

## Apply only this sequence
1. Extract v62 into `D:\waqf_ai_model`, allowing the replacement of the step 04 and step 06 files.
2. Run the replacement `04_promote_p1_knowledge_reference_documents_OPERATOR_APPLY.sql` using `psql` with `ON_ERROR_STOP=1`.
3. Run the replacement `06_post_apply_read_only_verification.sql`.
4. Send the complete output for KB08A intake.

## Required invariants
- `approved_on_promotion = 0`
- `chat_visible_on_promotion = 0`
- every v62 promoted knowledge record is `in_review` and `is_chat_eligible=false`
- every v62 citation is `linked`, not `verified`
- human review tasks exist for source and citation verification

## Do not rerun
- Do not rerun steps 02 or 03.
- Do not rerun 05 unless it failed in your local output.
- Do not run a pre-v62 copy of step 04.
