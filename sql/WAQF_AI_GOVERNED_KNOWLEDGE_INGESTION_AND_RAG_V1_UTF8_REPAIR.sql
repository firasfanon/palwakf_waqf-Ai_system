-- ASCII-safe UTF-8/entity normalization repair for V1.
-- Arabic literals are reconstructed from UTF-8 hex to prevent transport mojibake.

create or replace function assistant.normalize_entity_text_v1(p_text text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(
    lower(regexp_replace(
      replace(replace(replace(replace(replace(replace(
        coalesce(p_text,''),
        chr(1573),chr(1575)),
        chr(1571),chr(1575)),
        chr(1570),chr(1575)),
        chr(1649),chr(1575)),
        chr(1609),chr(1610)),
        chr(1577),chr(1607)),
      '[^[:alnum:][:space:]]+',' ','g'
    )),
    '[[:space:]]+',' ','g'
  ));
$$;

revoke all on function assistant.normalize_entity_text_v1(text) from public;
grant execute on function assistant.normalize_entity_text_v1(text)
  to anon,authenticated,service_role;

insert into assistant.knowledge_entities(
  canonical_key,canonical_name,entity_type,status,authority_level,metadata_json
)
values
(
  'waqf_khalil_al_rahman',
  convert_from(decode('d988d982d98120d8aed984d98ad98420d8a7d984d8b1d8add985d986','hex'),'UTF8'),
  'waqf','verified','reference',
  '{"seed":"WAQF_AI_GOVERNED_KNOWLEDGE_INGESTION_AND_RAG_V1"}'::jsonb
),
(
  'waqf_haseki_sultan',
  convert_from(decode('d988d982d98120d8aed8a7d8b5d983d98a20d8b3d984d8b7d8a7d986','hex'),'UTF8'),
  'waqf','verified','reference',
  '{"seed":"WAQF_AI_GOVERNED_KNOWLEDGE_INGESTION_AND_RAG_V1"}'::jsonb
)
on conflict(canonical_key) do update
set canonical_name=excluded.canonical_name,
    entity_type=excluded.entity_type,
    status=excluded.status,
    authority_level=excluded.authority_level,
    metadata_json=assistant.knowledge_entities.metadata_json || excluded.metadata_json,
    updated_at=now();

delete from assistant.knowledge_entity_aliases
where entity_id in (
  select id from assistant.knowledge_entities
  where canonical_key in ('waqf_khalil_al_rahman','waqf_haseki_sultan')
);

with aliases(canonical_key,alias,normalized_alias,language,alias_type) as (
  values
    ('waqf_khalil_al_rahman',
      convert_from(decode('d988d982d98120d8aed984d98ad98420d8a7d984d8b1d8add985d986','hex'),'UTF8'),
      convert_from(decode('d988d982d98120d8aed984d98ad98420d8a7d984d8b1d8add985d986','hex'),'UTF8'),'ar','canonical'),
    ('waqf_khalil_al_rahman',
      convert_from(decode('d8aed984d98ad98420d8a7d984d8b1d8add985d986','hex'),'UTF8'),
      convert_from(decode('d8aed984d98ad98420d8a7d984d8b1d8add985d986','hex'),'UTF8'),'ar','alternate'),
    ('waqf_khalil_al_rahman',
      convert_from(decode('d8a7d984d8add8b1d98520d8a7d984d8a5d8a8d8b1d8a7d987d98ad985d98a','hex'),'UTF8'),
      convert_from(decode('d8a7d984d8add8b1d98520d8a7d984d8a7d8a8d8b1d8a7d987d98ad985d98a','hex'),'UTF8'),'ar','alternate'),
    ('waqf_khalil_al_rahman',
      convert_from(decode('d8a7d984d985d8b3d8acd8af20d8a7d984d8a5d8a8d8b1d8a7d987d98ad985d98a','hex'),'UTF8'),
      convert_from(decode('d8a7d984d985d8b3d8acd8af20d8a7d984d8a7d8a8d8b1d8a7d987d98ad985d98a','hex'),'UTF8'),'ar','alternate'),
    ('waqf_khalil_al_rahman','Khalil al-Rahman','khalil al rahman','en','transliteration'),
    ('waqf_khalil_al_rahman','Haram al-Ibrahimi','haram al ibrahimi','en','alternate'),
    ('waqf_khalil_al_rahman','Sanctuary of Abraham','sanctuary of abraham','en','alternate'),
    ('waqf_haseki_sultan',
      convert_from(decode('d988d982d98120d8aed8a7d8b5d983d98a20d8b3d984d8b7d8a7d986','hex'),'UTF8'),
      convert_from(decode('d988d982d98120d8aed8a7d8b5d983d98a20d8b3d984d8b7d8a7d986','hex'),'UTF8'),'ar','canonical'),
    ('waqf_haseki_sultan',
      convert_from(decode('d8aed8a7d8b5d983d98a20d8b3d984d8b7d8a7d986','hex'),'UTF8'),
      convert_from(decode('d8aed8a7d8b5d983d98a20d8b3d984d8b7d8a7d986','hex'),'UTF8'),'ar','alternate'),
    ('waqf_haseki_sultan','Haseki Sultan','haseki sultan','en','transliteration'),
    ('waqf_haseki_sultan',
      convert_from(decode('486173656b692048c3bc7272656d2053756c74616e','hex'),'UTF8'),
      'haseki hurrem sultan','en','alternate')
)
insert into assistant.knowledge_entity_aliases(
  entity_id,alias,normalized_alias,language,alias_type,is_verified
)
select e.id,a.alias,a.normalized_alias,a.language,a.alias_type,true
from aliases a
join assistant.knowledge_entities e on e.canonical_key=a.canonical_key;

