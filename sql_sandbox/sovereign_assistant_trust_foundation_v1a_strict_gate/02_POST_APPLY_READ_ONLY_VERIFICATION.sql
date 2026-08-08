-- Sovereign Assistant Trust Foundation v1A
-- READ ONLY — v60 syntax-corrected verifier.
-- Expected hard safety results are all zero for the first three fields.
-- The strict_public_chat_candidates value is a scalar subquery because it comes
-- from a different relation than the aggregate over assistant.knowledge_documents.

select
  count(*) filter (
    where kd.status = 'approved'
      and kd.is_chat_eligible
      and kd.authority_level = 'unverified'
  ) as unverified_authority_chat_visible,
  count(*) filter (
    where kd.status = 'approved'
      and kd.is_chat_eligible
      and coalesce(rd.verification_status, 'pending') <> 'verified'
  ) as source_not_verified_chat_visible,
  count(*) filter (
    where kd.status = 'approved'
      and kd.is_chat_eligible
      and not exists (
        select 1
        from assistant.knowledge_citations kc
        where kc.knowledge_document_id = kd.id
          and kc.verification_status = 'verified'
      )
  ) as no_verified_citation_chat_visible,
  (
    select count(*)
    from assistant.v_chat_retrieval_candidates_v1
  ) as strict_public_chat_candidates
from assistant.knowledge_documents kd
left join assistant.reference_documents rd
  on rd.id = kd.reference_document_id;

select
  authority_level,
  reference_authority_level,
  reference_verification_status,
  verified_citations_count,
  count(*) as candidates
from assistant.v_chat_retrieval_candidates_v1
group by
  authority_level,
  reference_authority_level,
  reference_verification_status,
  verified_citations_count
order by authority_level, reference_authority_level;

select workflow_stage, priority, status, count(*) as tasks
from assistant.knowledge_review_tasks
group by workflow_stage, priority, status
order by workflow_stage, priority, status;
