-- Smart Tools 3 — KB58/KB08 duplicate content_classification consolidation
-- OPERATOR APPLY. Controlled task-state reconciliation only.
-- Does NOT delete tasks, modify knowledge/reference documents, change citations, or publish to chat.
-- REQUIRED: replace the placeholder UUID with the authenticated reviewer/admin user id authorized for assistant.review.

begin;

do $$
declare
  v_operator_auth_user_id uuid := '00000000-0000-0000-0000-000000000000'; -- REPLACE BEFORE EXECUTION
  v_expected_pair_count integer := 6;
  v_pair_count integer;
  v_updated_count integer;
begin
  if v_operator_auth_user_id = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'replace v_operator_auth_user_id with the authenticated reviewer/admin UUID before execution';
  end if;

  if not exists (
    select 1
    from assistant.knowledge_scope_assignments ksa
    where ksa.auth_user_id = v_operator_auth_user_id
      and ksa.is_active = true
      and (ksa.expires_at is null or ksa.expires_at >= now())
      and (
        ksa.scope_code in ('assistant.all', 'assistant.admin')
        or (ksa.scope_code = 'assistant.review' and ksa.access_level in ('review','publish','admin'))
      )
  ) then
    raise exception 'operator does not hold active assistant.review/admin scope';
  end if;

  with exact_pairs as (
    select
      legacy.id as legacy_task_id,
      current.id as canonical_task_id,
      legacy.target_id
    from assistant.knowledge_review_tasks legacy
    join assistant.knowledge_review_tasks current
      on current.target_type = legacy.target_type
     and current.target_id = legacy.target_id
     and current.workflow_stage = legacy.workflow_stage
    where legacy.workflow_stage = 'content_classification'
      and legacy.target_type = 'knowledge_document'
      and legacy.dedupe_key = 'kb58:quarantine:' || legacy.target_id::text
      and current.dedupe_key = 'kb08v62:classification:' || current.target_id::text
      and legacy.status = 'open'
      and current.status = 'open'
      and legacy.assigned_to is null
      and current.assigned_to is null
  )
  select count(*) into v_pair_count from exact_pairs;

  if v_pair_count <> v_expected_pair_count then
    raise exception 'expected exactly % open/unassigned KB58→KB08 pairs; found %. Stop and re-run 00A v2 for evidence.', v_expected_pair_count, v_pair_count;
  end if;

  with exact_pairs as (
    select
      legacy.id as legacy_task_id,
      current.id as canonical_task_id,
      legacy.target_id
    from assistant.knowledge_review_tasks legacy
    join assistant.knowledge_review_tasks current
      on current.target_type = legacy.target_type
     and current.target_id = legacy.target_id
     and current.workflow_stage = legacy.workflow_stage
    where legacy.workflow_stage = 'content_classification'
      and legacy.target_type = 'knowledge_document'
      and legacy.dedupe_key = 'kb58:quarantine:' || legacy.target_id::text
      and current.dedupe_key = 'kb08v62:classification:' || current.target_id::text
      and legacy.status = 'open'
      and current.status = 'open'
      and legacy.assigned_to is null
      and current.assigned_to is null
  ), updated as (
    update assistant.knowledge_review_tasks legacy
    set
      status = 'cancelled',
      completed_at = now(),
      completed_by = v_operator_auth_user_id,
      updated_at = now(),
      notes = concat_ws(E'\n', nullif(legacy.notes, ''), 'Reconciliation: cancelled as superseded duplicate; canonical KB08 task retained.'),
      metadata_json = coalesce(legacy.metadata_json, '{}'::jsonb) || jsonb_build_object(
        'reconciliation_decision', 'cancel_as_superseded_duplicate',
        'reconciliation_reason', 'same knowledge_document had a newer KB08 content_classification task with equivalent human decision scope',
        'superseded_by_task_id', p.canonical_task_id,
        'reconciled_by', v_operator_auth_user_id,
        'reconciled_at', now(),
        'reconciliation_batch', 'SMART_TOOLS_3_RECONCILIATION_GATE_CORRECTION_V1'
      )
    from exact_pairs p
    where legacy.id = p.legacy_task_id
    returning legacy.id
  )
  select count(*) into v_updated_count from updated;

  if v_updated_count <> v_expected_pair_count then
    raise exception 'expected to cancel % legacy duplicate tasks; updated %. Transaction will roll back.', v_expected_pair_count, v_updated_count;
  end if;
end;
$$;

commit;
