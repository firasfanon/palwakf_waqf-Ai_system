# PALWAKF PLATFORM COMPREHENSIVE GUIDE

**مرجع مختصر أعلى بعد تحديث Mega Batch 27C — 2026-06-16**

## 1) هوية المنصة

PalWakf منصة سيادية متعددة الأنظمة مبنية على:

- Flutter Web / Mobile في المنصة الرئيسية.
- Supabase + PostgreSQL + RLS + PostGIS.
- Riverpod + GoRouter في Flutter.
- المساعد الذكي يعمل كخدمة React/TypeScript شبه مستقلة تحت حوكمة PalWakf.

## 2) قواعد ثابتة

- الردود والتوثيق بالعربية.
- الدفعات تكون Mega Batches لا micro patches.
- بعد كل Batch ناجح يجب تحديث baseline/changelog/guide/handoff.
- `waqf_assets` هو الكيان التشغيلي المركزي في منصة PalWakf، والربط عبر `waqf_asset_id`.
- `awqaf_system` Master Data.
- `mustakshif` للتحليل المكاني/التاريخي فقط.
- `billing_system` للمالية والدفع.
- `cases` للقضايا.
- `tasks` للمهام.
- `assistant` للمعرفة والمساعدة.
- `core` و`waqf` مصادر سيادية، و`public` للـ views/RPC wrappers فقط.
- في الملفات Flutter الجديدة لا يستخدم `legacy.dart`؛ يستخدم `flutter_riverpod.dart`.

## 3) حالة المساعد الذكي حتى Mega Batch 27C

### Mega Batch 26

مغلق وظيفيًا. الأدوات الذكية الست تعمل وتحفظ سياديًا:

- summarize
- extract
- classify
- compare
- precedents
- predict

السجل السيادي المعتمد:

- `assistant.ai_tool_runs`
- `assistant.ai_tool_run_events`
- `assistant.ai_tool_run_links`

### Mega Batch 27A

تم تفعيل snapshot إداري للأدوات الذكية:

- `aiTools.getBackendActivationSnapshot`
- `aiTools.getRunMetrics`
- `aiTools.listRuns`
- `aiTools.getRunDetails`
- `aiTools.reviewRun`
- `aiTools.reopenRun`

### Mega Batch 27B

تم تفعيل backend أوسع للإدارة:

- `appRouter.admin`
- `appRouter.analytics`

#### الصفحات المفعلة في 27B

- `/admin/dashboard`
- `/admin/activity`
- `/admin/analytics`
- `/admin/content`
- `/admin/users`
- `/admin/cache`
- `/admin/backup`
- `/admin/integrations`
- `/admin/webhooks`
- `/admin/page-classification`

#### endpoints مضافة

- `admin.systemStats`
- `admin.charts.userGrowth`
- `admin.charts.conversationActivity`
- `admin.charts.faqDistribution`
- `admin.activityLog`
- `admin.users.*`
- `admin.content.faqs.*`
- `admin.content.documents.*`
- `admin.operations.*`
- `admin.backendActivationSnapshot`
- `analytics.*`

### Mega Batch 27C

تم استيعاب أدلة runtime المحلية التي أرسلها المستخدم واعتمادها كدليل تشغيل مرحلي لـ 27B:

- `pnpm.cmd run check` مر بنجاح دون أخطاء TypeScript.
- السيرفر المحلي اشتغل على `http://localhost:3000/`.
- الصفحات العشر أعلاه فتحت في المتصفح دون crash ظاهر.
- صفحة `/admin/page-classification` أثبتت وجود:
  - إجمالي الصفحات المفروزة: 52
  - صفحات عاملة: 20
  - تحتاج backend: 30
  - placeholder أو محجوبة: 1
  - Backend مفعّل: 9

#### قرار 27C

```text
MEGA_BATCH_27C_ADMIN_RUNTIME_EVIDENCE_ACCEPTED_PNPM_CHECK_PASSED_BROWSER_ROUTES_RENDERED_REMAINING_BACKEND_PENDING_DEFERRED_TO_27D
```

## 4) حوكمة العمليات الإدارية

- حذف المستخدمين في 27B وما بعده = تعطيل آمن `isActive = 0`، لا hard delete.
- حذف الوثائق/FAQs = تعطيل آمن.
- Backup = manifest-only، لا dump/restore من الواجهة.
- Webhooks = internal event map، لا external dispatch.
- لا production approval حتى قرار صريح مستقل.

## 5) ملاحظات Runtime مفتوحة بعد 27C

- تحذير pnpm settings غير حاجب ويحتاج صيانة إعدادات لاحقًا.
- تحذير `baseline-browser-mapping` غير حاجب ويحتاج تحديث dependency لاحقًا.
- تحذير Babel لملف React DOM كبير غير حاجب.
- تنسيق التاريخ في `/admin/activity` يحتاج formatter عربي أدق.
- Empty states في بعض الصفحات مقبولة runtime لكنها لا تعني اكتمال البيانات التشغيلية.

## 6) آخر baseline

`waqf_ai_model_hybrid_llm_admin_v35_mb27c_runtime_evidence_intake_2026_06_16.zip`

## 7) نقطة الاستئناف

**Mega Batch 27D — Remaining Backend Pending Closure**

الأولوية:

1. إغلاق جزء إضافي من `backend_pending = 30`.
2. تصنيف الصفحات المتبقية إلى read-only backend / write backend / مؤجلة رسميًا.
3. عدم إعادة فتح Mega Batch 26 أو 27A أو 27B إلا عند regression حقيقي.
4. تحديث baseline/changelog/guide/handoff بعد نجاح الدفعة.

---

## Mega Batch 27D TypeScript Closure Hotfix — 2026-06-16

**الحالة:** Applied, router static check passed, local `pnpm.cmd run check` retest required.  
**Baseline:** `waqf_ai_model_hybrid_llm_admin_v36a_mb27d_typescript_closure_hotfix_2026_06_16.zip`.

### السبب

نتيجة التشغيل المحلي بعد 27D كشفت خطأ TypeScript في `server/routers.ts` داخل `faqsRouter.incrementView` بسبب عدم تطابق شكل return بين success path وfallback path في `safeDbRead`.

### القرار

تم توحيد الشكل بإرجاع `skipped:false` في success path، مع بقاء fallback كـ `skipped:true`. لا توجد تغييرات schema أو RLS أو إنتاجية.

### أمر التحقق التالي

```powershell
cd D:\waqf_ai_model
pnpm.cmd run check
```

---

## Mega Batch 27E — Runtime Evidence Intake + Targeted UX Stabilization — 2026-06-16

**Baseline:** `waqf_ai_model_hybrid_llm_admin_v37_mb27e_runtime_evidence_targeted_ux_stabilization_2026_06_16.zip`.

### الدليل المقبول

تم قبول نتيجة المستخدم بأن:

```powershell
pnpm.cmd run check
```

مر بعد 27D Hotfix دون أخطاء TypeScript. التحذير الخاص بإعدادات `pnpm` غير حاجب.

### التحسين المنجز

تمت معالجة ملاحظة تنسيق التاريخ في صفحات الإدارة عبر:

- إضافة `client/src/lib/dateFormat.ts`.
- توحيد صيغة التاريخ في صفحات الإدارة الحساسة.
- تحسين `admin.activityLog` في `server/routers.ts` لتطبيع التاريخ والفرز الزمني.

### قرار 27E

```text
MEGA_BATCH_27E_RUNTIME_EVIDENCE_ACCEPTED_DATE_UX_STABILIZATION_APPLIED_SERVER_STATIC_CHECK_PASSED_LOCAL_POST_PATCH_CHECK_PENDING
```

### نقطة الاستئناف

**Mega Batch 27F — Post-27E Runtime Retest + Admin UX Final Sweep**.

ابدأ من v37، وشغّل `pnpm.cmd run check` ثم اختبر صفحات الإدارة ذات التواريخ.


---

## Mega Batch 27F — Runtime Console Noise Reduction + Final Admin UX Sweep — 2026-06-16

**Baseline:** `waqf_ai_model_hybrid_llm_admin_v38_mb27f_runtime_console_noise_reduction_final_admin_ux_sweep_2026_06_16.zip`.

### الأدلة المقبولة

- صفحات 27D الجديدة ظهرت في المتصفح دون crash:
  - Audit Logs
  - Security
  - API Keys
  - Maintenance
  - Reports
- السيرفر اشتغل محليًا على `localhost:3000`.
- fallback المحلي ظهر بسبب `Database not available` لكنه لم يوقف السيرفر.

### التحسين المنجز

تم تخفيض ضجيج الكونسول في `safeDbRead` داخل `server/routers.ts` عبر رسالة مختصرة وتصنيفها كـ local bootstrap fallback، مع كتم التكرار بدل طباعة stack trace كامل.

### القرار

`MEGA_BATCH_27F_RUNTIME_CONSOLE_NOISE_REDUCTION_APPLIED_ROUTER_STATIC_CHECK_PASSED_LOCAL_BROWSER_EVIDENCE_ACCEPTED_POST_PATCH_CHECK_PENDING`

### نقطة الاستئناف

**Mega Batch 27G — Final Runtime Retest + Admin Production Readiness Gate**.


---

## Update — Mega Batch 27F-1 Knowledge Runtime TDZ Hotfix (2026-06-17)

تم اعتماد baseline `waqf_ai_model_hybrid_llm_admin_v38a_mb27f1_knowledge_runtime_tdz_hotfix_2026_06_17.zip` بعد إغلاق crash صفحة `/knowledge#/admin/knowledge`.

### القرار

`MEGA_BATCH_27F1_KNOWLEDGE_RUNTIME_TDZ_HOTFIX_APPLIED_LOCAL_BROWSER_RETEST_REQUIRED`

### جوهر التعديل

رفع helper functions الخاصة بحالة وثائق المعرفة من داخل `ManageKnowledge` إلى module scope لتفادي Temporal Dead Zone عند تنفيذ `useMemo`.

### لا تغييرات سيادية

- لا DB.
- لا RLS.
- لا backend.
- لا صلاحيات.
- لا إنتاج معتمد.

### نقطة الاستئناف

`Mega Batch 27G — Final Runtime Retest + Admin Production Readiness Gate` فوق v38a.

---

## Update — Mega Batch 27F-2 Chat LLM Local Provider Fallback Hardening (2026-06-17)

