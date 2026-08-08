# Sovereign Batch 02A — Controlled Human Review Case Context + Containment Execution

## طبيعة العمل
تطوير تشغيلي محكوم لمرحلة **Controlled Human Review Execution**. لا يغير هذه الدفعة أهلية أي وثيقة للدردشة، ولا تمنح `assistant.publish`، ولا تنفذ KB08B Mapping، ولا تعدل KB09 Page Bindings.

## سبب الدفعة
أثبت Runtime المحلي أن مركز المراجعة يعمل، لكنه كان يعرض للمرجع `target_id` فقط ولا يوفر ملفًا مقيدًا للوثيقة/المصدر/الاستشهاد. كذلك لم تكن هناك عملية مكتملة لتسوية مهمة `content_classification`، ولم تكن RPCs المصدر والاستشهاد تفرض أن المهمة استلمها نفس المراجع.

## ما تضيفه
1. ملف مراجعة server-side محدود البيانات لكل مهمة، ويعرض للسياق المقيد للمراجع فقط.
2. فرض استلام المهمة قبل توثيق مصدر أو استشهاد.
3. قرار `content_classification` احتوائي فقط:
   - `confirm_test`
   - `confirm_duplicate`
   - `confirm_quarantine`
   - `defer`
4. إلغاء أدوات الإصدار وKB08B mutation من واجهة هذه المرحلة.

## ما لا تضيفه
- لا إصدار رسمي أو Chat Release.
- لا تحويل حالة المحتوى إلى `production`.
- لا `is_chat_eligible=true`.
- لا معالجة جماعية أو حذف أو تغيير RLS من المتصفح.

## ترتيب التطبيق
1. طبّق ملفات TypeScript عبر سكربت PowerShell، مع إنشاء نسخ احتياطية.
2. شغّل `pnpm.cmd run check` ثم `pnpm.cmd run build`.
3. شغّل SQL `01_...OPERATOR_APPLY.sql` مرة واحدة فقط في Supabase SQL Editor بصلاحية operator.
4. شغّل SQL `02_...READ_ONLY_VERIFICATION.sql` واحفظ النتائج.
5. أعد تشغيل الخادم المحلي وافتح:
   `http://localhost:3000/knowledge#/admin/knowledge-review-operations`
6. نفذ عينة واحدة فقط بالترتيب: تصنيف احتوائي، مصدر، استشهاد.

## بوابة القرار
يبقى الإنتاج غير معتمد. لا تبدأ KB08B ولا أي إصدار معرفة قبل استلام evidence لعينة المراجعة الثلاثية.
