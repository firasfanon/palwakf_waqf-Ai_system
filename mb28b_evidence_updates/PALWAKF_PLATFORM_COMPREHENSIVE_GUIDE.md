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

## Update — Mega Batch 28B Runtime Evidence Accepted — 2026-06-18

Decision: `MEGA_BATCH_28B_RUNTIME_EVIDENCE_ACCEPTED_SUPABASE_AND_LLM_READY_STAGING_PROMOTION_GATE_UNLOCKED`.

The assistant readiness gate was retested after correcting the database health adapter to treat Supabase/PostgreSQL as the sovereign database path when `PLATFORM_BRIDGE_ENABLED=1` and `PLATFORM_SUPABASE_URL` / `PLATFORM_SUPABASE_SERVICE_ROLE_KEY` are configured.

Accepted evidence:

- `/api/health/database-config`: `configured=true`, `source=PLATFORM_SUPABASE`, `provider=supabase_postgresql`, `dialect=postgresql`, `runtimeCompatible=true`.
- `/api/health/supabase`: `available=true`, `mode=connected`, `bridgeEnabled=true`, probe against `assistant.ai_tool_runs`.
- `/api/health/readiness`: `server=true`, `database=true`, `llm=true`, `ready=true`, `productionBlockers=[]`.

This unlocks Mega Batch 29 as a staging verification and production promotion assessment gate. It does not by itself grant production approval.
