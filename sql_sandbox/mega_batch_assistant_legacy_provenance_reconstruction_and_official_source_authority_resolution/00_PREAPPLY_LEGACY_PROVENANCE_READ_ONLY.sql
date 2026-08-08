-- LIVE READ ONLY PRE-FLIGHT.
-- This script is metadata-only and must not be executed with writes enabled.
begin transaction read only;

select current_database() as database_name,
       current_user as execution_role,
       current_setting('transaction_read_only') as transaction_read_only,
       now() as checked_at;

select required_object, present
from (
  values
    ('assistant.knowledge_activation_runs', to_regclass('assistant.knowledge_activation_runs') is not null),
    ('assistant.knowledge_activation_items', to_regclass('assistant.knowledge_activation_items') is not null),
    ('assistant.knowledge_documents', to_regclass('assistant.knowledge_documents') is not null),
    ('assistant.reference_documents', to_regclass('assistant.reference_documents') is not null),
    ('assistant.knowledge_sources', to_regclass('assistant.knowledge_sources') is not null),
    ('assistant.knowledge_review_tasks', to_regclass('assistant.knowledge_review_tasks') is not null),
    ('assistant.assert_knowledge_reviewer_scope_v1', to_regprocedure('assistant.assert_knowledge_reviewer_scope_v1(uuid,text)') is not null)
) v(required_object,present)
order by required_object;

with latest as (
  select id,created_at,summary_json
  from assistant.knowledge_activation_runs
  where status='completed'
  order by created_at desc
  limit 1
)
select id as latest_activation_run_id, created_at, summary_json
from latest;

with latest as (
  select id from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1
)
select ai.source_id,
       coalesce(ks.name,'[source name missing]') as source_container_name,
       coalesce(ks.verification_status,'[status missing]') as verification_status,
       coalesce(ks.authority_level,'[authority missing]') as authority_level,
       count(*) as affected_documents,
       count(distinct ai.reference_document_id) as affected_reference_documents
from assistant.knowledge_activation_items ai
left join assistant.knowledge_sources ks on ks.id=ai.source_id
where ai.activation_run_id=(select id from latest)
  and ai.lifecycle_bucket='source_verification_required'
group by ai.source_id,ks.name,ks.verification_status,ks.authority_level
order by affected_documents desc, source_container_name;

with latest as (
  select id from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1
), base as (
  select ai.knowledge_document_id,
         to_jsonb(kd) as kd_json,
         to_jsonb(rd) as rd_json,
         to_jsonb(ks) as ks_json
  from assistant.knowledge_activation_items ai
  join assistant.knowledge_documents kd on kd.id=ai.knowledge_document_id
  left join assistant.reference_documents rd on rd.id=ai.reference_document_id
  left join assistant.knowledge_sources ks on ks.id=ai.source_id
  where ai.activation_run_id=(select id from latest)
    and ai.lifecycle_bucket='source_verification_required'
), evidence as (
  select *,
    coalesce(nullif(trim(rd_json->>'canonical_url'),''),nullif(trim(rd_json->>'source_url'),''),nullif(trim(rd_json->>'url'),''),nullif(trim(rd_json->>'original_url'),''),nullif(trim(rd_json->>'document_url'),''),nullif(trim(kd_json->>'source_url'),''),nullif(trim(kd_json->>'url'),'')) as candidate_url,
    coalesce(nullif(trim(rd_json->>'issuer'),''),nullif(trim(rd_json->>'publisher'),''),nullif(trim(rd_json->>'issuing_entity'),''),nullif(trim(kd_json->>'issuer'),''),nullif(trim(kd_json->>'publisher'),'')) as candidate_issuer,
    coalesce(nullif(trim(rd_json->>'law_number'),''),nullif(trim(rd_json->>'decision_number'),''),nullif(trim(rd_json->>'document_number'),''),nullif(trim(rd_json->>'reference_number'),''),nullif(trim(kd_json->>'law_number'),''),nullif(trim(kd_json->>'decision_number'),''),nullif(trim(kd_json->>'document_number'),'')) as candidate_identifier,
    coalesce(nullif(trim(rd_json->>'original_filename'),''),nullif(trim(rd_json->>'file_name'),''),nullif(trim(rd_json->>'filename'),''),nullif(trim(rd_json->>'storage_path'),''),nullif(trim(kd_json->>'original_filename'),''),nullif(trim(kd_json->>'file_name'),''),nullif(trim(kd_json->>'filename'),'')) as candidate_file_name
  from base
)
select count(*) as total_source_verification_items,
       count(*) filter (where candidate_url is not null) as with_candidate_url,
       count(*) filter (where candidate_issuer is not null) as with_candidate_issuer,
       count(*) filter (where candidate_identifier is not null) as with_candidate_identifier,
       count(*) filter (where candidate_file_name is not null) as with_retained_file_candidate,
       count(*) filter (where candidate_url is null and candidate_issuer is null and candidate_identifier is null and candidate_file_name is null) as legacy_container_only_candidates
from evidence;

select target_type,target_id,workflow_stage,count(*) as active_task_count,
       array_agg(dedupe_key order by dedupe_key) as active_dedupe_keys
from assistant.knowledge_review_tasks
where workflow_stage='citation_verification'
  and status in ('open','assigned','in_progress','blocked')
group by target_type,target_id,workflow_stage
having count(*) > 1
order by active_task_count desc,target_id
limit 100;

rollback;
