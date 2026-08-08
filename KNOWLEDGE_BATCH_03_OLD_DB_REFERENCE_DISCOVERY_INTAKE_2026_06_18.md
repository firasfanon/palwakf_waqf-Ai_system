# Knowledge Batch 03 — Official Legal References Intake + Old DB Register Recovery

**Date:** 2026-06-18  
**Session:** تطوير الأدوات الذكية 2  
**Baseline in:** `waqf_ai_model_hybrid_llm_admin_v43_sovereign_batch_02_knowledge_uplift_review_approval_closure_2026_06_18.zip`  
**Batch type:** حوكمة معرفة + استرداد سجل مراجع من قاعدة البيانات السابقة + Intake تصنيفي  
**Production:** غير معتمد إنتاجيًا  
**Supabase DDL/DML:** لم ينفذ  

---

## 1) النبذة العربية

هذه الدفعة جاءت بعد تنبيه المستخدم إلى أن ملف/سجلات قاعدة البيانات السابقة قبل التحول إلى Supabase تحتوي تسجيلات المعرفة والمراجع.  
تمت مراجعة سجلات قاعدة البيانات القديمة الموجودة داخل `.manus/db/` وملفات seed/source القديمة الموجودة في المشروع، وتأكد أن المعرفة لم تكن محصورة في العينات الثمانية الحالية فقط.

طبيعة العمل هنا **استرداد واكتشاف وتصنيف** وليس اعتمادًا تلقائيًا ولا إدخالًا مباشرًا إلى Supabase.  
المخرجات أصبحت Register منظمًا يربط المعرفة القديمة بمسار المراجعة الجديد في `assistant`.

---

## 2) القرار

```text
KNOWLEDGE_BATCH_03_OLD_DB_REFERENCE_REGISTER_DISCOVERED_AND_INTAKEN_AS_REVIEW_BACKLOG
OLD_PRE_SUPABASE_KNOWLEDGE_RECORDS_CONFIRMED
SUPABASE_IMPORT_NOT_APPLIED
APPROVAL_REQUIRED_BEFORE_CHAT_VISIBILITY
PRODUCTION_NOT_APPROVED
```

---

## 3) النتيجة المختصرة

| البند | النتيجة |
|---|---:|
| سجلات معرفة/مراجع مميزة مستخرجة ومطهّرة | 138 |
| مرشحات مراجع قانونية/رسمية أولية | 41 |
| مرشحات إدارية/وزارة | 14 |
| مرشحات مراجع مساندة | 22 |
| تحتاج مراجعة بشرية | 59 |
| مستبعدة/غير سلطوية مبدئيًا | 2 |

---

## 4) أدلة قاعدة البيانات السابقة قبل Supabase

تم العثور على أدلة صريحة من سجلات MySQL/TiDB القديمة داخل `.manus/db/`، منها:

- `knowledge_documents` كان يحتوي أعدادًا متزايدة قبل التحول، وليس 8 فقط.
- وُجدت INSERT/SELECT قديمة للمعرفة القانونية والفقهية والتاريخية.
- وُجدت ملفات seed/source قديمة مثل `new_references.json`, `scripts/basic_references.json`, `scripts/additional_references.json`, `research_data/knowledge_base.json`, و`research_data/jerusalem_land_references.json`.
- وُجدت سجلات `knowledge_sources` قديمة، لكنها تشمل مصادر اختبارية، لذلك لا تعتمد كما هي.

### 4.1 مؤشرات count/category من السجلات القديمة

| file | evidence |
|---|---|
| db-query-1767916790725.json | total_documents=131 |
| db-query-1767917361721.json | total=132 |
| db-query-1767919863002.json | category=jurisprudence; count=59 |
| db-query-1767919863002.json | category=law; count=52 |
| db-query-1767919863002.json | category=historical; count=49 |
| db-query-1767919863002.json | category=reference; count=25 |
| db-query-1767919863002.json | category=administrative; count=12 |
| db-query-1767919863002.json | category=majalla; count=5 |
| db-query-1767919867643.json | total_documents=202 |
| db-query-1767967449651.json | total=226 |
| db-query-1767972513332.json | category=reference; count=24 |
| db-query-1767972513332.json | category=law; count=2 |
| db-query-1767972513332.json | category=historical; count=2 |
| db-query-1767974478166.json | total_count=293 |
| db-query-1767974478166.json | total_count=land_refs_count |
| db-query-1767974478166.json | total_count=16 |

> ملاحظة: بعض rows في سجلات قديمة خرجت بتنسيق stdout غير منتظم، لذلك استُخدمت كدليل سياقي فقط، لا كمدخل اعتماد مباشر.

---

## 5) Register مستخرج ومطهّر

تم إنشاء الملفين التاليين:

```text
knowledge_batch_03_old_db_extracted/old_db_knowledge_register_extracted_sanitized.json
knowledge_batch_03_old_db_extracted/old_db_knowledge_register_extracted_sanitized.csv
```

