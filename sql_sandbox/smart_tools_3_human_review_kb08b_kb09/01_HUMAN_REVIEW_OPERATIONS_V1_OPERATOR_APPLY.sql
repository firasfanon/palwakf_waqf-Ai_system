-- Smart Tools 3 / Human Review Operations v1
-- OPERATOR APPLY. No bulk approval, no bulk chat publication, no deletion.
-- Release is deliberately limited to human-verified OFFICIAL sources only.

begin;

create or replace function assistant.assert_knowledge_reviewer_scope_v1(
  p_auth_user_id uuid,
  p_required_scope text
) returns void
language plpgsql
security invoker
set search_path = assistant, public
as $$
begin
  if p_auth_user_id is null then
    raise exception 'reviewer auth user id is required';
  end if;

  if not exists (
    select 1
    from assistant.knowledge_scope_assignments ksa
    where ksa.auth_user_id = p_auth_user_id
      and ksa.is_active = true
      and (ksa.expires_at is null or ksa.expires_at >= now())
      and (
        ksa.scope_code in ('assistant.all', 'assistant.admin')
        or (p_required_scope = 'review' and ksa.scope_code = 'assistant.review' and ksa.access_level in ('review','publish','admin'))
        or (p_required_scope = 'publish' and ksa.scope_code = 'assistant.publish' and ksa.access_level in ('publish','admin'))
      )
  ) then
    raise exception 'reviewer scope denied for %', p_required_scope;
  end if;
end;
$$;

