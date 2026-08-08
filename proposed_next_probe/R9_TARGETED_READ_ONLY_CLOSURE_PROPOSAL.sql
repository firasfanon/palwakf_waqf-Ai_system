-- R9 Targeted Security and Workflow Contract Closure
-- PROPOSAL ONLY — READ ONLY — NOT AUTHORIZED FOR EXECUTION YET.
\set ON_ERROR_STOP on

BEGIN TRANSACTION READ ONLY;

SELECT
  current_database() AS database_name,
  current_user AS current_user_name,
  current_setting('transaction_read_only') AS transaction_read_only,
  current_setting('search_path') AS search_path;

-- 1. Exact RLS enablement and ACLs.
SELECT
  n.nspname AS schema_name,
  c.relname AS object_name,
  c.relkind,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  c.relacl::text AS acl
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'assistant'
  AND c.relkind IN ('r','p','v','m')
ORDER BY c.relname;

-- 2. Exact constraint definitions.
SELECT
  con.conname,
  rel.relname AS table_name,
  con.contype,
  pg_get_constraintdef(con.oid, true) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace n ON n.oid = rel.relnamespace
WHERE n.nspname = 'assistant'
  AND rel.relname IN (
    'knowledge_review_tasks',
    'knowledge_documents',
    'knowledge_sources',
    'knowledge_citations',
    'knowledge_activation_runs',
    'knowledge_activation_items',
    'ai_tool_runs',
    'ai_tool_run_links'
  )
ORDER BY rel.relname, con.conname;

-- 3. Function bodies, security mode, and configured search_path.
SELECT
  p.oid::regprocedure::text AS routine_identity,
  p.prosecdef AS security_definer,
  p.provolatile,
  p.proconfig,
  pg_get_functiondef(p.oid) AS function_definition,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'assistant'
ORDER BY p.proname, pg_get_function_identity_arguments(p.oid);

-- 4. Exact review queue census.
SELECT
  workflow_stage,
  status,
  target_type,
  priority,
  count(*)::bigint AS task_count
FROM assistant.knowledge_review_tasks
GROUP BY workflow_stage, status, target_type, priority
ORDER BY workflow_stage, status, target_type, priority;

-- 5. Active duplicate groups.
SELECT
  dedupe_key,
  count(*)::bigint AS active_count
FROM assistant.knowledge_review_tasks
WHERE status IN ('open','assigned','in_progress','blocked')
GROUP BY dedupe_key
HAVING count(*) > 1
ORDER BY active_count DESC, dedupe_key;

-- 6. Citation and activation census.
SELECT verification_status, count(*)::bigint
FROM assistant.knowledge_citations
GROUP BY verification_status
ORDER BY verification_status;

SELECT status, count(*)::bigint
FROM assistant.knowledge_activation_runs
GROUP BY status
ORDER BY status;

SELECT lifecycle_bucket, count(*)::bigint
FROM assistant.knowledge_activation_items
GROUP BY lifecycle_bucket
ORDER BY lifecycle_bucket;

-- 7. Detect possible rights metadata keys without exposing content.
SELECT 'knowledge_sources' AS object_name, key, count(*)::bigint
FROM assistant.knowledge_sources
CROSS JOIN LATERAL jsonb_object_keys(metadata_json) AS key
WHERE key ILIKE ANY (ARRAY['%right%','%license%','%copyright%','%reuse%'])
GROUP BY key
UNION ALL
SELECT 'reference_documents' AS object_name, key, count(*)::bigint
FROM assistant.reference_documents
CROSS JOIN LATERAL jsonb_object_keys(metadata_json) AS key
WHERE key ILIKE ANY (ARRAY['%right%','%license%','%copyright%','%reuse%'])
GROUP BY key
ORDER BY object_name, key;

ROLLBACK;
