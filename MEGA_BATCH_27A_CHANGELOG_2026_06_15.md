# Changelog — Mega Batch 27A

**التاريخ:** 2026-06-15  
**العنوان:** Smart Tools Admin Backend Activation + Arabic Quality Guard

## Added

- إضافة `runtimeGetAiToolBackendActivationSnapshot()` لقراءة حالة backend للأدوات الست من جداول `assistant.ai_tool_*`.
- إضافة endpoint جديد `aiTools.getBackendActivationSnapshot`.
- إضافة لوحة تفعيل backend داخل صفحة `/admin/tools`.
- إضافة فحص جودة آلي داخل تفاصيل التشغيل في `/admin/tools/runs`.
- إضافة حارس جودة عربي لأداة `compare` مع fallback عربي احتياطي.

## Changed

- تحديث `AITools.tsx` من بوابة أدوات عامة إلى مركز يتضمن تفعيل backend فعلي.
- تحديث `AIToolRuns.tsx` ليعرض جودة الأثر السيادي واللغة والربط المعرفي.
- تحديث prompt المقارنة في `legal-analysis.ts` لإلزام العربية في القيم النصية.

## Verified

- `node --experimental-strip-types --check server/runtimeRepository.ts` ✅
- `node --experimental-strip-types --check server/routers.ts` ✅
- `node --experimental-strip-types --check server/legal-analysis.ts` ✅

## Pending Verification

- `pnpm install`
- `pnpm run check`
- Browser UAT:
  - `/knowledge#/admin/tools`
  - `/knowledge#/admin/tools/runs`
  - تشغيل `compare` على نصين عربيين والتحقق من غياب المخرجات الأجنبية.

## Governance

- No production SQL.
- No destructive operation.
- No schema mutation.
- No change to legacy tables.
- No production approval.
