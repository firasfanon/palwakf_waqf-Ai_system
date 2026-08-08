-- Mega Batch Assistant Knowledge Sovereign Audit, Approval and Productivity Activation V1
-- LIVE DIRECT OPERATOR APPLY. Run only after the read-only preflight and task-reuse reconciliation.
-- It never marks a source, citation, or document verified/approved automatically.
begin;

create table if not exists assistant.knowledge_activation_runs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null,
  run_scope text not null default 'full_corpus',
  status text not null default 'completed',
  run_note text null,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  constraint assistant_knowledge_activation_runs_scope_chk check (run_scope='full_corpus'),
  constraint assistant_knowledge_activation_runs_status_chk check (status in ('running','completed','failed'))
);

create table if not exists assistant.knowledge_activation_items (
  id uuid primary key default gen_random_uuid(),
  activation_run_id uuid not null references assistant.knowledge_activation_runs(id) on delete cascade,
  knowledge_document_id uuid not null references assistant.knowledge_documents(id) on delete restrict,
  reference_document_id uuid null references assistant.reference_documents(id) on delete set null,
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  lifecycle_bucket text not null,
  blocker_codes jsonb not null default '[]'::jsonb,
  recommended_action text not null,
  title_snapshot text not null,
  reference_title_snapshot text null,
  source_name_snapshot text null,
  authority_level_snapshot text null,
  source_verified boolean not null default false,
  citation_verified boolean not null default false,
  created_at timestamptz not null default now(),
  constraint assistant_knowledge_activation_items_bucket_chk check (lifecycle_bucket in (
    'chat_eligible','release_ready','source_verification_required','citation_verification_required',
    'mapping_required','authority_alignment_required','containment_required'
  )),
  constraint assistant_knowledge_activation_items_run_document_uk unique (activation_run_id, knowledge_document_id)
);

create index if not exists idx_assistant_knowledge_activation_runs_created on assistant.knowledge_activation_runs(created_at desc);
create index if not exists idx_assistant_knowledge_activation_items_bucket on assistant.knowledge_activation_items(activation_run_id,lifecycle_bucket,created_at desc);
create index if not exists idx_assistant_knowledge_activation_items_document on assistant.knowledge_activation_items(knowledge_document_id,created_at desc);

alter table assistant.knowledge_activation_runs enable row level security;
alter table assistant.knowledge_activation_items enable row level security;

