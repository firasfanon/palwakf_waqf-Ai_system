# Review / Approval Closure Matrix — Sovereign Batch 02

**Date:** 2026-06-18  
**Scope:** مسار مراجعة واعتماد المعرفة ومخرجات الأدوات الذكية.

---

## 1) القرار المختصر

تم إغلاق سياسة review/approval كحوكمة تشغيلية، وليس كاعتماد محتوى شامل.  
المصادر غير المرفوعة لا يمكن مراجعتها أو اعتمادها. لذلك يكون الإغلاق هنا هو إغلاق **المسار والسياسة** لا إغلاق **corpus المعرفة الكامل**.

---

## 2) مصفوفة الحالات

| المسار | الحالة | هل يظهر للشات؟ | القرار |
|---|---|---:|---|
| وثيقة seed من الثمانية | `approved` فقط إذا مثبتة كذلك | نعم إذا `isChatEligible=true` | مقبولة كعينة أولى |
| وثيقة seed غير معتمدة | `draft/review_only/rejected` | لا | تبقى إدارية |
| مخرج أداة ذكية | `pending` أو `review_only` | لا | يحتاج اعتماد |
| مصدر رسمي جديد | `draft` عند الرفع | لا | يمر بالمراجعة |
| مصدر مرفوض | `rejected` | لا | يحفظ أثر القرار |
| مصدر مؤرشف | `archived` | لا | غير نشط |

---

## 3) قواعد الاعتماد

### Rule A — Approved-only Chat

```text
Only approved + chat eligible knowledge can be used in direct chat answers.
```

### Rule B — Tool Output is Draft

```text
Smart tool output is never automatically authoritative knowledge.
```

### Rule C — Seed-8 Scope

```text
The 8 current records are initial seed/sample records used during database construction and runtime linkage.
```

### Rule D — Source Gap Disclosure

```text
Remaining official sources and references are pending upload and approval.
```

---

## 4) Review action semantics

| الإجراء | الحالة الناتجة | الأثر |
|---|---|---|
| إرسال للمراجعة | `review_only` / `in_review` | لا يظهر للشات |
| اعتماد | `approved` | يظهر للشات عند `isChatEligible=true` |
| رفض | `rejected` | لا يظهر للشات |
| إعادة لمسودة | `draft` | لا يظهر للشات |
| أرشفة | `archived` | لا يظهر للشات |

---

## 5) ربط الأدوات الذكية

| الرابط | السياسة |
|---|---|
| `generated_knowledge_draft` | رابط مسودة فقط |
| `ai_tool_run.approved` | اعتماد تشغيل الأداة لا يعني اعتماد المعرفة الناتجة |
| `knowledge_document.approved` | الاعتماد الوحيد الذي يفعّل معرفة للشات |
| `knowledge_citation` | مطلوب قبل توسيع الاستشهادات الرسمية |

---

## 6) عناصر UAT المطلوبة لاحقًا

هذه المصفوفة جاهزة للتنفيذ عند توفر بيئة staging والبيانات:

| الاختبار | المتوقع | الحالة الآن |
|---|---|---|
| مستخدم غير إداري يحاول اعتماد وثيقة | رفض RBAC/RLS | Pending 29A |
| محرر يرفع مصدر جديد | يدخل draft/review | Pending source upload |
| مراجع يعتمد مصدرًا | يتحول approved + trace | Pending actual corpus |
| الشات يسأل عن محتوى غير معتمد | لا يستخدمه | Policy closed; evidence pending |
| الشات يستشهد بمصدر معتمد | يعرض citation/grounding | Pending citation-first batch |

---

## 7) قرار الإغلاق

```text
REVIEW_APPROVAL_POLICY_CLOSED
FULL_CONTENT_REVIEW_NOT_STARTED_FOR_MISSING_SOURCES
RBAC_RLS_NEGATIVE_UAT_PENDING_REMOTE_STAGING
```
