# C2 — تسلسل المشغّل القرائي

1. نفّذ `00_C2_PREFLIGHT_READ_ONLY.sql` في Staging فقط.
2. نفّذ `01_C2_CLUSTERED_DISPOSITION_READ_ONLY.sql` في Staging فقط.
3. احفظ الناتجين كدليل؛ كلا الملفين يبدأ بـ`begin transaction read only;` وينتهي بـ`rollback;`.
4. لا تطبق أي تحديث أو ربط مصادر أو حقوق بناءً على هذا الناتج.
5. قارن أعداد الـclusters مع لوحة C2 المحلية. أي فرق يعالج كفجوة دلالية، لا كمبرر للكتابة.

```text
NO_INSERT_UPDATE_DELETE
NO_SOURCE_LINK_WRITE
NO_RIGHTS_ASSIGNMENT
NO_AUTOMATIC_PROMOTION
NO_AUTOMATIC_CHAT_RELEASE
NO_PRODUCTION
```