تم اعتماد baseline `waqf_ai_model_hybrid_llm_admin_v38b_mb27f2_chat_llm_local_provider_fallback_hardening_2026_06_17.zip` بعد معالجة فشل واجهة المحادثة عند توقف مزود Ollama المحلي.

### الدليل المقبول

- `pnpm.cmd run check` نجح قبل التشغيل.
- السيرفر اشتغل على `localhost:3000`.
- `/knowledge#/chat` فشل عند الإرسال بسبب `ECONNREFUSED 127.0.0.1:11434`.

### القرار

`MEGA_BATCH_27F2_CHAT_LLM_LOCAL_PROVIDER_FALLBACK_HARDENING_APPLIED_ROUTER_STATIC_CHECK_PASSED_LOCAL_BROWSER_RETEST_REQUIRED`

### جوهر التعديل

تم تحصين `chat.sendMessage` بحيث لا يُسقط واجهة المحادثة عند توقف Ollama المحلي، بل يحفظ رسالة مساعد عربية آمنة توضّح أن مزود النموذج المحلي غير متاح مع الحفاظ على المراجع إن وجدت.

### لا تغييرات سيادية

- لا DB schema.
- لا RLS.
- لا production approval.
- لا تغيير في مزود النموذج المختار.

### نقطة الاستئناف

`Mega Batch 27G — Final Runtime Retest + Admin/Chat Production Readiness Gate` فوق v38b.

---

## Update — Mega Batch 27G Final Runtime Retest + Admin/Chat Production Readiness Gate (2026-06-17)

تم اعتماد baseline:

```text
waqf_ai_model_hybrid_llm_admin_v39_mb27g_final_runtime_retest_admin_chat_readiness_gate_2026_06_17.zip
```

### القرار

```text
MEGA_BATCH_27G_FINAL_RUNTIME_RETEST_ACCEPTED_ADMIN_CHAT_READY_AS_LOCAL_BOOTSTRAP_CANDIDATE_PRODUCTION_APPROVAL_DEFERRED
```

### الأدلة المقبولة

- `pnpm.cmd run check` مر محليًا دون أخطاء TypeScript.
- السيرفر اشتغل على `http://localhost:3000/`.
- local DB fallback ظهر بصيغة مختصرة ولم يوقف التشغيل.
- `/chat` عالج توقف Ollama المحلي عبر safe Arabic fallback بدل `fetch failed`.
- تم حفظ رسالة مساعد آمنة مع `assistantMessageId` بعد fallback.

### الحالة الإنتاجية

- مقبول كـ local bootstrap readiness candidate.
- غير معتمد إنتاجيًا.
- الإنتاج مؤجل إلى حين DB/LLM/staging evidence.

### نقطة الاستئناف

```text
Mega Batch 28 — Controlled Staging Readiness + Provider/Database Health Gate
```

## Mega Batch 28 — Controlled Staging Readiness + Provider/Database Health Gate — 2026-06-17
- Baseline source: `waqf_ai_model_hybrid_llm_admin_v39_mb27g_final_runtime_retest_admin_chat_readiness_gate_2026_06_17.zip`.
- Scope: controlled staging readiness only; no production approval.
- Added database health gate with safe `SELECT 1` probe and fallback classification.
- Added LLM provider health gate for local Ollama `/api/tags` and OpenAI-compatible metadata mode.
- Added unified readiness builder and raw endpoint `/api/health/readiness`.
- Added TRPC health router: `health.readiness`, `health.database`, `health.llm`.
- Updated Admin dashboard, maintenance, security, reports, and chat surfaces to display Database Health / Provider Health.
- Production remains blocked unless DB and LLM are both available and staging evidence is supplied.
- Mega Batch 29 is prepared as a later production-promotion assessment gate, not executed in this batch.

---

## Mega Batch 28A — Database Connectivity Remediation — 2026-06-18

**Baseline in:** `waqf_ai_model_hybrid_llm_admin_v40_mb28_controlled_staging_readiness_provider_database_health_gate_2026_06_17.zip`

**Decision:** `MEGA_BATCH_28A_DATABASE_CONNECTIVITY_REMEDIATION_APPLIED_STATIC_CHECKS_PASSED_LOCAL_PNPM_BROWSER_DB_RETEST_REQUIRED`

### Evidence intake
The `/api/health/readiness` browser evidence after Mega Batch 28 confirmed:

- `server=true`
- `llm=true`
- `database=false`
- `ready=false`
- `productionBlockers=["database_unavailable"]`
- `details.database.reason="database_not_configured"`
- `details.llm.mode="connected"` with model `qwen2.5:3b`

### Scope
Mega Batch 28A does not approve production and does not change the assistant data model. It remediates database configuration discovery and diagnostics so that local/staging operators can connect the existing MySQL Drizzle runtime through safe supported configuration forms.

### Implemented remediation
- Added `server/config/databaseConfig.ts` as the single safe database configuration resolver.
- Supported database configuration forms:
  - `DATABASE_URL`
  - `MYSQL_DATABASE_URL`
  - `DB_HOST + DB_PORT + DB_NAME + DB_USER + DB_PASSWORD`
  - `MYSQL_HOST + MYSQL_PORT + MYSQL_DATABASE + MYSQL_USER + MYSQL_PASSWORD`
- Added safe redaction for diagnostic URLs; no secrets are exposed.
- Added explicit runtime dialect guard: current runtime is MySQL/Drizzle (`drizzle-orm/mysql2` + `mysql-core` schema). PostgreSQL/Supabase URLs are detected but blocked with `database_dialect_mismatch_mysql_runtime_required` until a future PostgreSQL adapter is explicitly implemented.
- Added `/api/health/database-config` for safe operator diagnostics.
- Added `health.databaseConfig` TRPC endpoint for admin diagnostics.
- Updated `getDb`, `databaseHealth`, `ENV.databaseUrl`, `drizzle.config.ts`, and `.env.example` to use the same resolution policy.

### Production gate
Mega Batch 29 remains blocked until `/api/health/readiness` returns:

```json
{
  "server": true,
  "database": true,
  "llm": true,
  "ready": true
}
```

If LLM remains connected and database is still false after applying 28A, the next action is environment-only configuration: provide a valid MySQL-compatible URL or component variables, then rerun the readiness endpoint.

---

## 2026-06-18 — Assistant Mega Batch 28B Supabase/PostgreSQL Readiness Correction

- Baseline: `waqf_ai_model_hybrid_llm_admin_v40b_mb28b_supabase_postgres_runtime_adapter_readiness_gate_correction_2026_06_18.zip`.
- Corrected MB28/28A readiness semantics after operator evidence confirmed Supabase bridge keys exist in `.env`.
- Supabase/PostgreSQL is now accepted as the sovereign database health target for PalWakf Assistant when platform Supabase keys are configured.
- MySQL remains legacy/local fallback only and `getEffectiveDatabaseUrl()` remains MySQL-only to prevent accidental Drizzle/MySQL driver use against Supabase.
- Added `/api/health/supabase` and `health.supabase` for safe diagnostics.
- Production remains deferred until local/staging browser evidence confirms `database=true`, `llm=true`, and `ready=true`.

---

## 2026-06-18 — Assistant Mega Batch 29 Staging Verification + Production Promotion Assessment

**Arabic brief:** هذه الدفعة بوابة تحقق واعتماد مرحلي، وليست تطوير ميزة. قبلت أدلة MB28B التي أثبتت أن Supabase/PostgreSQL وLLM جاهزان وأن `/api/health/readiness` يرجع `ready=true`، لكنها لم تمنح موافقة إنتاجية.

- Baseline: `waqf_ai_model_hybrid_llm_admin_v41_mb29_staging_verification_production_promotion_assessment_2026_06_18.zip`.
- Decision: `STAGING_CANDIDATE_ACCEPTED_PRODUCTION_PROMOTION_DEFERRED`.
- Accepted local/staging-candidate evidence:
  - `server=true`
  - `database=true`
  - `llm=true`
  - `ready=true`
  - `productionBlockers=[]`
- Supabase/PostgreSQL remains the sovereign database health target for the assistant when `PLATFORM_BRIDGE_ENABLED=1` and platform Supabase keys are configured.
- MySQL remains only a legacy/local fallback and is not the sovereign production requirement for PalWakf.
- Production remains blocked until remote staging URL, RBAC/RLS positive/negative UAT, secret isolation, and rollback evidence are supplied.
- Next recommended batch: `Mega Batch 29A — Remote Staging Deployment Evidence + RBAC/RLS Negative UAT`.

---

## 2026-06-18 — Sovereign Batch 02 Knowledge Uplift + Review/Approval Closure

**Arabic brief:** هذه الدفعة حوكمة معرفة وإغلاق سياسة مراجعة/اعتماد، وليست رفعًا فعليًا لباقي مصادر المعرفة ولا اعتمادًا إنتاجيًا. تم تثبيت أن العينات الثمانية الحالية كانت دفعة أولى أثناء بناء قاعدة البيانات ومسار الربط فقط، وأن باقي مصادر المعرفة والمراجع الرسمية لم تُرفع بعد وما زالت مطلوبة.

- Baseline: `waqf_ai_model_hybrid_llm_admin_v43_sovereign_batch_02_knowledge_uplift_review_approval_closure_2026_06_18.zip`.
- Decision: `SOVEREIGN_BATCH_02_KNOWLEDGE_UPLIFT_REVIEW_APPROVAL_GOVERNANCE_CLOSED_CONTENT_SOURCE_UPLIFT_PENDING`.
- Current knowledge records: 8 seed/sample records only.
- The eight records are not a complete official PalWakf knowledge corpus.
- Remaining official references, laws, procedures, manuals, fatwas, archival material, and ministry-approved documents remain pending upload, review, and approval.
- Chat policy remains approved-only: `approved + chat eligible` records only may be used in direct chat answers.
- Smart tool outputs remain drafts/review items until explicitly approved; approval of an `ai_tool_run` is not equivalent to approval of the generated knowledge document.
- No database DDL/DML was executed in this batch.
- No production approval was granted.
- Mega Batch 30 remains blocked until Mega Batch 29A evidence and sufficient knowledge approval gates are closed.

### Mandatory continuation note

```text
العينات الثمانية الحالية هي Seed/Batch 1 فقط أثناء بناء قاعدة البيانات ومسار الربط. لم يتم رفع باقي مصادر المعرفة والمراجع الرسمية بعد، ويبقى مطلوبًا رفعها ومراجعتها واعتمادها قبل توسيع الشات أو الإنتاج.
```

### Next valid work

