-- Sovereign Batch 02A — Controlled Human Review Execution
-- OPERATOR APPLY. This is a narrow reviewer-workflow hardening migration.
-- It does NOT release knowledge, make content chat eligible, execute KB08B mapping,
-- change page bindings, create public data, or grant browser access.
-- Scope: require explicit task claim before source/citation verification and add
-- containment-only resolution for existing content_classification tasks.

begin;

create or replace function assistant.assert_knowledge_review_task_claim_v1(
  p_target_type text,
  p_target_id uuid,
  p_workflow_stage text,
  p_reviewer_auth_user_id uuid
) returns uuid
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare v_task assistant.knowledge_review_tasks%rowtype;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');

  select * into v_task
  from assistant.knowledge_review_tasks
  where target_type = p_target_type
    and target_id = p_target_id
    and workflow_stage = p_workflow_stage
    and status not in ('completed', 'cancelled')
  order by created_at asc
  limit 1
  for update;

  if not found then
    raise exception 'open review task not found for %/%/%', p_target_type, p_target_id, p_workflow_stage;
  end if;

  if v_task.assigned_to is distinct from p_reviewer_auth_user_id
     or v_task.status not in ('assigned', 'in_progress') then
    raise exception 'review task must be explicitly claimed by the current reviewer before verification';
  end if;

  return v_task.id;
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
  v_task_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');
  if nullif(trim(p_canonical_source_url), '') is null or nullif(trim(p_issuer_name), '') is null then
    raise exception 'canonical official URL and issuer name are required';
  end if;

  v_task_id := assistant.assert_knowledge_review_task_claim_v1(
    'reference_document', p_reference_document_id, 'source_verification', p_reviewer_auth_user_id
  );

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
      'Official source registered through Controlled Human Review Execution.',
      'official', true, 'verified', false,
      jsonb_build_object(
        'verified_by', p_reviewer_auth_user_id,
        'verified_at', now(),
        'verification_evidence', coalesce(p_evidence_json, '{}'::jsonb),
        'release_policy', 'official_only',
        'review_task_id', v_task_id,
        'workflow_version', 'controlled_human_review_execution_v1'
      )
    ) returning id into v_source_id;
  end if;

  update assistant.reference_documents
  set source_id = v_source_id,
      status = 'in_review',
      authority_level = 'official',
      verification_status = 'verified',
      review_notes = concat_ws(E'\n', nullif(review_notes, ''), 'Controlled Human Review: official source verified after explicit task claim.'),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'source_verification_status', 'verified',
        'official_issuer_name', trim(p_issuer_name),
        'canonical_source_url', trim(p_canonical_source_url),
        'source_verified_by', p_reviewer_auth_user_id,
        'source_verified_at', now(),
        'source_verification_evidence', coalesce(p_evidence_json, '{}'::jsonb),
        'review_task_id', v_task_id,
        'workflow_version', 'controlled_human_review_execution_v1'
      )
  where id = p_reference_document_id;

  update assistant.knowledge_documents
  set source_id = v_source_id,
      authority_level = 'official',
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'source_verification_status', 'verified',
        'official_only_release_policy', true,
        'review_task_id', v_task_id
      )
  where reference_document_id = p_reference_document_id;

  update assistant.knowledge_review_tasks
  set status = 'completed', completed_at = now(), completed_by = p_reviewer_auth_user_id,
      updated_at = now(),
      notes = concat_ws(E'\n', nullif(notes, ''), 'Official source verified after explicit reviewer claim.'),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'completed_by', p_reviewer_auth_user_id,
        'completed_at', now(),
        'official_source_verified', true,
        'claimed_task_required', true
      )
  where id = v_task_id;

  insert into assistant.knowledge_access_events (
    auth_user_id, knowledge_document_id, action, result, scope_code, reason_code, metadata_json
  )
  select
    p_reviewer_auth_user_id, kd.id, 'review', 'allowed', 'assistant.review',
    'official_source_verified_after_claim',
    jsonb_build_object('review_task_id', v_task_id, 'reference_document_id', p_reference_document_id)
  from assistant.knowledge_documents kd
  where kd.reference_document_id = p_reference_document_id
  limit 1;

  return jsonb_build_object(
    'reference_document_id', p_reference_document_id,
    'review_task_id', v_task_id,
    'official_source_id', v_source_id,
    'verification_status', 'verified',
    'publication', 'not_released_until_verified_citation_and_publish_review'
  );
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
declare
  v_citation_id uuid;
  v_task_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');
  if nullif(trim(p_locator), '') is null then raise exception 'verified locator is required'; end if;

  v_task_id := assistant.assert_knowledge_review_task_claim_v1(
    'knowledge_document', p_knowledge_document_id, 'citation_verification', p_reviewer_auth_user_id
  );

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
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'citation_verification_status', 'verified',
        'verified_by', p_reviewer_auth_user_id,
        'verified_at', now(),
        'verification_evidence', coalesce(p_evidence_json, '{}'::jsonb),
        'review_task_id', v_task_id,
        'workflow_version', 'controlled_human_review_execution_v1'
      )
  where id = v_citation_id;

  update assistant.knowledge_review_tasks
  set status = 'completed', completed_at = now(), completed_by = p_reviewer_auth_user_id,
      updated_at = now(),
      notes = concat_ws(E'\n', nullif(notes, ''), 'Citation locator verified after explicit reviewer claim.'),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'completed_by', p_reviewer_auth_user_id,
        'completed_at', now(),
        'citation_verified', true,
        'citation_id', v_citation_id,
        'claimed_task_required', true
      )
  where id = v_task_id;

  insert into assistant.knowledge_access_events (
    auth_user_id, knowledge_document_id, action, result, scope_code, reason_code, metadata_json
  ) values (
    p_reviewer_auth_user_id, p_knowledge_document_id, 'review', 'allowed', 'assistant.review',
    'citation_verified_after_claim',
    jsonb_build_object('review_task_id', v_task_id, 'citation_id', v_citation_id)
  );

  return jsonb_build_object(
    'knowledge_document_id', p_knowledge_document_id,
    'review_task_id', v_task_id,
    'citation_id', v_citation_id,
    'verification_status', 'verified',
    'publication', 'not_released_until_publish_review'
  );
