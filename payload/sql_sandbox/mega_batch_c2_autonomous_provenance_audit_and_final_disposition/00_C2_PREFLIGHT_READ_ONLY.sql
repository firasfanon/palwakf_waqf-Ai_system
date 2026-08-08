-- Mega Batch C2 — autonomous provenance audit preflight
-- STRICT READ ONLY: this file is evidence-only and always rolls back.
begin transaction read only;

select
  current_database() as database_name,
  current_user as actor,
  current_setting('transaction_read_only') as transaction_read_only,
  to_regclass('assistant.legacy_import_register') as legacy_register_relation,
  to_regclass('assistant.knowledge_documents') as knowledge_documents_relation,
  to_regclass('assistant.reference_documents') as reference_documents_relation;

select
  count(*) as legacy_register_rows,
  count(*) filter (where payload_json is not null) as rows_with_payload_json,
  count(*) filter (where migration_status = 'promoted') as promoted_rows,
  count(*) filter (where migration_status = 'needs_mapping') as needs_mapping_rows
from assistant.legacy_import_register;

rollback;