1. `Mega Batch 29A — Remote Staging Deployment Evidence + RBAC/RLS Negative UAT Evidence Intake` عند توفر أدلة staging.
2. `Knowledge Batch 03 — Official Legal References Intake` عند توفر المصادر الرسمية.
3. `Mega Batch 30 — Controlled Production Promotion Pack` فقط بعد إغلاق 29A وبوابات المعرفة اللازمة.

---

## Knowledge Batch 03 — Old DB Reference Discovery + Official Legal References Intake — 2026-06-18

**Baseline:** `waqf_ai_model_hybrid_llm_admin_v44_knowledge_batch_03_old_db_reference_intake_2026_06_18.zip`.

### النتيجة

بناءً على توجيه المستخدم، تمت مراجعة سجلات قاعدة البيانات السابقة قبل التحول إلى Supabase داخل `.manus/db/`، وتأكد أن المعرفة القديمة لم تكن محصورة في العينات الثمانية الحالية. تم استخراج Register مطهّر ومصنف من سجلات DB القديمة وملفات seed/source القديمة.

### أرقام الدفعة

```text
Distinct discovered review records: 138
Official/legal primary candidates: 41
Ministry/administrative candidates: 14
Supporting reference candidates: 22
Supabase import: not applied
Chat eligibility: blocked until approval
Production: not approved
```

### القاعدة الحاكمة

```text
Old pre-Supabase knowledge is recovered as review backlog only. It is not approved knowledge. No recovered record may become chat-visible unless reviewed, approved, and explicitly marked chat eligible.
```

### القرار

```text
KNOWLEDGE_BATCH_03_OLD_DB_REGISTER_DISCOVERY_CLOSED_AS_REVIEW_BACKLOG
SUPABASE_IMPORT_PENDING_REVIEW
MEGA_BATCH_30_BLOCKED
```



---

## Knowledge Batch 04 — Review Queue Import Plan + Human Approval Matrix — 2026-06-18

**Baseline:** `waqf_ai_model_hybrid_llm_admin_v45_knowledge_batch_04_review_queue_import_plan_human_approval_matrix_2026_06_18.zip`.

### النتيجة

تم تحويل السجل المسترد من قاعدة البيانات القديمة قبل Supabase إلى خطة إدخال صف مراجعة ومصفوفة اعتماد بشرية. هذه الدفعة لم تستورد أي سجل إلى Supabase ولم تمنح اعتمادًا لأي مرجع أو معرفة، ولم تغيّر أهلية الشات.

### أرقام الدفعة

```text
Total review queue candidates: 138
Supabase DML applied: 0
Chat eligible records added: 0
Production approval: false
```

### ملخص buckets

```json
{
  "HOLD_EXCLUDED_DO_NOT_IMPORT": 2,
  "P2_MINISTRY_ADMINISTRATIVE_REVIEW": 14,
  "P1_LEGAL_PRIMARY_REFERENCE_REVIEW": 35,
  "P2_OFFICIAL_REFERENCE_REVIEW": 4,
  "P2_FIQH_AUTHORITY_REVIEW": 2,
  "P4_TRIAGE_REQUIRED": 58,
  "P4_PUBLIC_WEB_TRIAGE_REQUIRED": 1,
  "P3_HISTORICAL_SUPPORTING_REVIEW": 5,
  "P3_SUPPORTING_REFERENCE_REVIEW": 17
}
```

### القاعدة الحاكمة

```text
Reference documents first. Derived knowledge later. Chat eligibility last.
Recovered records remain pending human approval until explicitly reviewed and approved.
```

### القرار

```text
KNOWLEDGE_BATCH_04_REVIEW_QUEUE_IMPORT_PLAN_AND_HUMAN_APPROVAL_MATRIX_PREPARED_NO_IMPORT_APPLIED
HUMAN_APPROVAL_REQUIRED_BEFORE_SUPABASE_IMPORT
CHAT_ELIGIBILITY_REMAINS_BLOCKED_BY_DEFAULT
MEGA_BATCH_30_BLOCKED
```

### Next valid work

1. `Knowledge Batch 05 — Review Queue UI/Workflow Contract + Approval Event Trail`.
2. `Knowledge Batch 05A — Controlled Staging Import Dry Run Evidence` after explicit staging authorization.
3. `Mega Batch 29A — Remote Staging Deployment Evidence + RBAC/RLS Negative UAT Intake` when evidence exists.

---

## Knowledge Batch 05 — Full Recovered Records DB Import + Approval/Chat Pack — 2026-06-18

Decision:

```text
KNOWLEDGE_BATCH_05_FULL_RECOVERED_RECORDS_DB_IMPORT_PACK_PREPARED
ALL_138_RECOVERED_RECORDS_INCLUDED_FOR_DATABASE_INSERT
PRIMARY_SQL_APPROVES_AND_MAKES_CHAT_VISIBLE_IF_OPERATOR_APPLIES_AS_IS
SAFE_FALLBACK_SQL_REVIEW_ONLY_INCLUDED
LIVE_SUPABASE_APPLY_NOT_EXECUTED_IN_CHATGPT_SANDBOX
PRODUCTION_NOT_APPROVED
```

Canonical correction after KB04:

```text
All recovered pre-Supabase knowledge/reference records must be inserted into the database.
The primary KB05 operator SQL imports all 138 records into assistant.reference_documents, creates assistant.knowledge_documents, sets status='approved', and sets is_chat_eligible=true.
A safe fallback SQL remains available for review-only insertion if the operator chooses not to publish to chat.
```

Arabic operational rule:

```text
كل السجلات المستردة من قاعدة البيانات القديمة تدخل قاعدة البيانات. ملف KB05 الأساسي يفعّلها كمعرفة معتمدة وظاهرة للشات عند تشغيله على Supabase، مع بقاء metadata_json حاكمًا لتتبع أنها سجلات مستردة من قاعدة قديمة. لم يتم التطبيق الحي داخل هذه البيئة لعدم توفر اتصال Supabase.
```


---

## Knowledge Batch 05A — Supabase Apply Result Intake + Approval/Chat Visibility Evidence Acceptance — 2026-06-18

### Nature

Evidence-intake and baseline-update batch for the assistant knowledge corpus.

### Operator evidence accepted

```text
payload_records=138
newly_inserted_reference_documents=138
newly_inserted_knowledge_documents=138
newly_inserted_citations=138
approved_on_import=true
chat_visible_on_import=true
```

A later no-op/fallback/idempotent result showed zero new inserts and is not treated as failure.

### Decision

`KNOWLEDGE_BATCH_05A_SUPABASE_APPLY_EVIDENCE_ACCEPTED_APPROVED_CHAT_VISIBLE_138_CONFIRMED`

### Current state

The recovered pre-Supabase knowledge records are now accepted as inserted into the database and published to chat visibility according to operator-supplied evidence.

This does not approve production promotion and does not close remote staging/RBAC/RLS gates.

### Next gate

`Knowledge Batch 06 — Chat Retrieval/Citation Runtime Evidence + Admin Knowledge Search Verification`.


---

## Knowledge Batch 06 — Chat Retrieval/Citation Runtime Evidence + Admin Knowledge Search Verification — 2026-06-18

### Nature

Runtime verification gate plus targeted Admin Knowledge Search contract fix above v47.

### Prior accepted state

```text
KB05A confirmed 138 reference_documents, 138 knowledge_documents, and 138 citations inserted, approved, and chat-visible according to operator evidence.
```

### KB06 implementation

```text
Admin Knowledge Search now accepts q/query/text, returns structured results, and displays approved/chat/citation signals.
Read-only SQL and browser UAT matrices were prepared for chat retrieval/citation certification.
```

### Decision

```text
KNOWLEDGE_BATCH_06_CHAT_RETRIEVAL_CITATION_AND_ADMIN_SEARCH_VERIFICATION_PACK_PREPARED_TARGETED_ADMIN_SEARCH_FIX_APPLIED_RUNTIME_BROWSER_EVIDENCE_PENDING
```

### Remaining gates

```text
CHAT_RETRIEVAL_CITATION_BROWSER_EVIDENCE_PENDING
ADMIN_KNOWLEDGE_SEARCH_BROWSER_EVIDENCE_PENDING
RBAC_RLS_NEGATIVE_UAT_PENDING
REMOTE_STAGING_EVIDENCE_PENDING
PRODUCTION_NOT_APPROVED
MEGA_BATCH_30_BLOCKED
```

### Next gate

`Knowledge Batch 06A — Browser Runtime Evidence Intake + Chat Citation Acceptance` or `Mega Batch 29A` when remote staging/RBAC evidence is available.


---

## Knowledge Batch 06A — Browser Runtime Evidence Intake + Chat Citation Acceptance Gate — 2026-06-18

### Nature

Evidence-intake batch above v48. It accepts operator-supplied Windows TypeScript evidence and keeps browser/chat citation runtime acceptance pending.

### Accepted evidence

```text
pnpm.cmd run check
> tsc --noEmit
result: no TypeScript errors shown
```

### Decision

```text
KNOWLEDGE_BATCH_06A_TYPESCRIPT_EVIDENCE_ACCEPTED_BROWSER_CHAT_CITATION_EVIDENCE_PENDING
```

### Current state

```text
TYPESCRIPT_CHECK_ACCEPTED=true
CHAT_RETRIEVAL_BROWSER_EVIDENCE_ACCEPTED=false
CITATION_RUNTIME_EVIDENCE_ACCEPTED=false
ADMIN_KNOWLEDGE_SEARCH_BROWSER_EVIDENCE_ACCEPTED=false
REMOTE_STAGING_EVIDENCE_ACCEPTED=false
RBAC_RLS_NEGATIVE_UAT_ACCEPTED=false
PRODUCTION_APPROVED=false
MEGA_BATCH_30_ALLOWED=false
```

### Next gate

`Knowledge Batch 06B — Chat/Citation Browser Evidence Acceptance` after submitting chat answers, citation proof, and Admin Knowledge Search evidence; or `Mega Batch 29A` if remote staging/RBAC evidence is ready.

---

## Knowledge Batch 06B — Chat/Citation Browser Evidence Acceptance Gate — 2026-06-18

### Nature

Browser runtime acceptance gate above v49. It prepares the acceptance matrix and runbook for chat retrieval, citations, and Admin Knowledge Search evidence.

### Evidence supplied

```text
No browser/API evidence was supplied in the KB06B request.
```

### Decision

