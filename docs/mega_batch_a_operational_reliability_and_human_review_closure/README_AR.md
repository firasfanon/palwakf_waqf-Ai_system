# Mega Batch A — Assistant Operational Reliability and Human Review Closure

**طبيعة الدفعة:** تطوير فعلي محلي/Pre-Apply لإغلاق موثوقية التشغيل وتنفيذ المراجعة البشرية المحكومة. ليست دفعة نشر، وليست إذنًا بالإصدار الرسمي، وليست Pilot لـKB08B.

## ما تضيفه الدفعة

1. **Runtime read resilience**: رفض bundle المعرفة الجزئي عند تعثر أي قراءة مصاحبة مطلوبة (`knowledge_sources`, `reference_documents`, `reference_files`, `knowledge_citations`) مع backoff آمن 30 ثانية وتشخيص لا يكشف أسرارًا.
2. **عدادات موحدة**: مصدر واحد لعدادات طابور المراجعة (`assistant_review_queue_metrics_v1`) بدل خلط عدد مهام مع عدد سجلات أو استشهادات.
3. **Review Case Context**: ملف مراجعة server-side مقيد بالصلاحية، يعرض المهمة والوثيقة والمرجع والمصدر والملفات والاستشهادات.
4. **Task-claim enforcement**: tRPC يرفض تحقق المصدر أو الاستشهاد ما لم تكن المهمة مستلمة للمراجع الحالي؛ وSQL يطبق القاعدة نفسها داخل RPC.
5. **Classification containment**: قرارات `confirm_test`, `confirm_duplicate`, `confirm_quarantine`, `defer` فقط. لا يمكنها الإصدار أو جعل الوثيقة مؤهلة للدردشة.
6. **Phase lock**: `KB08B mapping`, `page binding mutation`, و`official release` محجوبة server-side في Mega Batch A.
7. **Site settings local read fallback**: يمنع 500 المحلي عند غياب قاعدة بيانات تطبيق Drizzle، دون السماح بالكتابة أو إخفاء الحالة عن Diagnostics.

## غير مشمول عمدًا

```text
NO_PRODUCTION_DEPLOYMENT
NO_REMOTE_STAGING_REQUIREMENT
NO_KB08B_MAPPING_MUTATION
NO_PAGE_BINDING_MUTATION
NO_OFFICIAL_KNOWLEDGE_RELEASE
NO_AUTOMATIC_CHAT_ELIGIBILITY
```

## التسلسل بعد التطبيق

1. تطبيق ملفات الكود عبر PowerShell.
2. `pnpm.cmd run check` ثم `pnpm.cmd run build`.
3. تنفيذ `00_MEGA_BATCH_A_PREFLIGHT_READ_ONLY.sql`.
4. فقط عند نجاح ما سبق: تنفيذ `01_CONTROLLED_HUMAN_REVIEW_TASK_CLAIM_AND_CONTAINMENT_OPERATOR_APPLY.sql`.
5. تنفيذ `02_MEGA_BATCH_A_POST_APPLY_READ_ONLY_VERIFICATION.sql`.
6. إعادة تشغيل التطبيق، وفتح مسار Hash القانوني:
   `http://localhost:3000/knowledge#/admin/knowledge-review-operations`
7. التقاط دليل فتح ملف واحد فقط **دون حفظ قرار** أولًا.
8. بعد قبول الدليل، تنفيذ العينة الثلاثية بالتسلسل: تصنيف محتوى → تحقق مصدر → تحقق استشهاد.

لا تبدأ KB08B أو النشر قبل قبول دليل العينة الثلاثية.
