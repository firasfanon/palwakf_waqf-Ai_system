# Error Record — Sovereign Trust Foundation v1A

## السبب
سياسة v58 سمحت بمصادر ذات citation status=`linked` في الاسترجاع العام، بينما العقد الاستراتيجي المعتمد يتطلب verified citations ومصادر موثقة.

## الدليل
- 61 سجلًا `approved=true`, `is_chat_eligible=true`, `authority_level=unverified`.
- 152 مهمة `citation_verification` مفتوحة.
- 146 مهمة `source_verification` مفتوحة.

## الأثر
يمكن أن يظهر محتوى غير متحقق منه في الشات رغم وجود ربط citation مبدئي.

## ما لم يفشل
- لا يوجد دليل على فقد سجلات أو فشل DDL/DML.
- نجاح `Success. No rows returned` طبيعي للأوامر التي لا ترجع rows.

## الحل
- v59 يطبق strict verified retrieval gate في TypeScript وSupabase.
- لا حذف ولا دمج تلقائي.
- يعاد النشر للشات فقط بعد إغلاق مراجعة المصدر والاستشهاد.

## آخر baseline مستقر
`v58_sovereign_trust_foundation_2026_06_19`.