end;
$$;

create or replace function assistant.rpc_resolve_content_classification_containment_v1(
  p_task_id uuid,
  p_reviewer_auth_user_id uuid,
  p_decision text,
  p_evidence_note text,
  p_evidence_json jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare
  v_task assistant.knowledge_review_tasks%rowtype;
  v_document assistant.knowledge_documents%rowtype;
  v_expected_status text;
  v_result_status text;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');
  if nullif(trim(p_evidence_note), '') is null or length(trim(p_evidence_note)) < 20 then
    raise exception 'evidence note with at least 20 characters is required';
  end if;
  if p_decision not in ('confirm_test', 'confirm_duplicate', 'confirm_quarantine', 'defer') then
    raise exception 'unsupported containment decision';
  end if;

  select * into v_task from assistant.knowledge_review_tasks where id = p_task_id for update;
  if not found then raise exception 'review task not found'; end if;
  if v_task.workflow_stage <> 'content_classification' or v_task.target_type <> 'knowledge_document' then
    raise exception 'task is not a content_classification knowledge_document task';
  end if;
  if v_task.status in ('completed', 'cancelled') then raise exception 'review task is already closed'; end if;
  if v_task.assigned_to is distinct from p_reviewer_auth_user_id or v_task.status not in ('assigned', 'in_progress') then
    raise exception 'content classification task must be explicitly claimed by the current reviewer';
  end if;

  select * into v_document from assistant.knowledge_documents where id = v_task.target_id for update;
  if not found then raise exception 'knowledge document not found'; end if;

  if p_decision = 'defer' then
    update assistant.knowledge_review_tasks
    set status = 'blocked', updated_at = now(),
        notes = concat_ws(E'\n', nullif(notes, ''), 'Controlled Human Review deferred: ' || trim(p_evidence_note)),
        metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
          'classification_decision', 'defer', 'deferred_by', p_reviewer_auth_user_id,
          'deferred_at', now(), 'evidence_note', trim(p_evidence_note),
          'evidence_json', coalesce(p_evidence_json, '{}'::jsonb),
          'workflow_version', 'controlled_human_review_execution_v1'
        )
    where id = p_task_id;
    v_result_status := 'blocked';
  else
    v_expected_status := case p_decision
      when 'confirm_test' then 'test'
      when 'confirm_duplicate' then 'duplicate'
      when 'confirm_quarantine' then 'quarantined'
    end;

    if v_document.content_status is distinct from v_expected_status then
      raise exception 'containment decision % is incompatible with current content status %', p_decision, v_document.content_status;
    end if;

    update assistant.knowledge_documents
    set is_chat_eligible = false,
        requires_human_review = true,
        metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
          'content_classification_human_decision', p_decision,
          'content_classification_reviewed_by', p_reviewer_auth_user_id,
          'content_classification_reviewed_at', now(),
          'content_classification_evidence_note', trim(p_evidence_note),
          'content_classification_evidence_json', coalesce(p_evidence_json, '{}'::jsonb),
          'containment_preserved', true,
          'workflow_version', 'controlled_human_review_execution_v1'
        )
    where id = v_document.id;

    update assistant.knowledge_review_tasks
    set status = 'completed', completed_at = now(), completed_by = p_reviewer_auth_user_id,
        updated_at = now(),
        notes = concat_ws(E'\n', nullif(notes, ''), 'Controlled Human Review containment confirmed: ' || p_decision || '. ' || trim(p_evidence_note)),
        metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
          'classification_decision', p_decision,
          'completed_by', p_reviewer_auth_user_id,
          'completed_at', now(), 'evidence_note', trim(p_evidence_note),
          'evidence_json', coalesce(p_evidence_json, '{}'::jsonb),
          'containment_preserved', true,
          'workflow_version', 'controlled_human_review_execution_v1'
        )
    where id = p_task_id;
    v_result_status := 'completed';
  end if;

  insert into assistant.knowledge_access_events (
    auth_user_id, knowledge_document_id, action, result, scope_code, reason_code, metadata_json
  ) values (
    p_reviewer_auth_user_id, v_task.target_id, 'review', 'allowed', 'assistant.review',
    case when p_decision = 'defer' then 'classification_deferred' else 'classification_containment_confirmed' end,
    jsonb_build_object('review_task_id', p_task_id, 'decision', p_decision, 'workflow_version', 'controlled_human_review_execution_v1')
  );

  return jsonb_build_object(
    'task_id', p_task_id,
    'knowledge_document_id', v_task.target_id,
    'decision', p_decision,
    'task_status', v_result_status,
    'is_chat_eligible', false,
    'publication', 'not_released'
  );
end;
$$;

revoke all on function assistant.assert_knowledge_review_task_claim_v1(text,uuid,text,uuid) from public, anon, authenticated;
revoke all on function assistant.rpc_resolve_content_classification_containment_v1(uuid,uuid,text,text,jsonb) from public, anon, authenticated;
revoke all on function assistant.rpc_verify_official_reference_source_v1(uuid,uuid,text,text,jsonb) from public, anon, authenticated;
revoke all on function assistant.rpc_verify_knowledge_citation_v1(uuid,uuid,uuid,text,text,jsonb) from public, anon, authenticated;

grant execute on function assistant.rpc_resolve_content_classification_containment_v1(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function assistant.rpc_verify_official_reference_source_v1(uuid,uuid,text,text,jsonb) to service_role;
grant execute on function assistant.rpc_verify_knowledge_citation_v1(uuid,uuid,uuid,text,text,jsonb) to service_role;

commit;