```text
KNOWLEDGE_BATCH_06B_CHAT_CITATION_BROWSER_EVIDENCE_GATE_PREPARED_EVIDENCE_NOT_SUPPLIED_ACCEPTANCE_PENDING
```

### Current state

```text
TYPESCRIPT_CHECK_ACCEPTED=true
KB05A_IMPORT_APPROVED_CHAT_VISIBLE_ACCEPTED=true
CHAT_RETRIEVAL_BROWSER_EVIDENCE_ACCEPTED=false
CITATION_RUNTIME_EVIDENCE_ACCEPTED=false
ADMIN_KNOWLEDGE_SEARCH_BROWSER_EVIDENCE_ACCEPTED=false
REMOTE_STAGING_EVIDENCE_ACCEPTED=false
RBAC_RLS_NEGATIVE_UAT_ACCEPTED=false
PRODUCTION_APPROVED=false
MEGA_BATCH_30_ALLOWED=false
```

### Next gate

`Knowledge Batch 06B-1 — Chat/Citation Browser Evidence Intake` after evidence is supplied, or `Mega Batch 29A` if remote staging/RBAC evidence is ready.

---

## Knowledge Batch 06B-1 — Admin Knowledge Search Evidence Intake + SQL Verification Fix — 2026-06-18

### Nature

Evidence intake and SQL verification helper correction above v50.

### Evidence accepted

The supplied Admin Knowledge Search/read-surface sample included 25 displayed rows with:

```text
status=approved
is_chat_eligible=true
citations_count=1
```

This is accepted as proof that approved, chat-visible, citation-linked knowledge records are visible through the admin/read search surface.

### SQL error record

The supplied SQL error:

```text
42P01 relation "kb05_docs" does not exist
```

was classified as a PostgreSQL CTE scope issue in the optional verification helper, not as a data/import failure. A corrected helper was prepared and the previous helper path was patched.

### Decision

```text
KNOWLEDGE_BATCH_06B1_ADMIN_KNOWLEDGE_SEARCH_EVIDENCE_ACCEPTED_SQL_VERIFICATION_CTE_FIX_PREPARED_CHAT_ANSWER_CITATION_BROWSER_EVIDENCE_PENDING
```

### Remaining gates

```text
CHAT_ANSWER_RUNTIME_EVIDENCE_ACCEPTED=false
CHAT_CITATION_DISPLAY_ACCEPTED=false
REMOTE_STAGING_EVIDENCE_ACCEPTED=false
RBAC_RLS_NEGATIVE_UAT_ACCEPTED=false
PRODUCTION_APPROVED=false
MEGA_BATCH_30_ALLOWED=false
```

---

## Mega Batch UI/UX 01 — Assistant Comfort Light Rework + Light Visual System Closure — 2026-06-18

### Nature

One-stage Assistant-only UI/UX development batch requested by the user because the black/dark-heavy UI caused discomfort during project work.

### Fixed scope

```text
Assistant-only
UI/UX-only
Light-comfort-first
No governance expansion
No production gate
One big batch only
```

### Implementation summary

- Converted Assistant runtime theme from dark-frozen to `pwf-comfort-light`.
- Removed automatic `.dark` class injection from early bootstrap and ThemeProvider.
- Rebuilt default design tokens as light/warm comfort tokens.
- Preserved dark token block as fallback only, not default.
- Added final v52 CSS override layer for admin workspace:
  - light sidebar,
  - light topbar,
  - light cards,
  - light nav items,
  - light forms,
  - light tables,
  - lighter dialog overlays.
- Added `assistant-comfort-shell` to the chat page and softened conversation/code block surfaces.
- Updated theme selector metadata to describe the approved comfort-light identity.

### Files changed

```text
client/src/contexts/ThemeContext.tsx
client/src/main.tsx
client/src/App.tsx
client/src/lib/themes.ts
client/src/index.css
client/src/styles/admin.css
client/src/pages/Chat.tsx
```

### Verification

Sandbox TypeScript check remained blocked by missing type definitions in the extracted environment:

```text
TS2688 Cannot find type definition file for 'node'
TS2688 Cannot find type definition file for 'vite/client'
```

Required Windows check:

```powershell
pnpm.cmd run check
```

### Decision

```text
MEGA_BATCH_UIUX_01_COMFORT_LIGHT_REWORK_APPLIED_RUNTIME_BROWSER_EVIDENCE_PENDING
```

### Remaining gates after this one-stage UI/UX interlude

```text
CHAT_ANSWER_RUNTIME_EVIDENCE_ACCEPTED=false
CHAT_CITATION_DISPLAY_ACCEPTED=false
REMOTE_STAGING_EVIDENCE_ACCEPTED=false
RBAC_RLS_NEGATIVE_UAT_ACCEPTED=false
PRODUCTION_APPROVED=false
MEGA_BATCH_30_ALLOWED=false
```

### Return path

After this batch, return to:

1. `Knowledge Batch 06C — Chat Answer Runtime Evidence Intake + Citation Display Acceptance`, or
2. `Mega Batch 29A — Remote Staging Deployment Evidence + RBAC/RLS Negative UAT Intake`.

---

## 2026-06-18 — Mega Batch UI/UX 01A: Assistant Hash Navigation + Home CTA + Logout Fix

Decision: `MEGA_BATCH_UIUX_01A_HASH_NAVIGATION_HOME_CTA_LOGOUT_FIX_APPLIED_BROWSER_RETEST_REQUIRED`.

This update remains inside the approved one-stage Assistant UI/UX interlude. It does not expand governance, does not change DB/RLS/RBAC, and does not approve production.

Key rules established:

- `/knowledge` before the hash is the Assistant app mount path.
- Internal app Home remains `#/`.
- Canonical internal Knowledge browser route is now `#/knowledge-base`.
- Legacy `#/knowledge` remains accepted as an alias for backward compatibility.
- Home CTAs must use `getAppHref()` to preserve hash routing.
- Logout must redirect to `getAppHref("/")` instead of reloading the current URL.

Required retest:

- `/knowledge#/` renders Home.
- `/knowledge#/search` renders Search.
- `/knowledge#/knowledge-base` renders Knowledge browser.
- `/knowledge#/knowledge` does not 404.
- Logout does not end on 404.


---

## 2026-06-19 — Mega Batch UI/UX 01B: Assistant Chat Workspace Polish + Comfort Density Closure

Decision: `MEGA_BATCH_UIUX_01B_ASSISTANT_CHAT_WORKSPACE_POLISH_APPLIED_BROWSER_RETEST_REQUIRED`.

This update remains inside the approved one-stage Assistant UI/UX interlude. It does not expand governance, does not change DB/RLS/RBAC, and does not approve production.

### Trigger

User browser screenshots showed that the Assistant pages still required polish after the light theme and hash navigation fixes:

- visual density was high,
- borders and panel outlines felt too strong,
- long quick-question buttons were cramped,
- route-card URLs visually dominated their cards,
- Navbar/Footer needed softer integration with the Assistant workspace.

### Implementation

- Added scoped v54 Assistant polish classes to `Chat.tsx`.
- Added a v54 comfort polish layer to `client/src/styles/admin.css`.
- Reduced workspace width/gaps/radii and softened card borders/shadows.
- Added wrapping and line-height safeguards to `SuggestedQuestions.tsx`.
- Added route-link truncation rules.
- Added scoped `body:has(.assistant-polish-v54)` styling for nav/footer softening only while Assistant pages are visible.

### Changed files

```text
client/src/pages/Chat.tsx
client/src/components/SuggestedQuestions.tsx
client/src/styles/admin.css
```

### Verification

Static TSX transpile diagnostics passed for changed TSX files. CSS brace check passed.

Full sandbox `tsc --noEmit` remains blocked by inherited extracted-package dependency issue:

```text
TS2688 Cannot find type definition file for 'node'
TS2688 Cannot find type definition file for 'vite/client'
```

Required Windows check:

```powershell
pnpm.cmd run check
```

### Return path

After browser retest, return to:

```text
Knowledge Batch 06C — Chat Answer Runtime Evidence Intake + Citation Display Acceptance
```

Then proceed to 29A if staging/RBAC/RLS evidence is available. Mega Batch 30 remains blocked.

---

## 2026-06-19 — Mega Batch UI/UX 01C: Suggested Questions Click Response + Contrast Fix

Decision: `MEGA_BATCH_UIUX_01C_SUGGESTED_QUESTIONS_CLICK_RESPONSE_AND_CONTRAST_FIX_APPLIED_BROWSER_RETEST_REQUIRED`.

This remains inside the approved one-stage Assistant-only UI/UX interlude. No database, governance, RBAC/RLS, knowledge approval, or production changes were made.

### Trigger

User browser evidence showed that some suggested-question buttons on `/knowledge#/chat` were visually unclear and that pressing a suggested question did not produce a visible response.

### Fix

- `SuggestedQuestions.tsx`: added explicit `type="button"`, category data attributes, and clearer v55 button/icon classes.
- `Chat.tsx`: suggested question clicks now call `submitMessageContent(...)` directly instead of only setting input text or relying on delayed form submission.
- `admin.css`: added scoped v55 contrast layer for suggested-question buttons across legal/jurisprudence/administrative/historical groups.

### Required retest

- `/knowledge#/chat` suggested-question backgrounds are clear.
- Clicking a suggested question starts/uses a conversation and sends the question immediately.
- Windows `pnpm.cmd run check` passes.

### Return path

After v55 browser acceptance, return to `Knowledge Batch 06C`, then `Mega Batch 29A`. Mega Batch 30 remains blocked.


---

## Knowledge Batch 07 — Legacy DB Full Census + Migration Readiness + Page Operations Audit — 2026-06-19

### Nature
Assistant-only knowledge/data migration audit. No live DB write. No production gate.

### Key finding
The pre-Supabase assistant database contained a broader operational/content surface than the 138 records imported in KB05A. Historical evidence shows at least 307 `knowledge_documents` plus multiple supporting tables such as FAQs, suggested questions, fetched content, page settings, home sections, content templates, files and operational conversation data.

### Decision
`LEGACY_DB_FULL_CENSUS_COMPLETED_IMPORT_NOT_APPLIED_P1_MIGRATION_BACKLOG_PREPARED_PAGE_OPERATIONS_STATIC_AUDIT_COMPLETED_BROWSER_UAT_REQUIRED`

### Next
Knowledge Batch 08 should stage all legacy records first, then promote P1 data, then rebind pages and run browser UAT before returning to Knowledge 06C evidence.

---

## Knowledge Batch 08 — Legacy DB Staging Import + P1 Data Promotion Pack — 2026-06-19

