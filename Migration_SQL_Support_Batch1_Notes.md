# Optional SQL Support Notes for Migration Batch 1

No extra SQL is strictly required for Batch 1 beyond:
- `assistant_schema_sql_draft_1.sql`
- `assistant_rbac_rls_draft_1.sql`

## Optional verification queries

### Count migrated system settings
```sql
select count(*) from assistant.system_settings;
```

### Count migrated knowledge sources
```sql
select count(*) from assistant.knowledge_sources;
```

### Inspect migrated knowledge sources
```sql
select id, name, type, is_active, authority_level
from assistant.knowledge_sources
order by created_at desc;
```

### Inspect system settings keys
```sql
select key, updated_at
from assistant.system_settings
order by updated_at desc;
```
