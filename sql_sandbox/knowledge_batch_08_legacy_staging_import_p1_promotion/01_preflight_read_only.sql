-- Knowledge Batch 08 — preflight read-only check
-- No DDL/DML. This deliberately avoids selecting from objects that may not exist yet.
select
  object_name,
  to_regclass(object_name) is not null as present
from (values
  ('assistant.legacy_import_register'),
  ('assistant.knowledge_sources'),
  ('assistant.reference_documents'),
  ('assistant.knowledge_documents'),
  ('assistant.knowledge_citations'),
  ('assistant.legacy_operational_records')
) as t(object_name);

-- After 02/03/04/05 are applied, run 06_post_apply_read_only_verification.sql for counts.
