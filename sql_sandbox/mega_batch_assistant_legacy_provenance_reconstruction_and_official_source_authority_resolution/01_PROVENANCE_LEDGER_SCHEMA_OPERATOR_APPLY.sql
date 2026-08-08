-- LIVE OPERATOR APPLY.
-- Creates reconstruction and decision ledgers. It does NOT update canonical sources,
-- references, knowledge documents, citations, or chat eligibility automatically.
begin;

create table if not exists assistant.knowledge_provenance_reconstruction_runs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null,
  activation_run_id uuid not null references assistant.knowledge_activation_runs(id) on delete restrict,
  status text not null default 'completed',
  run_note text null,
  summary_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  constraint assistant_knowledge_provenance_reconstruction_runs_status_chk check (status in ('running','completed','failed'))
);

create table if not exists assistant.knowledge_provenance_reconstruction_items (
  id uuid primary key default gen_random_uuid(),
  provenance_run_id uuid not null references assistant.knowledge_provenance_reconstruction_runs(id) on delete cascade,
  activation_run_id uuid not null references assistant.knowledge_activation_runs(id) on delete restrict,
  knowledge_document_id uuid not null references assistant.knowledge_documents(id) on delete restrict,
  reference_document_id uuid null references assistant.reference_documents(id) on delete set null,
  source_container_id uuid null references assistant.knowledge_sources(id) on delete set null,
  source_container_name text null,
  title_snapshot text not null,
  reference_title_snapshot text null,
  provenance_state text not null,
  candidate_group_key text not null,
  candidate_url text null,
  candidate_issuer text null,
  candidate_identifier text null,
  candidate_file_name text null,
  candidate_document_date text null,
  evidence_metadata_json jsonb not null default '{}'::jsonb,
  linked_source_verification_task_count integer not null default 0,
  active_citation_task_count integer not null default 0,
  active_citation_duplicate_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint assistant_knowledge_provenance_reconstruction_items_state_chk check (provenance_state in ('legacy_container_only','url_candidate','issuer_identifier_candidate','retained_file_candidate','issuer_candidate')),
  constraint assistant_knowledge_provenance_reconstruction_items_run_document_uk unique (provenance_run_id,knowledge_document_id)
);

create table if not exists assistant.knowledge_provenance_resolution_decisions (
  id uuid primary key default gen_random_uuid(),
  provenance_item_id uuid not null references assistant.knowledge_provenance_reconstruction_items(id) on delete cascade,
  reviewer_auth_user_id uuid not null,
  decision_code text not null,
  evidence_reference text not null,
  candidate_url text null,
  issuer_name text null,
  notes text null,
  created_at timestamptz not null default now(),
  constraint assistant_knowledge_provenance_resolution_decisions_code_chk check (decision_code in ('official_source_candidate_confirmed','institutional_source_candidate_confirmed','metadata_insufficient','not_authoritative','needs_external_research','duplicate_or_contained')),
  constraint assistant_knowledge_provenance_resolution_decisions_evidence_chk check (length(trim(evidence_reference)) >= 5)
);

create table if not exists assistant.knowledge_review_task_reconciliation_events (
  id uuid primary key default gen_random_uuid(),
  reviewer_auth_user_id uuid not null,
  keep_task_id uuid not null references assistant.knowledge_review_tasks(id) on delete restrict,
  cancelled_task_id uuid not null references assistant.knowledge_review_tasks(id) on delete restrict,
  rationale text not null,
  created_at timestamptz not null default now(),
  constraint assistant_knowledge_review_task_reconciliation_events_distinct_chk check (keep_task_id <> cancelled_task_id),
  constraint assistant_knowledge_review_task_reconciliation_events_rationale_chk check (length(trim(rationale)) >= 8),
  constraint assistant_knowledge_review_task_reconciliation_events_cancelled_uk unique (cancelled_task_id)
);

