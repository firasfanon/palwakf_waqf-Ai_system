# AR1A — العقد الحاكم لمعمارية Pilot Agentic RAG للبحث الوقفي والقانوني

## 1. تعريف الدفعة وحدودها

**الاسم:** `MEGA_BATCH_AR1A — GOVERNED_AGENTIC_RAG_PILOT_ARCHITECTURE_AND_RELEASE_CONTRACT`

**طبيعة الدفعة:** توثيق معماري وحوكمي فقط. هذه الدفعة لا تضيف مسار Chat، ولا Agent Orchestrator تشغيلي، ولا RAG Runtime، ولا جدول قاعدة بيانات، ولا ربط مصادر، ولا تعيين حقوق، ولا إطلاق عام أو داخلي للمحتوى.

AR1A يثبت عقد الانتقال من طبقات C1–C4 إلى Pilot محدود لاحقًا، بحيث لا يصبح Agentic RAG واجهة نموذج لغوي فوق بيانات غير محكومة.

```text
AR1A_ARCHITECTURE_ONLY=YES
AR1A_IMPLEMENTATION=NOT_AUTHORIZED_BY_THIS_DOCUMENT
NO_DATABASE_WRITE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_FULL_TEXT_RETENTION
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PUBLIC_DISPLAY_RELEASE
NO_PRODUCTION
```

## 2. نقطة الانطلاق المعتمدة

طبقات C1–C4 أثبتت الاستعادة والتجميع والتحقق الخارجي المحدود وخطة اختيار مصادر متحققة تقنيًا. هذه النتائج لا تشكل بمفردها corpus قابلًا للإجابة الموضوعية أو القانونية.

الحالة الحاكمة بعد C4:

```text
C1_PROVENANCE_RECOVERY=ACCEPTED
C2_AUTONOMOUS_PROVENANCE_AUDIT=ACCEPTED
C3_EXTERNAL_METADATA_VERIFICATION=ACCEPTED
C4_CONTROLLED_RELEASE_PLAN=ACCEPTED
VERIFIED_SUBSTANTIVE_CORPUS_BOUND_TO_AGENT=NOT_YET
PUBLIC_CHAT_ELIGIBILITY=NOT_AUTHORIZED
```

لذلك لا يجوز للـPilot المستقبلي أن يساوي بين قابلية الوصول للرابط، أو وجود عنوان ومؤلف، أو اختيار C4، وبين حق استخدام النص أو صحة الإجابة القانونية.

## 3. هدف AR1

إنشاء Pilot داخلي ضيق لمجال واحد:

```text
البحث القانوني والوقفي الموثق
```

وظيفته ليست إصدار فتوى أو رأي قانوني حاسم أو قرار إداري، بل إنتاج **خريطة أدلة قابلة للتتبع** توضح:

1. ما الذي سأل عنه المستخدم؟
2. ما نوع المعرفة التي يحتاجها؟
3. ما المصادر أو الاستشهادات المسموح استخدامها داخل corpus المحرر؟
4. ما الذي تدعمه الأدلة وما الذي لا تدعمه؟
5. هل يلزم الامتناع أو الإحالة إلى مراجع بشري؟

## 4. نموذج الثقة والمستويات

| المستوى | الوصف | صلاحية Agentic RAG لاحقًا |
|---|---|---|
| `T0_RAW_OR_TECHNICAL` | سجل خام، أثر تقني، اختبار، أو حالة حجر | ممنوع تمامًا |
| `T1_PROVENANCE_ONLY` | دليل منشأ خام أو عنوان/مؤلف بلا تحقق كافٍ | غير قابل للإجابة؛ قد يظهر للمراجع المخول فقط |
| `T2_VERIFIED_METADATA_CANDIDATE` | مرشح C4 له تحقق تقني محدود وmetadata | لا يجيب موضوعيًا؛ يستخدم فقط في التخطيط والـcitation review |
| `T3_REVIEWED_CITATION` | مصدر/استشهاد راجعه إنسان مخول وقيّد مجال استخدامه | قابل للاسترجاع في Pilot داخلي وفق القيود |
| `T4_APPROVED_INTERNAL_CORPUS` | مادة أو مقتطفات محررة للاستخدام الداخلي ومقيدة بالحقوق | قابل للإجابة الداخلية الموثقة |
| `T5_PUBLIC_RELEASED_CORPUS` | مادة تمت مراجعة المصدر والحقوق والمحتوى وإطلاقها علنًا | لا يدخل إلا بعد بوابة مستقلة لاحقة |

