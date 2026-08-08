# Baseline Acceptance State — AR1 Source Provenance & Rights Operational UX Refinement V1

## القرار

```text
MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1=ACCEPTED_LOCAL_ONLY
STATIC_VERIFY=PASS
PATCH_APPLY=PASS
BROWSER_UAT=PASS
C3_C4_PRIORITY_FLOW=PASS
C4_ZERO_CANDIDATE_GUIDANCE=PASS
AR1_SESSION_GATING=PASS
RIGHTS_LAYER_SQL_NOT_APPLIED
STAGING_NOT_APPROVED
PRODUCTION_NOT_APPROVED
```

## القبول يشمل

1. ظهور المسار التشغيلي للمشغّل قبل إعداد الجلسة.
2. الانتقال الصحيح من انتظار C3/C4 إلى أهلية المادة بعد اكتمالهما مع صفر مرشحين قابلين للربط.
3. عدم إظهار نموذج الحقوق أو جلسة AR1 قبل تحقق مادة مؤهلة حتميًا.
4. استمرار عزل Chat وRelease ومنع أي كتابة على طبقات المعرفة والحقوق.

## القبول لا يشمل

- تفعيل طبقة الحقوق أو تطبيق `Mega Batch C` SQL.
- إصلاح `PGRST205` عبر تغيير قاعدة البيانات أو أي bypass.
- إنشاء مصدر أو ملف حقوق أو رابط مادة.
- تشغيل AR1 بجلسة إيجابية؛ إذ لا توجد مادة C4 حتمية مؤهلة في الدليل المحلي المقبول.
- Staging أو Production.

## baseline ID

`PALWAKF_ASSISTANT_SOURCE_BASELINE_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_20260706`
