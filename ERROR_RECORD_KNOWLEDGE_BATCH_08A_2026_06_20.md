# Error Record — Knowledge Batch 08 / 08A

## Error 1 — `assistant.legacy_import_register` not found (`42P01`)
- **السبب:** تم تشغيل post-apply verification قبل تشغيل staging step 02.
- **الحل:** تثبيت PostgreSQL CLI (`psql`) وتشغيل ملف staging الكبير عبر Session Pooler، ثم تحقق `kb08_stage_rows=929`.
- **النتيجة:** مغلق.

## Error 2 — SQL Editor query too large
- **السبب:** ملف staging يحتوي payload كبير لا يناسب SQL Editor.
- **الحل:** تشغيل الاستيراد عبر `psql` وSession Pooler مع `ON_ERROR_STOP=1`.
- **النتيجة:** مغلق؛ staging 929 + observed 66 مثبتان.

## Error 3 — wrong `status` column (`42703`)
- **السبب:** استعلام تشخيصي استخدم `status` بدل `migration_status` في `assistant.legacy_import_register`.
- **الحل:** اعتماد استعلامات تستخدم `migration_status`، وتسجيل فصل `legacy_operational_records.status` عن register status.
- **النتيجة:** مغلق.

## Error 4 — KB08 original step 04 conflicted with strict trust gate
- **السبب:** الملف القديم كان يرفع `approved/is_chat_eligible` تلقائيًا.
- **الحل:** v62 review-only promotion؛ كل promoted content يدخل `in_review`, `pending/linked`, و`is_chat_eligible=false`.
- **النتيجة:** مغلق؛ برهان التطبيق: approved=0, chat_visible=0.

## Remaining non-error backlog
- **296** records require mapping; they are not lost and remain in staging as `needs_mapping`.
- reviewer queue and release workflow remain pending.

## Reconciliation item — content classification queue not listed post-apply
- **الملاحظة:** كانت هناك 6 مهام `content_classification` قبل KB08A، لكن post-apply summary لم يعرض هذا workflow stage.
- **الحالة:** ليس دليلاً على فقد بيانات بمفرده، لكنه يحتاج read-only reconciliation قبل بدء المراجعة البشرية.
- **الإجراء التالي:** حساب المهام حسب workflow stage/status مع تتبع سجل الأحداث أو أرشيف المهام إن وجد؛ لا تنشأ بدائل قبل معرفة مصير الست الأصلية.
