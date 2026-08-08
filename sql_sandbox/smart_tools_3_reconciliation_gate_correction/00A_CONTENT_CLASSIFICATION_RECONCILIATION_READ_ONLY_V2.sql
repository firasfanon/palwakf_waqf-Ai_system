-- Smart Tools 3 — Reconciliation Gate Correction v2
-- READ ONLY. No task is created, assigned, completed, cancelled, or deleted.
-- Corrects the former flat-row count check: 6 logical target documents can legitimately have historical rows.
-- Gate semantics: six unique targets are expected; exactly one ACTIVE task per target is required before Human Review Operations apply.

with historical_expectation as (
  select 6::integer as expected_logical_target_count
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
    (krt.status not in ('completed','cancelled')) as is_active,
    case
      when krt.dedupe_key like 'kb08v62:classification:%' then 'kb08_current_classification'
      when krt.dedupe_key like 'kb58:quarantine:%' then 'kb58_legacy_quarantine'
      else 'other_or_unclassified'
    end as task_lineage
  from assistant.knowledge_review_tasks krt
  where krt.workflow_stage = 'content_classification'
    and krt.target_type = 'knowledge_document'
), per_target as (
  select
    target_id,
    count(*)::integer as historical_task_row_count,
    count(*) filter (where is_active)::integer as active_task_count,
    count(*) filter (where status = 'cancelled')::integer as cancelled_task_count,
    count(*) filter (where task_lineage = 'kb08_current_classification')::integer as kb08_task_count,
    count(*) filter (where task_lineage = 'kb58_legacy_quarantine')::integer as kb58_task_count,
    array_agg(id order by created_at) as task_ids,
    array_agg(dedupe_key order by created_at) as dedupe_keys,
    array_agg(status order by created_at) as task_statuses,
    array_agg(task_lineage order by created_at) as task_lineages
  from current_tasks
  group by target_id
), totals as (
  select
    (select expected_logical_target_count from historical_expectation) as expected_logical_target_count,
    count(*)::integer as observed_logical_target_count,
    coalesce(sum(historical_task_row_count), 0)::integer as observed_historical_task_row_count,
    coalesce(sum(active_task_count), 0)::integer as observed_active_task_count,
    count(*) filter (where active_task_count = 1)::integer as targets_with_exactly_one_active_task,
    count(*) filter (where active_task_count > 1)::integer as targets_with_duplicate_active_tasks,
    count(*) filter (where kb08_task_count = 1 and kb58_task_count = 1)::integer as kb08_kb58_pair_count
  from per_target
)
select
  t.expected_logical_target_count,
  t.observed_logical_target_count,
  t.observed_historical_task_row_count,
  t.observed_active_task_count,
  t.targets_with_exactly_one_active_task,
  t.targets_with_duplicate_active_tasks,
  t.kb08_kb58_pair_count,
  case
    when t.observed_logical_target_count <> t.expected_logical_target_count
      then 'LOGICAL_TARGET_COUNT_MISMATCH_REQUIRES_EVIDENCE_RECONCILIATION'
    when t.targets_with_duplicate_active_tasks > 0
      then 'DUPLICATE_ACTIVE_TASKS_REQUIRE_HUMAN_CONSOLIDATION'
    when t.observed_active_task_count <> t.expected_logical_target_count
      then 'ACTIVE_TASK_COUNT_MISMATCH_REQUIRES_EVIDENCE_RECONCILIATION'
    when t.targets_with_exactly_one_active_task = t.expected_logical_target_count
      then 'PASS_ONE_ACTIVE_TASK_PER_LOGICAL_TARGET'
    else 'RECONCILIATION_STATE_UNRESOLVED'
  end as reconciliation_gate,
  pt.target_id,
  pt.historical_task_row_count,
  pt.active_task_count,
  pt.cancelled_task_count,
  pt.kb08_task_count,
  pt.kb58_task_count,
  pt.task_ids,
  pt.dedupe_keys,
  pt.task_statuses,
  pt.task_lineages
from totals t
left join per_target pt on true
order by pt.target_id nulls first;
