-- Knowledge Batch 07 — Legacy import register post-apply check
select
  legacy_batch,
  count(*) as total_staged,
  count(*) filter (where migration_priority='P1') as p1_staged,
  count(*) filter (where legacy_table_name='knowledge_documents') as sql_knowledge_rows,
  count(*) filter (where legacy_table_name='legacy_json_content') as json_content_rows,
  count(*) filter (where migration_status='staged') as still_staged
from assistant.legacy_import_register
where legacy_batch='knowledge_batch_07'
group by legacy_batch;

select legacy_table_name, migration_priority, migration_status, count(*)
from assistant.legacy_import_register
where legacy_batch='knowledge_batch_07'
group by legacy_table_name, migration_priority, migration_status
order by legacy_table_name, migration_priority, migration_status;