create index if not exists idx_assistant_provenance_runs_created on assistant.knowledge_provenance_reconstruction_runs(created_at desc);
create index if not exists idx_assistant_provenance_items_state on assistant.knowledge_provenance_reconstruction_items(provenance_run_id,provenance_state,created_at desc);
create index if not exists idx_assistant_provenance_items_group on assistant.knowledge_provenance_reconstruction_items(provenance_run_id,candidate_group_key);
create index if not exists idx_assistant_provenance_decisions_item on assistant.knowledge_provenance_resolution_decisions(provenance_item_id,created_at desc);

alter table assistant.knowledge_provenance_reconstruction_runs enable row level security;
alter table assistant.knowledge_provenance_reconstruction_items enable row level security;
alter table assistant.knowledge_provenance_resolution_decisions enable row level security;
alter table assistant.knowledge_review_task_reconciliation_events enable row level security;

create or replace function assistant.rpc_refresh_legacy_provenance_reconstruction_v1(
  p_reviewer_auth_user_id uuid,
  p_activation_run_id uuid default null,
  p_run_note text default null
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare
  v_activation_run_id uuid;
  v_provenance_run_id uuid;
  v_summary jsonb;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id,'review');
  select coalesce(p_activation_run_id,(select id from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1)) into v_activation_run_id;
  if v_activation_run_id is null then raise exception 'completed full-corpus activation run is required'; end if;
  if not exists (select 1 from assistant.knowledge_activation_runs where id=v_activation_run_id and status='completed') then raise exception 'activation run is not completed'; end if;

  insert into assistant.knowledge_provenance_reconstruction_runs(requested_by,activation_run_id,status,run_note)
  values(p_reviewer_auth_user_id,v_activation_run_id,'running',nullif(trim(coalesce(p_run_note,'')),''))
  returning id into v_provenance_run_id;

  with base as (
    select ai.knowledge_document_id,ai.reference_document_id,ai.source_id,kd.title,rd.title as reference_title,ks.name as source_container_name,
      to_jsonb(kd) as kd_json,to_jsonb(rd) as rd_json
    from assistant.knowledge_activation_items ai
    join assistant.knowledge_documents kd on kd.id=ai.knowledge_document_id
    left join assistant.reference_documents rd on rd.id=ai.reference_document_id
    left join assistant.knowledge_sources ks on ks.id=ai.source_id
    where ai.activation_run_id=v_activation_run_id and ai.lifecycle_bucket='source_verification_required'
  ), evidence as (
    select *,
      coalesce(nullif(trim(rd_json->>'canonical_url'),''),nullif(trim(rd_json->>'source_url'),''),nullif(trim(rd_json->>'url'),''),nullif(trim(rd_json->>'original_url'),''),nullif(trim(rd_json->>'document_url'),''),nullif(trim(kd_json->>'source_url'),''),nullif(trim(kd_json->>'url'),'')) as candidate_url,
      coalesce(nullif(trim(rd_json->>'issuer'),''),nullif(trim(rd_json->>'publisher'),''),nullif(trim(rd_json->>'issuing_entity'),''),nullif(trim(kd_json->>'issuer'),''),nullif(trim(kd_json->>'publisher'),'')) as candidate_issuer,
      coalesce(nullif(trim(rd_json->>'law_number'),''),nullif(trim(rd_json->>'decision_number'),''),nullif(trim(rd_json->>'document_number'),''),nullif(trim(rd_json->>'reference_number'),''),nullif(trim(kd_json->>'law_number'),''),nullif(trim(kd_json->>'decision_number'),''),nullif(trim(kd_json->>'document_number'),'')) as candidate_identifier,
      coalesce(nullif(trim(rd_json->>'original_filename'),''),nullif(trim(rd_json->>'file_name'),''),nullif(trim(rd_json->>'filename'),''),nullif(trim(rd_json->>'storage_path'),''),nullif(trim(kd_json->>'original_filename'),''),nullif(trim(kd_json->>'file_name'),''),nullif(trim(kd_json->>'filename'),'')) as candidate_file_name,
      coalesce(nullif(trim(rd_json->>'issued_at'),''),nullif(trim(rd_json->>'published_at'),''),nullif(trim(rd_json->>'document_date'),''),nullif(trim(kd_json->>'issued_at'),''),nullif(trim(kd_json->>'document_date'),'')) as candidate_document_date
    from base
  ), classified as (
    select *,
      case when candidate_url is not null then 'url_candidate'
           when candidate_issuer is not null and candidate_identifier is not null then 'issuer_identifier_candidate'
           when candidate_file_name is not null then 'retained_file_candidate'
           when candidate_issuer is not null then 'issuer_candidate'
           else 'legacy_container_only' end as provenance_state,
      md5(lower(concat_ws('|',coalesce(candidate_url,''),coalesce(candidate_issuer,''),coalesce(candidate_identifier,''),coalesce(candidate_file_name,''),coalesce(reference_title,''),coalesce(source_container_name,'')))) as candidate_group_key
    from evidence
  ), task_counts as (
    select c.*, 
      (select count(*) from assistant.knowledge_review_tasks t where t.workflow_stage='source_verification' and t.target_type='reference_document' and t.target_id=c.reference_document_id and t.status in ('open','assigned','in_progress','blocked')) as linked_source_verification_task_count,
      (select count(*) from assistant.knowledge_review_tasks t where t.workflow_stage='citation_verification' and t.target_type='knowledge_document' and t.target_id=c.knowledge_document_id and t.status in ('open','assigned','in_progress','blocked')) as active_citation_task_count
    from classified c
  )
  insert into assistant.knowledge_provenance_reconstruction_items(
    provenance_run_id,activation_run_id,knowledge_document_id,reference_document_id,source_container_id,source_container_name,title_snapshot,reference_title_snapshot,
    provenance_state,candidate_group_key,candidate_url,candidate_issuer,candidate_identifier,candidate_file_name,candidate_document_date,evidence_metadata_json,
    linked_source_verification_task_count,active_citation_task_count,active_citation_duplicate_count
  )
  select v_provenance_run_id,v_activation_run_id,knowledge_document_id,reference_document_id,source_id,source_container_name,coalesce(title,'(untitled)'),reference_title,
    provenance_state,candidate_group_key,candidate_url,candidate_issuer,candidate_identifier,candidate_file_name,candidate_document_date,
    jsonb_strip_nulls(jsonb_build_object('candidate_url',candidate_url,'candidate_issuer',candidate_issuer,'candidate_identifier',candidate_identifier,'candidate_file_name',candidate_file_name,'candidate_document_date',candidate_document_date)),
    linked_source_verification_task_count,active_citation_task_count,greatest(active_citation_task_count-1,0)
  from task_counts;

  select jsonb_build_object(
    'total_items',count(*),
    'legacy_container_only',count(*) filter(where provenance_state='legacy_container_only'),
    'url_candidate',count(*) filter(where provenance_state='url_candidate'),
    'issuer_identifier_candidate',count(*) filter(where provenance_state='issuer_identifier_candidate'),
    'retained_file_candidate',count(*) filter(where provenance_state='retained_file_candidate'),
    'issuer_candidate',count(*) filter(where provenance_state='issuer_candidate'),
    'candidate_groups',count(distinct candidate_group_key),
    'unresolved_items',count(*)
  ) into v_summary
  from assistant.knowledge_provenance_reconstruction_items where provenance_run_id=v_provenance_run_id;

  update assistant.knowledge_provenance_reconstruction_runs set status='completed',summary_json=v_summary,completed_at=now() where id=v_provenance_run_id;
  insert into assistant.knowledge_access_events(auth_user_id,action,result,scope_code,reason_code,metadata_json)
  values(p_reviewer_auth_user_id,'review','allowed','assistant.review','legacy_provenance_reconstruction',jsonb_build_object('provenance_run_id',v_provenance_run_id,'activation_run_id',v_activation_run_id,'summary',v_summary));
  return jsonb_build_object('provenance_run_id',v_provenance_run_id,'activation_run_id',v_activation_run_id,'summary',v_summary,'mode','legacy_provenance_reconstruction_v1');
