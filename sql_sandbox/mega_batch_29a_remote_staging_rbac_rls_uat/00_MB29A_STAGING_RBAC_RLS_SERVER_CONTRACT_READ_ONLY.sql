-- Mega Batch 29A — Staging RBAC/RLS Server Contract (READ ONLY)
-- Purpose: capture database-side evidence after Smart Tools 3 SQL acceptance and before/after browser UAT.
-- No DDL, DML, GRANT, REVOKE, or role changes.

with target_tables(schema_name, table_name) as (
  values
    ('assistant', 'knowledge_review_tasks'),
    ('assistant', 'knowledge_scope_assignments'),
    ('assistant', 'legacy_mapping_resolutions'),
    ('assistant', 'page_operation_bindings')
), table_contract as (
  select
    schema_name || '.' || table_name as relation_name,
    to_regclass(schema_name || '.' || table_name) as relation_oid
  from target_tables
), table_evidence as (
  select
    relation_name,
    relation_oid is not null as relation_present,
    coalesce((select c.relrowsecurity from pg_class c where c.oid = relation_oid), false) as rls_enabled,
    coalesce((select c.relforcerowsecurity from pg_class c where c.oid = relation_oid), false) as rls_forced,
    coalesce(has_table_privilege('anon', relation_oid, 'select'), false) as anon_select,
    coalesce(has_table_privilege('anon', relation_oid, 'insert'), false) as anon_insert,
    coalesce(has_table_privilege('anon', relation_oid, 'update'), false) as anon_update,
    coalesce(has_table_privilege('anon', relation_oid, 'delete'), false) as anon_delete,
    coalesce(has_table_privilege('authenticated', relation_oid, 'select'), false) as authenticated_select,
    coalesce(has_table_privilege('authenticated', relation_oid, 'insert'), false) as authenticated_insert,
    coalesce(has_table_privilege('authenticated', relation_oid, 'update'), false) as authenticated_update,
    coalesce(has_table_privilege('authenticated', relation_oid, 'delete'), false) as authenticated_delete,
    coalesce(has_table_privilege('service_role', relation_oid, 'select'), false) as service_select,
    coalesce(has_table_privilege('service_role', relation_oid, 'insert'), false) as service_insert,
    coalesce(has_table_privilege('service_role', relation_oid, 'update'), false) as service_update
  from table_contract
), function_contract(signature, required_service_execute) as (
  values
    ('assistant.rpc_claim_knowledge_review_task_v1(uuid,uuid)', true),
    ('assistant.rpc_verify_official_reference_source_v1(uuid,uuid,text,text,jsonb)', true),
    ('assistant.rpc_verify_knowledge_citation_v1(uuid,uuid,uuid,text,text,jsonb)', true),
    ('assistant.rpc_release_official_knowledge_document_v1(uuid,uuid,text)', true),
    ('assistant.rpc_kb08b_mapping_queue_v1(integer,integer)', true),
    ('assistant.rpc_kb08b_resolve_mapping_v1(uuid,uuid,text,uuid,uuid,uuid,text,text,text,jsonb)', true),
    ('assistant.rpc_kb09_set_page_operation_binding_v1(text,uuid,text,text,text,text)', true)
), function_evidence as (
  select
    signature,
    required_service_execute,
    to_regprocedure(signature) as function_oid
  from function_contract
), normalized_function_evidence as (
  select
    signature,
    function_oid is not null as function_present,
    coalesce(has_function_privilege('anon', function_oid, 'execute'), false) as anon_execute,
    coalesce(has_function_privilege('authenticated', function_oid, 'execute'), false) as authenticated_execute,
    coalesce(has_function_privilege('service_role', function_oid, 'execute'), false) as service_role_execute
  from function_evidence
)
select jsonb_build_object(
  'contract', 'palwakf_mb29a_staging_rbac_rls_server_contract_v1',
  'observed_at_utc', now(),
  'table_evidence', (select jsonb_agg(to_jsonb(table_evidence) order by relation_name) from table_evidence),
  'function_evidence', (select jsonb_agg(to_jsonb(normalized_function_evidence) order by signature) from normalized_function_evidence),
  'decision', case
    when exists (select 1 from table_evidence where not relation_present) then 'FAIL_REQUIRED_RELATION_MISSING'
    when exists (select 1 from table_evidence where not rls_enabled) then 'FAIL_RLS_NOT_ENABLED'
    when exists (select 1 from table_evidence where anon_select or anon_insert or anon_update or anon_delete or authenticated_select or authenticated_insert or authenticated_update or authenticated_delete) then 'FAIL_BROWSER_DIRECT_TABLE_PRIVILEGE_PRESENT'
    when exists (select 1 from normalized_function_evidence where not function_present) then 'FAIL_REQUIRED_RPC_MISSING'
    when exists (select 1 from normalized_function_evidence where anon_execute or authenticated_execute) then 'FAIL_BROWSER_RPC_EXECUTE_PRESENT'
    when exists (select 1 from normalized_function_evidence where not service_role_execute) then 'FAIL_SERVICE_RPC_EXECUTE_MISSING'
    else 'PASS_SERVER_RBAC_RLS_CONTRACT_READY_FOR_BROWSER_UAT'
  end,
  'production_approved', false
) as mb29a_server_contract;
