-- Smart Tools 3 — post-consolidation verification
-- READ ONLY. Expected: 6 logical targets; 6 active KB08 tasks; 6 cancelled KB58 tasks.

with tasks as (
  select
    id,
    target_id,
    status,
    dedupe_key,
    metadata_json,
    (status not in ('completed','cancelled')) as is_active
  from assistant.knowledge_review_tasks
  where workflow_stage = 'content_classification'
    and target_type = 'knowledge_document'
), summary as (
  select
    count(distinct target_id)::integer as logical_targets,
    count(*)::integer as historical_rows,
    count(*) filter (where is_active)::integer as active_rows,
    count(*) filter (where status = 'cancelled' and metadata_json->>'reconciliation_decision' = 'cancel_as_superseded_duplicate')::integer as cancelled_superseded_rows,
    count(*) filter (where is_active and dedupe_key like 'kb08v62:classification:%')::integer as active_kb08_rows,
    count(*) filter (where is_active and dedupe_key like 'kb58:quarantine:%')::integer as active_kb58_rows
  from tasks
)
select *,
  case
    when logical_targets = 6
     and active_rows = 6
     and active_kb08_rows = 6
     and active_kb58_rows = 0
     and cancelled_superseded_rows = 6
      then 'RECONCILIATION_APPLIED_AND_VERIFIED'
    else 'RECONCILIATION_NOT_VERIFIED_DO_NOT_CONTINUE'
  end as decision
from summary;

select target_id, status, dedupe_key, completed_at, completed_by,
       metadata_json->>'reconciliation_decision' as reconciliation_decision,
       metadata_json->>'superseded_by_task_id' as superseded_by_task_id
from assistant.knowledge_review_tasks
where workflow_stage = 'content_classification'
  and target_type = 'knowledge_document'
order by target_id, created_at;