### Nature
Assistant-only knowledge/data migration pack. Operator SQL prepared; no live Supabase apply was executed in ChatGPT sandbox.

### Decision
`KNOWLEDGE_BATCH_08_OPERATOR_STAGING_AND_P1_PROMOTION_PACK_PREPARED_LIVE_APPLY_PENDING`

### Prepared counts
- Main staging payloads: 929.
- Supplemental observed SELECT rows: 74.
- P1 rows from main staging: 893.
- P1 knowledge/reference candidates: 876.
- P1 auxiliary candidates: 17.

### Rule
All old DB records are staged before page binding. P1 knowledge/reference records may be promoted by operator SQL, but production remains blocked until apply evidence, page binding UAT, chat/citation evidence, and 29A/RBAC/RLS are closed.

### Next
`Knowledge Batch 08A — Supabase Apply Result Intake + P1 Promotion Acceptance`, then `Knowledge Batch 09 — Page Binding + Real Operations Enablement`.

---

## Sovereign Trust Foundation v1 — Official Sources + Verified Citations + Scoped Permissions + Human Review + Useful Workflows + Calm UX — 2026-06-19

### User-approved institutional equation

```text
Official sources
+ verified citations
+ scoped permissions
+ human review
+ useful workflows
+ calm usable interface
= trustworthy Waqf AI platform
```

### Decision

```text
SOVEREIGN_TRUST_FOUNDATION_V1_CODE_AND_OPERATOR_APPLY_PACK_IMPLEMENTED
LIVE_SUPABASE_APPLY_PENDING
HUMAN_VERIFICATION_PENDING
PRODUCTION_NOT_APPROVED
```

### Implemented foundation

- `server/assistantTrust.ts` evaluates authority tier, citation lifecycle, visibility scope and test/duplicate/quarantine conditions.
- Chat retrieval receives actor scope codes and fails closed for non-public records without an active authorized assignment.
- `assistant.knowledge_scope_assignments`, `assistant.knowledge_review_tasks` and `assistant.knowledge_access_events` are prepared under assistant schema through operator SQL; new direct client access is not granted.
- Source/citation verification statuses are explicit and legacy data is not automatically called verified.
- Test/fixture records are quarantined from chat after operator backfill.
- `knowledgeTrust.snapshot` and `knowledgeTrust.reviewQueue` provide admin read contracts.
- Chat citation cards display authority and citation state compactly.

### Next

1. Apply v58 operator SQL and accept v58A evidence.
2. Execute Knowledge Batch 09 for actual page bindings and workflows.
3. Run UX behavior polish over real data.
4. Return to KB06C, then 29A.

Production remains blocked until all later evidence gates close.


## Sovereign Trust Foundation v1A — 2026-06-19

- تم قبول أدلة تطبيق v58: 146 سجلًا approved/chat-eligible و6 draft ضمن التوزيع المرسل.
- ظهر drift حرج: 61 سجلًا authority_level=unverified رغم `is_chat_eligible=true`.
- توجد 304 مهام مراجعة مفتوحة: 152 citation verification، 146 source verification، 6 content classification.
- لا يُغلق عقد trustworthy Waqf AI بعد؛ v59 يفرض strict verified-source + verified-citation public retrieval gate.
- لا حذف لأي سجل. يجري تعليق chat eligibility فقط للسجلات غير المتحققة، ثم تحريرها بعد human review موثق.
- الترتيب التالي: v1B intake → KB08A → KB09 → reviewer workflow UI → UX behavior polish → KB06C/29A.

---

## Sovereign Trust Foundation v1B — Post-Apply Verification SQL Fix (2026-06-19)

- v1A strict-gate operator apply returned success evidence; review tasks remain open.
- The post-apply verifier contained a PostgreSQL syntax defect caused by an unwrapped cross-relation `count(*) from ...` expression.
- v60 corrects only the read-only verification SQL using a scalar subquery for strict candidate count.
- No DDL, DML, role/RLS, runtime, UI, or production approval change occurred in v60.
- Acceptance remains conditional on corrected verification results proving zero unverified/source-unverified/no-verified-citation chat-visible records.

## Sovereign Trust Foundation v1B — Strict Retrieval Gate Acceptance (2026-06-19)

### Accepted live verification
The corrected v60 read-only verification returned:
- `unverified_authority_chat_visible = 0`
- `source_not_verified_chat_visible = 0`
- `no_verified_citation_chat_visible = 0`
- `strict_public_chat_candidates = 0`

### Decision
`SOVEREIGN_TRUST_FOUNDATION_V1B_STRICT_RETRIEVAL_GATE_ACCEPTED_UNVERIFIED_PUBLIC_CHAT_EXPOSURE_ZERO_CONTENT_TRUST_CLOSURE_PENDING_HUMAN_REVIEW`

### Operational interpretation
The strict public chat retrieval gate is accepted and fail-closed. No unverified authority, source-unverified, or citation-unverified document is exposed to public retrieval. The candidate set is intentionally empty until human reviewers complete source/citation verification and explicitly release eligible records.

### Remaining obligations
- 304 human-review tasks remain open.
- KB08A staging/P1 promotion evidence remains pending.
- KB09 page binding and browser UAT remain pending.
- KB06C, 29A and production promotion remain blocked.


## KB08 v62 — Trust-Aligned Promotion Correction (2026-06-19)
KB08 staging is live: 929 main rows and 66 observed rows. The original KB08 step 04 was superseded because it would auto-approve and mark unverified recovered P1 content chat-visible. v62 requires review-only promotion: references and knowledge enter `in_review`, source verification is `pending`, citations are `linked`, and `is_chat_eligible=false` until verified source + verified citation + human release.


## Knowledge Batch 08A — Supabase Apply Result Intake + Trust-Aligned P1 Promotion Acceptance (2026-06-20)

### Accepted live evidence
- `assistant.legacy_import_register`: 929 main staging rows + 66 observed rows.
- v62 review-only P1 operator run: 896 considered, 600 valid review candidates/mappings, 296 `needs_mapping`, 600 linked citations, `approved_on_promotion=0`, `chat_visible_on_promotion=0`.
- New legacy slice: 462 `knowledge_documents` in `in_review` / `is_chat_eligible=false`, 462 pending `reference_documents`, 600 linked citations.
- Strict verified retrieval remains fail-closed; no auto-release has occurred.

### Decision
`KNOWLEDGE_BATCH_08A_STAGING_AND_TRUST_ALIGNED_REVIEW_ONLY_P1_PROMOTION_ACCEPTED`

### Next
1. Human Review Operations v1 for source/citation verification and controlled release.
2. KB08B to resolve 296 `needs_mapping` records.
3. KB09 page binding and real operations enablement.

**Production remains blocked.**

### KB08A review-queue reconciliation note
The v62 post-apply output lists 473 citation and 600 source verification tasks but does not list the 6 previously observed `content_classification` tasks. Treat this as a reconciliation item in Human Review Operations before creating replacement tasks; do not infer deletion without read-only evidence.

---

## Smart Tools 3 — Human Review Operations v1 + KB08B + KB09 (2026-06-20)

### Baseline state

```text
SMART_TOOLS_3_IMPLEMENTATION_PREPARED_STATICALLY_VALIDATED
LIVE_SUPABASE_APPLY_PENDING
BROWSER_RBAC_RLS_UAT_PENDING
PRODUCTION_NOT_APPROVED
```

### Scope delivered in the patch baseline

- مركز عمليات إداري واحد: `/admin/knowledge-review-operations`.
- تسوية read-only إلزامية للمهام التاريخية الست `content_classification` قبل أي بدائل أو إلغاء.
- RPCs محكومة للآتي: claim review task، توثيق مصدر رسمي، توثيق citation، وإصدار وثيقة رسمية محددة فقط.
- إصدار الدردشة لا ينجح إلا مع `assistant.publish` ومصدر `official/verified` وcitation `verified`، ولا توجد عملية bulk release.
- KB08B يضيف سجل قرارات auditable للسجلات الـ296 `needs_mapping` مع `map_existing` أو `promote_review` أو `defer` أو `quarantine`، ولا يحذف السجل الموروث.
- KB09 ينشئ عقود التشغيل: Knowledge Base/Search/Files `active` عبر server contract؛ FAQ/Templates/Settings `prepared` وكتابة disabled إلى أن يتحدد canonical owner binding.
- لا direct browser DML إلى جداول knowledge/legacy mappings/page bindings.

### Validation completed in package assembly

- نجح فحص syntax للملفات TypeScript/TSX المعدلة باستخدام TypeScript transpilation.
- نجح فحص ساكن لغياب browser DML في شاشة المركز الجديدة.
- لم يُنفذ Supabase apply أو browser UAT من بيئة تجميع الحزمة؛ لذلك لا تغير هذه الفقرة قبول KB08A ولا تمنح اعتماد إنتاج.

### Mandatory next gate

نفّذ بالترتيب: `00_PREFLIGHT_READ_ONLY` → `00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY` → `01` → `02` → `03` → `04`، ثم server/client deploy وRBAC/RLS UAT. بعد حفظ الأدلة فقط يُنشأ baseline acceptance جديد وتُحدّث الأرقام التشغيلية الفعلية.


---

## Mega Batch 29A v65 — Remote Staging Evidence + RBAC/RLS Negative UAT Hardening (2026-06-20)

### Current confirmed Staging SQL state

```text
STAGING_SQL_APPLY_AND_GOVERNANCE_VERIFIED
HUMAN_REVIEW_OPERATIONS_V1_VERIFIED
KB08B_MAPPING_RESOLUTION_VERIFIED
KB09_PAGE_BINDING_VERIFIED
NO_AUTOMATIC_MAPPING_OR_CHAT_RELEASE_CONFIRMED
PRODUCTION_NOT_APPROVED
```

### v65 code and operator deliverables

- A safe endpoint `/api/health/staging-evidence` reports deployment labels and readiness for **Browser UAT only**; it returns no secret values and can never approve production.
- A read-only `/admin/staging-evidence` page is available for remote staging screenshots.
- The generic admin console is now explicit-admin-only. `manager`, `employee`, `viewer`, and unauthenticated users are denied visual `/admin` access and server-side `adminProcedure` paths until scoped internal routes are built.
- `knowledgeTrust` now requires server-side `assistant.review` for snapshots, review queues, tasks, mapping queue and KB09 bindings. No generic admin can read operations merely because it has an admin console role.
- `assistant.publish` is required before release or binding mutation; the review-only account sees no release control and receives a server 403 for publish attempts.
- Scope denials generate best-effort `knowledge_access_events` audit rows without storing secrets.

