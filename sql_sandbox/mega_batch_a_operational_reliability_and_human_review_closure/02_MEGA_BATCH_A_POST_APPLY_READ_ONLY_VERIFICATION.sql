-- Mega Batch A — POST APPLY READ ONLY verification
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
    where n.nspname = 'assistant'
      and p.proname = ef.function_name
      and pg_get_function_identity_arguments(p.oid) = ef.identity_args
  ) as function_present_exact_signature,
  coalesce(has_function_privilege('anon', 'assistant.' || ef.function_name || '(' || ef.identity_args || ')', 'execute'), false) as anon_execute_must_be_false,
  coalesce(has_function_privilege('authenticated', 'assistant.' || ef.function_name || '(' || ef.identity_args || ')', 'execute'), false) as authenticated_execute_must_be_false,
  coalesce(has_function_privilege('service_role', 'assistant.' || ef.function_name || '(' || ef.identity_args || ')', 'execute'), false) as service_role_execute_expected
from expected_functions ef
order by ef.function_name;

select
  workflow_stage,
  status,
  count(*) as task_count
from assistant.knowledge_review_tasks
where workflow_stage in ('content_classification','source_verification','citation_verification')
group by workflow_stage, status
order by workflow_stage, status;

select
  count(*) filter (where is_chat_eligible is true) as all_chat_eligible,
  count(*) filter (where is_chat_eligible is true and authority_level = 'official' and status in ('approved','released')) as official_released_chat_eligible_should_remain_zero
from assistant.knowledge_documents;

select
  action,
  result,
  scope_code,
  reason_code,
  count(*) as event_count,
  max(created_at) as latest_at
from assistant.knowledge_access_events
where action in ('review','publish')
group by action, result, scope_code, reason_code
order by latest_at desc nulls last;