**القاعدة:** C4 لا يرفع أي عنصر تلقائيًا من `T2` إلى `T3` أو أعلى.

## 5. المعمارية المرجعية للـPilot

```text
طلب مستخدم داخلي
  ↓
[Request Classification]
  ↓
[Authority + Capability Resolution]
  ↓
[Risk / Domain Gate]
  ↓
[Retrieval Plan]
  ↓
[Controlled Corpus Adapter]
  ↓
[Evidence Sufficiency + Citation Policy]
  ↓
[Permitted Tool Plan]
  ↓
[Answer / Abstain / Human Review Escalation]
  ↓
[User-visible Execution Trace + Audit Events]
```

### 5.1 Request Classification

يصنف الطلب قبل أي بحث إلى واحد من الأنماط:

```text
FACTUAL_RESEARCH
SOURCE_DISCOVERY
CITATION_LOOKUP
TEXT_COMPARISON
PRECEDENT_MAPPING
LEGAL_WAQF_EVIDENCE_MAP
CASE_SPECIFIC_DECISION_REQUEST
RIGHTS_OR_LICENSE_REQUEST
UNSUPPORTED_OR_OUT_OF_SCOPE
```

### 5.2 Authority + Capability Resolution

لا يكفي دور المستخدم العام. كل تشغيل لاحق يجب أن يحسم:

```text
(actor identity, authenticated role, effective authority, granted capability, allowed unit scope, current unit context, request risk)
```

الحد الأدنى المقترح للقدرات، دون إنشاء صلاحيات في AR1A:

```text
assistant.research.internal
assistant.research.legal_waqf
assistant.research.citation_view
assistant.research.audit_view
assistant.research.pilot_admin
```

كل قدرة تبقى مسودة حتى يتم تعريفها وربطها فعليًا في مرحلة التنفيذ.

### 5.3 Retrieval Plan

الخطة التشغيلية المقترحة ليست chain-of-thought معروضة للمستخدم. هي قرار قابل للتدقيق يحدد:

- نوع السؤال ونطاقه.
- طبقة corpus المؤهلة (`T3` أو `T4` فقط للاستدلال الموضوعي).
- نوع الاسترجاع: citation-first، metadata-only، comparison، أو refusal.
- الأدوات المسموح بها في هذه الجلسة.
- الحد الأدنى من الأدلة المطلوبة.
- سبب الامتناع أو التصعيد عند عدم اكتمالها.

### 5.4 Controlled Corpus Adapter

يجب أن يكون موصل corpus لاحقًا مقيدًا بالاستعلامات التالية فقط:

```text
released_for_internal_pilot=true
knowledge_status in (reviewed, approved_internal)
source_trust_tier in (T3, T4)
rights_usage_scope allows requested internal use
citation_status=verified
```

ولا يجوز له استرجاع:

```text
T0/T1/T2 records
quarantined records
technical markers
test URLs
social-only evidence as legal authority
unreviewed full text
content outside authorized unit/domain scope
```

## 6. سياسة الأدوات

الأدوات الموجودة في `assistant.ai_tool_runs` يمكن إعادة استخدامها لاحقًا فقط بعد تمريرها عبر مخطط التنفيذ المقيد:

