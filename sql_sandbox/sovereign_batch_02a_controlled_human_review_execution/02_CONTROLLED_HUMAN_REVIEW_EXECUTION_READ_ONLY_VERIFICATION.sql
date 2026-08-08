-- Sovereign Batch 02A — READ ONLY verification
-- No DDL/DML/GRANT/REVOKE. Capture result rows verbatim.

with expected_functions(function_name, identity_args) as (
  values
    ('assert_knowledge_review_task_claim_v1', 'text,uuid,text,uuid'),
    ('rpc_resolve_content_classification_containment_v1', 'uuid,uuid,text,text,jsonb'),
    ('rpc_verify_official_reference_source_v1', 'uuid,uuid,text,text,jsonb'),
    ('rpc_verify_knowledge_citation_v1', 'uuid,uuid,uuid,text,text,jsonb')
)
select
  ef.function_name,
  exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'assistant' and p.proname = ef.function_name
  ) as function_present,
  coalesce(has_function_privilege('anon', 'assistant.' || ef.function_name || '(' || ef.identity_args || ')', 'EXECUTE'), false) as anon_execute,
  coalesce(has_function_privilege('authenticated', 'assistant.' || ef.function_name || '(' || ef.identity_args || ')', 'EXECUTE'), false) as authenticated_execute,
  coalesce(has_function_privilege('service_role', 'assistant.' || ef.function_name || '(' || ef.identity_args || ')', 'EXECUTE'), false) as service_role_execute
from expected_functions ef
order by ef.function_name;

select
  workflow_stage,
  status,
  count(*) as task_count
from assistant.knowledge_review_tasks
where workflow_stage in ('content_classification', 'source_verification', 'citation_verification')
group by workflow_stage, status
order by workflow_stage, status;

select
  count(*) filter (where is_chat_eligible) as containment_tasks_chat_eligible_should_be_zero,
  count(*) as reviewed_containment_documents
from assistant.knowledge_documents kd
where coalesce(kd.metadata_json->>'workflow_version', '') = 'controlled_human_review_execution_v1';
