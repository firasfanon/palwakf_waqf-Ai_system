# MEGA_BATCH_C3 — AUTONOMOUS_EXTERNAL_SOURCE_VERIFICATION_AND_FINAL_RELEASE_MATRIX

## نبذة عربية
هذه حزمة **تدقيق خارجي قرائي محدود** تلي C2. لا تُلزم المشغّل بمراجعة صفوف المعرفة، ولا تقوم بأي كتابة على المصادر أو الحقوق أو المراجع أو حالة النشر.

C3 لا يبدأ تلقائيًا مع فتح الصفحة. يبدأ فقط عند الضغط على:

```text
تشغيل فحص C3 الخارجي
```

ثم يفحص عناقيد C2 المؤهلة فقط (الرسمية، الأكاديمية/المستودعات، وروابط المرشحين العامة) وفق سقف صريح لا يتجاوز 32 رابطًا في الجولة.

## ما الذي يتحقق منه C3؟

- صحة بنية رابط HTTP(S) ضمن سياسة منافذ محددة.
- منع العناوين المحلية والخاصة والمحجوزة عبر DNS safety guard ضد SSRF.
- قابلية الوصول اللحظية عبر `HEAD` أو `GET` محدود النطاق عند رفض `HEAD`.
- كود HTTP ونوع المحتوى والتحويل غير المتابع.
- عدم اتباع التحويلات تلقائيًا.

## ما الذي لا يفعله C3؟

```text
NO_DOCUMENT_BODY_READ_OR_RETENTION
NO_REDIRECT_FOLLOW
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_AUTOMATIC_PUBLISHER_IDENTITY_ASSERTION
NO_AUTOMATIC_LICENSE_ASSERTION
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PUBLIC_DISPLAY_RELEASE
NO_SQL_OPERATOR_APPLY
NO_PRODUCTION
```

نجاح HTTP يعني أن الرابط قابل للوصول خلال وقت الفحص فقط. لا يعني أن الجهة ناشرٌ مثبت، ولا أن المحتوى مرخص، ولا أن النص الكامل صالح للاحتفاظ أو العرض أو Chat/RAG.

## المصفوفة النهائية

| قرار C3 | المعنى التشغيلي | النتيجة |
|---|---|---|
| `OFFICIAL_URL_REACHABLE_METADATA_ONLY` | رابط رسمي مرشح أجاب بـ HTTP ناجح | بيانات وصفية مرشحة فقط؛ لا ربط ولا إتاحة |
| `ACADEMIC_URL_REACHABLE_METADATA_ONLY` | رابط أكاديمي/مستودع مرشح أجاب بنجاح | بيانات وصفية مرشحة فقط؛ تحتاج شروط ناشر |
| `REACHABLE_RIGHTS_UNKNOWN_HOLD` | رابط متاح لكن لا يكفي لاعتماد المصدر | يبقى معلقًا لبوابة جودة/حقوق |
| `RESTRICTED_OR_AUTH_REQUIRED_HOLD` | الوصول يتطلب صلاحية أو رفض الفحص | يبقى معلقًا |
| `REDIRECT_OR_HOST_CHANGE_HOLD` | تم رصد تحويل | لا يُتابع ولا يُعتمد تلقائيًا |
| `UNREACHABLE_OR_TIMEOUT_HOLD` | مهلة/فشل/حالة HTTP غير مناسبة | لا يعتمد الرابط في هذه الجولة |
| `SAFETY_BLOCKED_HOLD` | حجب DNS/SSRF أو رابط غير مسموح | لا طلب خارجي ولا ربط |
| `NO_ELIGIBLE_EXTERNAL_URL` | لا يوجد رابط مؤهل | يظل قرار C2 فقط |

في **كل الحالات**:

```text
sourceLinkWrite=blocked
rightsAssignment=blocked
publicDisplay=blocked_pending_rights_gate
chatRag=blocked_pending_separate_gate
finalRelease=not_authorized
```

## التطبيق

الحزمة تفترض أن الحالة المحلية هي:

```text
MEGA_BATCH_C2_AUTONOMOUS_PROVENANCE_AUDIT_APPLY=PASS
MEGA_BATCH_C2_LOCAL_QUALITY_CLOSURE=PASS
```

استخدم `apply.ps1` مع جذر المشروع `D:\waqf_ai_model`.

## بوابات التحقق بعد التطبيق

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
pnpm.cmd run build
pnpm.cmd run verify:mega-batch-c1-legacy-manus-provenance
pnpm.cmd run verify:mega-batch-c2-autonomous-provenance-audit
pnpm.cmd run verify:mega-batch-c3-external-source-verification
```

## UAT

1. شغّل الخادم المحلي.
2. افتح:
   ```text
   http://localhost:3000/knowledge#/admin/source-provenance-rights
   ```
3. افتح قسم C3 ثم اضغط `تشغيل فحص C3 الخارجي`.
4. التقط لقطة لمصفوفة C3 التي تعرض Codes HTTP والقرار والبوابة التالية.
5. افحص Console وNetwork:
   - تشغيل C3 يولد طلب `GET` واحدًا من المتصفح إلى tRPC فقط.
   - الاستعلام الخارجي يحدث من الخادم ضمن الحد والسياسات.
   - لا يسمح بأي `POST`/`PUT`/`PATCH`/`DELETE` للـ source/rights/knowledge lifecycle.

## حد الدليل

C3 هو دليل قابلية وصول خارجي ومصفوفة تشغيلية، وليس مراجعة قانونية أو حقوقية نهائية. أي بوابة تطبيق لاحقة تتطلب قرارًا مستقلًا، ومراجعة شروط المصدر، وقواعد الاقتباس/الاحتفاظ/النشر.
