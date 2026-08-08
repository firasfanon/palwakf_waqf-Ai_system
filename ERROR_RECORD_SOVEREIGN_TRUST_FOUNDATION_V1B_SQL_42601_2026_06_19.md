# Error Record — Sovereign Trust Foundation v1B

- **Error code:** `42601`
- **Observed message:** syntax error at or near `from` on the v1A read-only post-apply verifier.
- **Affected file:** `sql_sandbox/sovereign_assistant_trust_foundation_v1a_strict_gate/02_POST_APPLY_READ_ONLY_VERIFICATION.sql`
- **Cause:** invalid aggregate expression: `count(*) from <relation>` appeared inside another `select` list without a scalar-subquery wrapper.
- **Impact:** verification output unavailable; the operator apply itself was reported successful and was not modified by this read-only verifier failure.
- **Fix:** replace the invalid expression with a scalar subquery; no DML/DDL introduced.
- **Stable baseline before correction:** v59.
- **Corrected baseline:** v60.
