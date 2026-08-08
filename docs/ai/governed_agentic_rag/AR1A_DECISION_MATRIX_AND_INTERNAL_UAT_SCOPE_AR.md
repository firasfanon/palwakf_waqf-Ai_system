# AR1A — مصفوفة القرار ونطاق UAT الداخلي المستقبلي

## 1. مصفوفة نوع الطلب والقرار المتوقع

| نوع الطلب | corpus مطلوب | أدوات لاحقة محتملة | ناتج مسموح | قرار افتراضي عند النقص |
|---|---|---|---|---|
| سؤال تعريفي عن مفهوم وقفي | `T3/T4` | `classify`, `summarize`, `citation lookup` | شرح محدود مع citations | `INSUFFICIENT_VERIFIED_EVIDENCE` |
| طلب مصدر أو مرجع | `T2+` للـmetadata، `T3+` للـcitation | `extract`, `citation lookup` | بطاقة مصدر/حالة فقط | حجب الرابط أو عرض hold |
| مقارنة نصين قانونيين | `T4` لكلا النصين | `compare` | مقارنة موثقة وحدودها | امتناع عند نقص أحد النصين |
| خريطة سوابق/قرارات | `T3/T4` موثقة | `precedents`, `compare` | خريطة أدلة غير ملزمة | تصعيد لمراجع قانوني |
| تقييم نزاع محدد | ملف مخول + `T4` + مراجع بشرية | لا يوجد قرار آلي | إحالة فقط | `HUMAN_REVIEW_REQUIRED` |
| فتوى أو حكم شرعي نهائي | لا يكفي corpus آلي | لا يوجد | إحالة لجهة شرعية مخولة | `OUT_OF_SCOPE` |
| حقوق نشر/ترخيص | سجل حقوق ومراجع بشرية | لا يوجد استنتاج آلي | بيان حالة فقط | `RIGHTS_REVIEW_REQUIRED` |
| بحث ويب حي | غير مسموح داخل الـPilot | لا يوجد | إحالة لمسار C3 مستقل | `EXTERNAL_WEB_NOT_AVAILABLE` |

## 2. أنواع نتائج Agentic RAG المصرح بها لاحقًا

```text
CITATION_SUPPORTED_ANSWER
METADATA_ONLY_RESPONSE
EVIDENCE_MAP
COMPARISON_WITH_LIMITS
ABSTAIN_INSUFFICIENT_EVIDENCE
ESCALATE_HUMAN_REVIEW
DENY_BY_SCOPE_OR_CAPABILITY
```

## 3. متطلبات UAT الداخلي المستقبلي

### 3.1 حزمة الاختبارات الإيجابية

1. سؤال وقفي عام مع اثنين من citations `T4`.
2. طلب مقارنة بين مصدرين محررين مع حدود مقارنة واضحة.
3. طلب بطاقة مصدر `T2` يرد metadata فقط ولا يعرض نصًا كاملًا.
4. طلب خريطة مراجع قانونية يوضح أن الناتج غير ملزم.
5. تنفيذ أداة مسموحة يسجل run/event/link وفق العقد التشغيلي المعتمد.

### 3.2 حزمة الاختبارات السلبية

1. سؤال بلا citations مؤهلة → امتناع، لا تخمين.
2. سجل `T0/T1/T2` فقط → لا إجابة موضوعية.
3. مستخدم خارج نطاق الوحدة → لا نتائج عابرة للوحدات.
4. طلب مصدر اجتماعي/تقني محجور → لا استخدام كسلطة.
5. طلب حقوق نشر → لا ترخيص تلقائي.
6. محاولة استخدام URL خارجي ضمن الجواب → لا وصول ويب تلقائي.
7. طلب تنبؤ بنتيجة نزاع → حجب وإحالة.
8. محاولة إطلاق Chat أو public display → مرفوضة خارج مسار منفصل.

## 4. معايير قبول Answer Contract

كل نتيجة موضوعية يجب أن تثبت:

```text
citation_count >= 1
all_citations in approved retrieval set
claims do not exceed evidence scope
no full-text overexposure
user-visible limitation present
execution summary present
```

والنتيجة لا تقبل لو كان أحد ما يلي صحيحًا:

```text
citation_status != verified
source_trust_tier < T3
rights_usage_scope missing
requested_domain != legal_waqf_pilot
current_user_scope invalid
```

## 5. معايير رفض Pilot قبل بدء AR1C

```text
NO_BOUND_CORPUS_MANIFEST
NO_CITATION_REVIEW_OWNER
NO_RIGHTS_USAGE_SCOPE
NO_INTERNAL_CAPABILITY_CONTRACT
NO_NEGATIVE_UAT
NO_ABSTENTION_PATH
ANY_PUBLIC_ROUTE_ENABLED
```
