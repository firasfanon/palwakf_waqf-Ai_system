# Reviewable Tool-Output Intake

## مصادر المخرجات

```text
summarize
extract
classify
compare
precedents
predict
```

## القاعدة الحاكمة
كل مخرج أداة يبقى **operational output** حتى يمر بمسار Intake ومراجعة. لا يتحول تلقائيًا إلى `knowledge_document` معتمد أو `chat_eligible`.

## حالات Intake المقترحة

```text
generated
→ pending_triage
→ linked_to_source_or_reference
→ review_required
→ accepted_as_draft | rejected | retained_operational_only
```

## الحقول الدنيا المطلوبة

| الحقل | الغرض |
|---|---|
| tool_run_id | ربط المخرج بالتشغيل الأصلي |
| output_type | تلخيص/استخراج/تصنيف/مقارنة/سوابق/توقع |
| source_context | المصدر أو الوثيقة أو الاستعلام الذي بُني عليه المخرج |
| reviewer_scope | إثبات أن المراجع مخول |
| proposed_knowledge_status | draft فقط كبداية |
| provenance | أحداث/روابط التشغيل الأصلية |
| human_note | تفسير قبول/رفض/تأجيل |

## ممنوعات B

```text
NO_AUTOMATIC_KNOWLEDGE_PUBLICATION
NO_AUTOMATIC_CHAT_ELIGIBILITY
NO_TOOL_OUTPUT_AS_OFFICIAL_SOURCE
```
