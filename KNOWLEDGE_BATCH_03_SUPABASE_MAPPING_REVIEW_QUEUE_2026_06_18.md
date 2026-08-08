# Knowledge Batch 03 — Migration Mapping to Supabase Assistant Schema

**Date:** 2026-06-18  
**Status:** Mapping only — no SQL applied

## 1) الهدف

تحويل سجل المعرفة القديم قبل Supabase إلى Backlog قابل للمراجعة داخل نموذج `assistant` دون إدخال مباشر أو اعتماد تلقائي.

## 2) خريطة الحقول المقترحة

| Old DB / Legacy field | Target in `assistant.knowledge_documents` | Rule |
|---|---|---|
| `title` | `title` | إلزامي بعد dedupe |
| `content` / `content_preview` | `content` | لا يعتمد preview كمحتوى نهائي؛ يحتاج أصل النص أو الملف |
| `category` | `category` + `domain_scope` | mapping يدوي/شبه آلي |
| `source` / `url` | `source_id` أو `metadata_json.source_text` | إنشاء source record عند الاعتماد |
| `tags` | `tags` JSONB | normalize إلى مصفوفة |
| `origin_file` | `metadata_json.legacy_origin_file` | لأثر التوريث |
| `registry_key` | `metadata_json.legacy_registry_key` | dedupe/trace |
| `authority_tier_candidate` | `authority_level` مبدئي | لا يتحول إلى official إلا بعد مراجعة |

## 3) mapping تصنيفي أولي

| Candidate tier | authority_level المقترح قبل الاعتماد | status | is_chat_eligible |
|---|---|---|---|
| `official_or_legal_primary_candidate` | `unverified` ثم `official` بعد التحقق | `in_review` | `false` |
| `ministry_or_administrative_candidate` | `unverified` ثم `semi_official/official` بعد التحقق | `in_review` | `false` |
| `supporting_reference_candidate` | `reference` بعد مراجعة | `in_review` | `false` |
| `review_required_candidate` | `unverified` | `draft/in_review` | `false` |
| `excluded_or_non_authoritative_candidate` | `unverified` | `rejected/archived` | `false` |

## 4) بوابة الإدخال اللاحقة

قبل أي إدخال فعلي إلى Supabase يلزم:

1. تشغيل dedupe على `registry_key + title + source`.
2. ربط كل مصدر موثوق بسجل `assistant.knowledge_sources`.
3. إدخال السجلات كـ `in_review` فقط، وليس `approved`.
4. عدم تفعيل `is_chat_eligible` إلا بعد موافقة بشرية.
5. توثيق المراجع الرسمية التي لها نص أصلي/رابط رسمي منفصل عن المراجع المساندة.
6. رفض مصادر الاختبار أو `example.com` أو مواد غير سلطوية.

## 5) قرار هذه الخريطة

```text
MAPPING_READY
IMPORT_SQL_NOT_GENERATED_AS_EXECUTABLE_DML
HUMAN_REVIEW_REQUIRED
CHAT_VISIBILITY_BLOCKED_UNTIL_APPROVAL
```
