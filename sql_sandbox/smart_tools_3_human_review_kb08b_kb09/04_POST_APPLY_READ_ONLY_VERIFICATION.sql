-- Smart Tools 3 post-apply verification — READ ONLY
select workflow_stage, status, count(*) as tasks
from assistant.knowledge_review_tasks
group by workflow_stage, status
order by workflow_stage, status;

select migration_status, legacy_table_name, count(*) as rows
from assistant.legacy_import_register
where legacy_batch in ('knowledge_batch_08','knowledge_batch_08_observed_rows')
group by migration_status, legacy_table_name
order by migration_status, legacy_table_name;

select resolution_action, resolution_status, count(*) as rows
from assistant.legacy_mapping_resolutions
group by resolution_action, resolution_status
order by resolution_action, resolution_status;

select page_key, operation_domain, binding_status, read_contract, write_contract
from assistant.page_operation_bindings
order by page_key;

select
  count(*) filter (where kd.status='approved' and kd.is_chat_eligible=true and kd.authority_level='official') as official_released_chat_eligible,
  count(*) filter (where kd.status='approved' and kd.is_chat_eligible=true and kd.authority_level<>'official') as non_official_released_chat_eligible_should_be_zero
from assistant.knowledge_documents kd
where kd.metadata_json->>'official_only_release_policy'='true';
