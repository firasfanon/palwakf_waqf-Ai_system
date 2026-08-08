-- Sovereign Assistant Trust Foundation v1
-- OPERATOR APPLY: safe retrieval view and server-only RPC. No public base table is created.

begin;

create or replace view assistant.v_chat_retrieval_candidates_v1 as
select
  kd.id as knowledge_document_id,
  kd.title,
  kd.category,
  kd.domain_scope,
  kd.authority_level,
  kd.content,
  kd.summary,
  kd.chat_priority,
  kd.grounding_weight,
  kd.visibility_scope,
  kd.content_status,
  kd.status,
  kd.is_chat_eligible,
  count(kc.id) filter (where kc.verification_status in ('linked','verified')) as linked_or_verified_citations_count,
  count(kc.id) filter (where kc.verification_status = 'verified') as verified_citations_count,
  bool_or(kc.verification_status = 'verified') as has_verified_citation,
  rd.id as reference_document_id,
  rd.title as reference_document_title,
  rd.authority_level as reference_authority_level,
  rd.verification_status as reference_verification_status
from assistant.knowledge_documents kd
join assistant.reference_documents rd on rd.id = kd.reference_document_id
left join assistant.knowledge_citations kc on kc.knowledge_document_id = kd.id
where kd.status = 'approved'
  and kd.is_chat_eligible = true
  and kd.content_status = 'production'
  and kd.visibility_scope = 'public'
  and rd.status = 'approved'
  and rd.content_status = 'production'
group by kd.id, rd.id;

create or replace function assistant.rpc_list_chat_retrieval_candidates_v1(
  p_limit integer default 12,
  p_require_verified_citation boolean default false
)
returns table (
  knowledge_document_id uuid,
  title text,
  category text,
  domain_scope text,
  authority_level text,
  content text,
  summary text,
  chat_priority integer,
  grounding_weight numeric,
  linked_or_verified_citations_count bigint,
  verified_citations_count bigint,
  reference_document_id uuid,
  reference_document_title text,
  reference_authority_level text,
  reference_verification_status text
)
language sql
stable
security invoker
set search_path = assistant, public
as $$
  select
    knowledge_document_id,
    title,
    category,
    domain_scope,
    authority_level,
    content,
    summary,
    chat_priority,
    grounding_weight,
    linked_or_verified_citations_count,
    verified_citations_count,
    reference_document_id,
    reference_document_title,
    reference_authority_level,
    reference_verification_status
  from assistant.v_chat_retrieval_candidates_v1
  where linked_or_verified_citations_count > 0
    and (not p_require_verified_citation or has_verified_citation)
  order by
    has_verified_citation desc,
    case authority_level when 'official' then 3 when 'semi_official' then 2 when 'reference' then 1 else 0 end desc,
    chat_priority desc,
    grounding_weight desc,
    title
  limit greatest(1, least(coalesce(p_limit, 12), 100));
$$;

revoke all on assistant.v_chat_retrieval_candidates_v1 from public, anon, authenticated;
revoke all on function assistant.rpc_list_chat_retrieval_candidates_v1(integer, boolean) from public, anon, authenticated;
grant select on assistant.v_chat_retrieval_candidates_v1 to service_role;
grant execute on function assistant.rpc_list_chat_retrieval_candidates_v1(integer, boolean) to service_role;

commit;