exception when others then
  if v_provenance_run_id is not null then
    update assistant.knowledge_provenance_reconstruction_runs set status='failed',completed_at=now(),summary_json=jsonb_build_object('error',sqlerrm) where id=v_provenance_run_id;
  end if;
  raise;
end;
$$;

create or replace function assistant.rpc_record_legacy_provenance_resolution_v1(
  p_reviewer_auth_user_id uuid,
  p_item_id uuid,
  p_decision_code text,
  p_evidence_reference text,
  p_candidate_url text default null,
  p_issuer_name text default null,
  p_notes text default null
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare v_item assistant.knowledge_provenance_reconstruction_items%rowtype; v_decision_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id,'review');
  select * into v_item from assistant.knowledge_provenance_reconstruction_items where id=p_item_id;
  if not found then raise exception 'provenance reconstruction item not found'; end if;
  if p_decision_code not in ('official_source_candidate_confirmed','institutional_source_candidate_confirmed','metadata_insufficient','not_authoritative','needs_external_research','duplicate_or_contained') then raise exception 'unsupported provenance decision'; end if;
  if nullif(trim(coalesce(p_evidence_reference,'')),'') is null or length(trim(p_evidence_reference))<5 then raise exception 'evidence reference is required'; end if;
  if p_decision_code='official_source_candidate_confirmed' and (nullif(trim(coalesce(p_candidate_url,'')),'') is null or trim(p_candidate_url) !~ '^https://') then raise exception 'official candidate confirmation requires an https canonical source URL'; end if;
  if p_decision_code in ('official_source_candidate_confirmed','institutional_source_candidate_confirmed') and nullif(trim(coalesce(p_issuer_name,'')),'') is null then raise exception 'candidate confirmation requires issuer name'; end if;

  insert into assistant.knowledge_provenance_resolution_decisions(provenance_item_id,reviewer_auth_user_id,decision_code,evidence_reference,candidate_url,issuer_name,notes)
  values(p_item_id,p_reviewer_auth_user_id,p_decision_code,trim(p_evidence_reference),nullif(trim(coalesce(p_candidate_url,'')),''),nullif(trim(coalesce(p_issuer_name,'')),''),nullif(trim(coalesce(p_notes,'')),''))
  returning id into v_decision_id;
  insert into assistant.knowledge_access_events(auth_user_id,action,result,scope_code,reason_code,metadata_json)
  values(p_reviewer_auth_user_id,'review','allowed','assistant.review','legacy_provenance_resolution_recorded',jsonb_build_object('decision_id',v_decision_id,'item_id',p_item_id,'decision_code',p_decision_code));
  return jsonb_build_object('decision_id',v_decision_id,'item_id',p_item_id,'decision_code',p_decision_code,'canonical_source_mutation','not_performed','next_gate','explicit_promotion_after_schema_and_evidence_review');