create or replace function assistant.rpc_refresh_knowledge_activation_audit_v1(
  p_reviewer_auth_user_id uuid,
  p_run_note text default null
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare
  v_run_id uuid;
  v_summary jsonb;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'review');

  insert into assistant.knowledge_activation_runs(requested_by, run_scope, status, run_note)
  values (p_reviewer_auth_user_id, 'full_corpus', 'running', nullif(trim(coalesce(p_run_note,'')),''))
  returning id into v_run_id;

  with evaluated as (
    select
      kd.id as knowledge_document_id,
      kd.reference_document_id,
      coalesce(kd.source_id, rd.source_id) as source_id,
      kd.title,
      rd.title as reference_title,
      ks.name as source_name,
      coalesce(kd.authority_level,'unverified') as authority_level,
      coalesce(ks.verification_status,'pending')='verified' and coalesce(rd.verification_status,'pending')='verified' as source_verified,
      exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id=kd.id and kc.verification_status='verified') as citation_verified,
      case
        when kd.reference_document_id is null or coalesce(kd.source_id,rd.source_id) is null or rd.id is null or ks.id is null then 'mapping_required'
        when coalesce(kd.content_status,'production') in ('test','duplicate','quarantined') then 'containment_required'
        when coalesce(ks.verification_status,'pending') <> 'verified' or coalesce(rd.verification_status,'pending') <> 'verified' then 'source_verification_required'
        when not exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id=kd.id and kc.verification_status='verified') then 'citation_verification_required'
        when coalesce(kd.authority_level,'unverified') <> 'official' or coalesce(rd.authority_level,'unverified') <> 'official' or coalesce(ks.authority_level,'unverified') <> 'official' then 'authority_alignment_required'
        when kd.status='approved' and coalesce(kd.is_chat_eligible,false) then 'chat_eligible'
        else 'release_ready'
      end as lifecycle_bucket,
      case
        when kd.reference_document_id is null or coalesce(kd.source_id,rd.source_id) is null or rd.id is null or ks.id is null then jsonb_build_array('reference_or_source_link_missing')
        when coalesce(kd.content_status,'production') in ('test','duplicate','quarantined') then jsonb_build_array('containment_state')
        when coalesce(ks.verification_status,'pending') <> 'verified' or coalesce(rd.verification_status,'pending') <> 'verified' then jsonb_build_array('source_not_verified')
        when not exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id=kd.id and kc.verification_status='verified') then jsonb_build_array('citation_not_verified')
        when coalesce(kd.authority_level,'unverified') <> 'official' or coalesce(rd.authority_level,'unverified') <> 'official' or coalesce(ks.authority_level,'unverified') <> 'official' then jsonb_build_array('official_authority_required')
        when kd.status='approved' and coalesce(kd.is_chat_eligible,false) then '[]'::jsonb
        else jsonb_build_array('human_release_decision_required')
      end as blocker_codes,
      case
        when kd.reference_document_id is null or coalesce(kd.source_id,rd.source_id) is null or rd.id is null or ks.id is null then 'resolve_mapping'
        when coalesce(kd.content_status,'production') in ('test','duplicate','quarantined') then 'contain_or_quarantine'
        when coalesce(ks.verification_status,'pending') <> 'verified' or coalesce(rd.verification_status,'pending') <> 'verified' then 'verify_official_source'
        when not exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id=kd.id and kc.verification_status='verified') then 'verify_citation'
        when coalesce(kd.authority_level,'unverified') <> 'official' or coalesce(rd.authority_level,'unverified') <> 'official' or coalesce(ks.authority_level,'unverified') <> 'official' then 'align_authority_or_keep_internal'
        when kd.status='approved' and coalesce(kd.is_chat_eligible,false) then 'monitor'
        else 'human_publish_decision'
      end as recommended_action
    from assistant.knowledge_documents kd
    left join assistant.reference_documents rd on rd.id=kd.reference_document_id
    left join assistant.knowledge_sources ks on ks.id=coalesce(kd.source_id,rd.source_id)
  )
  insert into assistant.knowledge_activation_items(
    activation_run_id,knowledge_document_id,reference_document_id,source_id,lifecycle_bucket,blocker_codes,recommended_action,
    title_snapshot,reference_title_snapshot,source_name_snapshot,authority_level_snapshot,source_verified,citation_verified
  )
  select v_run_id,knowledge_document_id,reference_document_id,source_id,lifecycle_bucket,blocker_codes,recommended_action,
    coalesce(title,'(untitled)'),reference_title,source_name,authority_level,source_verified,citation_verified
  from evaluated;

  -- Create review work only where a valid target exists. Mapping gaps remain visible in the ledger,
  -- because no automatic relationship is permitted.
  -- Task-reuse invariant: an existing active task with the same target type, target id and workflow
  -- stage is reused operationally; this function does not create a second activation-namespaced task.
  insert into assistant.knowledge_review_tasks(target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json)
  select 'reference_document', ai.reference_document_id, 'source_verification',
    case when ai.authority_level_snapshot='official' then 'high' else 'normal' end,
    'open','activation:source:'||ai.reference_document_id::text,
    'Full-corpus activation: verify issuer, canonical retained URL/file and authority tier.',
    jsonb_build_object('batch','KNOWLEDGE_ACTIVATION_V1','activation_run_id',v_run_id)
  from assistant.knowledge_activation_items ai
  where ai.activation_run_id=v_run_id
    and ai.lifecycle_bucket='source_verification_required'
    and ai.reference_document_id is not null
    and not exists (
      select 1
      from assistant.knowledge_review_tasks existing
      where existing.target_type='reference_document'
        and existing.target_id=ai.reference_document_id
        and existing.workflow_stage='source_verification'
        and existing.status in ('open','assigned','in_progress','blocked')
    )
  on conflict (dedupe_key) do nothing;

  insert into assistant.knowledge_review_tasks(target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json)
  select 'knowledge_document', ai.knowledge_document_id, 'citation_verification','high','open',
    'activation:citation:'||ai.knowledge_document_id::text,
    'Full-corpus activation: verify at least one precise locator and excerpt against the retained canonical reference.',
    jsonb_build_object('batch','KNOWLEDGE_ACTIVATION_V1','activation_run_id',v_run_id)
  from assistant.knowledge_activation_items ai
  where ai.activation_run_id=v_run_id
    and ai.lifecycle_bucket='citation_verification_required'
    and not exists (
      select 1
      from assistant.knowledge_review_tasks existing
      where existing.target_type='knowledge_document'
        and existing.target_id=ai.knowledge_document_id
        and existing.workflow_stage='citation_verification'
        and existing.status in ('open','assigned','in_progress','blocked')
    )
  on conflict (dedupe_key) do nothing;

  insert into assistant.knowledge_review_tasks(target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json)
  select 'knowledge_document', ai.knowledge_document_id, 'content_classification','high','open',
    'activation:containment:'||ai.knowledge_document_id::text,
    'Full-corpus activation: confirm test, duplicate, quarantine, or retention decision before any further processing.',
    jsonb_build_object('batch','KNOWLEDGE_ACTIVATION_V1','activation_run_id',v_run_id)
  from assistant.knowledge_activation_items ai
  where ai.activation_run_id=v_run_id
    and ai.lifecycle_bucket='containment_required'
    and not exists (
      select 1
      from assistant.knowledge_review_tasks existing
      where existing.target_type='knowledge_document'
        and existing.target_id=ai.knowledge_document_id
        and existing.workflow_stage='content_classification'
        and existing.status in ('open','assigned','in_progress','blocked')
    )
  on conflict (dedupe_key) do nothing;

  insert into assistant.knowledge_review_tasks(target_type,target_id,workflow_stage,priority,status,dedupe_key,notes,metadata_json)
  select 'knowledge_document', ai.knowledge_document_id, 'human_approval','high','open',
    'activation:approval:'||ai.knowledge_document_id::text,
    'Full-corpus activation: source and citation gates are complete; publish reviewer must make an explicit release decision.',
    jsonb_build_object('batch','KNOWLEDGE_ACTIVATION_V1','activation_run_id',v_run_id)
  from assistant.knowledge_activation_items ai
  where ai.activation_run_id=v_run_id
    and ai.lifecycle_bucket='release_ready'
    and not exists (
      select 1
      from assistant.knowledge_review_tasks existing
      where existing.target_type='knowledge_document'
        and existing.target_id=ai.knowledge_document_id
        and existing.workflow_stage='human_approval'
        and existing.status in ('open','assigned','in_progress','blocked')
    )
  on conflict (dedupe_key) do nothing;

  -- Reconcile approval tasks after a prior explicit release.
  update assistant.knowledge_review_tasks t
  set status='completed', completed_at=now(), completed_by=p_reviewer_auth_user_id,
      notes=concat_ws(E'\n', nullif(t.notes,''), 'Activation reconciliation: document is now approved and chat eligible.'), updated_at=now()
  from assistant.knowledge_documents kd
  where t.workflow_stage='human_approval' and t.status in ('open','assigned','in_progress','blocked')
    and t.dedupe_key like 'activation:approval:%'
    and t.target_id=kd.id and kd.status='approved' and coalesce(kd.is_chat_eligible,false);

  select jsonb_build_object(
    'total_documents',count(*),
    'chat_eligible',count(*) filter (where lifecycle_bucket='chat_eligible'),
    'release_ready',count(*) filter (where lifecycle_bucket='release_ready'),
    'source_verification_required',count(*) filter (where lifecycle_bucket='source_verification_required'),
    'citation_verification_required',count(*) filter (where lifecycle_bucket='citation_verification_required'),
    'mapping_required',count(*) filter (where lifecycle_bucket='mapping_required'),
    'authority_alignment_required',count(*) filter (where lifecycle_bucket='authority_alignment_required'),
    'containment_required',count(*) filter (where lifecycle_bucket='containment_required'),
    'review_required',count(*) filter (where lifecycle_bucket <> 'chat_eligible')
  ) into v_summary
  from assistant.knowledge_activation_items where activation_run_id=v_run_id;

  update assistant.knowledge_activation_runs set status='completed',summary_json=v_summary,completed_at=now() where id=v_run_id;
  insert into assistant.knowledge_access_events(auth_user_id,action,result,scope_code,reason_code,metadata_json)
  values(p_reviewer_auth_user_id,'review','allowed','assistant.review','full_corpus_activation_audit',jsonb_build_object('activation_run_id',v_run_id,'summary',v_summary));
  return jsonb_build_object('activation_run_id',v_run_id,'summary',v_summary,'mode','full_corpus_sovereign_audit_v1');
