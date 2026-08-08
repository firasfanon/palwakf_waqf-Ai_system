# نطاق مساحات العمل اليومية — Mega Batch B

## مبدأ التصميم
صفحات الاستخدام اليومية تعرض المهمة التالية، البيانات اللازمة لها، والإجراء المسموح. لا تُعرض أدلة النشر أو RBAC أو سجل التدقيق كواجهة أولية.

## مساحات العمل

| المساحة | مهمة المستخدم اليومية | عناصر الحوكمة المنقولة |
|---|---|---|
| المصادر | إدخال/فحص مصدر رسمي ومراجعته | policy, audit, release gate |
| المراجع والملفات | تنظيم ملف، استخراج بيانات وصفية، الربط بالمصدر | storage diagnostics, raw identifiers |
| وثائق المعرفة | إنشاء مسودة معرفة، تحريرها، ربطها بالاستشهادات | lineage, approval evidence |
| الاستشهادات | فحص موضع الاستشهاد وربطه | verification audit trail |
| البحث | استكشاف المعرفة والمراجع | query diagnostics |
| مخرجات الأدوات | عرض/تحويل مخرج إلى عنصر قابل للمراجعة | tool run events and links |
| مراجعة المعرفة | استلام مهمة ثم إجراء واحد مطابق للمرحلة | RLS, release policy, staging evidence |

## مركز الحوكمة المنفصل

- RBAC/RLS
- Audit and review events
- release gates
- environment/runtime diagnostics
- staging evidence
- policy and retention
