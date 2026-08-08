# Knowledge Batch 06A — Browser Evidence Capture Runbook

## Purpose

Close the remaining runtime evidence gap after TypeScript check acceptance.

## Required browser/API checks

### 1. Chat retrieval

Open:

```text
/knowledge#/chat
```

Ask these four questions, or at least two of them:

```text
ما هو الوقف الذري؟
اشرح نظام الأراضي الأميرية في فلسطين.
ما هي تعليمات لجان رعاية المساجد رقم 2 لسنة 2023؟
ما أثر الانتداب البريطاني على إدارة الأوقاف في فلسطين؟
```

Acceptance:

```text
answer_not_empty=true
uses_imported_knowledge=true
includes_citation_or_source_reference=true
no_generic_ungrounded_answer=true
```

### 2. Citation traceability

Capture either UI citation cards, API payload, or read-only SQL result showing answer-to-source relation.

Acceptance:

```text
citation_title_present=true
source_or_reference_id_present=true
imported_legacy_registry_key_or_document_id_traceable=true
```

### 3. Admin Knowledge Search

Open:

```text
/admin/knowledge-search
```

Search for:

```text
الوقف الذري
الأراضي الأميرية
لجان رعاية المساجد
الانتداب البريطاني
```

Acceptance:

```text
result_count_greater_than_zero=true
status=approved
is_chat_eligible=true
citationsCount > 0
```

## Evidence to paste back

Paste compact tables or screenshots for:

```text
chat_question | answer_present | citation_present | source_title
admin_search_query | result_count | approved_count | chat_visible_count | citation_count
```
