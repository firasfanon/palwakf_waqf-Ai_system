# Mega Batch 29A — Remote Staging Deployment Evidence + RBAC/RLS Negative UAT

**التاريخ:** 2026-06-20  
**النوع:** تطوير حوكمة وتشغيل فعلي + بوابة أدلة.  
**البيئة المستهدفة:** Staging البعيدة فقط.  
**قرار الإنتاج:** `PRODUCTION_NOT_APPROVED`.

## 1) ما أضيف في هذه الدفعة

1. endpoint آمن بلا أسرار:
   ```text
   /api/health/staging-evidence
   ```
   يجمع حالة الخادم، قاعدة البيانات، LLM، Supabase، ووسم النشر/الـbaseline المعلن من متغيرات الخادم فقط.
2. شاشة إدارية للالتقاط البصري:
   ```text
   /admin/staging-evidence
   ```
3. تشديد الـadmin console: لم يعد `manager` أو `employee` أو `viewer` يُعدّون مديرين لمجرد الدور العام؛ الوصول الكامل إلى `/admin` و`adminProcedure` مقصور على أدوار الإدارة الصريحة.
4. تشديد مركز عمليات المعرفة: كل بياناته التشغيلية تحتاج `assistant.review` في طبقة الخادم، وعمليات الإصدار/ربط الصفحات تحتاج `assistant.publish` قبل استدعاء RPC.
5. رفض النطاق في طبقة tRPC يُسجّل كـ `review/publish denied` في `assistant.knowledge_access_events` بصورة best-effort، بلا أسرار.

## 2) متغيرات Staging المطلوبة

تُضبط على **الخادم فقط**، ولا توضع في أي متغير `VITE_*`:

```dotenv
PALWAKF_DEPLOYMENT_ENV=staging
PALWAKF_DEPLOYMENT_REF=<commit-or-release-hash>
PALWAKF_BASELINE_ID=v65_mega_batch_29a_remote_staging_rbac_rls_uat_preapply_2026_06_20
```

تبقى مفاتيح `PLATFORM_SUPABASE_SERVICE_ROLE_KEY` و`PWF_SUPABASE_SERVICE_ROLE_KEY` خادمية فقط. لا تُعرض في endpoint ولا في UI.

## 3) Build/Deploy Gate

نفّذ داخل نسخة المشروع التي تحتوي dependencies:

```powershell
pnpm.cmd run check
pnpm.cmd run build
```

ثم انشر artifact الناتج إلى Staging مع المتغيرات الثلاثة أعلاه. لا يُستخدم localhost كبديل للدليل البعيد.

## 4) التقاط أدلة Health البعيدة

بعد النشر:

```powershell
.\scripts\mb29a_capture_remote_staging_evidence.ps1 `
  -StagingBaseUrl "https://<staging-domain>" `
  -DeploymentRef "<commit-or-release-hash>"
```

النتائج المطلوبة:

| Endpoint | القبول |
|---|---|
| `/api/health/database-config` | `configured=true`, `runtimeCompatible=true`, provider متوقع |
| `/api/health/supabase` | `available=true`, `mode=connected` |
| `/api/health/readiness` | `server=true`, `database=true`, `llm=true`, `ready=true` |
| `/api/health/staging-evidence` | `environment=staging`, `readyForBrowserUat=true`, لا blockers |

## 5) Browser RBAC Negative UAT

### الممثلون

- **Admin صريح:** مستخدم يحمل `admin` أو `super_admin` في منصة PalWakf.
- **Reviewer فقط:** مستخدم إداري صريح وموجود له `assistant.review` فقط. في دليل Staging الحالي، حساب المراجع المهيأ هو UUID `96f6cdc2-67f9-4352-b9f8-775ef509fed8`، لكن يجب أن تربط الجلسة الفعلية بهذا المعرف قبل اختبار المتصفح.
- **Non-reviewer admin:** مدير صريح بلا `assistant.review`.
- **Non-admin:** `manager` أو `employee` أو `viewer` أو مستخدم وحدة عادي.
- **Anonymous:** نافذة InPrivate بلا جلسة.

### مصفوفة القبول