create or replace function assistant.runtime_resolve_knowledge_entities_v1(
  p_query text,
  p_limit integer default 12
)
returns table(payload jsonb)
language sql
stable
security definer
set search_path = pg_catalog, public, assistant
as $$
  with q as (
    select assistant.normalize_entity_text_v1(p_query) as normalized
  )
  select jsonb_build_object(
    'entityId', e.id,
    'canonicalKey', e.canonical_key,
    'canonicalName', e.canonical_name,
    'entityType', e.entity_type,
    'status', e.status,
    'authorityLevel', e.authority_level,
    'matchedAlias', a.alias,
    'normalizedAlias', a.normalized_alias,
    'verifiedAlias', a.is_verified
  )
  from assistant.knowledge_entity_aliases a
  join assistant.knowledge_entities e on e.id=a.entity_id
  cross join q
  where e.status in ('pending','verified')
    and q.normalized like '%' || a.normalized_alias || '%'
  order by
    case when e.status='verified' then 0 else 1 end,
    case when a.is_verified then 0 else 1 end,
    length(a.normalized_alias) desc
  limit greatest(1,least(coalesce(p_limit,12),50));
$$;

revoke all on function assistant.runtime_resolve_knowledge_entities_v1(text,integer) from public;
grant execute on function assistant.runtime_resolve_knowledge_entities_v1(text,integer)
  to anon, authenticated, service_role;

