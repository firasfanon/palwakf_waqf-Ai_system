# Migration SQL Support — Batch 2

## Suggested verification queries

### fetched_content
```sql
select count(*) from assistant.fetched_content;
```

```sql
select id, title, status, source_id, fetched_at
from assistant.fetched_content
order by fetched_at desc
limit 20;
```

### fetch_logs
```sql
select count(*) from assistant.fetch_logs;
```

```sql
select id, status, items_count, source_id, created_at
from assistant.fetch_logs
order by created_at desc
limit 20;
```

### classification_ratings
```sql
select count(*) from assistant.classification_ratings;
```

### review_events
```sql
select count(*) from assistant.review_events;
```

```sql
select target_type, event_type, decision, performed_at
from assistant.review_events
order by performed_at desc
limit 20;
```