### Remaining gate

```text
MEGA_BATCH_29A_CODE_AND_EVIDENCE_PACK_PREPARED
REMOTE_STAGING_DEPLOYMENT_EVIDENCE_PENDING
RBAC_RLS_NEGATIVE_UAT_PENDING
PRODUCTION_NOT_APPROVED
```

### Mandatory next action

Deploy this baseline to remote Staging and run the full evidence/runbook in `docs/mega_batch_29a_remote_staging_rbac_rls_uat/`. Do not execute Mega Batch 30 before accepted browser/Network/SQL evidence establishes `STAGING_RUNTIME_AND_NEGATIVE_UAT_VERIFIED`.

---

## Assistant Maturity Program — Mega Batch A Candidate (2026-06-28)

### Program decision

```text
THREE_MEGA_BATCH_ASSISTANT_MATURITY_PROGRAM_AUTHORIZED
MEGA_BATCH_A_NEXT
MEGA_BATCH_B_AND_C_CONDITIONALLY_SEQUENCED
POST_BATCH_C_COMPREHENSIVE_INSPECTION_REQUIRED
PRODUCTION_NOT_APPROVED
```

### Mega Batch A scope

- Runtime knowledge read resilience: required companion failures reject partial bundles and initiate a 30-second safe retry backoff.
- Safe operational diagnostics, with no secret, URL, or raw driver disclosure.
- Canonical human-review queue counters derived from the same task dataset.
- Reviewer-only case context: task, knowledge document, reference, source, files, and citations.
- Explicit reviewer task-claim enforcement in the tRPC layer and required SQL RPC gate.
- Containment-only content classification decisions; no chat eligibility increase.
- Server-side phase locks prevent KB08B mapping mutation, page-binding mutation, and official release throughout Mega Batch A.
- Local-only site settings fallback prevents development 500 noise while preserving write denial and production fail-closed behavior.

### Evidence status

```text
MEGA_BATCH_A_CANDIDATE_PREPARED_NOT_APPLIED
LOCAL_CHECK_AND_BUILD_PENDING
SQL_OPERATOR_APPLY_PENDING
CONTROLLED_HUMAN_REVIEW_SAMPLE_NOT_STARTED
PRODUCTION_NOT_APPROVED
```

No claim of SQL application, human decision completion, chat eligibility change, remote staging evidence, or production readiness is made by this candidate.

---

## MEGA_BATCH_AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1 — 2026-07-06

### Status

```text
ACCEPTED_LOCAL_ONLY
STATIC_VERIFY=PASS
PATCH_APPLY=PASS
BROWSER_UAT=PASS
STAGING_NOT_APPROVED
PRODUCTION_NOT_APPROVED
```

### Purpose

This batch refines the operational UX of the assistant page:

`/knowledge#/admin/source-provenance-rights`

The operator now sees the real workflow order before configuration fields:

`C3 → C4 → candidate eligibility → internal-use/rights acknowledgment → AR1 session`.

### Accepted runtime evidence

- Initial hold state correctly directed the operator to run C3 then C4.
- Completed C3/C4 state with `C4 linkable materials = 0` correctly moved the current action to candidate eligibility.
- The AR1 session form remained unavailable and the page explicitly explained the deterministic eligibility rules.
- The route rendered locally after restoration of private local runtime configuration. Private `.env` values are not part of the baseline.

### Non-negotiable controls preserved

- No fuzzy, semantic, vector, author-only, publisher-only, or partial URL matching.
- No automatic source/rights inference.
- No source-link, rights, document, chunk, embedding, vector, Chat, release, or production write.
- Maximum session limit remains five documents and thirty minutes when a session becomes eligible.
- `source_provenance_supporting_read_failed:PGRST205` remains a known expected state when Mega Batch C support-layer SQL is intentionally not applied; it is not repaired or bypassed by this batch.

### Baseline hygiene note

The clean source baseline remains secret-free. `.env`, `node_modules`, `dist`, and development caches are excluded. The original clean candidate exposed a `package.json` / `pnpm-lock.yaml` mismatch under `--frozen-lockfile`; local reconciliation used non-frozen installation. Strict frozen-lock revalidation should be run in a future dependency-hygiene gate if the updated lockfile is retained.

### Exact next functional step

Do not add AR1 capabilities. Perform only C4 candidate-eligibility triage when a real current deterministic candidate exists. Otherwise the current zero-candidate state is accepted and requires no UI repair.



## BASELINE_CLOSURE_VERIFIER_LITERAL_FIX_V1_2 — 2026-07-06

- تم تسجيل False Negative في verifier التوثيقي لإغلاق baseline بعد أن أثبت الفحص الحرفي للملف الفعلي وجود جميع مؤشرات AR1 المطلوبة.
- تم تصحيح أتمتة التحقق فقط لتستخدم مؤشرات حرفية منفصلة وقابلة للتفسير.
- لا تعديل على منطق AR1 أو SQL أو Schema/RLS/RPC أو الحقوق أو Chat/Release.
- يعتمد إغلاق baseline النهائي على Revision `R1` المحلي فقط؛ لا يوجد اعتماد Staging أو Production.



<!-- MEGA_BATCH_AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_V1_BASELINE_CLOSURE -->
## MEGA_BATCH_AR1_SINGLE_FLOW_ORCHESTRATION_AND_OPERATOR_CLARITY_V1 — Baseline Closure (2026-07-06)

تم قبول المسار الموحد محليًا بعد `STATIC_VERIFIER=PASS` وUAT متصفح مقبول. يختصر تشغيل AR1 للمشغّل في دورة واحدة: C3 محدود ثم C4 ثم حسم أهلية حتمي داخل العملية الخادمية نفسها. النتيجة الحالية `C4=0` مقبولة ومقفلة: لا جلسة AR1 ولا اختيار تلقائي ولا مطابقة تقريبية أو دلالية أو Vector.

لا يشمل القبول تفعيل طبقة الحقوق أو SQL أو Chat/Release أو Staging أو Production. نقطة الاستئناف لا تبدأ إلا عند ظهور مرشح C4 حتمي، ثم اختيار مشغّل صريح لمادة واحدة واعتمادات جلسة داخلية مكتملة.


## MEGA_BATCH_AR1_C4_DIRECT_KNOWLEDGE_DOCUMENT_METADATA_EXACT_LOOKUP_REPAIR_V1 — 2026-07-12

### الحالة

```text
AUTHORIZED=YES
SOURCE_PATCH_BUILT=YES
STATIC_VERIFICATION=PASS
TARGETED_TYPESCRIPT_DELTA_CHECK=PASS
RUNTIME_UAT=PENDING
USER_WORKSPACE_APPLY=PENDING
BASELINE=CANDIDATE_NOT_PROMOTED
PRODUCTION=NOT_APPROVED
```

### القرار التنفيذي

تم إصلاح فجوة حسم مادة C4 داخل AR1 بإضافة قراءة UUID مباشرة وضيقة من `assistant.knowledge_documents`. القراءة الجديدة لا تعتمد على نجاح `knowledge_sources` أو `reference_documents` أو `reference_files` أو `knowledge_citations`، ولا تتأثر بفتح circuit breaker الخاص بالحزمة المركبة. يبقى المسار العام القديم fallback للتوافق فقط.

يُرفض أي معرف غير UUID قبل الاستعلام، ويُنفذ الحسم عبر `eq('id', exactUuid)` و`maybeSingle()` فقط. لا مطابقة عنوان أو رابط أو fuzzy أو semantic أو vector، ولا إنشاء رابط مصدر أو قرار حقوق أو كتابة وثيقة/Chunk/Embedding. يحافظ resolver على UUID السيادي كمعرف الجلسة الأساسي حتى لا يعود تشغيل السؤال لاحقًا إلى مسار legacy رقمي.

### التحقق المحلي

- verifier الجديد: `PASS`.
- فحص TypeScript موجّه قبل/بعد التعديل أظهر نفس خطأي baseline غير المرتبطين في `server/legacyManusProvenance.ts`، ولم يضف التعديل أي خطأ في الملفين المستهدفين.
- لم يُنفذ Runtime UAT متصلًا بقاعدة البيانات داخل بيئة إعداد الحزمة؛ يلزم تطبيق الحزمة محليًا وتشغيل زر دورة التحقق مرة واحدة.

### بوابة القبول

لا تُرقّى الحزمة إلى baseline مقبول قبل إثبات:

```text
C3.status=completed
requestedChecks=30
noDatabaseWrite=true
C4.status=READY_FOR_OPERATOR_BINDING
candidateCount>0
directC4MaterialReferences>0
nextAction=REVIEW_ONE_DETERMINISTIC_CANDIDATE
AR1_SESSION_AUTO_START=NO
```

Chat/RAG والنشر العام وProduction وكتابة الحقوق والمصادر تظل محظورة.

---

## Update — AR1 C4 Direct Knowledge Document Exact Lookup Repair V1 — قبول محلي R3 (2026-07-12)

**الحالة:** `ACCEPTED_LOCAL_ONLY`  
**Baseline:** `PALWAKF_ASSISTANT_SOURCE_PROVENANCE_AR1_RESOLUTION_BASELINE_R3_ACCEPTED_LOCAL_20260712.zip`

### نتيجة الإغلاق

```text
SOURCE_PATCH_APPLIED=YES
STATIC_VERIFICATION=PASS
POSTIMAGE_VERIFY=PASS
TSX_RUNTIME_DEPENDENCY_REPAIR=PASS
RUNTIME_UAT=PASS
C3_STATUS=completed
C3_REQUESTED_CHECKS=30
C3_NO_DATABASE_WRITE=true
C4_STATUS=READY_FOR_OPERATOR_BINDING
C4_CANDIDATE_COUNT=2
DIRECT_C4_MATERIAL_REFERENCES=2
NEXT_ACTION=REVIEW_ONE_DETERMINISTIC_CANDIDATE
AR1_ACTIVE_SESSIONS=0
AR1_AUTOMATIC_SESSION_START=NO
LLM_GENERATION_ENABLED=false
BASELINE_STATUS=ACCEPTED_LOCAL_ONLY
```

### معنى القبول

أُغلق عطل اختفاء UUID المحدد من C4 داخل resolver الخاص بـAR1. أصبح AR1 يرى وثيقتي المعرفة المحددتين عبر exact read-only lookup على `assistant.knowledge_documents.id`، دون الاعتماد على نجاح الحزمة المركبة للجداول المرافقة.

