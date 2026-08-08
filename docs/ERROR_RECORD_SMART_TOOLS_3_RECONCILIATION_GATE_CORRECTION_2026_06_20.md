# Error Record — Smart Tools 3 Reconciliation Gate Correction

- **التاريخ:** 2026-06-20
- **المرحلة:** Pre-Apply / Staging SQL preflight
- **الخطأ:** `00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY.sql` استخدم `observed_task_count` لمقارنة عدد صفوف المهام التاريخية بعدد الحالات المنطقية الست.
- **الأثر:** أظهر gate `COUNT_MISMATCH_REQUIRES_EVIDENCE_RECONCILIATION` عند وجود 12 صفًا، رغم أن المستندات المستهدفة الفريدة كانت ستة فقط.
- **السبب:** مفاتيح dedupe مبنية على prefix الدفعة (`kb58` مقابل `kb08v62`) منعت إزالة التكرار بين الدفعات لنفس `target_id` و`workflow_stage`.
- **الأدلة:** ستة `target_id`، ولكل واحد مهمة `kb58:quarantine:*` ومهمة `kb08v62:classification:*`، وكلها `open` وغير مسندة.
- **الحل:** استبدال preflight بمقياس logical-target / active-task؛ وإلغاء ست مهام KB58 كنسخ تدقيقية superseded فقط بعد فحص الزوج exact-pair والصلاحية؛ والاحتفاظ بمهمة KB08 الأحدث.
- **الملفات:**
  - `00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY_V2.sql`
  - `00B_KB58_KB08_DUPLICATE_TASK_CONSOLIDATION_OPERATOR_APPLY.sql`
  - `00C_POST_CONSOLIDATION_READ_ONLY_VERIFICATION.sql`
- **آخر baseline مستقر:** `v64 Smart Tools 3 pre-apply`، غير مطبق.
- **الحالة:** `CORRECTION_PREPARED_NOT_APPLIED`.
