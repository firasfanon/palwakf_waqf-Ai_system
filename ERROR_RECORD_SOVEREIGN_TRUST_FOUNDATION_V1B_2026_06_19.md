# Error Record — Sovereign Trust Foundation v1B

## Historical defect
- **Issue:** v59 post-apply verifier failed with PostgreSQL `42601` near `from`.
- **Cause:** A cross-relation aggregate was written outside a scalar subquery.
- **Affected file:** `02_POST_APPLY_READ_ONLY_VERIFICATION.sql` in the v59 strict gate package.
- **Resolution:** v60 replaced the invalid expression with a scalar subquery.
- **Evidence:** The corrected verifier returned the four expected zero/zero/zero/zero values.
- **Stable baseline:** v61.

## Current operational condition
- `strict_public_chat_candidates=0` is not treated as an error. It is an intentional fail-closed condition until reviewer tasks are completed.