end;
$$;

create or replace function assistant.rpc_reconcile_duplicate_citation_review_task_v1(
  p_reviewer_auth_user_id uuid,
  p_keep_task_id uuid,
  p_cancel_task_id uuid,
  p_rationale text
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare v_keep assistant.knowledge_review_tasks%rowtype; v_cancel assistant.knowledge_review_tasks%rowtype; v_event_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id,'review');
  if p_keep_task_id=p_cancel_task_id then raise exception 'keep task and cancelled task must differ'; end if;
  if nullif(trim(coalesce(p_rationale,'')),'') is null or length(trim(p_rationale))<8 then raise exception 'reconciliation rationale is required'; end if;
  select * into v_keep from assistant.knowledge_review_tasks where id=p_keep_task_id for update;
  select * into v_cancel from assistant.knowledge_review_tasks where id=p_cancel_task_id for update;
  if not found then raise exception 'review task not found'; end if;
  if v_keep.workflow_stage <> 'citation_verification' or v_cancel.workflow_stage <> 'citation_verification' then raise exception 'only citation verification task duplicates can be reconciled here'; end if;
  if v_keep.target_type<>v_cancel.target_type or v_keep.target_id<>v_cancel.target_id then raise exception 'tasks do not represent the same target'; end if;
  if v_keep.status not in ('open','assigned','in_progress','blocked') or v_cancel.status not in ('open','assigned','in_progress','blocked') then raise exception 'both tasks must be active'; end if;
  update assistant.knowledge_review_tasks set status='cancelled',completed_at=now(),completed_by=p_reviewer_auth_user_id,updated_at=now(),notes=concat_ws(E'\n',nullif(notes,''),'Duplicate citation task reconciled. Kept task: '||p_keep_task_id::text||'. Rationale: '||trim(p_rationale)) where id=p_cancel_task_id;
  insert into assistant.knowledge_review_task_reconciliation_events(reviewer_auth_user_id,keep_task_id,cancelled_task_id,rationale)
  values(p_reviewer_auth_user_id,p_keep_task_id,p_cancel_task_id,trim(p_rationale)) returning id into v_event_id;
  insert into assistant.knowledge_access_events(auth_user_id,action,result,scope_code,reason_code,metadata_json)
  values(p_reviewer_auth_user_id,'review','allowed','assistant.review','duplicate_citation_task_reconciled',jsonb_build_object('event_id',v_event_id,'keep_task_id',p_keep_task_id,'cancelled_task_id',p_cancel_task_id));
  return jsonb_build_object('event_id',v_event_id,'keep_task_id',p_keep_task_id,'cancelled_task_id',p_cancel_task_id,'status','cancelled_duplicate_only');
