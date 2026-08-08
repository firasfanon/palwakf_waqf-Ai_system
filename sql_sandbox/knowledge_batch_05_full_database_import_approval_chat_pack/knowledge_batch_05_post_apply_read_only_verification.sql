-- Knowledge Batch 05 — Post-Apply Verification SQL
-- Read-only checks after running one of the KB05 operator SQL files.

select
  count(*) as kb05_reference_documents
from assistant.reference_documents
where metadata_json->>'batch'='knowledge_batch_05';

select
  count(*) as kb05_knowledge_documents
from assistant.knowledge_documents
where metadata_json->>'batch'='knowledge_batch_05';

select
  status,
  is_chat_eligible,
  count(*)
from assistant.knowledge_documents
where metadata_json->>'batch'='knowledge_batch_05'
group by status, is_chat_eligible
order by status, is_chat_eligible;

select
  metadata_json->>'original_hold_or_triage_bucket' as original_bucket,
  status,
  count(*)
from assistant.reference_documents
where metadata_json->>'batch'='knowledge_batch_05'
group by 1, 2
order by 1, 2;

select
  title,
  status,
  is_chat_eligible,
  metadata_json->>'legacy_registry_key' as legacy_registry_key
from assistant.knowledge_documents
where metadata_json->>'batch'='knowledge_batch_05'
order by created_at desc
limit 20;
