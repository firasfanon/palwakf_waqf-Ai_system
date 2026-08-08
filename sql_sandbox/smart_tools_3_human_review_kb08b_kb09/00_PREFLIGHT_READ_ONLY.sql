-- Smart Tools 3 preflight — READ ONLY
select
  to_regclass('assistant.knowledge_review_tasks') is not null as review_tasks_present,
  to_regclass('assistant.legacy_import_register') is not null as import_register_present,
  to_regclass('assistant.reference_documents') is not null as reference_documents_present,
  to_regclass('assistant.knowledge_documents') is not null as knowledge_documents_present,
  to_regclass('assistant.knowledge_citations') is not null as citations_present,
  to_regclass('assistant.knowledge_scope_assignments') is not null as scoped_permissions_present;

select workflow_stage, status, count(*) as tasks
from assistant.knowledge_review_tasks
group by workflow_stage, status
order by workflow_stage, status;

select legacy_table_name, count(*) as needs_mapping_rows
from assistant.legacy_import_register
where migration_status='needs_mapping'
group by legacy_table_name
order by legacy_table_name;

select count(*) as content_classification_tasks_observed
from assistant.knowledge_review_tasks
where workflow_stage='content_classification';
