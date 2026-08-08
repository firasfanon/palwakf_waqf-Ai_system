-- Mega Batch B — Read-only Discovery Evidence
-- Safety: no INSERT, UPDATE, DELETE, TRUNCATE, CREATE, ALTER, DROP, GRANT, REVOKE.
-- Run only against the intended environment.

begin read only;

select jsonb_build_object(
  'observed_at_utc', clock_timestamp(),
  'database_name', current_database(),
  'database_role', current_user,
  'transaction_read_only', current_setting('transaction_read_only', true),
  'application_name', current_setting('application_name', true)
) as environment_fingerprint;

select table_name
from information_schema.tables
where table_schema = 'assistant'
  and table_name in (
    'knowledge_sources','reference_documents','reference_files',
    'knowledge_documents','knowledge_citations','knowledge_review_tasks',
    'legacy_import_register','ai_tool_runs','ai_tool_run_events','ai_tool_run_links',
    'review_events','knowledge_scope_assignments'
  )
order by table_name;

select 'knowledge_sources' as entity, count(*)::bigint as row_count from assistant.knowledge_sources
union all select 'reference_documents', count(*) from assistant.reference_documents
union all select 'reference_files', count(*) from assistant.reference_files
union all select 'knowledge_documents', count(*) from assistant.knowledge_documents
union all select 'knowledge_citations', count(*) from assistant.knowledge_citations
union all select 'knowledge_review_tasks', count(*) from assistant.knowledge_review_tasks
union all select 'legacy_import_register', count(*) from assistant.legacy_import_register
union all select 'ai_tool_runs', count(*) from assistant.ai_tool_runs
union all select 'ai_tool_run_events', count(*) from assistant.ai_tool_run_events
union all select 'ai_tool_run_links', count(*) from assistant.ai_tool_run_links
order by entity;

select migration_status, count(*)::bigint as row_count
from assistant.legacy_import_register
group by migration_status
order by migration_status;

select
  workflow_stage,
  status,
  count(*)::bigint as task_count
from assistant.knowledge_review_tasks
group by workflow_stage, status
order by workflow_stage, status;

select
  status,
  is_chat_eligible,
  count(*)::bigint as document_count
from assistant.knowledge_documents
group by status, is_chat_eligible
order by status, is_chat_eligible;

select
  verification_status,
  count(*)::bigint as reference_count
from assistant.reference_documents
group by verification_status
order by verification_status;

select
  verification_status,
  count(*)::bigint as citation_count
from assistant.knowledge_citations
group by verification_status
order by verification_status;

-- Extract exactly ten candidate rows without deciding or updating anything.
select
  row_number() over (order by ctid) as pilot_rank,
  to_jsonb(candidate) as legacy_record
from (
  select *
  from assistant.legacy_import_register
  where migration_status = 'needs_mapping'
  order by ctid
  limit 10
) as candidate;

-- Table shape for future tool-output intake design; no application change here.
select
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'assistant'
  and table_name in ('ai_tool_runs','ai_tool_run_events','ai_tool_run_links')
order by table_name, ordinal_position;

commit;