create or replace function assistant.rpc_claim_knowledge_review_task_v1(
  p_task_id uuid,
  p_reviewer_auth_user_id uuid
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare v_task assistant.knowledge_review_tasks%rowtype;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');

  select * into v_task
  from assistant.knowledge_review_tasks
  where id = p_task_id
  for update;

  if not found then raise exception 'review task not found'; end if;
  if v_task.status in ('completed','cancelled') then raise exception 'review task is already closed'; end if;
  if v_task.assigned_to is not null and v_task.assigned_to <> p_reviewer_auth_user_id then
    raise exception 'review task is assigned to another reviewer';
  end if;

  update assistant.knowledge_review_tasks
  set assigned_to = p_reviewer_auth_user_id,
      assigned_by = coalesce(assigned_by, p_reviewer_auth_user_id),
      status = case when status = 'open' then 'in_progress' else status end,
      updated_at = now(),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object('claimed_at', now(), 'claimed_by', p_reviewer_auth_user_id)
  where id = p_task_id
  returning * into v_task;

  return jsonb_build_object('task_id', v_task.id, 'status', v_task.status, 'assigned_to', v_task.assigned_to, 'mode', 'human_review_operations_v1');
end;
$$;

create or replace function assistant.rpc_verify_official_reference_source_v1(
  p_reference_document_id uuid,
  p_reviewer_auth_user_id uuid,
  p_canonical_source_url text,
  p_issuer_name text,
  p_evidence_json jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare
  v_reference assistant.reference_documents%rowtype;
  v_source_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');
  if nullif(trim(p_canonical_source_url), '') is null or nullif(trim(p_issuer_name), '') is null then
    raise exception 'canonical official URL and issuer name are required';
  end if;

  select * into v_reference from assistant.reference_documents where id = p_reference_document_id for update;
  if not found then raise exception 'reference document not found'; end if;
  if v_reference.content_status in ('test','duplicate','quarantined') then raise exception 'blocked content cannot be verified for release'; end if;

  select id into v_source_id
  from assistant.knowledge_sources
  where base_url = trim(p_canonical_source_url)
    and authority_level = 'official'
    and verification_status = 'verified'
  order by created_at asc
  limit 1;

  if v_source_id is null then
    insert into assistant.knowledge_sources (
      name, type, base_url, description, authority_level, is_active, verification_status, review_required, metadata_json
    ) values (
      trim(p_issuer_name), 'external_fetch', trim(p_canonical_source_url),
      'Official source registered through Human Review Operations v1.',
      'official', true, 'verified', false,
      jsonb_build_object('verified_by', p_reviewer_auth_user_id, 'verified_at', now(), 'verification_evidence', coalesce(p_evidence_json, '{}'::jsonb), 'release_policy', 'official_only')
    ) returning id into v_source_id;
  end if;

  update assistant.reference_documents
  set source_id = v_source_id,
      status = 'in_review',
      authority_level = 'official',
      verification_status = 'verified',
      review_notes = concat_ws(E'\n', nullif(review_notes, ''), 'Human Review Operations v1: official source verified.'),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'source_verification_status', 'verified', 'official_issuer_name', trim(p_issuer_name), 'canonical_source_url', trim(p_canonical_source_url),
        'source_verified_by', p_reviewer_auth_user_id, 'source_verified_at', now(), 'source_verification_evidence', coalesce(p_evidence_json, '{}'::jsonb)
      )
  where id = p_reference_document_id;

  update assistant.knowledge_documents
  set source_id = v_source_id,
      authority_level = 'official',
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object('source_verification_status', 'verified', 'official_only_release_policy', true)
  where reference_document_id = p_reference_document_id;

  update assistant.knowledge_review_tasks
  set status = 'completed', completed_at = now(), completed_by = p_reviewer_auth_user_id, assigned_to = coalesce(assigned_to, p_reviewer_auth_user_id), updated_at = now(),
      notes = concat_ws(E'\n', nullif(notes, ''), 'Official source verified by reviewer.'),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object('completed_by', p_reviewer_auth_user_id, 'completed_at', now(), 'official_source_verified', true)
  where target_type = 'reference_document' and target_id = p_reference_document_id and workflow_stage = 'source_verification' and status not in ('completed','cancelled');

  return jsonb_build_object('reference_document_id', p_reference_document_id, 'official_source_id', v_source_id, 'verification_status', 'verified', 'publication', 'not_released_until_verified_citation_and_publish_review');
end;
$$;

create or replace function assistant.rpc_verify_knowledge_citation_v1(
  p_knowledge_document_id uuid,
  p_citation_id uuid default null,
  p_reviewer_auth_user_id uuid default null,
  p_locator text default null,
  p_excerpt text default null,
  p_evidence_json jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare v_citation_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');
  if nullif(trim(p_locator), '') is null then raise exception 'verified locator is required'; end if;

  select kc.id into v_citation_id
  from assistant.knowledge_citations kc
  where kc.knowledge_document_id = p_knowledge_document_id
    and (p_citation_id is null or kc.id = p_citation_id)
    and kc.verification_status in ('linked','verified')
  order by case when kc.id = p_citation_id then 0 else 1 end, kc.created_at asc
  limit 1
  for update;
  if v_citation_id is null then raise exception 'eligible linked citation not found'; end if;

  update assistant.knowledge_citations
  set verification_status = 'verified', verified_by = p_reviewer_auth_user_id, verified_at = now(),
      locator = trim(p_locator), excerpt = coalesce(nullif(trim(p_excerpt), ''), excerpt),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object('citation_verification_status', 'verified', 'verified_by', p_reviewer_auth_user_id, 'verified_at', now(), 'verification_evidence', coalesce(p_evidence_json, '{}'::jsonb))
  where id = v_citation_id;

  update assistant.knowledge_review_tasks
  set status = 'completed', completed_at = now(), completed_by = p_reviewer_auth_user_id, assigned_to = coalesce(assigned_to, p_reviewer_auth_user_id), updated_at = now(),
      notes = concat_ws(E'\n', nullif(notes, ''), 'Citation locator verified by reviewer.'),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object('completed_by', p_reviewer_auth_user_id, 'completed_at', now(), 'citation_verified', true, 'citation_id', v_citation_id)
  where target_type = 'knowledge_document' and target_id = p_knowledge_document_id and workflow_stage = 'citation_verification' and status not in ('completed','cancelled');

  return jsonb_build_object('knowledge_document_id', p_knowledge_document_id, 'citation_id', v_citation_id, 'verification_status', 'verified', 'publication', 'not_released_until_publish_review');
end;
$$;

create or replace function assistant.rpc_release_official_knowledge_document_v1(
  p_knowledge_document_id uuid,
  p_reviewer_auth_user_id uuid,
  p_release_notes text
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare v_reference_id uuid; v_source_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'publish');
  if nullif(trim(p_release_notes), '') is null then raise exception 'release notes are required'; end if;

  select kd.reference_document_id, kd.source_id into v_reference_id, v_source_id
  from assistant.knowledge_documents kd
  where kd.id = p_knowledge_document_id
  for update;
  if v_reference_id is null then raise exception 'knowledge document or canonical reference not found'; end if;

  if not exists (
    select 1 from assistant.reference_documents rd
    join assistant.knowledge_sources ks on ks.id = rd.source_id
    where rd.id = v_reference_id and rd.verification_status = 'verified' and rd.authority_level = 'official'
      and rd.content_status not in ('test','duplicate','quarantined') and ks.authority_level = 'official' and ks.verification_status = 'verified'
  ) then raise exception 'official human-verified source requirement is not met'; end if;
  if not exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id = p_knowledge_document_id and kc.verification_status = 'verified') then
    raise exception 'at least one human-verified citation is required';
  end if;
  if exists (select 1 from assistant.knowledge_documents kd where kd.id = p_knowledge_document_id and kd.content_status in ('test','duplicate','quarantined')) then
    raise exception 'blocked content cannot be released';
  end if;

  update assistant.reference_documents
  set status = 'approved', content_status = 'production', authority_level = 'official', review_decision = 'approve', reviewed_by = p_reviewer_auth_user_id, reviewed_at = now(), approval_version = coalesce(approval_version, 0) + 1,
      review_notes = concat_ws(E'\n', nullif(review_notes, ''), 'Official release: ' || trim(p_release_notes))
  where id = v_reference_id;

  update assistant.knowledge_documents
  set status = 'approved', content_status = 'production', authority_level = 'official', is_chat_eligible = true, requires_human_review = false,
      review_decision = 'approve', reviewed_by = p_reviewer_auth_user_id, reviewed_at = now(), approval_version = coalesce(approval_version, 0) + 1,
      review_notes = concat_ws(E'\n', nullif(review_notes, ''), 'Official release: ' || trim(p_release_notes)),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object('strict_public_retrieval_gate', 'released_after_official_source_and_verified_citation', 'chat_released_at', now(), 'chat_released_by', p_reviewer_auth_user_id, 'official_only_release_policy', true)
  where id = p_knowledge_document_id;

  insert into assistant.knowledge_review_tasks (target_type, target_id, workflow_stage, priority, status, completed_at, completed_by, dedupe_key, notes, metadata_json)
  values ('knowledge_document', p_knowledge_document_id, 'human_approval', 'high', 'completed', now(), p_reviewer_auth_user_id, 'human_release:' || p_knowledge_document_id::text, trim(p_release_notes), jsonb_build_object('release_policy','official_only','released_at',now(),'released_by',p_reviewer_auth_user_id))
  on conflict (dedupe_key) do update set status='completed', completed_at=excluded.completed_at, completed_by=excluded.completed_by, notes=excluded.notes, updated_at=now();

  insert into assistant.knowledge_access_events (auth_user_id, knowledge_document_id, action, result, scope_code, reason_code, metadata_json)
  values (p_reviewer_auth_user_id, p_knowledge_document_id, 'publish', 'allowed', 'assistant.publish', 'official_source_verified_citation_verified', jsonb_build_object('release_notes',trim(p_release_notes),'reference_document_id',v_reference_id));

  return jsonb_build_object('knowledge_document_id', p_knowledge_document_id, 'reference_document_id', v_reference_id, 'status', 'approved', 'is_chat_eligible', true, 'release_policy', 'official_only');
end;
$$;

revoke all on function assistant.assert_knowledge_reviewer_scope_v1(uuid,text) from public, anon, authenticated;
revoke all on function assistant.rpc_claim_knowledge_review_task_v1(uuid,uuid) from public, anon, authenticated;
revoke all on function assistant.rpc_verify_official_reference_source_v1(uuid,uuid,text,text,jsonb) from public, anon, authenticated;
revoke all on function assistant.rpc_verify_knowledge_citation_v1(uuid,uuid,uuid,text,text,jsonb) from public, anon, authenticated;
revoke all on function assistant.rpc_release_official_knowledge_document_v1(uuid,uuid,text) from public, anon, authenticated;
grant execute on function assistant.rpc_claim_knowledge_review_task_v1(uuid,uuid) to service_role;
grant execute on function assistant.rpc_verify_official_reference_source_v1(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function assistant.rpc_verify_knowledge_citation_v1(uuid,uuid,uuid,text,text,jsonb) to service_role;
grant execute on function assistant.rpc_release_official_knowledge_document_v1(uuid,uuid,text) to service_role;

commit;
