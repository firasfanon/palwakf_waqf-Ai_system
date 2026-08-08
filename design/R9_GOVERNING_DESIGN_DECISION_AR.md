# R9 — القرار الحاكم للتصميم

## القرار

يُبنى R9 كتطوير محكوم فوق البنية القائمة، لا كمنظومة مراجعة موازية.

## السلسلة التشغيلية

```text
knowledge_source
→ reference_document/reference_file
→ knowledge_document
→ knowledge_citation
→ knowledge_review_task
→ review_event
→ activation readiness computation
→ activation audit
```

## الكيانات المعتمدة لإعادة الاستخدام

- `assistant.knowledge_sources`
- `assistant.reference_documents`
- `assistant.reference_files`
- `assistant.knowledge_documents`
- `assistant.knowledge_citations`
- `assistant.knowledge_review_tasks`
- `assistant.review_events`
- `assistant.knowledge_review_task_reconciliation_events`
- `assistant.knowledge_activation_runs`
- `assistant.knowledge_activation_items`
- `assistant.ai_tool_runs`
- `assistant.ai_tool_run_links`
- `assistant.ai_tool_run_events`
- Provenance V1.1 كـsupporting ledger فقط.

## قرار الحقوق

لم يظهر كيان حقوق مستقل. قبل التنفيذ يجب اختيار أحد عقدين:

### الخيار المفضل

كيان حقوق مستقل ومحكوم يرتبط بالمصدر/المرجع، مع:

```text
rights_class
rights_status
evidence_reference
issuer
jurisdiction
reuse_scope
quotation_scope
reviewed_by
reviewed_at
decision_note
```

### الخيار المؤقت غير المفضل

عقد JSON صريح داخل `metadata_json` مع View/RPC موحد. لا يُعتمد إلا إذا أثبتت المراجعة أن إنشاء كيان مستقل غير ضروري.

## آلة الحالات

لا تُستبدل حالات الجدول قبل التقاط `pg_get_constraintdef`. تُبنى طبقة Product Status mapping فوق القيم الفعلية، ثم يُقرر توسيع constraint عند الحاجة.

## بوابة التفعيل

الأفضل أن تكون View/RPC محسوبة أولًا:

```text
SOURCE_VERIFIED
RIGHTS_RESOLVED
CITATION_VERIFIED
CONTENT_REVIEWED
MAPPING_RESOLVED
CONTAINMENT_RESOLVED
HUMAN_APPROVED
NO_BLOCKING_TASK
```

لا تُضاف أعمدة دائمة إلا إذا أثبتت متطلبات التدقيق أنها ضرورية.

## مخرجات الأدوات

`ai_tool_runs` و`ai_tool_run_links` هما السجل المرجعي. لا تتحول المخرجات إلى معرفة تلقائيًا. يجب ربطها بمهمة مراجعة بشرية، بعد تأكيد أن target constraint يدعم `ai_tool_run` أو اعتماد bridge محكوم.

## حدود التنفيذ

```text
AUTOMATIC_APPROVAL=NO
AUTOMATIC_ACTIVATION=NO
CHAT_RELEASE=NO
PUBLIC_RELEASE=NO
DIRECT_BROWSER_TABLE_WRITE=NO
NEW_PARALLEL_REVIEW_QUEUE=NO
```
