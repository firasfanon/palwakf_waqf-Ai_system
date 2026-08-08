# طلب الأدلة التشغيلية التالي — بدون HAR

افتح DevTools → Network في صفحة:

```text
/knowledge#/admin/source-provenance-rights
```

وانسخ Response فقط للطلبات التالية إذا ظهرت:

```text
sourceProvenance.legacyManusReconciliation
sourceProvenance.autonomousAudit
sourceProvenance.controlledReleasePlan
agenticRagPilot.status
agenticRagPilot.candidates
```

لا ترسل HAR لأنه قد يحتوي Cookies أو ترويسات.

إذا لم تظهر `controlledReleasePlan` أو `agenticRagPilot.*`، لا تضغط أزرار تشغيل جديدة قبل التصريح.

المطلوب من responses:
- clusterKey
- title
- urls/requestedUrl
- c2Disposition
- c3MatrixDisposition
- C4 disposition
- candidateMaterials
- AR1 availableCandidateDocuments
- AR1 corpusResolution
