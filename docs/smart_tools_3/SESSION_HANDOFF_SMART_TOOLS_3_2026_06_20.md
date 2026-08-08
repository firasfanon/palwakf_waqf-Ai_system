# Session Handoff — Smart Tools 3

## 1) تعريف الحالة

- **اسم الدفعة:** Smart Tools 3 — Human Review Operations v1 + KB08B Mapping Resolution + KB09 Page Binding.
- **النقطة السابقة المعتمدة:** KB08A بتاريخ 2026-06-20.
- **الحالة الآن:** حزمة كود/SQL/توثيق مكتملة بفحص ساكن فقط؛ **لم يثبت تشغيلها على Supabase ولم تعتمد للإنتاج**.
- **قرار الإنتاج:** `PRODUCTION_NOT_APPROVED`.

## 2) الدليل الحاكم قبل هذه الدفعة

- 929 صف staging رئيسي + 66 صف observed.
- 896 P1 considered.
- 600 review candidates/mappings.
- 296 `needs_mapping` = 276 `legacy_json_content` + 20 observed `knowledge_documents`.
- 600 citations linked وغير موثقة.
- 462 knowledge documents في `in_review` وchat=false.
- لا يوجد auto approval أو auto chat publication.
- تم قبول strict retrieval gate في KB08A، ويجب أن يبقى fail-closed.

## 3) الملفات التي تغيرت

### Server / Client

- `server/knowledgeOperations.ts` — عمليات server/service-role المحكومة.
- `server/routers.ts` — مسارات `knowledgeTrust` الجديدة.
- `client/src/pages/admin/KnowledgeReviewOperations.tsx` — واجهة التشغيل.
- `client/src/config/adminRegistryV2.ts` — تسجيل المسار الإداري.
- `client/src/components/PageBreadcrumbs.tsx` — تسمية breadcrumb.

### SQL

- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/00_PREFLIGHT_READ_ONLY.sql`
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY.sql`
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/01_HUMAN_REVIEW_OPERATIONS_V1_OPERATOR_APPLY.sql`
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/02_KB08B_MAPPING_RESOLUTION_OPERATOR_APPLY.sql`
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/03_KB09_PAGE_BINDING_REAL_OPERATIONS_OPERATOR_APPLY.sql`
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/04_POST_APPLY_READ_ONLY_VERIFICATION.sql`
- `sql_sandbox/smart_tools_3_human_review_kb08b_kb09/00_OPERATOR_SEQUENCE.md`

## 4) ما تحقق داخل الكود

### Human Review

- `claimReviewTask`: يستلزم `assistant.review` أو أعلى.
- `verifyOfficialSource`: يخلق/يعيد استخدام مصدر official verified ويكمل مهمة source verification، لكنه لا يحرر وثيقة للدردشة.
- `verifyCitation`: يوثق citation locator/excerpt ويكمل مهمة citation فقط.
- `releaseOfficialDocument`: يستلزم `assistant.publish`، ومصدر official verified واستشهاد verified؛ عندها فقط يتم اعتماد وثيقة واحدة وجعلها chat-eligible.

### KB08B

- `map_existing`: يربط السجل بسجل canonical موجود ثم يوسم import promoted؛ لا ينشر.
- `promote_review`: ينشئ reference + knowledge + linked citation + source/citation review tasks بحالة review-only.
- `defer` و`quarantine`: تحفظان السجل الموروث وقرار المراجع؛ لا حذف.

### KB09

- `knowledge_base/search/files`: عقود قراءة مفعلة server-only.
- `faq/templates/settings`: prepared وكتابة disabled لأنها لا تزال legacy operational records بلا canonical owner binding.

## 5) خطوات التنفيذ اللاحقة، بالترتيب

1. شغّل `00_PREFLIGHT_READ_ONLY.sql` واحفظ الإخراج.
2. شغّل `00A_CONTENT_CLASSIFICATION_RECONCILIATION_READ_ONLY.sql`.
3. إذا كان عدد `content_classification` ليس 6 أو صفرًا، لا تنشئ/تلغِ أي مهمة قبل جدول قرار صفّي مع evidence.
4. طبّق SQL 01 ثم 02 ثم 03 كل ملف منفصلًا.
5. شغّل SQL 04 واحفظ النتائج.
6. انشر server/client في staging.
7. شغّل `pnpm.cmd run check` و`pnpm.cmd run build` في بيئة Windows التي تحتوي dependencies.
8. افتح `/admin/knowledge-review-operations` بحساب admin مخول.
9. نفّذ UAT موجب/سلبي شامل؛ احفظ Network evidence لاستدعاءات `knowledgeTrust.*` وRPC.
10. لا تصدر وثيقة إلى الدردشة كتجربة إلا لو كانت وثيقة رسمية واحدة، مصدرها verified، citation verified، مع reviewer/publisher evidence.
11. سجّل نتائج KB08B للـ296 صفًا ثم حدّث baseline نتيجة التطبيق (لا قبل ذلك).

## 6) Evidence Matrix المطلوبة

| مجال | الدليل الأدنى | شرط القبول |
|---|---|---|
| Reconciliation | إخراج SQL صفّي للست مهام + قرار لكل صف | لا task replacement بالافتراض |
| Source verification | RPC success + reference/source state | chat لا يتغير |
| Citation verification | RPC success + citation state | chat لا يتغير |
| Controlled release | RPC success + source/citation verified + scope | وثيقة رسمية واحدة فقط تصبح eligible |
| RBAC negative | حساب بلا review/publish يرفض | 403/denied أو RPC failure صحيح |
| KB08B | قرارات محفوظة في legacy_mapping_resolutions | لا auto approval/chat |
| KB09 | binding table + UI evidence | legacy FAQ/templates/settings ليست active |
| Regression | strict retrieval summary | non-official chat-visible = 0 |

## 7) Rollback / containment

- لا يوجد rollback جماعي تلقائي لهذه الدفعة.
- عند خلل في release: حظر document محدد عبر مسار مراجعة موثق، ثم حفظ audit/access event وإعادة فحص strict gate.
- عند خلل KB09: اجعل binding `blocked` فقط؛ لا تعدل بيانات legacy.
- عند خلل KB08B: لا تحذف resolution؛ أضف resolution لاحقًا مع evidence يشرح التصحيح.

## 8) مسار ما بعد القبول

بعد قبول هذه الدفعة بأدلة حية:

1. تحديث `PALWAKF_PLATFORM_COMPREHENSIVE_GUIDE.md` بقرار apply الحقيقي والأرقام الناتجة.
2. إنشاء baseline compressed جديد متضمنًا SQL results وUAT.
3. UX behavior polish فوق بيانات حقيقية.
4. KB06C ثم Mega Batch 29A، مع بقاء Mega Batch 30 محجوبًا حتى اكتمال بوابات التشغيل والإنتاج.
