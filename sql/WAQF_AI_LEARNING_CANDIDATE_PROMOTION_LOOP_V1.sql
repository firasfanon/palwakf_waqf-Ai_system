-- WAQF_AI_LEARNING_CANDIDATE_PROMOTION_LOOP_V1
-- Governed bridge:
-- ai_tool_runs(waqf_research_answer) -> in_review knowledge candidate.
-- Human review remains mandatory; no automatic chat eligibility or release.

alter table assistant.ai_tool_runs
  drop constraint if exists ai_tool_runs_tool_key_check;

alter table assistant.ai_tool_runs
  add constraint ai_tool_runs_tool_key_check
  check (tool_key = any (array[
    'extract'::text,
    'summarize'::text,
    'classify'::text,
    'compare'::text,
    'precedents'::text,
    'predict'::text,
    'waqf_research_answer'::text
  ]));

create unique index if not exists
  idx_knowledge_documents_learning_tool_run_unique
on assistant.knowledge_documents ((metadata_json->>'source_ai_tool_run_id'))
where metadata_json->>'tool_origin'='waqf_research_answer';

create or replace function assistant.rpc_materialize_research_learning_candidate_v1(
  p_tool_run_id uuid,
  p_reviewer_auth_user_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = assistant, pg_catalog
as $$
declare
  v_run assistant.ai_tool_runs%rowtype;
  v_candidate jsonb;
  v_refs jsonb;
  v_ref jsonb;
  v_ref_map jsonb := '[]'::jsonb;
  v_map jsonb;
  v_existing_candidate_id uuid;
  v_candidate_id uuid;
  v_source_id uuid;
  v_reference_id uuid;
  v_primary_source_id uuid;
  v_primary_reference_id uuid;
  v_existing_ref_text text;
  v_source_name text;
  v_source_url text;
  v_title text;
  v_reference_count integer := 0;
  v_new_source_count integer := 0;
  v_citation_count integer := 0;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(
    p_reviewer_auth_user_id,
    'review'
  );

  select *
  into v_run
  from assistant.ai_tool_runs
  where id=p_tool_run_id
  for update;

  if not found then
    raise exception 'AI tool run not found';
  end if;

  if v_run.tool_key <> 'waqf_research_answer' then
    raise exception 'AI tool run is not a waqf research answer';
  end if;

  if v_run.run_status <> 'completed' then
    raise exception 'AI tool run must be completed before materialization';
  end if;

  if nullif(btrim(coalesce(v_run.output_text,'')),'') is null then
    raise exception 'AI tool run has no output text';
  end if;

  v_candidate := coalesce(v_run.output_json->'learningCandidate','{}'::jsonb);

  if coalesce((v_candidate->>'eligible')::boolean,false) is not true then
    raise exception 'Learning candidate is not eligible';
  end if;

  if coalesce(v_candidate->>'promotionPolicy','') <> 'human_verified_only' then
    raise exception 'Learning candidate promotion policy must be human_verified_only';
  end if;

  v_refs := coalesce(v_run.source_context_json->'references','[]'::jsonb);
  if jsonb_typeof(v_refs) <> 'array' or jsonb_array_length(v_refs)=0 then
    raise exception 'Learning candidate requires at least one research reference';
  end if;

  select id into v_existing_candidate_id
  from assistant.knowledge_documents
  where metadata_json->>'tool_origin'='waqf_research_answer'
    and metadata_json->>'source_ai_tool_run_id'=p_tool_run_id::text
  limit 1;

  if v_existing_candidate_id is not null then
    return jsonb_build_object(
      'tool_run_id',p_tool_run_id,
      'knowledge_document_id',v_existing_candidate_id,
      'materialized',false,
      'reused_existing_candidate',true,
      'chat_eligible',false,
      'automatic_promotion',false
    );
  end if;
  for v_ref in
    select value from jsonb_array_elements(v_refs)
  loop
    v_reference_count := v_reference_count + 1;
    v_source_id := null;
    v_reference_id := null;
    v_existing_ref_text := nullif(btrim(coalesce(v_ref->>'referenceDocumentId','')),'');

    if v_existing_ref_text is not null
       and v_existing_ref_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    then
      select rd.id,rd.source_id
      into v_reference_id,v_source_id
      from assistant.reference_documents rd
      where rd.id=v_existing_ref_text::uuid
      limit 1;
    end if;

    if v_reference_id is null then
      v_source_url := nullif(
        btrim(coalesce(v_ref->>'sourceUrl',v_ref->>'referenceFileUrl','')),
        ''
      );
      v_source_name := left(
        coalesce(
          nullif(btrim(coalesce(v_ref->>'source','')),''),
          nullif(btrim(coalesce(v_ref->>'title','')),''),
          'Research reference'
        ),
        500
      );

      insert into assistant.knowledge_sources(
        name,
        type,
        base_url,
        description,
        authority_level,
        is_active,
        metadata_json,
        verification_status,
        review_required
      )
      values(
        v_source_name,
        case when v_source_url is null then 'other' else 'external_fetch' end,
        v_source_url,
        'Materialized from a governed waqf research learning candidate.',
        'unverified',
        true,
        jsonb_build_object(
          'source_ai_tool_run_id',p_tool_run_id,
          'reference_ordinal',v_reference_count,
          'original_reference',v_ref,
          'automatic_authority_assignment',false
        ),
        'pending',
        true
      )
      returning id into v_source_id;

      insert into assistant.source_rights_profiles(
        source_id,
        rights_status,
        full_text_retention_allowed,
        rag_eligibility,
        public_display_eligibility,
        review_status,
        notes,
        metadata_json
      )
      values(
        v_source_id,
        'review_required',
        false,
        'review_only',
        'metadata_only',
        'pending',
        'Rights review required before RAG or public release.',
        jsonb_build_object(
          'source_ai_tool_run_id',p_tool_run_id,
          'automatic_rag_release',false
        )
      )
      on conflict(source_id) do nothing;

      insert into assistant.reference_documents(
        source_id,
        title,
        document_type,
        language,
        status,
        authority_level,
        domain_scope,
        source_type,
        summary,
        metadata_json,
        verification_status,
        visibility_scope,
        content_status
      )
      values(
        v_source_id,
        left(coalesce(nullif(btrim(coalesce(v_ref->>'title','')),''),v_source_name),500),
        coalesce(nullif(btrim(coalesce(v_ref->>'citationType','')),''),'research_reference'),
        null,
        'in_review',
        'unverified',
        'waqf_law',
        case when v_source_url is null then 'manual' else 'external_fetch' end,
        left(nullif(btrim(coalesce(v_ref->>'citationExcerpt','')),''),5000),
        jsonb_build_object(
          'source_ai_tool_run_id',p_tool_run_id,
          'reference_ordinal',v_reference_count,
          'original_reference',v_ref,
          'full_text_retained',false
        ),
        'pending',
        'internal',
        'review'
      )
      returning id into v_reference_id;

      v_new_source_count := v_new_source_count + 1;

      insert into assistant.knowledge_review_tasks(
        target_type,
        target_id,
        workflow_stage,
        priority,
        status,
        dedupe_key,
        notes,
        metadata_json
      )
      values(
        'reference_document',
        v_reference_id,
        'source_verification',
        'high',
        'open',
        'learning_source_verification:'||p_tool_run_id::text||':'||v_reference_count::text,
        'Verify source identity, canonical URL, authority and rights.',
        jsonb_build_object(
          'source_ai_tool_run_id',p_tool_run_id,
          'reference_ordinal',v_reference_count
        )
      )
      on conflict(dedupe_key) do nothing;
    end if;

    if v_primary_reference_id is null then
      v_primary_reference_id := v_reference_id;
      v_primary_source_id := v_source_id;
    end if;

    v_ref_map := v_ref_map || jsonb_build_array(jsonb_build_object(
      'referenceDocumentId',v_reference_id,
      'sourceId',v_source_id,
      'citationType',coalesce(nullif(btrim(coalesce(v_ref->>'citationType','')),''),'research_reference'),
      'locator',nullif(btrim(coalesce(v_ref->>'citationLocator','')),''),
      'excerpt',left(nullif(btrim(coalesce(v_ref->>'citationExcerpt','')),''),5000),
      'originalReference',v_ref
    ));
  end loop;

  if v_primary_reference_id is null then
    raise exception 'No usable reference could be materialized';
  end if;
  v_title := left(
    coalesce(
      nullif(btrim(coalesce(v_run.title,'')),''),
      nullif(btrim(coalesce(v_run.input_text,'')),''),
      'Waqf research learning candidate'
    ),
    500
  );

  insert into assistant.knowledge_documents(
    reference_document_id,
    source_id,
    title,
    category,
    status,
    authority_level,
    domain_scope,
    source_type,
    summary,
    content,
    tags,
    is_chat_eligible,
    chat_priority,
    grounding_weight,
    approval_version,
    review_notes,
    review_decision,
    metadata_json,
    content_status,
    visibility_scope,
    requires_human_review
  )
  values(
    v_primary_reference_id,
    v_primary_source_id,
    v_title,
    'law',
    'in_review',
    'unverified',
    'waqf_law',
    'system_generated',
    left(nullif(btrim(coalesce(v_run.input_text,'')),''),2000),
    v_run.output_text,
    '["learning_candidate","waqf_legal_research"]'::jsonb,
    false,
    50,
    1.000,
    1,
    concat_ws(
      E'\n',
      'Materialized from waqf_research_answer; human verification required.',
      nullif(btrim(coalesce(p_notes,'')),'')
    ),
    null,
    jsonb_build_object(
      'learning_candidate',true,
      'source_ai_tool_run_id',p_tool_run_id,
      'tool_origin','waqf_research_answer',
      'promotion_policy','human_verified_only',
      'promotion_state','materialized_in_review',
      'source_verification_status','pending',
      'citation_verification_status','linked',
      'automatic_chat_release',false,
      'automatic_promotion',false,
      'learning_candidate_snapshot',v_candidate
    ),
    'review',
    'internal',
    true
  )
  returning id into v_candidate_id;

  for v_map in
    select value from jsonb_array_elements(v_ref_map)
  loop
    insert into assistant.knowledge_citations(
      knowledge_document_id,
      reference_document_id,
      citation_type,
      locator,
      excerpt,
      metadata_json,
      verification_status
    )
    values(
      v_candidate_id,
      (v_map->>'referenceDocumentId')::uuid,
      coalesce(nullif(v_map->>'citationType',''),'research_reference'),
      nullif(v_map->>'locator',''),
      nullif(v_map->>'excerpt',''),
      jsonb_build_object(
        'source_ai_tool_run_id',p_tool_run_id,
        'original_reference',v_map->'originalReference',
        'citation_verification_status','linked'
      ),
      'linked'
    );
    v_citation_count := v_citation_count + 1;
  end loop;

  insert into assistant.knowledge_review_tasks(
    target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json
  )
  values
  (
    'knowledge_document',v_candidate_id,'citation_verification','high','open',
    'learning_citation_verification:'||p_tool_run_id::text,
    'Verify every linked citation and exact locator before release.',
    jsonb_build_object('source_ai_tool_run_id',p_tool_run_id)
  ),
  (
    'knowledge_document',v_candidate_id,'content_classification','high','open',
    'learning_content_classification:'||p_tool_run_id::text,
    'Review category, domain, entities, duplicate risk and answer scope.',
    jsonb_build_object('source_ai_tool_run_id',p_tool_run_id)
  ),
  (
    'knowledge_document',v_candidate_id,'human_approval','high','blocked',
    'learning_human_approval:'||p_tool_run_id::text,
    'Blocked until source, rights, citation and classification gates are satisfied.',
    jsonb_build_object(
      'source_ai_tool_run_id',p_tool_run_id,
      'promotion_policy','human_verified_only'
    )
  )
  on conflict(dedupe_key) do nothing;

  update assistant.ai_tool_runs
  set
    output_json=coalesce(output_json,'{}'::jsonb) || jsonb_build_object(
      'learningPromotion',
      jsonb_build_object(
        'state','materialized_in_review',
        'knowledgeDocumentId',v_candidate_id,
        'materializedAt',now(),
        'materializedBy',p_reviewer_auth_user_id,
        'automaticPromotion',false,
        'chatEligible',false
      )
    ),
    notes=concat_ws(
      E'\n',
      nullif(notes,''),
      'Governed learning candidate materialized for human review.'
    ),
    updated_at=now()
  where id=p_tool_run_id;

  return jsonb_build_object(
    'tool_run_id',p_tool_run_id,
    'knowledge_document_id',v_candidate_id,
    'reference_count',v_reference_count,
    'new_source_count',v_new_source_count,
    'citation_count',v_citation_count,
    'materialized',true,
    'reused_existing_candidate',false,
    'status','in_review',
    'visibility_scope','internal',
    'chat_eligible',false,
    'automatic_promotion',false
  );
end;
$$;

revoke all on function assistant.rpc_materialize_research_learning_candidate_v1(uuid,uuid,text)
  from public;
grant execute on function assistant.rpc_materialize_research_learning_candidate_v1(uuid,uuid,text)
  to service_role;
