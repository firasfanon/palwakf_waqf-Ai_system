# Knowledge Batch 06B — Browser Evidence Capture Runbook

**Date:** 2026-06-18

## Purpose

Capture the browser/API evidence required to convert KB06B from a prepared acceptance gate into an accepted runtime certification.

## Precondition

```text
pnpm.cmd run check passed in KB06A.
KB05A import evidence confirmed 138 approved and chat-visible knowledge documents.
Application server is running and connected to the Supabase environment that received KB05 imports.
```

## Chat evidence steps

Open:

```text
/knowledge#/chat
```

Run these prompts:

```text
ما هو الوقف الذري؟
اشرح حق التصرف في الأراضي الأميرية في فلسطين.
ما هي تعليمات لجان رعاية المساجد لسنة 2023؟
ماذا تقول المراجع عن إدارة الأوقاف في عهد الانتداب البريطاني؟
```

For each prompt capture one of:

```text
1. Screenshot showing answer + source/citation title.
2. Browser Network JSON response showing answer text + citations/groundingReferences/sources.
3. Database row showing assistant message with non-empty sources/citations field.
```

## Admin search evidence steps

Open:

```text
/admin/knowledge-search
```

Run:

```text
الأراضي الأميرية
تعليمات لجان رعاية المساجد
```

Accepted result:

```text
result_count > 0
status = approved
chat_visible = true / ظاهر
citationsCount > 0
```

## Evidence table to send back

```text
chat_question | answer_present | citation_present | source_title | accepted
admin_search_query | result_count | approved_count | chat_visible_count | citation_count | accepted
```

## Blocking rule

Do not mark KB06B accepted if any citation field is empty, if admin search returns zero rows, or if the result only proves TypeScript compilation without runtime retrieval.
