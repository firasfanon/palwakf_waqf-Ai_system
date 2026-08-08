-- Smart Tools 3 / Human Review Operations v1
-- READ ONLY reconciliation for the six historical content_classification tasks.
-- No task is created, assigned, completed, cancelled, or deleted here.

with historical_expectation as (
  select 6::integer as expected_task_count
), current_tasks as (
  select
    krt.id,
    krt.target_type,
    krt.target_id,
    krt.priority,
    krt.status,
    krt.assigned_to,
    krt.completed_at,
    krt.completed_by,
    krt.dedupe_key,
    krt.notes,
    krt.metadata_json,
    krt.created_at,
    krt.updated_at,
    case
      when krt.status in ('completed','cancelled') then 'closed_existing_task'
      else 'requires_human_reconciliation'
    end as reconciliation_state
  from assistant.knowledge_review_tasks krt
  where krt.workflow_stage = 'content_classification'
), totals as (
  select
    (select expected_task_count from historical_expectation) as expected_task_count,
    count(*)::integer as observed_task_count,
    count(*) filter (where status not in ('completed','cancelled'))::integer as unresolved_task_count
  from current_tasks
)
select
  t.expected_task_count,
  t.observed_task_count,
  t.unresolved_task_count,
  case
    when t.observed_task_count = t.expected_task_count then 'COUNT_MATCH_REQUIRES_ROW_BY_ROW_REVIEW'
    when t.observed_task_count = 0 then 'NO_CURRENT_ROWS_REQUIRES_EVIDENCE_RECONCILIATION'
    else 'COUNT_MISMATCH_REQUIRES_EVIDENCE_RECONCILIATION'
  end as reconciliation_gate,
  ct.*
from totals t
left join current_tasks ct on true
order by ct.created_at nulls first;

-- Mandatory operator decision record template (do not execute until evidence exists):
-- For each expected historical task, record: original task id / target id / prior evidence / current status /
-- reviewer decision: retain | complete-existing | cancel-with-reason | recreate-after-evidence.