هذا القبول لا يمنح حق استخدام أو ترخيصًا ولا ينشئ source link أو rights assignment ولا يطلق Chat/RAG. المرشحان المعروضان هما قائمة مراجعة داخلية فقط، ويتطلب أي انتقال إلى جلسة AR1 تأكيدًا بشريًا وتفويضًا صريحًا جديدًا.

### ملاحظة صلاحية دليل C3

دليل C3 المستخدم في UAT كان مؤقتًا وانتهت صلاحيته عند `2026-07-12T00:10:09.265Z`. قبول الـbaseline يثبت صحة الإصلاح، لكنه لا يجعل حالة C3 الحالية دائمة. يجب إنشاء دليل C3 جديد عند أي جلسة تشغيل لاحقة أو بعد إعادة تشغيل العملية.

### نقطة الاستئناف

`REVIEW_ONE_DETERMINISTIC_CANDIDATE` بوصفه إجراءً بشريًا محكومًا منفصلًا. لا تبدأ جلسة AR1 ولا تختَر مادة ولا تسجل حقوقًا أو مصدرًا قبل تفويض مستقل.

---

## Update — MEGA_BATCH_AR1_DETERMINISTIC_CANDIDATE_REVIEW_AND_EPHEMERAL_SESSION_AUTHORITY_PREP_V1 — 2026-07-12

### الحالة

```text
STATUS=BUILT_CANDIDATE_PENDING_LOCAL_APPLY_AND_RUNTIME_UAT
BASELINE_CURRENT=PALWAKF_ASSISTANT_SOURCE_PROVENANCE_AR1_RESOLUTION_BASELINE_R3_ACCEPTED_LOCAL_20260712
BASELINE_NEXT=PALWAKF_ASSISTANT_AR1_AUTHORITY_PREP_BASELINE_R4_CANDIDATE_20260712
```

### الغرض

إضافة مرحلة مستقلة ومحكومة بين `REVIEW_ONE_DETERMINISTIC_CANDIDATE` وبدء جلسة AR1. تراجع المرحلة مرشحًا واحدًا فقط، وتطلب T3/T4 ومرجع استخدام داخلي ومرجع حقوق/استخدام ومبررات وإقرارات صريحة، ثم تنشئ `authorityPreparationId` مؤقتًا في ذاكرة الخادم دون بدء الجلسة.

### العقد الحاكم

```text
C3 fresh evidence
→ C4 READY_FOR_OPERATOR_BINDING
→ one current deterministic candidate
→ operator review and acknowledgements
→ process-memory authority preparation (max 10 minutes and bounded by C3 expiry)
→ session start remains separately authorized
```

### القيود

```text
NO_SQL
NO_DATABASE_WRITE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_DOCUMENT_COPY
NO_CHUNK_OR_EMBEDDING_WRITE
NO_VECTOR_INDEXING
NO_FUZZY_OR_SEMANTIC_MATCHING
NO_MODEL_INVOCATION_DURING_PREP
NO_SESSION_AUTO_START
NO_PUBLIC_CHAT_RELEASE
NO_PUBLIC_RELEASE
NO_PRODUCTION
SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED
```

### أثر الواجهة

- يظهر زر **تحضير صلاحية جلسة AR1** بعد استكمال المراجعة.
- يعرض التحضير المعرف، ووقت الانتهاء، والبصمة، وحالة `sessionStarted=false`.
- زر بدء الجلسة محجوب ميكانيكيًا في هذه الدفعة.
- يمكن إلغاء التحضير ومسحه من الذاكرة.

### معيار Runtime UAT

```text
authorityPreparation.status=prepared
authorityPreparation.sessionStarted=false
authorityPreparation.databaseWrites=0
activeSessions=0
sessionStartPolicy=SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED
```

---

## Update — AR1 Deterministic Candidate Review and Ephemeral Session Authority Preparation V1 — قبول Runtime محلي (2026-07-13)

```text
SOURCE_APPLY=PASS
STATIC_VERIFICATION=PASS
RUNTIME_UAT=PASS
AUTHORITY_PREPARATION_STATUS=prepared
AUTHORITY_STORAGE=process_memory_only
AUTHORITY_TTL_MINUTES=10
AUTHORITY_REVOKE_STATUS=revoked
ACTIVE_AUTHORITY_PREPARATIONS_AFTER_REVOKE=0
ACTIVE_SESSIONS=0
SESSION_STARTED=false
DATABASE_WRITES=0
SOURCE_OR_RIGHTS_WRITES=0
LLM_GENERATION_ENABLED=false
SESSION_START_POLICY=SEPARATE_EXPLICIT_SESSION_START_AUTHORIZATION_REQUIRED
BASELINE_R4=READY_FOR_ACCEPTED_LOCAL_PROMOTION
PRODUCTION_NOT_APPROVED=YES
```

أثبت Runtime UAT أن المشغل يستطيع مراجعة مرشح C4 واحد وتحضير صلاحية داخل ذاكرة العملية، مرتبطة بالمشغل، محدودة بعشر دقائق وبصلاحية C3، دون إنشاء جلسة AR1. كما أثبت الإبطال الصريح أن التحضير انتقل إلى `revoked` مع بقاء `activeSessions=0` و`activeAuthorityPreparations=0`.

هذا القبول لا يصرح ببدء جلسة AR1 ولا يمنح حقوقًا أو ترخيصًا، ولا ينشئ Source Link أو Rights Assignment، ولا يفعّل LLM أو Chat/RAG أو Production.

---

## AR1 Explicit Ephemeral Session Start and Evidence-only Runtime UAT V1 — 2026-07-13

**الطبيعة:** تشغيل فعلي داخلي محدود، وليس Production ولا Chat/RAG عامًا.

```text
BATCH=MEGA_BATCH_AR1_EXPLICIT_EPHEMERAL_SESSION_START_AND_EVIDENCE_ONLY_RUNTIME_UAT_V1
EXPLICIT_SESSION_START=ENABLED_FOR_EVIDENCE_ONLY_RUNTIME_UAT
AUTHORITY_PREPARATION_REQUIRED=true
ONE_QUESTION_LIMIT=1
LLM_GENERATION=DISABLED_BY_SESSION_CONTRACT
SESSION_STORAGE=process_memory_only
DATABASE_WRITE=NO
SOURCE_OR_RIGHTS_WRITE=NO
ROLLBACK_REQUIRED=YES
PUBLIC_RELEASE=NO
PRODUCTION_NOT_APPROVED=YES
RUNTIME_UAT=PENDING
```

تسمح الدفعة ببدء جلسة AR1 مؤقتة واحدة بعد تحضير صلاحية صحيحة وحديثة. يتطلب البدء قرارًا صريحًا ومرجع UAT وثلاثة إقرارات. تُقيد الجلسة بسؤال واحد، وتبقى Evidence-only حتى لو تغير إعداد مزود النموذج أثناء الجلسة. بعد التقاط أدلة السؤال يجب تنفيذ Rollback ومسح الجلسة من الذاكرة.

هذه الدفعة لا تمنح حقوقًا ولا تنشئ Source Link ولا تعتمد المعرفة لـChat/RAG أو Production.

---

## AR1 Evidence-only Session Runtime UAT — قبول محلي (2026-07-13)

```text
SOURCE_APPLY=PASS
STATIC_VERIFICATION=PASS
FUNCTIONAL_ISOLATED_TEST=PASS
RUNTIME_UI_UAT=PASS
EXECUTION_MODE=evidence_only_runtime_uat
QUESTION_COUNT=1
MAX_QUESTIONS=1
LLM_GENERATION_USED=false
DATABASE_WRITES=0
SOURCE_OR_RIGHTS_WRITES=0
PUBLIC_RELEASE=blocked
CHAT_RELEASE=blocked
ROLLBACK_APPLIED=true
ACTIVE_SESSIONS_AFTER_ROLLBACK=0
ACTIVE_AUTHORITY_PREPARATIONS_AFTER_ROLLBACK=0
BASELINE_R5=READY_FOR_ACCEPTED_LOCAL_PROMOTION
PRODUCTION_NOT_APPROVED=YES
```

تم تشغيل أول جلسة AR1 فعلية داخلية مؤقتة بسؤال واحد ومادة واحدة من C4. أُعيدت نتيجة Evidence-only مقيدة باستشهاد T3، ثم نُفذ Rollback وأزيلت الجلسة من ذاكرة العملية.

لا يصرح هذا القبول بتفعيل LLM أو Chat/RAG العام أو أي كتابة سيادية أو Production.
---

## Update — R9 Controlled Live Remediation + Source Sync — 2026-08-21

### الجذر والفرع الحاكمان
- Canonical local root: `C:\Users\DELL\StudioProjects\palwakf_waqf Ai_system`
- Branch: `agent/assistant-local-root-adoption-v1`
- Base HEAD before source sync: `3976707e203ed37ba18d9b6811a254060ce78ec1`

### الأدلة المقبولة
- R9 Targeted Read-Only Closure: PASS.
- `transaction_read_only=on` مثبت.
- R9 Source Usage Census: 63/63 identifiers و10,701 tracked matches.
- Live migration `palwakf_assistant_r9_controlled_live_remediation_v1`: PASS.

### الإغلاق الحي المنجز
- `document_can_write_v1()` أصبح fail-closed لدور `authenticated`.
- الجداول الأربعة P0 أصبحت client SELECT-only.
- أزيلت `MAINTAIN/TRUNCATE/REFERENCES/TRIGGER` من `anon/authenticated` على مجموعة R9 ذات 42 جدولًا.
- سبعة Legacy Provenance RPCs أصبحت `postgres/service_role` only.
- أصبحت `source_rights_profiles`, `source_url_history`, `source_permissions`, `source_takedown_requests`, `source_provenance_events` Live.
- أصبحت `rpc_source_rights_review_v1` Live.
- أصبح `rpc_release_official_knowledge_document_v1` fail-closed على verified rights + active official source + source consistency + verified citation + no takedown hold.

### Source Sync
- أضيف `reviewSourceRightsProfile` إلى backend.
- أضيف `sourceProvenance.reviewRights` إلى TRPC.
- أضيفت واجهة Verify / Reject بشرية في سجل المصادر والحقوق.
- تعديل ملف الحقوق يعيد قرار المراجعة إلى `pending` في العقد الحي.
- لا يؤدي Rights Review إلى Chat/Public Release تلقائيًا.
- نُسخت الـMigration المطبقة إلى `sql_sandbox` كسجل مرجعي ولا تعاد من هناك.

