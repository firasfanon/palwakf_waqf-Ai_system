-- Smart Tools 3 / KB08B — Mapping Resolution
-- OPERATOR APPLY. Keeps every legacy row; decisions are auditable and review-only.

begin;

create table if not exists assistant.legacy_mapping_resolutions (
  id uuid primary key default gen_random_uuid(),
  legacy_import_id uuid not null references assistant.legacy_import_register(id) on delete restrict,
  resolution_action text not null,
  resolution_status text not null default 'applied',
  target_reference_document_id uuid null references assistant.reference_documents(id) on delete set null,
  target_knowledge_document_id uuid null references assistant.knowledge_documents(id) on delete set null,
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  reviewer_auth_user_id uuid not null,
  notes text null,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_legacy_mapping_resolution_action_chk check (resolution_action in ('map_existing','promote_review','defer','quarantine')),
  constraint assistant_legacy_mapping_resolution_status_chk check (resolution_status in ('applied','deferred','quarantined'))
);
create index if not exists idx_assistant_legacy_mapping_resolutions_import on assistant.legacy_mapping_resolutions(legacy_import_id, created_at desc);
alter table assistant.legacy_mapping_resolutions enable row level security;

create or replace function assistant.rpc_kb08b_mapping_queue_v1(
  p_limit integer default 100,
  p_offset integer default 0
) returns table (
  legacy_import_id uuid,
  legacy_batch text,
  legacy_source_table text,
  legacy_record_key text,
  legacy_dedupe_key text,
  title_candidate text,
  content_available boolean,
  source_url_candidate text,
  current_notes text,
  last_resolution_action text,
  last_resolution_status text,
  created_at timestamptz
)
language sql
stable
security invoker
set search_path = assistant, public
as $$
  select
    lir.id,
    lir.legacy_batch,
    lir.legacy_table_name,
    lir.legacy_record_key,
    lir.legacy_dedupe_key,
    coalesce(nullif(lir.payload_json #>> '{row,title}',''), nullif(lir.payload_json #>> '{row,question}',''), nullif(lir.payload_json #>> '{title}',''), lir.legacy_record_key),
    coalesce(nullif(lir.payload_json #>> '{row,content_text}',''), nullif(lir.payload_json #>> '{row,content}',''), nullif(lir.payload_json #>> '{row,description}',''), nullif(lir.payload_json #>> '{content_text}',''), nullif(lir.payload_json #>> '{content}','')) is not null,
    coalesce(nullif(lir.payload_json #>> '{row,source_url}',''), nullif(lir.payload_json #>> '{row,url}',''), nullif(lir.payload_json #>> '{source_url}','')),
    lir.notes,
    lmr.resolution_action,
    lmr.resolution_status,
    lir.created_at
  from assistant.legacy_import_register lir
  left join lateral (
    select resolution_action, resolution_status
    from assistant.legacy_mapping_resolutions
    where legacy_import_id = lir.id
    order by created_at desc
    limit 1
  ) lmr on true
  where lir.migration_status = 'needs_mapping'
    and lir.legacy_batch in ('knowledge_batch_08','knowledge_batch_08_observed_rows')
  order by lir.created_at, lir.legacy_table_name, lir.legacy_record_key
  limit greatest(1, least(coalesce(p_limit,100),500))
  offset greatest(0, coalesce(p_offset,0));
$$;

create or replace function assistant.rpc_kb08b_resolve_mapping_v1(
  p_legacy_import_id uuid,
  p_reviewer_auth_user_id uuid,
  p_resolution_action text,
  p_target_reference_document_id uuid default null,
  p_target_knowledge_document_id uuid default null,
  p_source_id uuid default null,
  p_category text default null,
  p_domain_scope text default null,
  p_notes text default null,
  p_evidence_json jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare
  v_row assistant.legacy_import_register%rowtype;
  v_title text; v_content text; v_summary text; v_source_url text;
  v_reference_id uuid; v_knowledge_id uuid; v_source_id uuid;
  v_category text; v_domain_scope text; v_resolution_status text;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');
  if p_resolution_action not in ('map_existing','promote_review','defer','quarantine') then raise exception 'unsupported KB08B resolution action'; end if;

  select * into v_row from assistant.legacy_import_register where id = p_legacy_import_id for update;
  if not found then raise exception 'legacy import record not found'; end if;
  if v_row.migration_status <> 'needs_mapping' then raise exception 'legacy record is not in needs_mapping'; end if;

  v_title := coalesce(nullif(v_row.payload_json #>> '{row,title}',''), nullif(v_row.payload_json #>> '{row,question}',''), nullif(v_row.payload_json #>> '{title}',''), v_row.legacy_record_key);
  v_content := coalesce(nullif(v_row.payload_json #>> '{row,content_text}',''), nullif(v_row.payload_json #>> '{row,content}',''), nullif(v_row.payload_json #>> '{row,description}',''), nullif(v_row.payload_json #>> '{row,summary}',''), nullif(v_row.payload_json #>> '{content_text}',''), nullif(v_row.payload_json #>> '{content}',''));
  v_summary := coalesce(nullif(v_row.payload_json #>> '{row,summary}',''), nullif(v_row.payload_json #>> '{row,description}',''), nullif(left(v_content,4000),''));
  v_source_url := coalesce(nullif(v_row.payload_json #>> '{row,source_url}',''), nullif(v_row.payload_json #>> '{row,url}',''), nullif(v_row.payload_json #>> '{source_url}',''));

  if p_resolution_action = 'map_existing' then
    if p_target_reference_document_id is null then raise exception 'target reference document is required for map_existing'; end if;
    select id into v_reference_id from assistant.reference_documents where id = p_target_reference_document_id;
    if v_reference_id is null then raise exception 'target reference document does not exist'; end if;
    if p_target_knowledge_document_id is not null and not exists (select 1 from assistant.knowledge_documents where id=p_target_knowledge_document_id and reference_document_id=v_reference_id) then
      raise exception 'target knowledge document does not belong to target reference';
    end if;
    v_knowledge_id := p_target_knowledge_document_id;
    v_resolution_status := 'applied';
    update assistant.legacy_import_register
    set migration_status='promoted', target_table='assistant.reference_documents',
        notes=concat_ws(' | ', nullif(notes,''), 'KB08B map_existing review decision; no automatic approval or chat publication.')
    where id=p_legacy_import_id;

  elsif p_resolution_action = 'promote_review' then
    if nullif(trim(v_title),'') is null or nullif(trim(v_content),'') is null then raise exception 'title and content are required to promote review-only'; end if;
    if p_source_id is null or not exists (select 1 from assistant.knowledge_sources where id=p_source_id) then raise exception 'valid source_id is required for promote_review'; end if;
    v_source_id := p_source_id;
    v_category := case when p_category in ('law','jurisprudence','historical','administrative','reference') then p_category else 'reference' end;
    v_domain_scope := case when p_domain_scope in ('waqf_law','fiqh','administrative','historical','public_info','internal_procedure','other') then p_domain_scope else 'other' end;

    insert into assistant.reference_documents (
      source_id,title,document_type,language,status,authority_level,domain_scope,source_type,summary,content_text,content_hash,metadata_json,approval_version,review_notes,verification_status,visibility_scope,content_status
    ) values (
      v_source_id,trim(v_title),'legacy_reference','ar','in_review','unverified',v_domain_scope,case when v_source_url is null then 'seeded' else 'external_fetch' end,
      v_summary,v_content,md5(v_content || '|' || v_row.legacy_dedupe_key),
      jsonb_build_object('batch','KB08B','legacy_import_id',p_legacy_import_id,'legacy_dedupe_key',v_row.legacy_dedupe_key,'original_payload',v_row.payload_json,'mapping_evidence',coalesce(p_evidence_json,'{}'::jsonb)),
      0,concat_ws(E'\n','KB08B promote_review: review-only; no automatic approval.',nullif(p_notes,'')),'pending','public','legacy'
    ) returning id into v_reference_id;

    insert into assistant.knowledge_documents (
      reference_document_id,source_id,title,category,status,authority_level,domain_scope,source_type,summary,content,tags,is_chat_eligible,chat_priority,grounding_weight,approval_version,review_notes,metadata_json,content_status,visibility_scope,requires_human_review
    ) values (
      v_reference_id,v_source_id,trim(v_title),v_category,'in_review','unverified',v_domain_scope,case when v_source_url is null then 'seeded' else 'external_fetch' end,
      v_summary,v_content,'[]'::jsonb,false,45,1.0,0,concat_ws(E'\n','KB08B promote_review: requires verified source/citation and human release.',nullif(p_notes,'')),
      jsonb_build_object('batch','KB08B','legacy_import_id',p_legacy_import_id,'trust_alignment','review_only','mapping_evidence',coalesce(p_evidence_json,'{}'::jsonb)),
      'legacy','public',true
    ) returning id into v_knowledge_id;

    insert into assistant.knowledge_citations (knowledge_document_id,reference_document_id,citation_type,locator,excerpt,metadata_json,verification_status)
    values (v_knowledge_id,v_reference_id,'kb08b_mapping_review','KB08B mapped legacy record; reviewer must verify canonical locator.',null,jsonb_build_object('batch','KB08B','legacy_import_id',p_legacy_import_id,'citation_policy','linked_not_verified'),'linked');

    insert into assistant.knowledge_review_tasks (target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json)
    values
      ('reference_document',v_reference_id,'source_verification','normal','open','kb08b:source:'||v_reference_id::text,'Verify issuer and retained canonical source before publication.',jsonb_build_object('batch','KB08B','legacy_import_id',p_legacy_import_id)),
      ('knowledge_document',v_knowledge_id,'citation_verification','normal','open','kb08b:citation:'||v_knowledge_id::text,'Verify citation locator/excerpt before publication.',jsonb_build_object('batch','KB08B','legacy_import_id',p_legacy_import_id))
    on conflict (dedupe_key) do nothing;

    update assistant.legacy_import_register
    set migration_status='promoted', target_table='assistant.reference_documents',
        notes=concat_ws(' | ', nullif(notes,''), 'KB08B promoted into review-only canonical reference/knowledge/citation workflow; not approved and not chat-visible.')
    where id=p_legacy_import_id;
    v_resolution_status := 'applied';

  elsif p_resolution_action = 'defer' then
    v_resolution_status := 'deferred';
    update assistant.legacy_import_register set notes=concat_ws(' | ', nullif(notes,''), 'KB08B deferred by human reviewer; retained in needs_mapping.') where id=p_legacy_import_id;

  else
    v_resolution_status := 'quarantined';
    update assistant.legacy_import_register set notes=concat_ws(' | ', nullif(notes,''), 'KB08B quarantine decision: retained in staging and excluded from promotion.') where id=p_legacy_import_id;
  end if;

  insert into assistant.legacy_mapping_resolutions (
    legacy_import_id,resolution_action,resolution_status,target_reference_document_id,target_knowledge_document_id,source_id,reviewer_auth_user_id,notes,evidence_json
  ) values (
    p_legacy_import_id,p_resolution_action,v_resolution_status,v_reference_id,v_knowledge_id,coalesce(v_source_id,p_source_id),p_reviewer_auth_user_id,p_notes,coalesce(p_evidence_json,'{}'::jsonb)
  );

  return jsonb_build_object('legacy_import_id',p_legacy_import_id,'resolution_action',p_resolution_action,'resolution_status',v_resolution_status,'reference_document_id',v_reference_id,'knowledge_document_id',v_knowledge_id,'chat_eligible',false,'approval','not_automatic');
end;
$$;

revoke all on assistant.legacy_mapping_resolutions from public, anon, authenticated;
revoke all on function assistant.rpc_kb08b_mapping_queue_v1(integer,integer) from public, anon, authenticated;
revoke all on function assistant.rpc_kb08b_resolve_mapping_v1(uuid,uuid,text,uuid,uuid,uuid,text,text,text,jsonb) from public, anon, authenticated;
grant select on assistant.legacy_mapping_resolutions to service_role;
grant execute on function assistant.rpc_kb08b_mapping_queue_v1(integer,integer) to service_role;
grant execute on function assistant.rpc_kb08b_resolve_mapping_v1(uuid,uuid,text,uuid,uuid,uuid,text,text,text,jsonb) to service_role;

commit;
