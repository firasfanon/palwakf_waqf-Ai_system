# Knowledge Batch 06B-1 — Admin Knowledge Search Evidence Intake + SQL Verification Fix

**Date:** 2026-06-18  
**Baseline:** v51  
**Based on:** v50 — Knowledge Batch 06B Chat/Citation Browser Evidence Acceptance Gate.

## Nature

This batch is an **evidence intake + SQL verification correction** batch.

It accepts the supplied Admin Knowledge Search evidence and fixes the read-only SQL helper defect reported by the operator.

It is not a new data import, not a runtime code patch, not a production promotion, and not Mega Batch 30.

## Evidence supplied

The operator supplied an Admin Knowledge Search/DB result sample containing **25 displayed rows**. Every displayed row has:

```text
status = approved
is_chat_eligible = true
citations_count = 1
```

Representative accepted titles include:

```text
Consequences of the Ottoman land law: Agrarian and privatization processes in Palestine, 1858–1918
Land privatization in nineteenth-century Ottoman Palestine
Land registry maps in Palestine during the Ottoman period
Minimal Test Document
أحكام الوقف في الشريعة الإسلامية - محمد عبيد الكبيسي
أوقاف القدس التاريخية - المسجد الأقصى
إدارة الأوقاف في عهد الانتداب البريطاني
إدارة وتنمية أموال الوقف - ماجد أبو رخية
إعلام الموقعين عن رب العالمين - ابن القيم
```

## Accepted inference

This evidence proves that the Admin Knowledge Search/read surface can return approved, chat-visible knowledge records with citations attached.

It also reinforces the KB05A evidence that the imported knowledge corpus is stored, approved, and citation-linked.

## SQL error supplied

```text
Failed to run sql query: ERROR: 42P01: relation "kb05_docs" does not exist
LINE 38: from kb05_docs d
```

## Error classification

```text
VERIFICATION_SQL_CTE_SCOPE_ERROR_NOT_DATA_FAILURE
```

Cause: the optional KB06B read-only helper used `kb05_docs` in a later SQL statement after the CTE scope had ended. In PostgreSQL, a CTE is scoped only to the single statement immediately following `WITH`.

This does **not** invalidate the supplied evidence table. It only invalidates the second statement of the helper query.

## Decision

```text
KNOWLEDGE_BATCH_06B1_ADMIN_KNOWLEDGE_SEARCH_EVIDENCE_ACCEPTED_SQL_VERIFICATION_CTE_FIX_PREPARED_CHAT_ANSWER_CITATION_BROWSER_EVIDENCE_PENDING
```

## Gate status after KB06B-1

| Gate | Status | Notes |
|---|---|---|
| KB05A 138 import | accepted | retained |
| KB05A approved/chat-visible | accepted | retained |
| KB06A TypeScript check | accepted | retained |
| Admin Knowledge Search evidence | accepted | supplied rows prove approved/chat-visible/cited records |
| Optional SQL helper | fixed | CTE scope issue corrected in v51 |
| Chat answer retrieval evidence | pending | no actual `/knowledge#/chat` answer text supplied |
| Chat citation display evidence | pending | no chat answer citation payload/screenshot supplied |
| Remote staging evidence | pending | outside this batch |
| RBAC/RLS negative UAT | pending | outside this batch |
| Production approval | blocked | gates remain open |
| Mega Batch 30 | blocked | chat answer evidence + 29A/RBAC gates still required |

## Correct continuation

```text
Knowledge Batch 06C — Chat Answer Runtime Evidence Intake + Citation Display Acceptance
```

Required next evidence:

```text
chat_question | answer_present | citation_present | source_title | accepted
```

Minimum probes:

```text
ما هو الوقف الذري؟
اشرح حق التصرف في الأراضي الأميرية في فلسطين.
ما هي تعليمات لجان رعاية المساجد لسنة 2023؟
ماذا تقول المراجع عن إدارة الأوقاف في عهد الانتداب البريطاني؟
```
