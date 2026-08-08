-- Mega Batch C1 — Legacy Manus Provenance Recovery and Evidence Reconciliation
-- STRICT READ ONLY: do not mutate legacy_import_register, knowledge sources, documents, rights, lifecycle, Chat/RAG, or permissions.
begin transaction read only;

select 'assistant.legacy_import_register' as required_object, to_regclass('assistant.legacy_import_register') is not null as present
union all select 'assistant.reference_documents', to_regclass('assistant.reference_documents') is not null
union all select 'assistant.knowledge_documents', to_regclass('assistant.knowledge_documents') is not null
union all select 'assistant.knowledge_sources', to_regclass('assistant.knowledge_sources') is not null
union all select 'assistant.fetched_content', to_regclass('assistant.fetched_content') is not null
union all select 'assistant.fetch_logs', to_regclass('assistant.fetch_logs') is not null;

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'assistant'
  and table_name in ('legacy_import_register', 'reference_documents', 'knowledge_documents', 'knowledge_sources', 'fetched_content', 'fetch_logs')
order by table_name, ordinal_position;

select
  count(*) as legacy_rows_total,
  count(*) filter (where payload_json is not null) as payload_rows,
  count(*) filter (where migration_status = 'promoted') as promoted_rows,
  count(*) filter (where migration_status = 'needs_mapping') as needs_mapping_rows,
  count(distinct legacy_table_name) as legacy_table_count,
  count(distinct legacy_source_file) as legacy_source_file_count
from assistant.legacy_import_register;

select legacy_table_name, migration_status, count(*) as row_count
from assistant.legacy_import_register
group by legacy_table_name, migration_status
order by legacy_table_name, migration_status;

rollback;