-- READ ONLY. Run after audit refresh. This verification distinguishes newly created
-- activation tasks from existing active tasks that were safely reused.
begin transaction read only;

select * from assistant.rpc_get_knowledge_activation_snapshot_v1();

select lifecycle_bucket,count(*) as documents
from assistant.knowledge_activation_items
where activation_run_id=(select id from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1)
group by lifecycle_bucket
order by lifecycle_bucket;

select workflow_stage,status,count(*) as activation_namespaced_tasks
from assistant.knowledge_review_tasks
where dedupe_key like 'activation:%'
group by workflow_stage,status
order by workflow_stage,status;

with latest as (
  select id
  from assistant.knowledge_activation_runs
  where status='completed'
  order by created_at desc
  limit 1
),
expected as (
  select
    case ai.lifecycle_bucket
      when 'source_verification_required' then 'source_verification'
      when 'citation_verification_required' then 'citation_verification'
      when 'containment_required' then 'content_classification'
      when 'release_ready' then 'human_approval'
    end as workflow_stage,
    case ai.lifecycle_bucket
      when 'source_verification_required' then 'reference_document'
      else 'knowledge_document'
    end as target_type,
    case ai.lifecycle_bucket
      when 'source_verification_required' then ai.reference_document_id
      else ai.knowledge_document_id
    end as target_id
  from assistant.knowledge_activation_items ai
  where ai.activation_run_id=(select id from latest)
    and ai.lifecycle_bucket in (
      'source_verification_required',
      'citation_verification_required',
      'containment_required',
      'release_ready'
    )
),
coverage as (
  select distinct workflow_stage,target_type,target_id
  from expected
  where target_id is not null
)
select
  c.workflow_stage,
  count(*) as expected_unique_targets,
  count(*) filter (
    where exists (
      select 1
      from assistant.knowledge_review_tasks t
      where t.workflow_stage=c.workflow_stage
        and t.target_type=c.target_type
        and t.target_id=c.target_id
        and t.status in ('open','assigned','in_progress','blocked')
    )
  ) as active_task_coverage,
  count(*) filter (
    where exists (
      select 1
      from assistant.knowledge_review_tasks t
      where t.workflow_stage=c.workflow_stage
        and t.target_type=c.target_type
        and t.target_id=c.target_id
        and t.status in ('open','assigned','in_progress','blocked')
        and t.dedupe_key not like 'activation:%'
    )
  ) as reused_existing_task_coverage,
  count(*) filter (
    where exists (
      select 1
      from assistant.knowledge_review_tasks t
      where t.workflow_stage=c.workflow_stage
        and t.target_type=c.target_type
        and t.target_id=c.target_id
        and t.status in ('open','assigned','in_progress','blocked')
        and t.dedupe_key like 'activation:%'
    )
  ) as activation_task_coverage
from coverage c
group by c.workflow_stage
order by c.workflow_stage;

-- Informational debt check: pre-existing duplicates are reported, never auto-closed.
select
  t.target_type,
  t.target_id,
  t.workflow_stage,
  count(*) as active_tasks,
  array_agg(t.dedupe_key order by t.dedupe_key) as active_dedupe_keys
from assistant.knowledge_review_tasks t
where t.status in ('open','assigned','in_progress','blocked')
  and t.workflow_stage in (
    'source_verification',
    'citation_verification',
    'content_classification',
    'human_approval'
  )
group by t.target_type,t.target_id,t.workflow_stage
having count(*) > 1
order by active_tasks desc,t.workflow_stage
limit 100;

select count(*) as strict_chat_candidates
from assistant.v_chat_retrieval_candidates_v1;

rollback;
