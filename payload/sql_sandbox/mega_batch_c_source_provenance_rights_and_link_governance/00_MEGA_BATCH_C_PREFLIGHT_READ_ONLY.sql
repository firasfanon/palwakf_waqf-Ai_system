-- Mega Batch C — Source Provenance, Rights and Link Governance
-- READ ONLY preflight. No data mutation, no source update, no chat release.
begin transaction read only;

select 'assistant.knowledge_sources' as required_object, to_regclass('assistant.knowledge_sources') is not null as present
union all select 'assistant.reference_documents', to_regclass('assistant.reference_documents') is not null
union all select 'assistant.knowledge_documents', to_regclass('assistant.knowledge_documents') is not null
union all select 'assistant.knowledge_scope_assignments', to_regclass('assistant.knowledge_scope_assignments') is not null
union all select 'assistant.knowledge_sources base_url', exists (
  select 1 from information_schema.columns where table_schema='assistant' and table_name='knowledge_sources' and column_name='base_url'
)
union all select 'assistant.knowledge_sources metadata_json', exists (
  select 1 from information_schema.columns where table_schema='assistant' and table_name='knowledge_sources' and column_name='metadata_json'
)
union all select 'assistant.reference_documents source_id', exists (
  select 1 from information_schema.columns where table_schema='assistant' and table_name='reference_documents' and column_name='source_id'
)
union all select 'assistant.knowledge_documents source_id', exists (
  select 1 from information_schema.columns where table_schema='assistant' and table_name='knowledge_documents' and column_name='source_id'
);

select
  (select count(*) from assistant.knowledge_sources) as knowledge_sources_before,
  (select count(*) from assistant.reference_documents) as reference_documents_before,
  (select count(*) from assistant.knowledge_documents) as knowledge_documents_before;

rollback;
