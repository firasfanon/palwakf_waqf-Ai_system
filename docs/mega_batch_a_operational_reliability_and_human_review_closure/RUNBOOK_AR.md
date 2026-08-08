# Runbook — Mega Batch A

## 0. نطاق الإجراء
هذه الدفعة لا تسمح بإصدار معرفة أو تعديل KB08B. كل الإجراءات الفعلية مقيدة بالمراجعة البشرية فقط.

## 1. تحقق الكود محليًا

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
pnpm.cmd run build
```

يجب أن تنتهي الأوامر بلا أخطاء TypeScript أو Build قبل تشغيل SQL.

## 2. SQL بالترتيب

1. شغّل `00_MEGA_BATCH_A_PREFLIGHT_READ_ONLY.sql` واحفظ النتائج.
2. تحقق أن `official_chat_eligible_should_remain_zero = 0`.
3. شغّل `01_CONTROLLED_HUMAN_REVIEW_TASK_CLAIM_AND_CONTAINMENT_OPERATOR_APPLY.sql` مرة واحدة فقط في Supabase SQL Editor.
4. شغّل `02_MEGA_BATCH_A_POST_APPLY_READ_ONLY_VERIFICATION.sql`.
5. تحقق أن `anon_execute_must_be_false` و`authenticated_execute_must_be_false` لكل الدوال الأربع.

## 3. Browser preflight

افتح:

```text
http://localhost:3000/knowledge#/admin/knowledge-review-operations
```

تحقق من الآتي:

- تظهر بطاقة Runtime بدون كشف أسرار.
- عدادات المصدر/الاستشهاد/التصنيف من مصدر queue واحد.
- لا تظهر أزرار `إصدار رسمي` أو KB08B mutation أو تغيير binding.
- `فتح ملف` يفتح Modal معزولًا؛ الخلفية غير قابلة للتمرير أو التفاعل.
- الروابط الطويلة تكسر داخل المحتوى ولا تنشئ تمريرًا أفقيًا للصفحة.

## 4. Controlled sample execution

نفذ فقط بعد قبول Browser preflight.

### A. content_classification
1. اختر مهمة مفتوحة من المرحلة نفسها.
2. `فتح ملف` → راجع السياق → `استلام المهمة`.
3. استخدم واحدًا من القرارات الاحتوائية فقط.
4. سجل سندًا لا يقل عن 20 حرفًا.
5. تحقق أن `is_chat_eligible=false` بقيت كما هي.

### B. source_verification
1. افتح مهمة تحقق مصدر.
2. استلمها قبل إدخال أي رابط أو جهة.
3. راجع الأصل خارج الواجهة.
4. احفظ الجهة والرابط الرسمي فقط.

### C. citation_verification
1. افتح مهمة تحقق استشهاد.
2. استلمها قبل إدخال الموضع.
3. وثق المادة/الصفحة أو الموضع الفعلي والمقتطف عند توفره.

## 5. أدلة القبول المطلوبة

- لقطة واحدة لكل مرحلة عند فتح الملف.
- لقطة واحدة فقط للنتيجة بعد الحفظ لكل مرحلة.
- ناتج SQL post-apply.
- Console/Network فقط إن ظهر خطأ.

لا تجمع لقطات مكررة أو سجلات أسرار.