| ID | الحالة | الممثل | الإجراء | النتيجة المطلوبة | دليل القبول |
|---|---|---|---|---|---|
| 29A-RBAC-P01 | وصول إداري | Admin صريح | افتح `/admin/staging-evidence` | الصفحة تظهر ولقطة health لا تحوي أسرارًا | Screenshot + Network |
| 29A-RBAC-P02 | مراجعة معرفة | Reviewer فقط | افتح `/admin/knowledge-review-operations` | تظهر المهام/KB08B/KB09، ولا يظهر زر الإصدار | Screenshot + `knowledgeTrust.access` |
| 29A-RBAC-N01 | Admin anonymous | Anonymous | افتح `/admin/dashboard` | شاشة **وصول إداري مرفوض**؛ لا تحميل بيانات | Screenshot + Network 401/403 |
| 29A-RBAC-N02 | Admin non-admin | manager/employee/viewer | افتح `/admin/users` أو `/admin/tools` | شاشة رفض؛ لا Sidebar ولا بيانات | Screenshot + Network 403 |
| 29A-RBAC-N03 | Knowledge non-reviewer | Admin بلا scope | افتح `/admin/knowledge-review-operations` | رسالة تطلب `assistant.review`؛ لا مهام ولا mapping | Screenshot + `knowledgeTrust.access` |
| 29A-RBAC-N04 | Publish denial | Reviewer فقط | استدعاء `knowledgeTrust.releaseOfficialDocument` من DevTools/واجهة إن ظهر | 403، وبلا تغيير chat eligibility | Network response + SQL chat gate |
| 29A-RBAC-N05 | Binding mutation denial | Reviewer فقط | محاولة `setPageBinding` | 403، ولا تغيير في binding | Network response + SQL bindings |
| 29A-RLS-N01 | Direct table write | Browser anon/authenticated | محاولة POST مباشرة إلى `assistant.knowledge_review_tasks` عبر REST staging | مرفوض 401/403/RLS؛ لا row جديد | Network response + SQL task count |
| 29A-RLS-N02 | Direct sensitive read | Browser anon/authenticated | GET مباشر للجدول أو `knowledge_scope_assignments` | مرفوض أو صفر حسب RLS؛ لا تجاوز نطاق | Network response |
| 29A-SEC-N01 | Service-role isolation | Browser | افحص Network/LocalStorage/SessionStorage/Sources | لا `service_role`, لا `sb_secret_`, لا أسماء المتغيرات الخادمية | Screenshot/grep redacted |
| 29A-AUDIT-N01 | denied action audit | Non-reviewer admin | نفّذ `knowledgeTrust.operationsSnapshot` | 403 + صف denied لعملية review في access events إن كان authUserId صالحًا | Network + SQL intake |

### قواعد تنفيذ آمنة

- لا تستخدم وثيقة حقيقية قابلة للإصدار لاختبار الرفض.
- لا تنشئ قرار KB08B حقيقيًا لأجل الاختبار إلا إن كان لديك دليل قرار بشري؛ use read-only endpoints في هذا الـUAT.
- لا تنشر وثيقة إلى الدردشة لأجل التحقق. صفر وثائق chat-eligible مقبول في هذه المرحلة.
- لا تلتقط أو ترسل service-role key أو bearer token أو cookies؛ اخفها كليًا في الصور.

## 6) SQL Evidence

قبل/بعد UAT شغّل (قراءة فقط):

```text
sql_sandbox/mega_batch_29a_remote_staging_rbac_rls_uat/00_MB29A_STAGING_RBAC_RLS_SERVER_CONTRACT_READ_ONLY.sql
sql_sandbox/mega_batch_29a_remote_staging_rbac_rls_uat/01_MB29A_POST_BROWSER_UAT_GOVERNANCE_READ_ONLY.sql
```

### قرار SQL المقبول

```text
PASS_SERVER_RBAC_RLS_CONTRACT_READY_FOR_BROWSER_UAT
```

ويجب أن تظهر `anon/authenticated` بلا SELECT/INSERT/UPDATE/DELETE على جداول assistant التشغيلية، وبلا EXECUTE على RPCs المذكورة.

## 7) أدلة التسليم المطلوبة

ضع الأدلة في مجلد واحد منظم:

```text
evidence/mega_batch_29a/<timestamp>/
  capture_manifest.json
  database-config.json
  supabase.json
  readiness.json
  staging-evidence.json
  29A-RBAC-P01-admin-staging-evidence.png
  29A-RBAC-P02-reviewer-knowledge-operations.png
  29A-RBAC-N01-anonymous-admin-denied.png
  29A-RBAC-N03-nonreviewer-knowledge-denied.png
  29A-RLS-N01-direct-write-denied.png
  29A-SEC-N01-service-role-not-found.png
  server-contract.json
  post-browser-uat-governance.json
  deployment-metadata-redacted.json
```

## 8) قرار الإغلاق

لا يصبح القرار:

```text
STAGING_RUNTIME_AND_NEGATIVE_UAT_VERIFIED
PRODUCTION_PROMOTION_ASSESSMENT_READY
```

إلا عند تقديم كل الأدلة المطلوبة وظهورها متسقة. حتى ذلك الحين:

```text
MEGA_BATCH_29A_CODE_AND_EVIDENCE_PACK_PREPARED
REMOTE_STAGING_DEPLOYMENT_EVIDENCE_PENDING
RBAC_RLS_NEGATIVE_UAT_PENDING
PRODUCTION_NOT_APPROVED
```
