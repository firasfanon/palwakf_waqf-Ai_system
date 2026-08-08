# Error Record — Sovereign Batch 02

**Date:** 2026-06-18  
**Batch:** Sovereign Batch 02 — Knowledge Uplift + Review/Approval Closure

---

## 1) Error / Gap Summary

```text
KNOWLEDGE_SOURCE_CORPUS_INCOMPLETE_SEED8_ONLY
```

## 2) السبب

العينات الثمانية الحالية أُنشئت كدفعة أولى أثناء بناء قاعدة البيانات ومسار الربط، ولم يتم رفع باقي مصادر المعرفة والمراجع الرسمية داخل baseline الحالي أو هذه الجلسة.

## 3) الملفات/المسارات المتأثرة

| المسار | التأثير |
|---|---|
| `assistant.knowledge_documents` | يحتوي عينات/وثائق أولية فقط |
| `assistant.knowledge_sources` | يحتاج بقية المصادر الرسمية |
| `assistant.reference_documents` | يحتاج بقية الملفات المرجعية |
| `assistant.knowledge_citations` | يحتاج توسيع citation coverage |
| `/knowledge#/chat` | يجب أن يبقى approved-only |
| `/knowledge#/admin/knowledge` | مسار review/approval لإدخال المصادر اللاحقة |

## 4) ما فشل أو لم يكتمل

- لم يتم رفع بقية مصادر المعرفة.
- لم يتم اعتماد corpus معرفي شامل.
- لم تُغلق أدلة remote staging الخاصة بـ 29A.
- لم تُغلق RBAC/RLS negative UAT.

## 5) الحل المطبق في هذه الدفعة

- توثيق العينات الثمانية كـ Seed Batch 1 فقط.
- إنشاء سجل فجوة المصادر.
- تثبيت سياسة review/approval.
- تثبيت أن مخرجات الأدوات لا تعتمد نفسها تلقائيًا.
- تحديث الدليل الشامل والـ baseline.

## 6) الحل المتبقي

- رفع المصادر الرسمية المتبقية ضمن Knowledge Batch 03 وما بعده.
- إغلاق review/approval بالمحتوى الفعلي لا بالسياسة فقط.
- تشغيل 29A عند توفر remote staging evidence.
- تشغيل Citation-first chat بعد توفر مصادر معتمدة كافية.

## 7) آخر baseline مستقر

```text
waqf_ai_model_hybrid_llm_admin_v42_final_comprehensive_handoff_baseline_2026_06_18.zip
```

## 8) Baseline الناتج

```text
waqf_ai_model_hybrid_llm_admin_v43_sovereign_batch_02_knowledge_uplift_review_approval_closure_2026_06_18.zip
```


---

## 9) PNPM validation limitation

```text
PNPM_NOT_AVAILABLE_IN_CONTAINER_FOR_DOCS_ONLY_BATCH
```

`pnpm run check` لم يعمل داخل بيئة الحاوية لأن `pnpm` غير متوفر، ومحاولة `npx pnpm run check` لم تكتمل ضمن نافذة التنفيذ المتاحة أثناء محاولة جلب pnpm. لا يوجد أثر compile مباشر لأن هذه الدفعة لم تعدّل كود التطبيق، لكن يبقى مطلوبًا تشغيل `pnpm.cmd run check` محليًا قبل أي دفعة لاحقة تغيّر الكود.