create or replace function assistant.runtime_hybrid_rag_search_v1(
  p_query text,
  p_query_embedding text default null,
  p_limit integer default 8
)
returns table(payload jsonb)
language sql
stable
security definer
set search_path = pg_catalog, public, assistant, extensions
as $$
  with params as (
    select
      btrim(coalesce(p_query,'')) as query_text,
      case
        when nullif(btrim(coalesce(p_query_embedding,'')),'') is null then null::extensions.vector
        else p_query_embedding::extensions.vector
      end as query_embedding,
      greatest(1,least(coalesce(p_limit,8),30)) as max_rows
  ),
  eligible as (
    select
      kc.*,
      kd.title as knowledge_title,
      kd.category as knowledge_category,
      kd.authority_level,
      kd.chat_priority,
      kd.grounding_weight,
      rd.title as reference_title,
      ks.name as source_name,
      ks.base_url as source_url,
      case kd.authority_level
        when 'official' then 1.0
        when 'semi_official' then 0.75
        when 'reference' then 0.50
        else 0.0
      end as authority_score,
      (
        select jsonb_build_object(
          'id', cit.id,
          'locator', cit.locator,
          'excerpt', cit.excerpt,
          'verificationStatus', cit.verification_status,
          'referenceDocumentId', cit.reference_document_id
        )
        from assistant.knowledge_citations cit
        where cit.knowledge_document_id=kd.id
          and cit.verification_status='verified'
        order by cit.verified_at desc nulls last, cit.created_at asc
        limit 1
      ) as verified_citation
    from assistant.knowledge_chunks kc
    join assistant.knowledge_documents kd on kd.id=kc.knowledge_document_id
    join assistant.reference_documents rd on rd.id=kd.reference_document_id
    join assistant.knowledge_sources ks on ks.id=rd.source_id
    join assistant.source_rights_profiles srp on srp.source_id=ks.id
    where kd.status='approved'
      and kd.is_chat_eligible=true
      and kd.content_status='production'
      and kd.visibility_scope='public'
      and kd.authority_level<>'unverified'
      and rd.verification_status='verified'
      and rd.content_status='production'
      and ks.verification_status='verified'
      and ks.is_active=true
      and srp.review_status='verified'
      and srp.rag_eligibility='eligible_after_review'
      and srp.rights_status in ('licensed','permission_recorded','public_domain','official_publication')
      and exists (
        select 1 from assistant.knowledge_citations cit
        where cit.knowledge_document_id=kd.id
          and cit.verification_status='verified'
      )
  ),
  scored as (
    select
      e.*,
      case
        when p.query_embedding is null or e.embedding is null then 0::double precision
        else greatest(0::double precision, 1 - (e.embedding <=> p.query_embedding))
      end as semantic_score,
      least(
        1::double precision,
        ts_rank_cd(e.search_vector, plainto_tsquery('simple', p.query_text))::double precision * 8
      ) as lexical_score,
      greatest(
        similarity(coalesce(e.heading,''), p.query_text),
        similarity(left(e.content,2000), p.query_text)
      )::double precision as trigram_score,
      case when exists (
        select 1
        from assistant.knowledge_chunk_entities ce
        join assistant.knowledge_entity_aliases ea on ea.entity_id=ce.entity_id
        where ce.chunk_id=e.id
          and assistant.normalize_entity_text_v1(p.query_text)
              like '%' || ea.normalized_alias || '%'
      ) then 1::double precision else 0::double precision end as entity_score
    from eligible e
    cross join params p
    where
      e.search_vector @@ plainto_tsquery('simple', p.query_text)
      or similarity(coalesce(e.heading,''), p.query_text) > 0.08
      or similarity(left(e.content,2000), p.query_text) > 0.08
      or exists (
        select 1
        from assistant.knowledge_chunk_entities ce
        join assistant.knowledge_entity_aliases ea on ea.entity_id=ce.entity_id
        where ce.chunk_id=e.id
          and assistant.normalize_entity_text_v1(p.query_text)
              like '%' || ea.normalized_alias || '%'
      )
      or (p.query_embedding is not null and e.embedding is not null)
  ),
  ranked as (
    select
      s.*,
      (
        semantic_score * 0.50 +
        lexical_score * 0.20 +
        trigram_score * 0.10 +
        entity_score * 0.10 +
        authority_score * 0.07 +
        least(greatest(coalesce(chat_priority,50),0),1000)::double precision / 1000 * 0.02 +
        least(greatest(coalesce(grounding_weight,1),0),5)::double precision / 5 * 0.01
      ) as hybrid_score
    from scored s
  )
  select jsonb_build_object(
    'chunkId', r.id,
    'knowledgeDocumentId', r.knowledge_document_id,
    'referenceDocumentId', r.reference_document_id,
    'sourceId', r.source_id,
    'title', r.knowledge_title,
    'category', r.knowledge_category,
    'sectionType', r.section_type,
    'heading', r.heading,
    'locator', r.locator,
    'content', r.content,
    'contentHash', r.content_hash,
    'sourceName', r.source_name,
    'sourceUrl', r.source_url,
    'referenceTitle', r.reference_title,
    'authorityLevel', r.authority_level,
    'citation', r.verified_citation,
    'scores', jsonb_build_object(
      'hybrid', round(r.hybrid_score::numeric,6),
      'semantic', round(r.semantic_score::numeric,6),
      'lexical', round(r.lexical_score::numeric,6),
      'trigram', round(r.trigram_score::numeric,6),
      'entity', round(r.entity_score::numeric,6),
      'authority', round(r.authority_score::numeric,6)
    )
  )
  from (
    select
      ranked.*,
      row_number() over (
        order by ranked.hybrid_score desc, ranked.chunk_index asc
      ) as result_row_number
    from ranked
  ) r
  cross join params p
  where r.result_row_number <= p.max_rows
  order by r.hybrid_score desc, r.chunk_index asc;
$$;

revoke all on function assistant.runtime_hybrid_rag_search_v1(text,text,integer) from public;
grant execute on function assistant.runtime_hybrid_rag_search_v1(text,text,integer)
  to anon, authenticated, service_role;
