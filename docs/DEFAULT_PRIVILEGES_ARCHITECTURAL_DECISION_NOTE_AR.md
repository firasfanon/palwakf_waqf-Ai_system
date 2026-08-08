# ملاحظة معمارية

في PostgreSQL، Default Privileges تعتمد على دور إنشاء الكائن. كما أن Built-in Default للدوال يمنح `PUBLIC EXECUTE`.

عندما يبقى هذا المنح فعالًا على المستوى Global، فإن تعديلًا محليًا تحت `IN SCHEMA assistant` لا يكفي وحده لإغلاقه.

بعد الدليل ستكون الخيارات:

1. Hardening محلي للجداول والمتتاليات والمنح المباشرة.
2. تغيير Global Function Default مع إعادة منح انتقائي للـschemas الأخرى.
3. Owner Role مخصص لـ`assistant` وتشغيل migrations تحته.

لا تحتوي هذه الحزمة على Apply كي لا توسع النطاق بصمت.