| الأداة | الاستخدام المسموح في Pilot لاحقًا | القيد |
|---|---|---|
| `summarize` | تلخيص مادة `T4` محررة فقط | لا تلخيص نص غير مصرح بالاحتفاظ به |
| `extract` | استخراج metadata أو citation fields من مادة مسموحة | لا يستخرج أو يخزن محتوى خارجيًا مباشرًا |
| `classify` | تصنيف السؤال والمخاطر | ليس قرار اعتماد أو حقوق |
| `compare` | مقارنة نصوص/استشهادات داخل corpus محكوم | لا يقارن مصادر خارج نطاق الاستخدام |
| `precedents` | رسم خريطة سوابق أو مراجع معتمدة | لا يعطي حكمًا ملزمًا |
| `predict` | غير مسموح في Pilot القانوني/الوقفي الأول | لا توقع نتيجة قضية أو قرار |

**الإنترنت الخارجي:** غير مسموح داخل AR1C كأداة إجابة افتراضية. C3 هو مسار فحص خارجي مستقل ومقيد، ولا يتحول إلى Web-search عام للوكيل.

## 7. عقد الإجابة والاستشهاد

كل إجابة موضوعية في Pilot لاحقًا يجب أن تحتوي، عند وجود corpus مؤهل:

```text
answer_mode
scope_and_limit
claims[]
citations[]
evidence_sufficiency
confidence_band
known_gaps
review_or_abstention_reason
execution_summary
```

### 7.1 قواعد الاستشهاد

- لا توجد دعوى موضوعية قانونية أو وقفية بلا استشهاد واحد على الأقل من `T3` أو `T4`.
- كل استشهاد يعرض: المعرف، العنوان، الجهة/الناشر عند توفره، الموضع أو المقتطف المسموح، وحالة المراجعة.
- لا تعرض الإجابة نصًا محميًا يتجاوز ما تسمح به الحقوق أو سياسة الاقتباس.
- لا تستخدم C3 reachability كاستشهاد موضوعي أو كدليل ترخيص.

### 7.2 نطاقات الثقة

```text
SUPPORTED_BY_VERIFIED_CITATIONS
PARTIALLY_SUPPORTED_LIMITED_CORPUS
INSUFFICIENT_VERIFIED_EVIDENCE
OUT_OF_SCOPE_OR_REVIEW_REQUIRED
```

لا يجوز استخدام درجة رقمية تبدو علمية بلا معيار واضح؛ النطاقات الوصفية أعلاه هي الافتراضية.

## 8. الامتناع والتصعيد البشري

الـPilot يجب أن يمتنع أو يصعّد للمراجعة البشرية عند:

- غياب عنصر `T3` أو `T4` مناسب.
- طلب فتوى أو رأي قانوني نهائي أو تمثيل قضائي.
- طلب قرار حول واقعة فردية أو نزاع أو معاملة دون ملف كامل ومراجع مخولة.
- تعارض المصادر أو عدم كفاية citation coverage.
- عدم تطابق نطاق المستخدم أو الوحدة أو القدرة.
- سؤال عن الحقوق أو الترخيص دون مراجعة حقوق بشرية مختصة.
- طلب استخدام مصدر خارجي أو مادة غير محررة.

صيغة الامتناع يجب أن تكون عملية:

```text
لا توجد مادة موثقة ومحررة ضمن corpus التجريبي تكفي لدعم إجابة موثوقة على هذا السؤال.
تم حجب الاستنتاج الموضوعي، ويستلزم الأمر مراجعة بشرية أو إدخال مصدر معتمد وفق بوابة مستقلة.
```

## 9. سجل التنفيذ والمساءلة

لا يعرض المستخدم سلسلة التفكير الداخلية. بدلاً من ذلك يظهر له **ملخص تنفيذ مقيد**:

```text
request_category
corpus_scope_used
tools_used
citation_count
confidence_band
withheld_actions
reason_for_abstention_or_escalation
```

وفي السجل التشغيلي تحفظ المرحلة اللاحقة، عند تفويضها، معرّفات تشغيل مرتبطة بـ:

