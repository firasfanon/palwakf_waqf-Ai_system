-- Knowledge Batch 06 — read-only runtime verification
-- Purpose: verify that KB05/05A imported records are approved, chat-visible,
-- citation-linked, searchable, and ready for /knowledge#/chat grounding checks.
-- READ ONLY. No DDL, no DML, no grants, no production approval.

with kb05_docs as (
  select
    kd.id,
    kd.title,
    kd.status,
    kd.is_chat_eligible,
    kd.reference_document_id,
    kd.category,
    kd.source_type,
    kd.metadata_json,
    kd.updated_at
  from assistant.knowledge_documents kd
  where
    kd.metadata_json->>'batch' = 'knowledge_batch_05'
    or kd.metadata_json ? 'legacy_registry_key'
    or kd.metadata_json ? 'registry_key'
), kb05_refs as (
  select
    rd.id,
    rd.title,
    rd.status,
    rd.metadata_json
  from assistant.reference_documents rd
  where
    rd.metadata_json->>'batch' = 'knowledge_batch_05'
    or rd.metadata_json ? 'legacy_registry_key'
    or rd.metadata_json ? 'registry_key'
), kb05_citations as (
  select kc.*
  from assistant.knowledge_citations kc
  join kb05_docs kd on kd.id = kc.knowledge_document_id
)
select
  (select count(*) from kb05_refs) as kb05_reference_documents,
  (select count(*) from kb05_docs) as kb05_knowledge_documents,
  (select count(*) from kb05_citations) as kb05_citations,
  (select count(*) from kb05_docs where status='approved') as approved_knowledge_documents,
  (select count(*) from kb05_docs where is_chat_eligible is true) as chat_eligible_knowledge_documents,
  (select count(*) from kb05_docs where status='approved' and is_chat_eligible is true) as approved_chat_visible_documents,
  (select count(*) from kb05_docs kd where kd.reference_document_id is not null) as knowledge_docs_with_reference_document_id;

-- Orphan / linkage health. Expected: all zero except docs_with_no_citation should be 0 after KB05A evidence.
with kb05_docs as (
  select * from assistant.knowledge_documents kd
  where kd.metadata_json->>'batch' = 'knowledge_batch_05'
     or kd.metadata_json ? 'legacy_registry_key'
     or kd.metadata_json ? 'registry_key'
)
select
  (select count(*) from kb05_docs kd left join assistant.reference_documents rd on rd.id = kd.reference_document_id where kd.reference_document_id is not null and rd.id is null) as orphan_reference_links,
  (select count(*) from assistant.knowledge_citations kc join kb05_docs kd on kd.id = kc.knowledge_document_id left join assistant.reference_documents rd on rd.id = kc.reference_document_id where kc.reference_document_id is not null and rd.id is null) as orphan_citation_reference_links,
  (select count(*) from kb05_docs kd where not exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id = kd.id)) as docs_with_no_citation;

-- Search readiness probes used by Admin Knowledge Search and chat grounding.
with probes(search_phrase) as (
  values
    ('الوقف'),
    ('الوقف الذري'),
    ('تعليمات لجان رعاية المساجد'),
    ('الأراضي الأميرية'),
    ('الانتداب البريطاني'),
    ('مهام وزارة الأوقاف'),
    ('القدس'),
    ('منذر قحف')
)
select
  p.search_phrase,
  count(kd.id) as approved_chat_visible_matches,
  min(kd.title) as sample_title
from probes p
left join assistant.knowledge_documents kd
  on kd.status='approved'
 and kd.is_chat_eligible is true
 and (
   kd.title ilike '%' || p.search_phrase || '%'
   or kd.content ilike '%' || p.search_phrase || '%'
   or kd.summary ilike '%' || p.search_phrase || '%'
   or coalesce(kd.tags::text, '') ilike '%' || p.search_phrase || '%'
 )
group by p.search_phrase
order by p.search_phrase;

-- Sample rows for operator screenshots/evidence capture.
select
  kd.title,
  kd.status,
  kd.is_chat_eligible,
  kd.metadata_json->>'legacy_registry_key' as legacy_registry_key,
  count(kc.id) as citations_count
from assistant.knowledge_documents kd
left join assistant.knowledge_citations kc on kc.knowledge_document_id = kd.id
where kd.status='approved'
  and kd.is_chat_eligible is true
  and (kd.metadata_json->>'batch' = 'knowledge_batch_05' or kd.metadata_json ? 'legacy_registry_key' or kd.metadata_json ? 'registry_key')
group by kd.id
order by kd.updated_at desc nulls last, kd.title
limit 25;
