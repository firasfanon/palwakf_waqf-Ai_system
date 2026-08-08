# STATE — MEGA_BATCH_AR1_CORPUS_RESOLUTION_AND_INTERNAL_PILOT_ACTIVATION

- الحالة عند التحضير: `PREAPPLY_CANDIDATE`.
- السبب: C3 وC4 كانا يعملان، لكن AR1 لم يجد `knowledge_document` مباشرًا ضمن `candidateMaterials`.
- الإصلاح: عرض روابط جلسية حتمية فقط من العنوان أو الرابط الحالي، دون أي كتابة أو ترقية دائمة.
- مرفوض: أي مطابقة تقريبية أو دلالية أو تحويل تلقائي إلى T3/T4 أو Chat/RAG.
- قبول التشغيل يحتاج: apply + `pnpm check` + build + verifier + C3/C4/AR1 browser UAT.
