# Knowledge Batch 06 — Chat Retrieval/Citation UAT Runbook

## Required environment

- Supabase variables configured for the assistant runtime.
- KB05A records present in `assistant.reference_documents`, `assistant.knowledge_documents`, and `assistant.knowledge_citations`.
- Login/session available for `/knowledge#/chat`.
- Local/remote LLM provider available if the test requires generated answers; if the LLM is unavailable, the fallback may still prove document retrieval count but not answer quality.

## Browser/API tests

Run these prompts in `/knowledge#/chat`:

1. `ما هو الوقف الذري؟`
2. `ما هي تعليمات لجان رعاية المساجد لسنة 2023؟`
3. `اشرح حق التصرف في الأراضي الأميرية في فلسطين.`
4. `ماذا تقول المراجع عن إدارة الأوقاف في عهد الانتداب البريطاني؟`
5. `ما مهام وزارة الأوقاف والشؤون الدينية الفلسطينية؟`

## Required evidence per prompt

For each prompt, capture:

```text
prompt
answer excerpt
number of groundingReferences
first reference title
citation locator/excerpt if present
assistant message sources not empty
network status 200 for chat.sendMessage
```

## Pass criteria

```text
CHAT_RETRIEVAL_PASS = groundingReferences.length >= 1 for at least 4/5 probes
CITATION_PASS = at least 4/5 responses include source/citation metadata
ANSWER_QUALITY_PASS = no hallucinated source names; answer remains grounded in imported references
```
