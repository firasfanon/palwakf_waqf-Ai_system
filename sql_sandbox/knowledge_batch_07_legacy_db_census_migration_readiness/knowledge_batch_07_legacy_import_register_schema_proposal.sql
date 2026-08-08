-- Knowledge Batch 07 — Legacy import register schema proposal
-- Purpose: preserve every old DB/content record in Supabase before final domain promotion.
-- This is a proposal/operator script. Review before apply.
begin;
create schema if not exists assistant;
create table if not exists assistant.legacy_import_register (
  id uuid primary key default gen_random_uuid(),
  legacy_batch text not null default 'knowledge_batch_07',
  legacy_source_file text not null,
  legacy_table_name text not null,
  legacy_record_key text null,
  legacy_dedupe_key text not null,
  target_schema text not null default 'assistant',
  target_table text null,
  migration_priority text not null default 'review',
  migration_status text not null default 'staged',
  payload_json jsonb not null,
  notes text null,
  created_at timestamptz not null default now(),
  constraint assistant_legacy_import_register_status_chk check (migration_status in ('staged','promoted','skipped','needs_mapping','error')),
  constraint assistant_legacy_import_register_dedupe_uniq unique (legacy_batch, legacy_dedupe_key)
);
create index if not exists idx_assistant_legacy_import_register_table on assistant.legacy_import_register (legacy_table_name);
create index if not exists idx_assistant_legacy_import_register_status on assistant.legacy_import_register (migration_status);
commit;
