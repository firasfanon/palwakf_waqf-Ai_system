-- Knowledge Batch 08 — P1 auxiliary operational records promotion
-- Purpose: preserve P1 non-knowledge operational records such as content_templates/page_settings into a generic assistant-local operational staging table.
-- Runtime page binding is intentionally deferred to Knowledge Batch 09.

begin;
create schema if not exists assistant;
create table if not exists assistant.legacy_operational_records (
  id uuid primary key default gen_random_uuid(),
  legacy_batch text not null,
  legacy_source_table text not null,
  legacy_record_key text null,
  legacy_dedupe_key text not null,
  operation_domain text not null,
  target_table_hint text null,
  status text not null default 'staged_for_page_binding',
  payload_json jsonb not null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_legacy_operational_records_status_chk check (status in ('staged_for_page_binding','bound','skipped','needs_mapping','error')),
  constraint assistant_legacy_operational_records_dedupe_uniq unique (legacy_batch, legacy_source_table, legacy_dedupe_key)
);
create index if not exists idx_assistant_legacy_operational_records_domain on assistant.legacy_operational_records(operation_domain);
create index if not exists idx_assistant_legacy_operational_records_status on assistant.legacy_operational_records(status);

with main_aux as (
  select
    'knowledge_batch_08'::text as legacy_batch,
    lir.legacy_table_name as legacy_source_table,
    lir.legacy_record_key,
    lir.legacy_dedupe_key,
    case
      when lir.legacy_table_name in ('content_templates') then 'content_templates'
      when lir.legacy_table_name in ('page_settings') then 'page_settings'
      else 'assistant_auxiliary'
    end as operation_domain,
    lir.target_table as target_table_hint,
    lir.payload_json,
    'Promoted from KB08 main legacy_import_register for Knowledge Batch 09 page binding.'::text as notes
  from assistant.legacy_import_register lir
  where lir.legacy_batch='knowledge_batch_08'
    and lir.migration_priority='P1'
    and lir.legacy_table_name in ('content_templates','page_settings')
),
supp_aux as (
  select
    'knowledge_batch_08_observed_rows'::text as legacy_batch,
    lir.legacy_table_name as legacy_source_table,
    lir.legacy_record_key,
    lir.legacy_dedupe_key,
    case
      when lir.legacy_table_name in ('knowledge_sources') then 'knowledge_sources_observed'
      when lir.legacy_table_name in ('fetched_content') then 'fetched_content_observed'
      when lir.legacy_table_name in ('fetch_logs') then 'fetch_logs_observed'
      when lir.legacy_table_name in ('site_settings') then 'site_settings_observed'
      else 'observed_rows'
    end as operation_domain,
    lir.target_table as target_table_hint,
    lir.payload_json,
    'Supplemental observed SELECT row staged for later reconciliation; may be partial evidence, not full table dump.'::text as notes
  from assistant.legacy_import_register lir
  where lir.legacy_batch='knowledge_batch_08_observed_rows'
    and lir.legacy_table_name in ('knowledge_sources','fetched_content','fetch_logs','site_settings','messages')
),
combined as (
  select * from main_aux
  union all
  select * from supp_aux
),
inserted as (
  insert into assistant.legacy_operational_records
  (legacy_batch, legacy_source_table, legacy_record_key, legacy_dedupe_key, operation_domain, target_table_hint, status, payload_json, notes)
  select legacy_batch, legacy_source_table, legacy_record_key, legacy_dedupe_key, operation_domain, target_table_hint,
         'staged_for_page_binding', payload_json, notes
  from combined
  on conflict (legacy_batch, legacy_source_table, legacy_dedupe_key) do nothing
  returning id
),
updated_register as (
  update assistant.legacy_import_register lir
  set migration_status='promoted',
      notes=coalesce(lir.notes,'') || ' | KB08 auxiliary operational record staged for page binding at ' || now()::text
  where exists (
    select 1 from combined c
    where c.legacy_batch=lir.legacy_batch and c.legacy_dedupe_key=lir.legacy_dedupe_key and c.legacy_source_table=lir.legacy_table_name
  )
  returning lir.id
)
select
  (select count(*) from combined) as auxiliary_candidates,
  (select count(*) from inserted) as newly_inserted_legacy_operational_records,
  (select count(*) from updated_register) as legacy_register_rows_marked_promoted_for_auxiliary_binding;
commit;
