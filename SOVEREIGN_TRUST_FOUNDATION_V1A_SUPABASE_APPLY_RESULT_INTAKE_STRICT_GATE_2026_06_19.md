# Sovereign Trust Foundation v1A — Supabase Apply Result Intake + Strict Gate

## طبيعة الدفعة
استيعاب نتيجة تطبيق v58 وتصحيح سياسة الاسترجاع العام لتطابق العقد المعتمد:

`Official sources + verified citations + scoped permissions + human review + useful workflows + calm usable interface`.

## الأدلة المستلمة
تم قبول تنفيذ أوامر v58 التي رجعت `Success. No rows returned` كنجاح لأوامر DDL/DML التي لا ينتج عنها جدول نتائج.

توزيع المعرفة بعد التطبيق:

| status | is_chat_eligible | authority_level | rows |
|---|---:|---|---:|
| approved | true | official | 41 |
| approved | true | reference | 30 |
| approved | true | semi_official | 14 |
| approved | true | unverified | 61 |
| draft | false | unverified | 6 |

إجمالي السجلات المعتمدة والمرشحة للشات في الدليل = **146**، وإجمالي السجلات في هذا التوزيع = **152**.

مهام المراجعة المفتوحة:

| workflow_stage | priority | status | tasks |
|---|---|---|---:|
| citation_verification | high | open | 55 |
| citation_verification | normal | open | 97 |
| content_classification | high | open | 6 |
| source_verification | high | open | 41 |
| source_verification | normal | open | 105 |

إجمالي مهام المراجعة المفتوحة = **304**.

## القرار
`SOVEREIGN_TRUST_FOUNDATION_V1_APPLY_ACCEPTED_STRICT_VERIFIED_RETRIEVAL_CORRECTION_REQUIRED_BEFORE_TRUST_CLOSURE`

## سبب عدم الإغلاق الكامل
وجود **61** سجلًا `authority_level=unverified` لكنه `approved=true` و`is_chat_eligible=true` يخالف شرط المصدر الرسمي/الموثق. كما أن وجود 152 مهمة تحقق استشهادات و146 مهمة تحقق مصادر يعني أن الاسترجاع العام لا يجوز أن يكتفي بحالة `linked`.

## الإجراء التصحيحي في v59
- سياسة TypeScript أصبحت fail-closed: لا شات عام دون مصدر verified + citation verified.
- SQL v1A يعطل `is_chat_eligible` فقط للسجلات غير المستوفية، دون حذفها.
- View/RPC الاسترجاع أصبحت strict ولا تقبل bypass عن طريق `p_require_verified_citation=false`.
- السجلات تعود للشات واحدة واحدة بعد المراجعة البشرية.

## ما تم قبوله
- تطبيق مخطط v58/backfill/review workflow: مقبول وفق المخرجات المرسلة.
- إنشاء مهام مراجعة: مقبول.
- إغلاق الثقة النهائية: غير مقبول بعد، حتى تطبيق strict gate وإكمال التحقق البشري.