كل سجل يحمل:

- `registry_key`
- `title`
- `category`
- `source`
- `origin`
- `origin_file`
- `authority_tier_candidate`
- `supabase_intake_status = discovered_pending_review_not_applied`

---

## 6) أمثلة من المرشحات الرسمية/القانونية والإدارية

| title | category | source | tier |
|---|---|---|---|
| إدارة الأوقاف في عهد الانتداب البريطاني | historical | https://badil.org/publications/al-majdal/issues/items/409.html | ministry_or_administrative_candidate |
| نظام ملكية الأراضي في العهد العثماني | reference | https://info.wafa.ps/pages/details/32393 | ministry_or_administrative_candidate |
| إدارة وتنمية أموال الوقف - ماجد أبو رخية | إداري |  | ministry_or_administrative_candidate |
| الإشراف المعاصر على العقارات الوقفية | إداري | https://www.palestinecabinet.gov.ps/portal/GovService/Details/129 | ministry_or_administrative_candidate |
| الوقف الإسلامي: تطوره، إدارته، تنميته - منذر قحف | إداري |  | ministry_or_administrative_candidate |
| تعليمات لجان رعاية المساجد رقم (2) لسنة 2023م | إداري | http://muqtafi.birzeit.edu/pg/getleg.asp?id=18827 | ministry_or_administrative_candidate |
| مهام وزارة الأوقاف والشؤون الدينية الفلسطينية | إداري | https://www.palestinecabinet.gov.ps/portal/OrgStructure/Details/20 | ministry_or_administrative_candidate |
| نظام الأوقاف في التطبيق المعاصر - عبد الله بن ناصر السدحان | إداري |  | ministry_or_administrative_candidate |
| إدارة الأوقاف في عهد الانتداب البريطاني | تاريخي | https://badil.org/publications/al-majdal/issues/items/409.html | ministry_or_administrative_candidate |
| الأوقاف والسياسة في مصر - إبراهيم البيومي غانم | تاريخي |  | ministry_or_administrative_candidate |
| تاريخ إدارة الأوقاف في فلسطين | تاريخي | https://www.tawaf.ps/ | ministry_or_administrative_candidate |
| أحكام الوقف في الشريعة الإسلامية - محمد عبيد الكبيسي | فقهي |  | ministry_or_administrative_candidate |
| إحياء الوقف المتعطل - الأحكام | فقهي | الفقه الإسلامي - إدارة الأوقاف | ministry_or_administrative_candidate |
| الوقف الإسلامي بين النظرية والتطبيق - حسن عبد الله الأمين | فقهي |  | ministry_or_administrative_candidate |
| النظام القانوني للأراضي الأميرية في فلسطين | law |  | official_or_legal_primary_candidate |
| حق التصرف الوارد على الأراضي الأميرية وفقاً للتشريعات النافذة في فلسطين | law |  | official_or_legal_primary_candidate |
| ديار بئر السبع: جنوب فلسطين العثماني - الأرض والمجتمع والدولة | law |  | official_or_legal_primary_candidate |
| قانون الأراضي العثماني (1858) | law | الدولة العثمانية | official_or_legal_primary_candidate |

---

## 7) قواعد التصنيف السيادي

| المستوى | المعنى | الشات |
|---|---|---|
| `official_or_legal_primary_candidate` | قانون/مجلة/مصدر قانوني أو رسمي مرشح | ممنوع حتى approved |
| `ministry_or_administrative_candidate` | مادة وزارة/إدارة/إجراءات مرشحة | ممنوع حتى approved |
| `supporting_reference_candidate` | كتاب/بحث/مرجع مساند | ممنوع حتى approved + authority mapping |
| `review_required_candidate` | يحتاج تحقق يدوي | ممنوع |
| `review_required_public_web_candidate` | مصدر ويب عام يحتاج تحقق خاص | ممنوع |
| `excluded_or_non_authoritative_candidate` | اختبار/مصدر غير سلطوي/مثال | مستبعد |

---

## 8) حدود الدفعة

لم يتم تنفيذ أي مما يلي:

- لا Supabase insert/update.
- لا DDL/DML.
- لا اعتماد تلقائي للمراجع القديمة.
- لا فتح للمعرفة في الشات.
- لا إنتاج.
- لا Mega Batch 30.

---

## 9) قاعدة العمل بعد هذه الدفعة

```text
Old DB registered knowledge is now recovered as a review backlog.
Recovered records are not approved knowledge.
Only reviewed + approved + chat eligible records may be used by /knowledge#/chat.
```

بالصيغة العربية:

```text
ما كان مسجلًا في قاعدة البيانات السابقة قبل Supabase يُعامل الآن كسجل مراجع مسترد قيد المراجعة، وليس معرفة معتمدة. لا يدخل أي سجل إلى الشات إلا بعد مراجعته واعتماده وربطه بسياسة chat eligibility.
```
