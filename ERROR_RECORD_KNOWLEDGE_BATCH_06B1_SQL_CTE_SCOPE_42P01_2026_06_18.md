# Error Record — Knowledge Batch 06B-1 SQL Verification Helper 42P01

**Date:** 2026-06-18  
**Baseline:** v51

## Error

```text
ERROR: 42P01: relation "kb05_docs" does not exist
LINE 38: from kb05_docs d
```

## Classification

```text
VERIFICATION_SQL_CTE_SCOPE_ERROR_NOT_DATA_FAILURE
```

## Cause

The previous optional read-only helper defined `kb05_docs` as a CTE, then attempted to use it in a later SQL statement. PostgreSQL CTEs are scoped only to the single statement directly following the `WITH` clause.

## Files involved

```text
sql_sandbox/knowledge_batch_06b_chat_citation_browser_evidence_gate/knowledge_batch_06b_optional_read_only_db_visibility_helper.sql
```

## What failed

Only the helper verification query failed. The supplied result table still proves that records are approved, chat eligible, and citation-linked.

## Fix

Prepared and patched a corrected read-only helper that repeats the CTE for each SELECT statement:

```text
sql_sandbox/knowledge_batch_06b1_admin_search_evidence_sql_fix/knowledge_batch_06b1_read_only_db_visibility_helper_cte_scope_fixed.sql
```

The old helper path was also patched to avoid repeated operator error.

## Last stable baseline

```text
v50 — KB06B acceptance gate prepared; browser evidence pending.
```

## Current baseline

```text
v51 — Admin Knowledge Search evidence accepted; SQL helper CTE-scope fixed; chat answer evidence pending.
```
