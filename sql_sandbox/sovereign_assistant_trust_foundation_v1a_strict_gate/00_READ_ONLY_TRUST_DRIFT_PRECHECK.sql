-- Sovereign Assistant Trust Foundation v1A
-- READ ONLY. Confirms the v58 apply evidence and measures strict-gate drift.

select
  status,
  is_chat_eligible,
  authority_level,
  count(*) as rows
from assistant.knowledge_documents
group by status, is_chat_eligible, authority_level
order by status, is_chat_eligible desc, authority_level;

select
  kd.authority_level,
  rd.verification_status as source_verification_status,
  coalesce(kc.verification_status, 'missing') as citation_verification_status,
  count(distinct kd.id) as knowledge_documents
from assistant.knowledge_documents kd
left join assistant.reference_documents rd on rd.id = kd.reference_document_id
left join assistant.knowledge_citations kc on kc.knowledge_document_id = kd.id
where kd.status = 'approved'
group by kd.authority_level, rd.verification_status, coalesce(kc.verification_status, 'missing')
order by kd.authority_level, rd.verification_status, citation_verification_status;

select
  count(*) filter (where kd.status = 'approved' and kd.is_chat_eligible and kd.authority_level = 'unverified') as unverified_authority_currently_chat_visible,
  count(*) filter (where kd.status = 'approved' and kd.is_chat_eligible and coalesce(rd.verification_status, 'pending') <> 'verified') as source_not_verified_currently_chat_visible,
  count(*) filter (where kd.status = 'approved' and kd.is_chat_eligible and not exists (
    select 1 from assistant.knowledge_citations kc
    where kc.knowledge_document_id = kd.id and kc.verification_status = 'verified'
  )) as no_verified_citation_currently_chat_visible
from assistant.knowledge_documents kd
left join assistant.reference_documents rd on rd.id = kd.reference_document_id;

select workflow_stage, priority, status, count(*) as tasks
from assistant.knowledge_review_tasks
group by workflow_stage, priority, status
order by workflow_stage, priority, status;
