-- Mega Batch 29A — Post Browser UAT Governance Intake (READ ONLY)
-- Purpose: record the database evidence that should remain safe after browser RBAC/RLS negative UAT.
-- No DDL, DML, GRANT, REVOKE, role, approval, release, mapping, or page-binding mutation.

with task_summary as (
  select workflow_stage, priority, status, count(*) as task_count
  from assistant.knowledge_review_tasks
  group by workflow_stage, priority, status
), mapping_summary as (
  select coalesce(resolution_action, 'none') as resolution_action,
         coalesce(resolution_status, 'none') as resolution_status,
         count(*) as row_count
  from assistant.legacy_mapping_resolutions
  group by resolution_action, resolution_status
), binding_summary as (
  select page_key, operation_domain, binding_status, read_contract, write_contract
  from assistant.page_operation_bindings
), access_events as (
  select
    action,
    result,
    scope_code,
    reason_code,
    count(*) as event_count,
    max(created_at) as latest_at
  from assistant.knowledge_access_events
  where action in ('review', 'publish')
  group by action, result, scope_code, reason_code
), chat_gate as (
  select
    count(*) filter (
      where kd.status = 'approved'
        and kd.is_chat_eligible = true
        and kd.authority_level = 'official'
    ) as official_released_chat_eligible,
    count(*) filter (
      where kd.status = 'approved'
        and kd.is_chat_eligible = true
        and coalesce(kd.authority_level, 'unverified') <> 'official'
    ) as non_official_released_chat_eligible_should_be_zero
  from assistant.knowledge_documents kd
)
select jsonb_build_object(
  'contract', 'palwakf_mb29a_post_browser_uat_governance_v1',
  'observed_at_utc', now(),
  'review_tasks', (select jsonb_agg(to_jsonb(task_summary) order by workflow_stage, priority, status) from task_summary),
  'mapping_resolutions', (select coalesce(jsonb_agg(to_jsonb(mapping_summary) order by resolution_action, resolution_status), '[]'::jsonb) from mapping_summary),
  'page_bindings', (select jsonb_agg(to_jsonb(binding_summary) order by page_key) from binding_summary),
  'review_publish_access_events', (select coalesce(jsonb_agg(to_jsonb(access_events) order by action, result), '[]'::jsonb) from access_events),
  'chat_gate', (select to_jsonb(chat_gate) from chat_gate),
  'decision_note', 'This SQL cannot replace remote browser screenshots, Network evidence, deployment metadata, or secret-isolation checks.',
  'production_approved', false
) as mb29a_post_browser_uat_governance;
