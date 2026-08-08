-- Mega Batch C — post-apply READ ONLY verification.
begin transaction read only;

select 'assistant.source_url_history' as object_name, to_regclass('assistant.source_url_history') is not null as present
union all select 'assistant.source_rights_profiles', to_regclass('assistant.source_rights_profiles') is not null
union all select 'assistant.source_permissions', to_regclass('assistant.source_permissions') is not null
union all select 'assistant.source_takedown_requests', to_regclass('assistant.source_takedown_requests') is not null
union all select 'assistant.source_provenance_events', to_regclass('assistant.source_provenance_events') is not null;

select
  has_table_privilege('service_role', 'assistant.source_url_history', 'select,insert,update,delete') as service_role_url_history_privileges,
  has_table_privilege('authenticated', 'assistant.source_url_history', 'select') as authenticated_direct_read_privilege,
  has_function_privilege('service_role', 'assistant.rpc_source_provenance_upsert_source_v1(uuid,boolean,uuid,text,text,text,text,boolean,text,jsonb)', 'execute') as service_role_upsert_execute,
  has_function_privilege('authenticated', 'assistant.rpc_source_provenance_upsert_source_v1(uuid,boolean,uuid,text,text,text,text,boolean,text,jsonb)', 'execute') as authenticated_upsert_execute;

select
  relname,
  relrowsecurity
from pg_class
where oid in (
  'assistant.source_url_history'::regclass,
  'assistant.source_rights_profiles'::regclass,
  'assistant.source_permissions'::regclass,
  'assistant.source_takedown_requests'::regclass,
  'assistant.source_provenance_events'::regclass
)
order by relname;

select
  (select count(*) from assistant.knowledge_sources) as knowledge_sources_after,
  (select count(*) from assistant.source_url_history) as source_url_history_rows,
  (select count(*) from assistant.source_rights_profiles) as source_rights_profiles_rows,
  (select count(*) from assistant.source_provenance_events) as source_provenance_events_rows;

rollback;
