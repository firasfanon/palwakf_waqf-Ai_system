# Mega Batch C4 — تصميم سجل المصدر المنضبط وبوابة الحقوق

## طبيعة الحزمة
حزمة تصميم وتشغيل قرائي فقط تبني مخططات سجل مصدر مرشحة من عناقيد C2. لا تنشئ سجلات فعلية، ولا تنفذ SQL، ولا تربط مصادر بمواد، ولا تعيّن حقوقًا، ولا تفتح العرض أو Chat/RAG.

## ما تضيفه
- خدمة `server/controlledSourceRegistryDesign.ts`.
- query إدارية قرائية: `sourceProvenance.controlledRegistryDesign`.
- قسم C4 في سجل المصادر والحقوق، يعرض مخططات موحدة بحسب الرابط القانوني والنطاق.
- ست بوابات تصميمية: G1 الهوية والنطاق، G2 شروط وحقوق الاستخدام، G3 تطبيق سجل منضبط، G4 ربط المواد، G5 العرض العام، G6 Chat/RAG.

## حدود صريحة
```text
NO_SQL_OPERATOR_APPLY
NO_CONTROLLED_REGISTRY_CREATE
NO_CONTROLLED_REGISTRY_UPDATE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_EXTERNAL_REQUEST
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PRODUCTION
```

## ملاحظة
نتائج C3 هي دليل وصول خارجي لحظي ولا تُحفظ في C4 كاعتماد دائم. المرحلة اللاحقة، إن أُذن بها، يجب أن تكون تطبيقًا محدودًا لسجل واحد أو مجموعة معتمدة مع بوابة حقوق مستقلة.
