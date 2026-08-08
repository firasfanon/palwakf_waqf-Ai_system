# Sovereign Trust Foundation v1A — Human Review Release Runbook

## قاعدة الإصدار
لا يُعاد `is_chat_eligible=true` إلا بعد تحقق المراجع البشرية من كل الآتي:

1. جهة ناشرة أو مؤلف محدد وموثق.
2. ملف/رابط مصدر محفوظ أو مرجع احتفاظ موثق.
3. `assistant.reference_documents.verification_status='verified'`.
4. استشهاد واحد على الأقل مرتبط بموضع صالح ومراجع يدويًا.
5. `assistant.knowledge_citations.verification_status='verified'`.
6. `authority_level` ليس `unverified`.
7. المحتوى ليس `test` أو `duplicate` أو `quarantined`.
8. يقرر المراجع أن النطاق `public` أو يتم ربط صلاحيات `internal/restricted` صراحة.

## خطوة التحرير بعد مراجعة سجل واحد
ينفذها مشغّل مصرح له فقط بعد إغلاق task المصدر وtask الاستشهاد:

```sql
update assistant.knowledge_documents
set is_chat_eligible = true,
    requires_human_review = false,
    metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
      'strict_public_retrieval_gate','released_after_human_verification',
      'chat_released_at', now()
    )
where id = '<knowledge_document_uuid>'::uuid
  and status = 'approved'
  and content_status = 'production'
  and authority_level in ('official','semi_official','reference')
  and exists (
    select 1 from assistant.reference_documents rd
    where rd.id = reference_document_id
      and rd.verification_status = 'verified'
  )
  and exists (
    select 1 from assistant.knowledge_citations kc
    where kc.knowledge_document_id = assistant.knowledge_documents.id
      and kc.verification_status = 'verified'
  );
```

لا تستخدم هذا التحديث كمجموعة شاملة قبل إغلاق مهام المراجعة.
