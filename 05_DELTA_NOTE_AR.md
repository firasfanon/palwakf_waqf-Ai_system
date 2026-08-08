# Delta

هذا Patch مكمل فقط.

قبل:
- AR1 يحاول حل بعض معرفات C4، لكن لا يطبع دليلًا واضحًا أن `candidateMaterials[].id` قُرئ كـ knowledge_document UUID.
- المطابقة مع documents كانت تعتمد على `document.id` أكثر من `document.uuid`.

بعد:
- `candidateMaterials[].id` وأسماء الحقول البديلة تُقرأ فقط عند `materialKind = knowledge_document`.
- المطابقة تقبل `document.id` و `document.uuid` وحقول UUID/ID البديلة.
- `documentId` داخل المرشح يستخدم `preferredKnowledgeDocumentId`.
- لا يوجد fuzzy/semantic/vector.
