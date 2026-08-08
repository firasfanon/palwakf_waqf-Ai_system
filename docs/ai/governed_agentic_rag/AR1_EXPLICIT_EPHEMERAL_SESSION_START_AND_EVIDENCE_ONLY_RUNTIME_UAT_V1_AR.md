# AR1 — بدء جلسة مؤقتة صريحة وRuntime UAT بنمط Evidence-only

## الهدف

إثبات أول تشغيل فعلي محكوم لـAR1 دون استخدام LLM ودون أي كتابة سيادية.

## عقد البدء

- Authority Preparation صالحة ومقيدة بالمشغل.
- دليل C3 حديث.
- مرجع Runtime UAT.
- قرار صريح: `AUTHORIZE_ONE_EPHEMERAL_EVIDENCE_ONLY_UAT_SESSION`.
- ثلاثة إقرارات: Evidence-only، سؤال واحد، Rollback إلزامي.

## عقد الجلسة

```text
executionMode=evidence_only_runtime_uat
maxQuestions=1
llmGenerationUsed=false
sessionStorage=process_memory_only
databaseWrites=0
sourceOrRightsWrites=0
```

## الممنوع

LLM، السؤال الثاني، DB/source/rights writes، public Chat/RAG، وProduction.
