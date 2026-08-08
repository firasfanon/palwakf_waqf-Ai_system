# Mega Batch A — Rebaselined Foundation and Review Closure

## نطاق الدفعة
- UI/UX foundation عالمية: أسطح صلبة، RTL، مودالات مضبوطة، ومركز حوكمة منفصل في التنقل.
- إعادة بناء مساحة مراجعة المعرفة كمساحة عمل يومية.
- إخفاء تفاصيل الأعطال التقنية من صفحات الاستخدام اليومي.
- تهيئة تشغيل محلي متوافق مع Windows عبر `pnpm run dev`.

## حدود صارمة
- لا SQL Operator Apply.
- لا KB08B mutation.
- لا official release.
- لا تغيير لأهلية الدردشة.

## اختبارات القبول قبل اعتماد الدفعة
1. `pnpm.cmd run check`
2. `pnpm.cmd run build`
3. `pnpm.cmd run verify:mega-batch-a`
4. UAT يدوي لمسارات: Home، Chat، Knowledge، Search، Files، Tools، Knowledge Review Operations، Audit Logs.
5. لا انتقال إلى Mega Batch B قبل سجل UAT مقبول.
