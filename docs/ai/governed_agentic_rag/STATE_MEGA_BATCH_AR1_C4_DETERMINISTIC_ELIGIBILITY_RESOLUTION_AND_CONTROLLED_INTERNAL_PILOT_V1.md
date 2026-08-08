# STATE — MEGA_BATCH_AR1_C4_DETERMINISTIC_ELIGIBILITY_RESOLUTION_AND_CONTROLLED_INTERNAL_PILOT_V1

```text
STATUS=PREAPPLY_CANDIDATE
BASELINE=AR1_SOURCE_PROVENANCE_RIGHTS_OPERATIONAL_UX_REFINEMENT_V1_R1
SCOPE=DETERMINISTIC_READ_ONLY_ELIGIBILITY_PLUS_INTERNAL_EPHEMERAL_PILOT
SQL_OPERATOR_APPLY=NOT_AUTHORIZED
RIGHTS_LAYER_ACTIVATION=NOT_AUTHORIZED
PUBLIC_CHAT_RELEASE=NOT_AUTHORIZED
PRODUCTION=NOT_AUTHORIZED
```

## سبب الدفعة

أثبتت UAT السابقة أن C3 وC4 يكتملان لكن `C4 linkable materials = 0`. السبب المرجح في مسار المصدر هو أن `candidateMaterials` قد تشير إلى `reference_document` أو UUID قائم، بينما resolver السابق كان يقبل `knowledge_document` الرقمي المباشر فقط.

## العلاج

قراءة association حتمي قائم عبر `reference_document_id` مع شرط uniqueness كامل. لا يكتب resolver أي حالة، ولا يعالج الغموض بالتخمين.
