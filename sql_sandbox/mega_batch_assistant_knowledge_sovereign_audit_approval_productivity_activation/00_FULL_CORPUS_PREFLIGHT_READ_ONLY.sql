-- Mega Batch Assistant Knowledge Sovereign Audit, Approval and Productivity Activation V1
-- STAGING READ ONLY. Capture output verbatim before any schema or data mutation.
begin transaction read only;

select current_database() as database_name, current_user as execution_role, now() as checked_at;

select required_object, present
from (
  values
    ('assistant.knowledge_sources', to_regclass('assistant.knowledge_sources') is not null),
    ('assistant.reference_documents', to_regclass('assistant.reference_documents') is not null),
    ('assistant.knowledge_documents', to_regclass('assistant.knowledge_documents') is not null),
    ('assistant.knowledge_citations', to_regclass('assistant.knowledge_citations') is not null),
    ('assistant.knowledge_review_tasks', to_regclass('assistant.knowledge_review_tasks') is not null),
    ('assistant.assert_knowledge_reviewer_scope_v1', to_regprocedure('assistant.assert_knowledge_reviewer_scope_v1(uuid,text)') is not null),
    ('assistant.rpc_release_official_knowledge_document_v1', to_regprocedure('assistant.rpc_release_official_knowledge_document_v1(uuid,uuid,text)') is not null)
) required(required_object, present)
order by required_object;

with evaluated as (
  select
    kd.id,
    case
      when kd.reference_document_id is null or kd.source_id is null or rd.id is null or ks.id is null then 'mapping_required'
      when coalesce(kd.content_status,'production') in ('test','duplicate','quarantined') then 'containment_required'
      when coalesce(ks.verification_status,'pending') <> 'verified' or coalesce(rd.verification_status,'pending') <> 'verified' then 'source_verification_required'
      when not exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id=kd.id and kc.verification_status='verified') then 'citation_verification_required'
      when coalesce(kd.authority_level,'unverified') <> 'official' or coalesce(rd.authority_level,'unverified') <> 'official' or coalesce(ks.authority_level,'unverified') <> 'official' then 'authority_alignment_required'
      when kd.status='approved' and coalesce(kd.is_chat_eligible,false) then 'chat_eligible'
      else 'release_ready'
    end as lifecycle_bucket
  from assistant.knowledge_documents kd
  left join assistant.reference_documents rd on rd.id=kd.reference_document_id
  left join assistant.knowledge_sources ks on ks.id=coalesce(kd.source_id,rd.source_id)
)
select lifecycle_bucket, count(*) as documents
from evaluated
group by lifecycle_bucket
order by lifecycle_bucket;

select workflow_stage, status, count(*) as tasks
from assistant.knowledge_review_tasks
group by workflow_stage,status
order by workflow_stage,status;

select count(*) as existing_chat_candidates
from assistant.v_chat_retrieval_candidates_v1;

rollback;
