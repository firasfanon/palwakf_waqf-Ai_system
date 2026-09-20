-- WAQF_AI_GOVERNED_KNOWLEDGE_INGESTION_AND_RAG_V1
-- Additive knowledge-ingestion/index layer over the existing sovereign
-- source/reference/knowledge/citation/review model.
-- No automatic approval, verification, chat release or rights expansion.

create extension if not exists vector with schema extensions;

create table if not exists assistant.knowledge_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references assistant.knowledge_sources(id) on delete set null,
  reference_document_id uuid references assistant.reference_documents(id) on delete set null,
  knowledge_document_id uuid references assistant.knowledge_documents(id) on delete set null,
  input_kind text not null check (input_kind in ('upload','manual','url','learning_candidate','existing_reference')),
  input_locator text,
  original_filename text,
  mime_type text,
  status text not null default 'received'
    check (status in ('received','extracted','chunked','indexed','review_pending','completed','failed','quarantined')),
  retention_basis text not null default 'review_required'
    check (retention_basis in ('user_provided','internal','verified_rights','metadata_only','review_required')),
  full_text_allowed boolean not null default false,
  requested_by uuid,
  error_code text,
  error_message text,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists assistant.knowledge_entities (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  canonical_name text not null,
  entity_type text not null
    check (entity_type in ('waqf','place','person','institution','law','court','case','document','other')),
  status text not null default 'pending'
    check (status in ('pending','verified','rejected','archived')),
  authority_level text not null default 'unverified'
    check (authority_level in ('official','semi_official','reference','unverified')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant.knowledge_entity_aliases (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references assistant.knowledge_entities(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  language text,
  alias_type text not null default 'alternate'
    check (alias_type in ('canonical','alternate','historical','transliteration','abbreviation')),
  is_verified boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(entity_id, normalized_alias)
);

create table if not exists assistant.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  ingestion_job_id uuid references assistant.knowledge_ingestion_jobs(id) on delete set null,
  knowledge_document_id uuid not null references assistant.knowledge_documents(id) on delete cascade,
  reference_document_id uuid references assistant.reference_documents(id) on delete set null,
  source_id uuid references assistant.knowledge_sources(id) on delete set null,
  chunk_index integer not null check (chunk_index >= 0),
  section_type text not null default 'paragraph'
    check (section_type in ('article','holding','reasoning','facts','waqf_clause','heading','paragraph','table','metadata','other')),
  heading text,
  locator text,
  content text not null,
  content_hash text not null,
  token_count integer,
  embedding extensions.vector(768),
  embedding_model text,
  embedding_status text not null default 'pending'
    check (embedding_status in ('pending','ready','failed','stale')),
  metadata_json jsonb not null default '{}'::jsonb,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(heading,'') || ' ' || coalesce(locator,'') || ' ' || content)
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(knowledge_document_id, chunk_index, content_hash)
);
create table if not exists assistant.knowledge_chunk_entities (
  chunk_id uuid not null references assistant.knowledge_chunks(id) on delete cascade,
  entity_id uuid not null references assistant.knowledge_entities(id) on delete cascade,
  match_type text not null default 'alias'
    check (match_type in ('canonical','alias','manual','model')),
  confidence numeric(5,4) not null default 1.0
    check (confidence >= 0 and confidence <= 1),
  is_verified boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(chunk_id, entity_id)
);

create table if not exists assistant.knowledge_chunk_citations (
  chunk_id uuid not null references assistant.knowledge_chunks(id) on delete cascade,
  citation_id uuid not null references assistant.knowledge_citations(id) on delete cascade,
  locator_snapshot text,
  excerpt_snapshot text,
  created_at timestamptz not null default now(),
  primary key(chunk_id, citation_id)
);

create table if not exists assistant.knowledge_embedding_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  model text not null,
  dimensions integer not null check (dimensions > 0),
  status text not null default 'running'
    check (status in ('running','completed','partial','failed')),
  input_count integer not null default 0,
  output_count integer not null default 0,
  failed_count integer not null default 0,
  metadata_json jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_knowledge_chunks_search_vector
  on assistant.knowledge_chunks using gin(search_vector);
create index if not exists idx_knowledge_chunks_content_trgm
  on assistant.knowledge_chunks using gin(content gin_trgm_ops);
create index if not exists idx_knowledge_chunks_heading_trgm
  on assistant.knowledge_chunks using gin(heading gin_trgm_ops);
create index if not exists idx_knowledge_chunks_document
  on assistant.knowledge_chunks(knowledge_document_id, chunk_index);
create index if not exists idx_knowledge_chunks_embedding_hnsw
  on assistant.knowledge_chunks using hnsw (embedding vector_cosine_ops)
  where embedding is not null;
create index if not exists idx_knowledge_entity_alias_normalized
  on assistant.knowledge_entity_aliases(normalized_alias);
create index if not exists idx_knowledge_entity_alias_trgm
  on assistant.knowledge_entity_aliases using gin(normalized_alias gin_trgm_ops);
create index if not exists idx_knowledge_ingestion_jobs_status
  on assistant.knowledge_ingestion_jobs(status, created_at desc);

alter table assistant.knowledge_ingestion_jobs enable row level security;
alter table assistant.knowledge_entities enable row level security;
alter table assistant.knowledge_entity_aliases enable row level security;
alter table assistant.knowledge_chunks enable row level security;
alter table assistant.knowledge_chunk_entities enable row level security;
alter table assistant.knowledge_chunk_citations enable row level security;
alter table assistant.knowledge_embedding_runs enable row level security;

revoke all on assistant.knowledge_ingestion_jobs from anon, authenticated;
revoke all on assistant.knowledge_entities from anon, authenticated;
revoke all on assistant.knowledge_entity_aliases from anon, authenticated;
revoke all on assistant.knowledge_chunks from anon, authenticated;
revoke all on assistant.knowledge_chunk_entities from anon, authenticated;
revoke all on assistant.knowledge_chunk_citations from anon, authenticated;
revoke all on assistant.knowledge_embedding_runs from anon, authenticated;
create or replace function assistant.normalize_entity_text_v1(p_text text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(
    lower(regexp_replace(
      replace(replace(replace(replace(replace(replace(coalesce(p_text,'),chr(1573),chr(1575)),chr(1571),chr(1575)),chr(1570),chr(1575)),chr(1649),chr(1575)),chr(1609),chr(1610)),chr(1577),chr(1607)),
      '[^[:alnum:][:space:]]+',' ','g'
    )),
    '[[:space:]]+',' ','g'
  ));
$$;

revoke all on function assistant.normalize_entity_text_v1(text) from public;
grant execute on function assistant.normalize_entity_text_v1(text) to anon,authenticated,service_role;

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
create or replace function assistant.rpc_queue_learning_candidate_review_v1(
  p_knowledge_document_id uuid,
  p_reviewer_auth_user_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = assistant, pg_catalog
as $$
declare
  v_doc assistant.knowledge_documents%rowtype;
  v_policy text;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id,'review');

  select * into v_doc
  from assistant.knowledge_documents
  where id=p_knowledge_document_id
  for update;
  if not found then raise exception 'knowledge document not found'; end if;

  v_policy := coalesce(v_doc.metadata_json->>'promotion_policy','');
  if coalesce(v_doc.metadata_json->>'tool_origin','') <> 'waqf_research_answer' then
    raise exception 'document is not a governed learning candidate';
  end if;
  if v_policy <> 'human_verified_only' then
    raise exception 'learning candidate promotion policy must be human_verified_only';
  end if;
  if v_doc.is_chat_eligible then
    raise exception 'learning candidate is already chat eligible';
  end if;

  update assistant.knowledge_documents
  set
    status=case when status='draft' then 'in_review' else status end,
    requires_human_review=true,
    is_chat_eligible=false,
    review_notes=concat_ws(E'\n',nullif(review_notes,''),nullif(trim(p_notes),'')),
    metadata_json=coalesce(metadata_json,'{}'::jsonb) || jsonb_build_object(
      'learning_promotion_queue_status','queued_for_human_review',
      'learning_promotion_queued_at',now(),
      'learning_promotion_queued_by',p_reviewer_auth_user_id
    ),
    updated_at=now()
  where id=p_knowledge_document_id;

  insert into assistant.knowledge_review_tasks(
    target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json
  ) values (
    'knowledge_document',p_knowledge_document_id,'content_classification','high','open',
    'learning_candidate_classification:'||p_knowledge_document_id::text,
    coalesce(nullif(trim(p_notes),''),'Governed learning candidate classification required.'),
    jsonb_build_object('origin','waqf_research_answer','promotion_policy','human_verified_only')
  ) on conflict(dedupe_key) do nothing;

  insert into assistant.knowledge_review_tasks(
    target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json
  ) values (
    'knowledge_document',p_knowledge_document_id,'human_approval','high','blocked',
    'learning_candidate_human_approval:'||p_knowledge_document_id::text,
    'Blocked until source and citation verification gates are satisfied.',
    jsonb_build_object('origin','waqf_research_answer','promotion_policy','human_verified_only')
  ) on conflict(dedupe_key) do nothing;

  return jsonb_build_object(
    'knowledge_document_id',p_knowledge_document_id,
    'queue_status','queued_for_human_review',
    'chat_eligible',false,
    'automatic_promotion',false
  );
end;
$$;

revoke all on function assistant.rpc_queue_learning_candidate_review_v1(uuid,uuid,text) from public;
grant execute on function assistant.rpc_queue_learning_candidate_review_v1(uuid,uuid,text)
  to service_role;