end;
$$;

create or replace function assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1()
returns jsonb language sql stable security invoker set search_path=assistant,public as $$
with latest as (select id,activation_run_id,summary_json,created_at,completed_at from assistant.knowledge_provenance_reconstruction_runs where status='completed' order by created_at desc limit 1),
duplicates as (select count(*) as duplicate_groups from (select target_type,target_id from assistant.knowledge_review_tasks where workflow_stage='citation_verification' and status in ('open','assigned','in_progress','blocked') group by target_type,target_id having count(*)>1) x)
select coalesce((select jsonb_build_object('latestRunId',id,'activationRunId',activation_run_id,'createdAt',created_at,'completedAt',completed_at,'summary',summary_json || jsonb_build_object('duplicate_citation_task_groups',(select duplicate_groups from duplicates))) from latest),jsonb_build_object('latestRunId',null,'summary',jsonb_build_object('total_items',0,'unresolved_items',0,'duplicate_citation_task_groups',(select duplicate_groups from duplicates))));
$$;

create or replace function assistant.rpc_list_legacy_provenance_reconstruction_items_v1(p_run_id uuid default null,p_state text default null,p_limit integer default 100)
returns table(id uuid,knowledge_document_id uuid,reference_document_id uuid,source_container_id uuid,source_container_name text,title text,reference_title text,provenance_state text,candidate_group_key text,candidate_url text,candidate_issuer text,candidate_identifier text,candidate_file_name text,candidate_document_date text,evidence_metadata_json jsonb,source_task_count integer,citation_task_count integer,citation_duplicate_count integer,latest_decision_code text,latest_decision_at timestamptz)
language sql stable security invoker set search_path=assistant,public as $$
with latest as (select id from assistant.knowledge_provenance_reconstruction_runs where status='completed' order by created_at desc limit 1), decisions as (select distinct on (provenance_item_id) provenance_item_id,decision_code,created_at from assistant.knowledge_provenance_resolution_decisions order by provenance_item_id,created_at desc)
select i.id,i.knowledge_document_id,i.reference_document_id,i.source_container_id,i.source_container_name,i.title_snapshot,i.reference_title_snapshot,i.provenance_state,i.candidate_group_key,i.candidate_url,i.candidate_issuer,i.candidate_identifier,i.candidate_file_name,i.candidate_document_date,i.evidence_metadata_json,i.linked_source_verification_task_count,i.active_citation_task_count,i.active_citation_duplicate_count,d.decision_code,d.created_at
from assistant.knowledge_provenance_reconstruction_items i left join decisions d on d.provenance_item_id=i.id
where i.provenance_run_id=coalesce(p_run_id,(select id from latest)) and (p_state is null or i.provenance_state=p_state)
order by case i.provenance_state when 'url_candidate' then 1 when 'issuer_identifier_candidate' then 2 when 'retained_file_candidate' then 3 when 'issuer_candidate' then 4 else 5 end,i.title_snapshot
limit greatest(1,least(coalesce(p_limit,100),500));
$$;

