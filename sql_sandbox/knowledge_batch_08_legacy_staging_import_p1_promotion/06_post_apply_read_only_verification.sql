-- KB08 v62 post-promotion verification (READ ONLY)
-- Run only after the v62 review-only replacement for step 04 succeeds.

select
  legacy_batch,
  legacy_table_name,
  migration_priority,
  migration_status,
  count(*) as rows
from assistant.legacy_import_register
where legacy_batch in ('knowledge_batch_08','knowledge_batch_08_observed_rows')
group by legacy_batch, legacy_table_name, migration_priority, migration_status
order by legacy_batch, legacy_table_name, migration_priority, migration_status;

select
  kd.status,
  kd.is_chat_eligible,
  kd.content_status,
  kd.authority_level,
  count(*) as rows
from assistant.knowledge_documents kd
where kd.metadata_json->>'trust_alignment' = 'v62_review_only'
group by kd.status, kd.is_chat_eligible, kd.content_status, kd.authority_level
order by kd.status, kd.is_chat_eligible, kd.content_status, kd.authority_level;

select
  rd.status,
  rd.verification_status,
  rd.content_status,
  count(*) as rows
from assistant.reference_documents rd
where rd.metadata_json->>'trust_alignment' = 'v62_review_only'
group by rd.status, rd.verification_status, rd.content_status
order by rd.status, rd.verification_status, rd.content_status;

select
  kc.verification_status,
  count(*) as citations
from assistant.knowledge_citations kc
where kc.metadata_json->>'trust_alignment' = 'v62_review_only'
group by kc.verification_status
order by kc.verification_status;

select
  workflow_stage,
  priority,
  status,
  count(*) as tasks
from assistant.knowledge_review_tasks
where metadata_json->>'trust_alignment' = 'v62_review_only'
group by workflow_stage, priority, status
order by workflow_stage, priority, status;

select
  count(*) filter (where kd.status='approved' and kd.is_chat_eligible) as v62_approved_chat_visible,
  count(*) filter (where kd.status='in_review' and kd.is_chat_eligible=false) as v62_review_only_not_chat_visible
from assistant.knowledge_documents kd
where kd.metadata_json->>'trust_alignment' = 'v62_review_only';
