# Migration SQL Support — Batch 3

## Suggested verification queries

### reference_documents
```sql
select count(*) from assistant.reference_documents;
```

```sql
select id, title, source_type, status, authority_level, domain_scope
from assistant.reference_documents
order by created_at desc
limit 20;
```

### reference_files
```sql
select count(*) from assistant.reference_files;
```

```sql
select reference_document_id, original_filename, mime_type, storage_path, is_primary
from assistant.reference_files
order by created_at desc
limit 20;
```

### knowledge_documents
```sql
select count(*) from assistant.knowledge_documents;
```

```sql
select id, title, category, status, is_chat_eligible, source_type
from assistant.knowledge_documents
order by created_at desc
limit 20;
```

### knowledge_citations
```sql
select count(*) from assistant.knowledge_citations;
```

```sql
select knowledge_document_id, reference_document_id, citation_type, locator
from assistant.knowledge_citations
limit 20;
```
