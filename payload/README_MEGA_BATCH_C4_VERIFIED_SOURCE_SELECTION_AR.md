# Mega Batch C4 Reconciliation — Verified Source Selection and Controlled Knowledge Release Plan

## نبذة عربية
هذه حزمة **تصالحية آمنة** بُنيت على لقطة المشروع الفعلية المرفوعة من جهازك في:
`C4_RECON_BASELINE_CAPTURE_20260704_000202.zip`.

سببها أن حزمة C4 السابقة افترضت Baseline C3 مختلفًا، بينما كان مشروعك يحتوي بالفعل على طبقة C4 أخرى بعنوان **Controlled Source Registry and Rights Gate Design**. لا تحذف هذه الحزمة الطبقة السابقة ولا تستبدلها؛ بل تضيف فوقها خطة اختيار المصادر المتحققة تقنيًا وإطلاق بيانات وصفية محكومة فقط.

## ما تضيفه
- خدمة `server/verifiedSourceSelection.ts`.
- قراءة C4 إضافية: `sourceProvenance.controlledReleasePlan`.
- ذاكرة C3 مؤقتة داخل عملية الخادم لمدة 30 دقيقة، بلا قاعدة بيانات وبلا تخزين دائم.
- سطح إداري جديد لخطة اختيار المصادر المتحققة تقنيًا، إلى جانب سطح تصميم سجل المصدر القائم.
- Cohort قصوى من 5 مرشحين لبيانات وصفية/استشهادات فقط عندما يوجد:
  - مرشح رسمي في C2،
  - دليل C3 حديث وHTTP 2xx،
  - DNS عام آمن،
  - لا تعارض URL،
  - مادة حالية مرشحة مرتبطة.

## ما لا تفعله
```text
NO_SQL_OPERATOR_APPLY
NO_DATABASE_WRITE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_FULL_TEXT_RETENTION
NO_PUBLIC_DISPLAY_RELEASE
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PRODUCTION
```

## ترتيب التشغيل
1. طبّق الحزمة.
2. شغّل بوابات `check`, `build`, وverifiers.
3. شغّل C3 يدويًا في نفس عملية الخادم.
4. افتح خطة C4 قبل انتهاء TTL البالغ 30 دقيقة.
5. النتيجة تخطيطية فقط، ولا تخوّل أي مصدر أو مادة للإطلاق.

## قاعدة مهمة
نجاح C3 أو اختيار C4 لا يثبت هوية الناشر أو الترخيص أو حقوق النص الكامل. كلمة «متحققة» في C4 تعني تحققًا تقنيًا ضيقًا من C2 + C3 فقط.
