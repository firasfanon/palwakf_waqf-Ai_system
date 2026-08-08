-- Knowledge Batch 06B-1 — Corrected read-only DB visibility helper
-- Date: 2026-06-18
-- Purpose: verify knowledge-document approval, chat visibility, and citation attachment.
-- Safety: read-only SELECT statements only. No DDL/DML.
-- Fix: repeat CTEs for each SELECT because PostgreSQL CTE scope is one statement only.

-- Summary check
with kb05_docs as (
  select
    kd.id,
    kd.title,
    kd.status,
    coalesce(kd.is_chat_eligible, false) as is_chat_eligible,
    kd.metadata_json
  from assistant.knowledge_documents kd
  where kd.metadata_json->>'knowledge_batch_05' = 'full_recovered_records_import'
     or kd.metadata_json->>'legacy_import_batch' = 'knowledge_batch_05'
     or kd.metadata_json->>'recovered_from' = 'pre_supabase_old_db'
     or kd.metadata_json ? 'legacy_registry_key'
), citation_counts as (
  select
    kc.knowledge_document_id,
    count(*)::int as citation_count
  from assistant.knowledge_citations kc
  group by kc.knowledge_document_id
)
select
  count(*)::int as kb05_knowledge_documents,
  count(*) filter (where d.status = 'approved')::int as approved_documents,
  count(*) filter (where d.is_chat_eligible = true)::int as chat_visible_documents,
  count(*) filter (where coalesce(cc.citation_count, 0) > 0)::int as documents_with_citations,
  coalesce(sum(cc.citation_count), 0)::int as total_citations
from kb05_docs d
left join citation_counts cc on cc.knowledge_document_id = d.id;

-- Search/sample check; CTE repeated intentionally.
with kb05_docs as (
  select
    kd.id,
    kd.title,
    kd.status,
    coalesce(kd.is_chat_eligible, false) as is_chat_eligible,
    kd.metadata_json,
    coalesce(kd.metadata_json->>'legacy_registry_key', kd.metadata_json->>'legacy_key', kd.id::text) as legacy_registry_key
  from assistant.knowledge_documents kd
  where kd.metadata_json->>'knowledge_batch_05' = 'full_recovered_records_import'
     or kd.metadata_json->>'legacy_import_batch' = 'knowledge_batch_05'
     or kd.metadata_json->>'recovered_from' = 'pre_supabase_old_db'
     or kd.metadata_json ? 'legacy_registry_key'
), citation_counts as (
  select
    kc.knowledge_document_id,
    count(*)::int as citations_count
  from assistant.knowledge_citations kc
  group by kc.knowledge_document_id
)
select
  d.title,
  d.status,
  d.is_chat_eligible,
  d.legacy_registry_key,
  coalesce(cc.citations_count, 0)::int as citations_count
from kb05_docs d
left join citation_counts cc on cc.knowledge_document_id = d.id
where d.title ilike any (array[
  '%الوقف الذري%',
  '%الأراضي الأميرية%',
  '%تعليمات لجان رعاية المساجد%',
  '%الانتداب البريطاني%',
  '%Ottoman land law%',
  '%Ottoman Palestine%',
  '%Jerusalem%',
  '%أوقاف القدس%'
])
order by d.title
limit 100;

-- Strict acceptance helper: rows with missing citation or visibility blockers.
with kb05_docs as (
  select
    kd.id,
    kd.title,
    kd.status,
    coalesce(kd.is_chat_eligible, false) as is_chat_eligible,
    kd.metadata_json
  from assistant.knowledge_documents kd
  where kd.metadata_json->>'knowledge_batch_05' = 'full_recovered_records_import'
     or kd.metadata_json->>'legacy_import_batch' = 'knowledge_batch_05'
     or kd.metadata_json->>'recovered_from' = 'pre_supabase_old_db'
     or kd.metadata_json ? 'legacy_registry_key'
), citation_counts as (
  select
    kc.knowledge_document_id,
    count(*)::int as citations_count
  from assistant.knowledge_citations kc
  group by kc.knowledge_document_id
)
select
  d.title,
  d.status,
  d.is_chat_eligible,
  coalesce(cc.citations_count, 0)::int as citations_count,
  case
    when d.status <> 'approved' then 'BLOCKED_STATUS_NOT_APPROVED'
    when d.is_chat_eligible is not true then 'BLOCKED_NOT_CHAT_ELIGIBLE'
    when coalesce(cc.citations_count, 0) = 0 then 'BLOCKED_NO_CITATION'
    else 'READY'
  end as readiness_status
from kb05_docs d
left join citation_counts cc on cc.knowledge_document_id = d.id
where d.status <> 'approved'
   or d.is_chat_eligible is not true
   or coalesce(cc.citations_count, 0) = 0
order by readiness_status, d.title;