### الحدود
- لا automatic rights approval.
- لا automatic knowledge approval.
- لا public production promotion.
- لا تعديل `pnpm-lock.yaml`.
- لا Git commit/push/PR حتى نجاح TypeScript + Runtime UAT + Final Diff.

### البوابة التالية
`R9_SOURCE_SYNC_TYPESCRIPT_RUNTIME_UAT_AND_FINAL_DIFF_GATE`

---

## Update — R9 Runtime + Final Diff Local Closure — 2026-08-21

### حالة القبول المحلي
- `R9_CONTROLLED_LIVE_REMEDIATION=ACCEPTED_LIVE`
- `R9_SOURCE_SYNC=ACCEPTED_LOCAL`
- `R9_SOURCE_SYNC_TYPESCRIPT=PASS`
- `R9_RUNTIME_SERVER=PASS`
- `R9_HTTP_SMOKE=PASS`
- `R9_SUPABASE_LIVE_CONNECTION=PASS`
- `R9_LIVE_DATA_BINDING=PROVEN`
- `R9_LLM_RUNTIME=PASS`
- `R9_READ_ONLY_BROWSER_UAT=PASS`
- `R9_BROWSER_CONSOLE_ERRORS=0`
- `R9_FINAL_DIFF_CODE_SCOPE=PASS`
- `PNPM_LOCK_CHANGED=NO`

### Runtime المثبت
- Database provider: `supabase_postgresql`.
- Database mode: `connected`.
- Live probe: `assistant.ai_tool_runs`.
- LLM provider: `ollama`.
- LLM model: `qwen2.5:3b`.
- Readiness: `server=true`, `database=true`, `llm=true`, `ready=true`.
- Production blockers reported by readiness: `0`.

### Git baseline قبل الترقية
- Branch: `agent/assistant-local-root-adoption-v1`
- Base HEAD: `3976707e203ed37ba18d9b6811a254060ce78ec1`
- `origin/main`: `3976707e203ed37ba18d9b6811a254060ce78ec1`
- Ahead/Behind before promotion: `0/0`.

### حدود القبول
- لا automatic rights approval.
- لا automatic knowledge approval.
- لم ينفذ Rights Review mutation أثناء Browser UAT.
- لا Public Release تلقائي.
- لا تعديل `pnpm-lock.yaml`.
- رسائل Legacy local DB fallback تبقى دينًا تشغيليًا غير حاجب لأن Supabase health/readiness المثبتين Passed.

### البوابة التالية
`R9_GITHUB_PROMOTION_AND_CANONICAL_BASELINE_GATE`

- `R9_GITHUB_PROMOTION=PENDING`
- `R9_CANONICAL_GITHUB_BASELINE=PENDING`

---

## Update — R9 GitHub Promotion + Draft PR Pre-Merge Hygiene — 2026-08-21

### الحالة المثبتة قبل الدمج
- `R9_GITHUB_PROMOTION=ACCEPTED`
- `R9_REMOTE_BRANCH=VERIFIED`
- `R9_PR_CREATION=ACCEPTED_DRAFT`
- `R9_PR_NUMBER=1`
- `R9_PR_BASE_BRANCH=main`
- `R9_PR_HEAD_BRANCH=agent/assistant-local-root-adoption-v1`
- `R9_PR_PREMERGE_HYGIENE_PATCH=APPLIED_PENDING_FINAL_GITHUB_REVIEW`
- `R9_MAIN_MERGE=PENDING`
- `R9_CANONICAL_MAIN_BASELINE=PENDING`

### نطاق Hygiene Patch
- إزالة UTF-8 BOM غير المقصود من أربعة ملفات tracked فقط.
- تثبيت UTF-8 بدون BOM.
- تثبيت نهاية ملف واحدة LF للملفات الأربعة.
- لا تغيير دلالي مقصود في ملفات TypeScript/TSX.
- تحديث هذا الدليل فقط بحالة GitHub Promotion وDraft PR الحالية.

### بوابات ما قبل Commit/Push
- TypeScript check مطلوب.
- `git diff --check` مطلوب.
- staged scope يجب أن يساوي الملفات الأربعة فقط.
- `pnpm-lock.yaml` يجب أن يبقى بلا تغيير.

### الحدود
- لا Database write.
- لا PR جديد.
- لا Merge.
- لا direct write إلى `main`.
- لا توسيع للنطاق.

### البوابة التالية
`R9_PR_FINAL_GITHUB_REVIEW_AND_MERGE_AUTHORIZATION_GATE`

---

## Update — R9 Final Post-Merge Canonical Closure — 2026-08-21

### الحقيقة النهائية المعتمدة
- `R9_CONTROLLED_LIVE_REMEDIATION=ACCEPTED`
- `R9_SOURCE_SYNC=ACCEPTED`
- `R9_TYPESCRIPT=PASS`
- `R9_RUNTIME=PASS`
- `R9_SUPABASE_LIVE=PASS`
- `R9_LLM_RUNTIME=PASS`
- `R9_READ_ONLY_BROWSER_UAT=PASS`
- `R9_ENCODING_HYGIENE=PASS`
- `R9_GITHUB_PROMOTION=ACCEPTED`
- `R9_PR_NUMBER=1`
- `R9_PR_FINAL_STATE=MERGED`
- `R9_MAIN_MERGE=ACCEPTED`
- `R9_POST_MERGE_LOCAL_MAIN_RECONCILIATION=PASS`

### GitHub canonical state بعد دمج R9
- Merge commit / `main`: `31037260daeae3321f974da6cbc414dff2e567ea`
- Canonical tree: `e5887ab0661d9205dd3e94e09c5bb590bdf3790e`
- R9 final feature/hygiene head قبل الدمج: `757cc982635b011a89660b8f30eb15403b10f5d3`
- R9 original promotion commit: `7aab0e4d6ed41a28cd3258909ff550d094dcb828`
- R9 pre-promotion base: `3976707e203ed37ba18d9b6811a254060ce78ec1`
- النطاق المدمج: 10 مسارات بالضبط.
- `pnpm-lock.yaml` لم يتغير.

### Canonical Main Baseline الملتقطة بعد الدمج
- Baseline: `PALWAKF_ASSISTANT_R9_CANONICAL_MAIN_BASELINE_20260821_231336.zip`
- SHA-256: `199A342A3D4AABBF7E0CFEC60B176AF8686ABF643193144F06989E177635DCBD`
- `R9_CANONICAL_MAIN_BASELINE=ACCEPTED`
- الالتقاط تم من `origin/main` دون تبديل الفرع أثناء الالتقاط ودون Git/DB write.

### تفسير العلامات التاريخية السابقة
علامات `PENDING` الموجودة في كتل R9 الأقدم تبقى كسجل تاريخي صحيح لحالة تلك اللحظة، ولا تمثل الحالة الحالية. هذه الكتلة هي المرجع الزمني الأحدث لحالة R9.

### الحدود المستمرة
- لا automatic rights approval.
- لا automatic knowledge approval.
- لا automatic public release.
- أي Live DB mutation جديدة تحتاج تفويضًا صريحًا جديدًا.
- أي Merge جديد إلى `main` يحتاج بوابة مستقلة.
- لا تعديل `pnpm-lock.yaml` ضمن هذا الإغلاق.

### وضع هذا التحديث
- هذا التحديث الوثائقي ينشأ على فرع مستقل بعد مصالحة local `main` مع canonical GitHub `main`.
- دمج PR الخاصة بهذا التحديث **غير مشمول** في تفويض المصالحة الحالي.

### البوابة التالية
`R9_POST_MERGE_GUIDE_CLOSURE_PR_REVIEW_AND_MERGE_GATE`

بعد دمج تحديث الدليل وإعادة تثبيت canonical `main`، يبدأ R10 من أحدث `main` معتمدة:
`MEGA_BATCH_ASSISTANT_PRODUCTION_OPERATIONS_WORKBENCH_AND_UX_R10_V1`

---

## Update — R10 Production Operations Workbench & UX — 2026-08-21

### نقطة الانطلاق
- Canonical GitHub `main`: `3b2d0fd8902dde3bc46914ecfd8d06e6af12af87`
- Canonical tree: `5d8200a4213ab91a5d06b97930065d90fda375b1`
- Branch: `agent/assistant-r10-production-operations-v1`
- `R9=FUNCTIONALLY_AND_CANONICALLY_CLOSED`

### القرار
`R10_PRODUCTION_OPERATIONS_WORKBENCH=SOURCE_APPLIED_PENDING_TYPESCRIPT_RUNTIME_READ_ONLY_BROWSER_UAT`

### التحول المنتجّي
- أصبحت `/admin/dashboard` مركز عمل يومي بدل Dashboard إحصائية.
- أضيف `/admin/assistant` لتشغيل Chat الحقيقي داخل Admin shell.
- أضيف `/admin/operations-search` للبحث في المعرفة والمصادر وتشغيلات الأدوات.
- أعيد بناء `/admin/knowledge-workspace` كطابور عمل متصل مع `claimReviewTask`.
- أعيد بناء `/admin/tools` كاستوديو أدوات، ونقلت تفاصيل Backend/الحوكمة إلى جزء ثانوي قابل للفتح.
- أصبحت القائمة اليومية موجهة إلى: العمل اليومي، المعرفة، الأدوات الذكية، البيانات الوقفية.
- بقية الأسطح تبقى متاحة تحت `الحوكمة والإدارة المتقدمة`.
- أضيف حفظ آخر route يومي وزر `متابعة آخر عمل`.

### حدود UAT الحالية
- Runtime Smoke = Read-Only.
- Browser UAT = Read-Only.
- لا `claimReviewTask` أثناء UAT الحالية.
- لا تشغيل أداة جديدة أثناء UAT الحالية.
- لا إرسال Chat أثناء UAT الحالية.
- لا Review/Approve/Reject أو أي mutation حية.
- أي Live mutating UAT تحتاج تفويضًا منفصلًا.

### حدود Git والبيانات
- لا DB migration أو DB write في R10 V1.0.1.
- لا تعديل `pnpm-lock.yaml`.
- لا Git commit/push/PR/merge ضمن بوابة التطبيق الحالية.

### البوابة التالية
`R10_TYPESCRIPT_RUNTIME_READ_ONLY_BROWSER_UAT_AND_FINAL_DIFF_GATE`
