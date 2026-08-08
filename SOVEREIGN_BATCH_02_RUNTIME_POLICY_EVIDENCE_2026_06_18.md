# Runtime Policy Evidence — Sovereign Batch 02

**Date:** 2026-06-18  
**Scope:** توثيق السياسة الموجودة في runtime بخصوص المعرفة المعتمدة.

---

## 1) أدلة من الكود الحالي

تمت مراجعة المسارات الحالية داخل الحزمة v42، وتبيّن أن السياسة التالية موجودة مفاهيميًا في runtime:

- `knowledge.list` يطلب `isActive: 1` للقراءة العامة.
- `runtimeRepository` عند قراءة `assistant.knowledge_documents` يفلتر `status='approved'` و `is_chat_eligible=true` عند طلب المعرفة النشطة.
- `localRuntimeStore` يجعل `isChatEligible=1` فقط عند `status='approved'`.
- مخرجات الأدوات الذكية تنشئ `generated_knowledge_draft` أو `review_only` ولا تعتمد نفسها تلقائيًا.

---

## 2) تفسير السيادة

هذا يعني أن مسار runtime الحالي يدعم القاعدة:

```text
لا معرفة للشات إلا بعد الاعتماد.
```

لكن هذه القاعدة لا تعني أن corpus المعرفة مكتمل.  
لذلك تم تثبيت أن العينات الثمانية هي seed أولي فقط، وأن باقي المصادر مطلوبة.

---

## 3) حدود الدليل

هذه الدفعة لم تشغّل Remote Staging ولم تنفذ RBAC/RLS negative UAT.  
الدليل هنا هو review static/runtime policy من baseline المرفوع، وليس دليل production.

---

## 4) مخاطر قائمة

| الخطر | مستوى الخطورة | المعالجة |
|---|---:|---|
| اعتبار 8 عينات corpus كامل | عالٍ | تم إنشاء سجل فجوة وإلزام عبارة Seed-8 |
| اعتماد مخرجات الأدوات تلقائيًا | متوسط | السياسة تمنع ذلك وتبقيها review |
| نقص citations | متوسط | يؤجل إلى Citation-first batch |
| غياب staging evidence | عالٍ | يبقى ضمن 29A |
| مصطلح `review_only` بدل `in_review` | منخفض/متوسط | يوثق كمرادف مرحلي ويعالج لاحقًا عند توحيد schema |

---

## 5) القرار

```text
RUNTIME_POLICY_SUPPORTS_APPROVED_ONLY_KNOWLEDGE
STATIC_REVIEW_ACCEPTED
REMOTE_STAGING_EVIDENCE_NOT_SUPPLIED
```
