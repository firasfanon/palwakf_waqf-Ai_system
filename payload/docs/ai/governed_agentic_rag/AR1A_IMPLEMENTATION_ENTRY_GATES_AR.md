# AR1A — بوابات الدخول إلى AR1B وAR1C

## AR1B — Controlled Corpus Binding

### النطاق المقترح

AR1B هو الدفعة الوحيدة المصرح لها لاحقًا بتحديد مجموعة corpus صغيرة للـPilot الداخلي. لا يبدأ بالاستيراد الجماعي ولا بتغيير حالة آلاف السجلات.

### مخرجات AR1B المتوقعة

```text
bound_corpus_manifest
candidate_ids
trust_tier_per_item
citation_review_status
rights_usage_scope
allowed_answer_modes
excluded_content_reasons
rollback_or_unbind_plan
```

### قيود AR1B

```text
NO_PUBLIC_RELEASE
NO_FULL_TEXT_IMPORT_UNLESS_RIGHTS_ALLOW
NO_AUTOMATIC_T2_TO_T3_PROMOTION
NO_SOURCE_LINK_WRITE_WITHOUT_SEPARATE_AUTHORIZATION
NO_RIGHTS_ASSIGNMENT_WITHOUT_HUMAN_DECISION
NO_CROSS_DOMAIN_BINDING
```

## AR1C — Governed Agentic RAG Pilot Implementation

### لا يبدأ إلا بعد AR1B

AR1C لا يكون Agent عامًا. أول تشغيل يكون داخل مسار داخلي منفصل وبعدد مستخدمين محدد وبمجال `legal_waqf_research` فقط.

### مكونات AR1C المتوقعة

```text
policy-aware request classifier
effective-authority resolver
restricted retrieval adapter
citation sufficiency evaluator
tool orchestration adapter
abstention/escalation service
execution trace renderer
audit correlation adapter
internal UAT route only
```

### ما لا يدخل AR1C الأول

```text
public chat
open web browsing
case disposition engine
rights adjudication
fatwa generation
predictive legal decisioning
autonomous source ingestion
unbounded multi-agent workflows
```

## بوابة تفويض التنفيذ

لا تعد `AR1A_ARCHITECTURE_APPROVED` تفويضًا بالتنفيذ. يلزم قرار مستقل وصريح بصيغة:

```text
AR1B_CONTROLLED_CORPUS_BINDING=AUTHORIZED
```

ثم بعد نجاح AR1B:

```text
AR1C_GOVERNED_AGENTIC_RAG_PILOT_IMPLEMENTATION=AUTHORIZED
```

## قرار الإطلاق العام

أي انتقال إلى Chat عام أو واجهة عامة يحتاج دفعة منفصلة لا تقل عن:

```text
PUBLIC_RELEASE_CORPUS_GATE
PUBLIC_RAG_SAFETY_UAT
RIGHTS_AND_ATTRIBUTION_RELEASE_DECISION
PUBLIC_CITATION_UX_APPROVAL
PRODUCTION_APPROVAL
```
