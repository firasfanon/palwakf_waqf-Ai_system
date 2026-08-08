# Error Record — Mega Batch 27A

## ER-27A-001 — Full TypeScript check not runnable in container

**السبب:** بيئة الحاوية لا تحتوي `pnpm` ولا `node_modules` داخل baseline.  
**ما فشل:** محاولة فحص `.tsx` مباشرة عبر Node فشلت لأن Node لا يدعم امتداد `.tsx` بهذا المسار دون toolchain.  
**الأثر:** لا يثبت فشل الكود؛ فقط يعني أن الفحص الكامل يجب أن ينفذ في بيئة التطوير المعتمدة.  
**الحل:** تشغيل الأوامر التالية محليًا:

```powershell
pnpm install
pnpm run check
```

**آخر baseline مستقر قبل هذا السجل:** `waqf_ai_model_hybrid_llm_admin_v32_mb26_precedents_predict_backend_closure.zip`  
**Baseline جديد مرشح:** `waqf_ai_model_hybrid_llm_admin_v33_mb27a_smart_tools_admin_backend_activation_2026_06_15.zip`

---

## ER-27A-002 — Compare non-Arabic output quality risk

**السبب:** سجل Mega Batch 26 أشار إلى مخرجات غير عربية/صينية في أداة `compare`.  
**الملفات:** `server/legal-analysis.ts`  
**ما فشل سابقًا:** جودة المخرجات اللغوية، لا المسار السيادي.  
**الحل في 27A:**

- تشديد prompt المقارنة للعربية حصرًا.
- إضافة fallback عربي احتياطي إذا كان الناتج غير عربي أو غير مطابق للبنية.
- توثيق أن fallback صلاحيته مسودة مراجعة فقط.

**آخر baseline مستقر:** `waqf_ai_model_hybrid_llm_admin_v32_mb26_precedents_predict_backend_closure.zip`
