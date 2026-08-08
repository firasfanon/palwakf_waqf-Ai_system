-- Smart Tools 3 / KB09 — Page Binding + Real Operations Enablement
-- OPERATOR APPLY. Server/service-role contracts only; no direct browser DML.

begin;

create table if not exists assistant.page_operation_bindings (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique,
  operation_domain text not null,
  read_contract text not null,
  write_contract text not null,
  binding_status text not null default 'prepared',
  notes text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_page_operation_bindings_key_chk check (page_key in ('faq','knowledge_base','search','files','templates','settings')),
  constraint assistant_page_operation_bindings_status_chk check (binding_status in ('prepared','active','blocked'))
);
create index if not exists idx_assistant_page_operation_bindings_status on assistant.page_operation_bindings(binding_status);
alter table assistant.page_operation_bindings enable row level security;

insert into assistant.page_operation_bindings (page_key,operation_domain,read_contract,write_contract,binding_status,notes,metadata_json)
values
  ('knowledge_base','knowledge_documents','assistant_runtime_repository.read_canonical_knowledge','server_rpc_only','active','Canonical knowledge read is active; chat remains governed by the strict verified retrieval gate.',jsonb_build_object('batch','KB09','public_release','trust_gate_required')),
  ('search','knowledge_documents','assistant_runtime_repository.search_canonical_knowledge','server_rpc_only','active','Search reads canonical knowledge. It must not override trust eligibility for chat.',jsonb_build_object('batch','KB09','public_release','trust_gate_required')),
  ('files','reference_files','assistant_runtime_repository.read_reference_files','server_rpc_only','active','Files are read through the document/reference linkage; no direct browser storage writes.',jsonb_build_object('batch','KB09')),
  ('faq','legacy_operational_records','assistant.legacy_operational_records.review_queue','disabled','prepared','FAQ legacy records require dedicated canonical FAQ mapping before public read/write activation.',jsonb_build_object('batch','KB09','legacy_status','staged_for_page_binding')),
  ('templates','legacy_operational_records','assistant.legacy_operational_records.review_queue','disabled','prepared','Template records are preserved for reviewer binding; no direct activation before content-owner review.',jsonb_build_object('batch','KB09','legacy_status','staged_for_page_binding')),
  ('settings','legacy_operational_records','assistant.legacy_operational_records.review_queue','disabled','prepared','Legacy page/site settings remain staged; activate only through an approved settings binding.',jsonb_build_object('batch','KB09','legacy_status','staged_for_page_binding'))
on conflict (page_key) do update
set operation_domain=excluded.operation_domain,
    read_contract=excluded.read_contract,
    write_contract=excluded.write_contract,
    notes=excluded.notes,
    metadata_json=assistant.page_operation_bindings.metadata_json || excluded.metadata_json,
    updated_at=now();

create or replace function assistant.rpc_kb09_set_page_operation_binding_v1(
  p_page_key text,
  p_reviewer_auth_user_id uuid,
  p_binding_status text,
  p_read_contract text default null,
  p_write_contract text default null,
  p_notes text default null
) returns jsonb
language plpgsql
security invoker
set search_path = assistant, public
as $$
declare v_row assistant.page_operation_bindings%rowtype;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id, 'publish');
  if p_page_key not in ('faq','knowledge_base','search','files','templates','settings') then raise exception 'unsupported KB09 page key'; end if;
  if p_binding_status not in ('prepared','active','blocked') then raise exception 'unsupported binding status'; end if;

  select * into v_row from assistant.page_operation_bindings where page_key=p_page_key for update;
  if not found then raise exception 'page binding not found'; end if;

  -- FAQ/templates/settings cannot silently skip canonical ownership review.
  if p_binding_status='active' and p_page_key in ('faq','templates','settings') and v_row.operation_domain='legacy_operational_records' then
    raise exception 'legacy staged operation requires canonical owner binding before activation';
  end if;

  update assistant.page_operation_bindings
  set binding_status=p_binding_status,
      read_contract=coalesce(nullif(trim(p_read_contract),''),read_contract),
      write_contract=coalesce(nullif(trim(p_write_contract),''),write_contract),
      notes=coalesce(nullif(trim(p_notes),''),notes),
      metadata_json=coalesce(metadata_json,'{}'::jsonb) || jsonb_build_object('updated_by',p_reviewer_auth_user_id,'updated_at',now(),'KB09',true),
      updated_at=now()
  where page_key=p_page_key
  returning * into v_row;

  return jsonb_build_object('page_key',v_row.page_key,'binding_status',v_row.binding_status,'read_contract',v_row.read_contract,'write_contract',v_row.write_contract);
end;
$$;

create or replace view assistant.v_kb09_page_operations_snapshot_v1 as
select
  pob.page_key,
  pob.operation_domain,
  pob.read_contract,
  pob.write_contract,
  pob.binding_status,
  pob.notes,
  case when pob.operation_domain='legacy_operational_records' then (
    select count(*) from assistant.legacy_operational_records lor where lor.operation_domain = case pob.page_key when 'faq' then 'faq' when 'templates' then 'content_templates' when 'settings' then 'page_settings' else pob.operation_domain end
  ) else null end as staged_operational_records,
  pob.updated_at
from assistant.page_operation_bindings pob;

revoke all on assistant.page_operation_bindings from public, anon, authenticated;
revoke all on assistant.v_kb09_page_operations_snapshot_v1 from public, anon, authenticated;
revoke all on function assistant.rpc_kb09_set_page_operation_binding_v1(text,uuid,text,text,text,text) from public, anon, authenticated;
grant select on assistant.page_operation_bindings to service_role;
grant select on assistant.v_kb09_page_operations_snapshot_v1 to service_role;
grant execute on function assistant.rpc_kb09_set_page_operation_binding_v1(text,uuid,text,text,text,text) to service_role;

commit;