create or replace function assistant.rpc_list_legacy_provenance_groups_v1(p_run_id uuid default null,p_limit integer default 100)
returns table(candidate_group_key text,provenance_state text,source_container_name text,candidate_url text,candidate_issuer text,candidate_identifier text,candidate_file_name text,affected_documents bigint,affected_reference_documents bigint,source_task_links bigint,citation_duplicate_documents bigint,decision_count bigint)
language sql stable security invoker set search_path=assistant,public as $$
with latest as (select id from assistant.knowledge_provenance_reconstruction_runs where status='completed' order by created_at desc limit 1), dec as (select provenance_item_id,count(*) as decision_count from assistant.knowledge_provenance_resolution_decisions group by provenance_item_id)
select i.candidate_group_key,i.provenance_state,max(i.source_container_name),max(i.candidate_url),max(i.candidate_issuer),max(i.candidate_identifier),max(i.candidate_file_name),count(*),count(distinct i.reference_document_id),sum(i.linked_source_verification_task_count),count(*) filter(where i.active_citation_duplicate_count>0),coalesce(sum(dec.decision_count),0)
from assistant.knowledge_provenance_reconstruction_items i left join dec on dec.provenance_item_id=i.id
where i.provenance_run_id=coalesce(p_run_id,(select id from latest))
group by i.candidate_group_key,i.provenance_state
order by count(*) desc,max(i.source_container_name),i.candidate_group_key
limit greatest(1,least(coalesce(p_limit,100),500));
$$;

create or replace function assistant.rpc_list_duplicate_citation_review_task_groups_v1(p_limit integer default 100)
returns table(target_id uuid,active_task_count bigint,task_ids jsonb,dedupe_keys jsonb)
language sql stable security invoker set search_path=assistant,public as $$
select target_id,count(*),jsonb_agg(id order by created_at),jsonb_agg(dedupe_key order by dedupe_key)
from assistant.knowledge_review_tasks
where workflow_stage='citation_verification' and target_type='knowledge_document' and status in ('open','assigned','in_progress','blocked')
group by target_id
having count(*)>1
order by count(*) desc,target_id
limit greatest(1,least(coalesce(p_limit,100),500));
$$;

revoke all on function assistant.rpc_refresh_legacy_provenance_reconstruction_v1(uuid,uuid,text) from public,anon,authenticated;
revoke all on function assistant.rpc_record_legacy_provenance_resolution_v1(uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
revoke all on function assistant.rpc_reconcile_duplicate_citation_review_task_v1(uuid,uuid,uuid,text) from public,anon,authenticated;
revoke all on function assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1() from public,anon,authenticated;
revoke all on function assistant.rpc_list_legacy_provenance_reconstruction_items_v1(uuid,text,integer) from public,anon,authenticated;
revoke all on function assistant.rpc_list_legacy_provenance_groups_v1(uuid,integer) from public,anon,authenticated;
revoke all on function assistant.rpc_list_duplicate_citation_review_task_groups_v1(integer) from public,anon,authenticated;
grant execute on function assistant.rpc_refresh_legacy_provenance_reconstruction_v1(uuid,uuid,text) to service_role;
grant execute on function assistant.rpc_record_legacy_provenance_resolution_v1(uuid,uuid,text,text,text,text,text) to service_role;
grant execute on function assistant.rpc_reconcile_duplicate_citation_review_task_v1(uuid,uuid,uuid,text) to service_role;
grant execute on function assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1() to service_role;
grant execute on function assistant.rpc_list_legacy_provenance_reconstruction_items_v1(uuid,text,integer) to service_role;
grant execute on function assistant.rpc_list_legacy_provenance_groups_v1(uuid,integer) to service_role;
grant execute on function assistant.rpc_list_duplicate_citation_review_task_groups_v1(integer) to service_role;

commit;
