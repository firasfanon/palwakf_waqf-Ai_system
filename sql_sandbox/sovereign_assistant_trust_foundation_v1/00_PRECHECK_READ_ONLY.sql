-- Sovereign Assistant Trust Foundation v1
-- READ ONLY. Run before any DDL/DML.
-- Stop if assistant schema / core tables are absent.

select current_database() as database_name, current_user as execution_role, now() as checked_at;

select table_name
from information_schema.tables
where table_schema = 'assistant'
  and table_name in (
    'knowledge_sources', 'reference_documents', 'reference_files',
    'knowledge_documents', 'knowledge_citations', 'review_events'
  )
order by table_name;

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'assistant'
  and table_name in ('knowledge_sources','reference_documents','knowledge_documents','knowledge_citations')
order by table_name, ordinal_position;

select
  (select count(*) from assistant.knowledge_sources) as knowledge_sources,
  (select count(*) from assistant.reference_documents) as reference_documents,
  (select count(*) from assistant.knowledge_documents) as knowledge_documents,
  (select count(*) from assistant.knowledge_citations) as knowledge_citations,
  (select count(*) from assistant.review_events) as review_events;

select
  kd.status,
  kd.is_chat_eligible,
  kd.authority_level,
  count(*) as rows
from assistant.knowledge_documents kd
group by kd.status, kd.is_chat_eligible, kd.authority_level
order by kd.status, kd.is_chat_eligible desc, kd.authority_level;
