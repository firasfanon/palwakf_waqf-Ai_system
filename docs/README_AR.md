# Smart Tools 3 — تصحيح Bootstrap لأول مراجع (v64.2)

## طبيعة الحزمة
تصحيح موضعي **Pre-Apply** لمعالجة حالة كان فيها جدول `assistant.knowledge_scope_assignments` فارغًا بالكامل. الحزمة تمنح حساب المراجع الأول المعتمد صلاحية مراجعة أدنى فقط كي يمكن تشغيل توحيد المهام المكررة بين KB58 وKB08.

لا تنشئ الحزمة مصادر أو وثائق أو استشهادات. لا تعتمد معرفة. لا تنشر للدردشة. لا تمنح `assistant.publish` أو `assistant.admin` أو `assistant.all`.

## هوية Bootstrap المقيدة
- `auth_user_id`: `96f6cdc2-67f9-4352-b9f8-775ef509fed8`
- الهوية المتوقعة: `firasfanon@gmail.com`
- scope الوحيد: `assistant.review`
- access level: `review`

تتحقق ملفات التطبيق من تطابق UUID مع البريد المسجل في `auth.users` قبل أي كتابة.

## الترتيب الإلزامي
1. `00AA_INITIAL_REVIEWER_SCOPE_BOOTSTRAP_OPERATOR_APPLY.sql`
2. `00AB_INITIAL_REVIEWER_SCOPE_BOOTSTRAP_READ_ONLY_VERIFICATION.sql`
3. `00B_KB58_KB08_DUPLICATE_TASK_CONSOLIDATION_OPERATOR_APPLY_V2.sql`
4. ارجع إلى حزمة v64.1 وشغّل `00C_POST_CONSOLIDATION_READ_ONLY_VERIFICATION.sql`
5. عند نجاح `00C` فقط، استأنف v64 من `01_HUMAN_REVIEW_OPERATIONS_V1_OPERATOR_APPLY.sql`.

## بوابات التوقف
- إذا فشل `00AA`: لا تحاول INSERT يدويًا. احفظ الخطأ كاملًا.
- إذا لم يعرض `00AB` القيمة `BOOTSTRAP_VERIFIED_REVIEW_ONLY`: لا تشغّل `00B V2`.
- إذا لم يعرض `00B V2` `cancelled_kb58_rows = 6` و`active_kb08_rows = 6`: لا تشغّل `00C` أو بقية الدفعة.
- لا تذهب إلى الإنتاج بعد SQL؛ يلزم نشر runtime وBrowser/RBAC/RLS UAT.

## الحالة
```text
BOOTSTRAP_PATCH_PREPARED_NOT_APPLIED
RECONCILIATION_NOT_APPLIED
LIVE_APPLY_PENDING
PRODUCTION_NOT_APPROVED
```
