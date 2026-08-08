# MEGA_BATCH_ASSISTANT_PROVENANCE_PIPELINE_CROSSWALK_GAP_DIAGNOSIS_V1
## تقرير فحص ومواءمة — قراءة فقط

**طبيعة الدفعة:** Audit / Reconciliation / Crosswalk / Gap Diagnosis.  
**لا يتضمن:** تعديل مصدر، SQL، Supabase write، تشغيل C3 جديد، إنشاء AR1، قرار Ledger، أو Chat/RAG.

---

## 1) القرار الحاكم

```text
DO_NOT_REBUILD =
Manus recovery
C2 disposition
C3 external status/header checks
AR1 fail-closed UX
```

المسار السابق موجود ويجب اعتماده كمسار حاكم:

```text
Source Provenance Rights C1/C2/C3/C4/AR1
+
Legacy Provenance V1.1 as lineage/supporting ledger surface
```

---

## 2) خلاصة الفحص الساكن

| البند | النتيجة |
|---|---|
| C2 autonomous audit | موجود؛ read-only؛ يحول أدلة C1 إلى clusters وتصنيفات تشغيلية |
| C3 external verification | موجود؛ operator-triggered؛ snapshot مؤقتة 30 دقيقة في ذاكرة الخادم |
| C4 controlled selection | موجود؛ read-only plan؛ لا يشغّل C3 بنفسه |
| AR1 candidate resolver | موجود؛ fail-closed عند غياب مادة knowledge_document أو تطابق حتمي |
| Source Provenance Rights Registry | موجود؛ يدعم سجل المصادر/الحقوق، لكن طبقة الحقوق الداعمة قد تكون غير مطبقة |
| Legacy V1.1 | موجود كـlineage/decision surface، وليس بديلًا عن C1/C2/C3/C4/AR1 |

---

## 3) نقطة الانكسار الفنية

السبب الأكثر ترجيحًا لبقاء AR1 مغلقًا ليس غياب C1/C2/C3/C4، بل:

```text
C4/AR1 cannot resolve candidateMaterials to a usable knowledge_document
OR cannot find deterministic exact title/canonical URL match.
```

C4 لا يرفع مرشحًا إلى `CONTROLLED_METADATA_PILOT_CANDIDATE` إلا عند تحقق شروط جوهرية:

```text
C2 official candidate
+ fresh C3 reachable metadata
+ DNS public safety
+ no conflicting URL evidence
+ candidateMaterials.length > 0
```

ثم AR1 لا يقبل إلا:

```text
C4_DIRECT_MATERIAL_REFERENCE
DETERMINISTIC_TITLE_EXACT
DETERMINISTIC_URL_EXACT
DETERMINISTIC_TITLE_AND_URL_EXACT
```

ويرفض:

```text
fuzzy / semantic / vector / author-only / publisher-only
```

---

## 4) Legacy V1.1 government candidates

من Response القراءة الحية لـLegacy V1.1:

| المؤشر | العدد |
|---|---:|
| items في response | 169 |
| groups في response | 60 |
| government_host_candidate items | 19 |
| unique government targets | 3 |

الأهداف الحكومية الفريدة:

| العنوان | الرابط | عدد عناصر Legacy |
|---|---|---:|
| الإشراف المعاصر على العقارات الوقفية | `https://www.palestinecabinet.gov.ps/portal/govservice/details/129` | 7 |
| قانون الأوقاف والشؤون الدينية رقم (26) لسنة 1966م وتعديلاته | `https://mjr.ogb.gov.ps/mergedlegislations/viewtext/165` | 6 |
| مهام وزارة الأوقاف والشؤون الدينية الفلسطينية | `https://www.palestinecabinet.gov.ps/portal/orgstructure/details/20` | 6 |

هذه لا تكفي وحدها لبدء AR1 أو قرار مصدر؛ يجب مواءمتها مع C1/C2/C3/C4.

---

## 5) Crosswalk المطلوب لاحقًا

لكل هدف حكومي يجب إثبات السلسلة التالية:

```text
Legacy V1.1 candidate
→ C1 Manus evidence row(s)
→ C2 clusterKey + disposition
→ C3 entry + matrixDisposition
→ C4 entry + disposition + candidateMaterials
→ AR1 candidate resolver status
```

### رموز فشل محتملة

```text
LEGACY_ONLY_NOT_IN_C1_C2
C2_CLUSTER_NOT_OFFICIAL
C2_CONFLICTING_URL_EVIDENCE
C3_EVIDENCE_ABSENT_OR_STALE
C3_NOT_REACHABLE_OFFICIAL_METADATA
C4_CANDIDATE_MATERIALS_ZERO
C4_SELECTED_OUT_BY_LIMIT
AR1_NO_KNOWLEDGE_DOCUMENT_DIRECT_REFERENCE
AR1_NO_EXACT_TITLE_MATCH
AR1_NO_EXACT_URL_MATCH
AR1_BLOCKED_BY_FAIL_CLOSED_CONTRACT
```

---

## 6) ما لا نفعله الآن

```text
NO SQL
NO db:push
NO Supabase write
NO source patch
NO C3 re-run unless explicitly authorized
NO AR1 startSession
NO Ledger decision
NO source rights upsert/archive
NO Chat/RAG eligibility
```

---

## 7) الدليل التشغيلي المطلوب لاستكمال التشخيص

بدل إعادة البناء، نحتاج فقط Responses قراءة من Network، إن كانت متاحة بعد فتح الصفحة:

```text
sourceProvenance.legacyManusReconciliation
sourceProvenance.autonomousAudit
sourceProvenance.controlledReleasePlan
agenticRagPilot.status
agenticRagPilot.candidates
```

وإذا لم تكن C3 snapshot حديثة، لا نشغل C3 إلا بتفويض مستقل لأن `externalVerification` يرسل HTTP/DNS خارجيًا.

---

## 8) القرار النهائي لهذه الدفعة

```text
CROSSWALK_STATIC_AUDIT = COMPLETE
RUNTIME_CROSSWALK = PENDING_RESPONSE_EVIDENCE
PRIMARY_GAP = C4/AR1 material eligibility and deterministic candidate resolution
NEXT_STEP = collect read-only tRPC responses, not rebuild
DATABASE_WRITE = NONE
SOURCE_WRITE = NONE
```
