-- Mega Batch A — Operational Reliability and Human Review Closure
-- READ ONLY. Do not use this file to change data, permissions, or release state.
-- Capture result rows verbatim before applying 01.

select
  'MEGA_BATCH_A_PREFLIGHT' as check_name,
  count(*) filter (where status in ('open','assigned','in_progress','blocked')) as open_tasks,
  count(*) filter (where workflow_stage = 'source_verification' and status in ('open','assigned','in_progress','blocked')) as source_verification_open,
  count(*) filter (where workflow_stage = 'citation_verification' and status in ('open','assigned','in_progress','blocked')) as citation_verification_open,
  count(*) filter (where workflow_stage = 'content_classification' and status in ('open','assigned','in_progress','blocked')) as content_classification_open,
  count(*) filter (where status = 'completed') as completed_tasks,
  count(*) filter (where status = 'cancelled') as cancelled_tasks
from assistant.knowledge_review_tasks;

select
  workflow_stage,
  status,
  count(*) as task_count
from assistant.knowledge_review_tasks
where workflow_stage in ('content_classification','source_verification','citation_verification')
group by workflow_stage, status
order by workflow_stage, status;

select
  count(*) filter (where migration_status = 'needs_mapping') as needs_mapping_rows,
  count(*) filter (where migration_status = 'promoted') as promoted_rows
from assistant.legacy_import_register;

select
  count(*) filter (where is_chat_eligible is true) as all_chat_eligible,
  count(*) filter (where is_chat_eligible is true and authority_level = 'official' and status in ('approved','released')) as official_chat_eligible_should_remain_zero
from assistant.knowledge_documents;

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  has_function_privilege('anon', p.oid, 'execute') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_execute,
  has_function_privilege('service_role', p.oid, 'execute') as service_role_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'assistant'
  and p.proname in (
    'assert_knowledge_review_task_claim_v1',
    'rpc_verify_official_reference_source_v1',
    'rpc_verify_knowledge_citation_v1',
    'rpc_resolve_content_classification_containment_v1'
  )
order by p.proname;

select
  scope_code,
  access_level,
  is_active,
  expires_at
from assistant.knowledge_scope_assignments
where auth_user_id = '96f6cdc2-67f9-4352-b9f8-775ef509fed8'::uuid
order by scope_code;
