# Runbook — تفعيل المعرفة والإنتاجية V1

## المعنى العملي

التدقيق الآلي يفرز كل corpus، لكنه لا يزعم أن مصدرًا أو استشهادًا صحيح ما لم يثبت ذلك. المراجعة البشرية ليست تعطيلًا؛ هي توقيع مسؤول على حقيقة المصدر والاستشهاد قبل تحويل المعرفة إلى إجابة للمستخدم.

## Staging sequence

1. شغل `00_FULL_CORPUS_PREFLIGHT_READ_ONLY.sql` واحفظ الناتج.
2. تحقق من presence لكل objects المطلوبة؛ إذا غاب object، توقف ولا تطبق schema.
3. شغل `01_ACTIVATION_LEDGER_SCHEMA_OPERATOR_APPLY.sql`.
4. شغل `02_RUN_FULL_CORPUS_AUDIT_OPERATOR_APPLY.sql` عبر psql مع reviewer UUID صالح.
5. شغل `03_POST_APPLY_READ_ONLY_VERIFICATION.sql`.
6. افتح `/admin/knowledge-activation` واضغط `بدء تدقيق شامل للمعرفة الموجودة` إذا احتجت snapshot محدثًا بعد عمليات المراجعة.
7. راجع buckets بالترتيب: containment → mapping → source → citation → release_ready.
8. لا تحرر وثيقة إلا بعد أن تظهر `release_ready` ويكون لديك `assistant.publish` وملاحظة اعتماد واضحة.

## تشغيل الإنتاجية

- لا يوجد Release جماعي.
- كل وثيقة `release_ready` تمر بقرار صريح.
- بعد أول مجموعة معتمدة، نفذ UAT Chat داخلي بالأسئلة الواقعية مع تحقق الاستشهادات.
- لا تستخدم Production قبل نجاح Staging وRBAC/RLS وUAT.
