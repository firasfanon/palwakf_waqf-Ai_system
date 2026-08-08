# Knowledge Lifecycle Inventory — baseline before live refresh

## دورة المعرفة الحاكمة

```text
مصادر أصلية
→ مراجع وملفات منظمة
→ معرفة مشتقة ومنظمة
→ حزم مؤسسية/إدارية وقانونية/فقهية/وقفية
→ مخرجات الأدوات الذكية القابلة للمراجعة
→ مراجعة واعتماد
→ تشغيل داخل المساعد
```

## الارتباطات التقنية الحالية

| مرحلة المعرفة | الكيانات الأساسية |
|---|---|
| المصادر الأصلية | `assistant.knowledge_sources`, `assistant.reference_documents`, `assistant.reference_files` |
| المعرفة المشتقة والمنظمة | `assistant.knowledge_documents`, `assistant.knowledge_citations` |
| المراجعة | `assistant.knowledge_review_tasks`, `assistant.review_events`, `assistant.knowledge_scope_assignments` |
| مخرجات الأدوات | `assistant.ai_tool_runs`, `assistant.ai_tool_run_events`, `assistant.ai_tool_run_links` |
| السجل الموروث | `assistant.legacy_import_register` |

## آخر لقطة معروفة — يجب إعادة إثباتها Read-only

| مؤشر | آخر قيمة مرصودة | الدلالة |
|---|---:|---|
| KB08B `needs_mapping` | 296 | backlog محفوظ للمراجعة والتطابق، لا تطبيق جماعي |
| promoted legacy rows | 663 | قيمة مرصودة لاحقًا؛ يجب إعادة فحصها قبل الاعتماد |
| open review tasks | 1377 | 746 source + 625 citation + 6 classification |
| completed review tasks | 0 | لا يُستنتج أي اعتماد مكتمل |
| cancelled classification tasks | 6 | تاريخية؛ لا يعاد فتحها أو تعديلها |
| all chat eligible | 0 | لا توجد أهلية محادثة مثبتة |
| official chat eligible | 0 | لا يوجد إصدار رسمي للمحادثة |

## قواعد التفسير

- لا تتحول المعرفة إلى Chat Eligible تلقائيًا.
- مخرجات الأدوات الذكية لا تصبح معرفة نهائية إلا بعد مسار مراجعة.
- `needs_mapping` هي حالة حفظ وحوكمة، وليست فشلًا أو مبررًا للحذف.
- أي اختلاف بين اللقطة الحية والقيم أعلاه يسجل كـ reconciliation item ولا يُعالج في Discovery.
