-- Sovereign Assistant Trust Foundation v1A
-- OPERATOR APPLY. Fails closed for public chat retrieval until the retained
-- source and at least one citation have explicit human verification.
-- This does not delete any legacy data or close review tasks.

begin;

-- Preserve every record, but remove public-chat eligibility from records that
-- do not yet satisfy the verified-source + verified-citation contract.
update assistant.knowledge_documents kd
set
  is_chat_eligible = false,
  requires_human_review = true,
  metadata_json = coalesce(kd.metadata_json, '{}'::jsonb) || jsonb_build_object(
    'trust_foundation_version','v1A',
    'strict_public_retrieval_gate','blocked_pending_verified_source_and_citation',
    'chat_eligibility_suspended_at', now()
  )
where kd.status = 'approved'
  and kd.is_chat_eligible = true
  and (
    kd.authority_level = 'unverified'
    or not exists (
      select 1
      from assistant.reference_documents rd
      where rd.id = kd.reference_document_id
        and rd.status = 'approved'
        and rd.verification_status = 'verified'
        and rd.authority_level in ('official','semi_official','reference')
    )
    or not exists (
      select 1
      from assistant.knowledge_citations kc
      where kc.knowledge_document_id = kd.id
        and kc.verification_status = 'verified'
    )
  );

-- Replace v1 with the strict production candidate set. Existing callers cannot
-- bypass verification by passing p_require_verified_citation = false.
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
  count(kc.id) filter (where kc.verification_status = 'verified') as linked_or_verified_citations_count,
  count(kc.id) filter (where kc.verification_status = 'verified') as verified_citations_count,
  true as has_verified_citation,
  rd.id as reference_document_id,
  rd.title as reference_document_title,
  rd.authority_level as reference_authority_level,
  rd.verification_status as reference_verification_status
from assistant.knowledge_documents kd
join assistant.reference_documents rd on rd.id = kd.reference_document_id
join assistant.knowledge_citations kc
  on kc.knowledge_document_id = kd.id
 and kc.verification_status = 'verified'
where kd.status = 'approved'
  and kd.is_chat_eligible = true
  and kd.content_status = 'production'
  and kd.visibility_scope = 'public'
  and kd.authority_level in ('official','semi_official','reference')
  and rd.status = 'approved'
  and rd.content_status = 'production'
  and rd.verification_status = 'verified'
  and rd.authority_level in ('official','semi_official','reference')
group by kd.id, rd.id;

create or replace function assistant.rpc_list_chat_retrieval_candidates_v1(
  p_limit integer default 12,
  p_require_verified_citation boolean default true
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
    verified_citations_count as linked_or_verified_citations_count,
    verified_citations_count,
    reference_document_id,
    reference_document_title,
    reference_authority_level,
    reference_verification_status
  from assistant.v_chat_retrieval_candidates_v1
  order by
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
