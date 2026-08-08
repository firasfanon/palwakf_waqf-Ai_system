# Knowledge Uplift Backlog Plan — Sovereign Batch 02

**Date:** 2026-06-18  
**Purpose:** تجهيز خطة رفع باقي مصادر المعرفة والمراجع بعد تثبيت أن العينات الثمانية Seed فقط.

---

## 1) مبدأ الخطة

لا يتم رفع المعرفة على شكل ملفات متفرقة بلا حوكمة.  
كل مصدر يجب أن يدخل ضمن batch معرفي له:

- تصنيف.
- مصدر أصلي.
- مستوى سلطة.
- reviewer.
- approval decision.
- eligibility للشات.
- أثر في changelog/baseline.

---

## 2) batches المعرفة المقترحة

### Knowledge Batch 03 — Official Legal References Intake

**الطبيعة:** رفع مصادر قانونية/سيادية.  
**الأولوية:** عالية.  
**المخرجات:** مستندات قانونية مصنفة ومعتمدة جزئيًا أو في review.

شروط الإغلاق:

- source register مكتمل.
- لا وثيقة تظهر للشات قبل الاعتماد.
- review trace لكل وثيقة.
- citation metadata عند توفر الصفحات/المواد.

---

### Knowledge Batch 04 — Administrative Procedures + Service Manuals

**الطبيعة:** رفع إجراءات العمل والخدمات.  
**الأولوية:** عالية.  
**الربط:** الخدمات الإلكترونية، tasks، cases، billing عند الحاجة.

شروط الإغلاق:

- التمييز بين إجراء رسمي ومعلومة توعوية.
- عدم إصدار الشات قرارًا إداريًا ملزمًا دون مرجع.
- عرض source/citation.

---

### Knowledge Batch 05 — Waqf Assets Referential Corpus

**الطبيعة:** ربط معرفة الأصول الوقفية بمفتاح `waqf_asset_id`.  
**الأولوية:** متوسطة/عالية.  
**القاعدة:** `waqf_assets` هو الكيان التشغيلي المركزي.

شروط الإغلاق:

- عدم إنشاء أصل جديد من المعرفة.
- كل ربط أصل يتم عبر `waqf_asset_id`.
- لا استخدام `mustakshif` كمصدر تشغيلي.

---

### Knowledge Batch 06 — Fiqh + Historical Reference Corpus

**الطبيعة:** مراجع فقهية وتاريخية مساندة.  
**الأولوية:** متوسطة.  
**التحذير:** لا تستخدم كمصدر إداري مباشر إلا إذا كانت مدعومة بقرار رسمي.

---

### Knowledge Batch 07 — Citation-first Chat Closure

**الطبيعة:** تطوير/حوكمة استشهادات.  
**الأولوية:** بعد رفع أول دفعة رسمية من المصادر.  
**المخرجات:** إجابات الشات تظهر grounding/citations بوضوح.

---

## 3) قالب تسليم أي batch معرفة

كل batch معرفة لاحق يجب أن يسلم:

1. `SOURCE_REGISTER.md`
2. `REVIEW_APPROVAL_MATRIX.md`
3. `IMPORT_RESULT.md`
4. `CHAT_ELIGIBILITY_REPORT.md`
5. `ERROR_RECORD.md`
6. `CHANGELOG.md`
7. `SESSION_HANDOFF.md`
8. `BASELINE_POINTER.md`
9. ZIP تجميعي.

---

## 4) حالات القبول والرفض

| الحالة | القبول |
|---|---|
| مصدر رسمي واضح | يقبل للرفع كـ draft ثم review |
| مصدر رسمي دون رابط/ملف | يبقى pending evidence |
| مصدر غير رسمي | يصنف reference/unverified ولا يظهر للشات قبل قرار |
| نص مولد آليًا | review_only فقط |
| وثيقة مرتبطة بأصل وقفي | يلزم `waqf_asset_id` عند الربط التشغيلي |
| وثيقة مكانية/تاريخية | لا تنتقل إلى تشغيل الأصول إلا عبر owner schema |

---

## 5) القرار

```text
KNOWLEDGE_UPLIFT_BACKLOG_READY
ACTUAL_UPLOAD_PENDING_SOURCE_FILES
NEXT_VALID_BATCH_KNOWLEDGE_03_OR_29A_EVIDENCE_INTAKE
```