exception when others then
  if v_run_id is not null then update assistant.knowledge_activation_runs set status='failed',completed_at=now(),summary_json=jsonb_build_object('error',sqlerrm) where id=v_run_id; end if;
  raise;
end;
$$;

create or replace function assistant.rpc_get_knowledge_activation_snapshot_v1()
returns jsonb language sql stable security invoker set search_path=assistant,public as $$
  with latest as (
    select id,summary_json,created_at,completed_at from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1
  )
  select coalesce((select jsonb_build_object('latestRunId',id,'createdAt',created_at,'completedAt',completed_at,'summary',summary_json) from latest),
    jsonb_build_object('latestRunId',null,'summary',jsonb_build_object('total_documents',0,'review_required',0)));
$$;

create or replace function assistant.rpc_list_knowledge_activation_items_v1(
  p_run_id uuid default null,
  p_bucket text default null,
  p_limit integer default 100
) returns table(
  id uuid, knowledge_document_id uuid, reference_document_id uuid, source_id uuid, lifecycle_bucket text, blocker_codes jsonb,
  recommended_action text, title text, reference_title text, source_name text, authority_level text, source_verified boolean, citation_verified boolean
) language sql stable security invoker set search_path=assistant,public as $$
  with latest as (select id from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1)
  select ai.id,ai.knowledge_document_id,ai.reference_document_id,ai.source_id,ai.lifecycle_bucket,ai.blocker_codes,ai.recommended_action,
    ai.title_snapshot,ai.reference_title_snapshot,ai.source_name_snapshot,ai.authority_level_snapshot,ai.source_verified,ai.citation_verified
  from assistant.knowledge_activation_items ai
  where ai.activation_run_id=coalesce(p_run_id,(select id from latest)) and (p_bucket is null or ai.lifecycle_bucket=p_bucket)
  order by case ai.lifecycle_bucket when 'release_ready' then 1 when 'source_verification_required' then 2 when 'citation_verification_required' then 3 else 4 end, ai.title_snapshot
  limit greatest(1,least(coalesce(p_limit,100),500));
$$;

create or replace view assistant.v_knowledge_productivity_release_candidates_v1 as
select ai.*
from assistant.knowledge_activation_items ai
join assistant.knowledge_activation_runs ar on ar.id=ai.activation_run_id and ar.status='completed'
where ai.lifecycle_bucket='release_ready';

revoke all on function assistant.rpc_refresh_knowledge_activation_audit_v1(uuid,text) from public,anon,authenticated;
revoke all on function assistant.rpc_get_knowledge_activation_snapshot_v1() from public,anon,authenticated;
revoke all on function assistant.rpc_list_knowledge_activation_items_v1(uuid,text,integer) from public,anon,authenticated;
revoke all on assistant.v_knowledge_productivity_release_candidates_v1 from public,anon,authenticated;
grant execute on function assistant.rpc_refresh_knowledge_activation_audit_v1(uuid,text) to service_role;
grant execute on function assistant.rpc_get_knowledge_activation_snapshot_v1() to service_role;
grant execute on function assistant.rpc_list_knowledge_activation_items_v1(uuid,text,integer) to service_role;
grant select on assistant.v_knowledge_productivity_release_candidates_v1 to service_role;

commit;
