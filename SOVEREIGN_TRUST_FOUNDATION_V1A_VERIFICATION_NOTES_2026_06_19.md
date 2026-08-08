# Verification Notes — Sovereign Trust Foundation v1A

## Evidence accepted
- أوامر v58 الثلاثة التي أعادت `Success. No rows returned` تم قبولها كنجاح تنفيذ غير مرجع للصفوف.
- تم قبول جدول التوزيع ومهام workflow المرسلة من Supabase.

## Static checks
- تم فحص صياغة TypeScript الجديدة يدويًا مع تحديث test cases.
- تم فحص بنية ملفات SQL وعدم احتوائها على `public` base table creation.

## Pending local checks
```powershell
pnpm.cmd run check
pnpm.cmd test -- assistantTrust.test.ts
```

## Pending Supabase checks
1. `00_READ_ONLY_TRUST_DRIFT_PRECHECK.sql`
2. `01_STRICT_VERIFIED_RETRIEVAL_GATE_OPERATOR_APPLY.sql`
3. `02_POST_APPLY_READ_ONLY_VERIFICATION.sql`

## Expected hard result after v1A apply
- `unverified_authority_chat_visible = 0`
- `source_not_verified_chat_visible = 0`
- `no_verified_citation_chat_visible = 0`

A strict candidate count of zero is acceptable temporarily; it signals that human verification must release records before public chat uses them.