```text
assistant.ai_tool_runs
assistant.ai_tool_run_events
assistant.ai_tool_run_links
conversation/request correlation id
retrieval set identifier
policy decision identifier
```

AR1A لا ينشئ حقولًا أو جداول جديدة.

## 10. حدود الفصل بين المسارات

| المسار | ما يسمح به | ما لا يسمح به |
|---|---|---|
| `internal_research` | استكشاف metadata وخطة أدلة للمخولين | أجوبة موضوعية بلا corpus `T3/T4` |
| `metadata_exploration` | عرض حالة المصدر والمنشأ والتحقق | تحرير مصدر أو حق أو نص |
| `verified_citation_answering` | إجابة داخلية موثقة من `T3/T4` | إطلاق عام أو اعتماد قانوني حاسم |
| `public_chat_eligibility` | غير مفعل في AR1A | أي نشر أو إتاحة عامة |
| `external_source_verification` | C3 مستقل ومشغل يدويًا | استخدام الويب كوكيل إجابة حر |

## 11. بوابات الانتقال

### الانتقال من AR1A إلى AR1B — Controlled Corpus Binding

لا يبدأ AR1B إلا بعد تحقق جميع البنود:

```text
AR1A_ARCHITECTURE_REVIEW=APPROVED
PILOT_DOMAIN=legal_waqf_research_only
C4_COHORT_DECISION=RECORDED
T3_OR_T4_CANDIDATE_SET=EXPLICITLY_IDENTIFIED
CITATION_REVIEW_OWNER=ASSIGNED
RIGHTS_USAGE_SCOPE=RECORDED_PER_CANDIDATE
INTERNAL_USER_CAPABILITY_MODEL=APPROVED
ABSTENTION_AND_ESCALATION_COPY=APPROVED
NO_PUBLIC_CHAT_RELEASE=RECONFIRMED
```

### الانتقال من AR1B إلى AR1C — Implementation

```text
BOUND_CORPUS_MANIFEST=APPROVED
RETRIEVAL_FILTERS=TESTED
NEGATIVE_RETRIEVAL_UAT=PASS
CITATION_CONTRACT_UAT=PASS
AUTHORITY_SCOPE_UAT=PASS
TOOL_RUN_AUDIT_CONTRACT=PASS
HUMAN_REVIEW_ESCALATION_PATH=READY
```

### الانتقال من AR1C إلى Limited Internal UAT

```text
INTERNAL_ONLY_ROUTE=PASS
NO_PUBLIC_ROUTE=PASS
NO_EXTERNAL_WEB_AGENT=PASS
NO_UNVERIFIED_CORPUS_RETRIEVAL=PASS
NO_RIGHTS_BYPASS=PASS
ABSTENTION_BEHAVIOR=PASS
```

## 12. قرارات ممنوعة صراحة

```text
NO_AUTONOMOUS_LEGAL_CONCLUSION
NO_AUTONOMOUS_FATWA
NO_CASE_OUTCOME_PREDICTION
NO_RIGHTS_INFERENCE
NO_AUTOMATIC_SOURCE_PROMOTION
NO_CHAT_OR_PUBLIC_RELEASE
NO_FULL_TEXT_CAPTURE_FROM_EXTERNAL_URL
NO_CROSS_UNIT_DATA_LEAKAGE
NO_UNEXPLAINED_TOOL_ACTION
NO_PRODUCTION
```

## 13. مخرج AR1A النهائي

النتيجة المقبولة لهذه الدفعة ليست Agent عاملًا، بل عقد موحد يمكن تقييم كل تغيير لاحق عليه:

```text
ARCHITECTURE=DEFINED
CORPUS_BINDING=NOT_YET_AUTHORIZED
RUNTIME_IMPLEMENTATION=NOT_YET_AUTHORIZED
LIMITED_INTERNAL_UAT=NOT_YET_AUTHORIZED
PUBLIC_RELEASE=NOT_AUTHORIZED
```
