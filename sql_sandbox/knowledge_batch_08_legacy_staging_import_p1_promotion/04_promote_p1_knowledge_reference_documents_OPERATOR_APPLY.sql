-- Knowledge Batch 08 — TRUST-ALIGNED P1 promotion (REVIEW ONLY)
-- Replacement for the earlier KB08 step 04.
-- Purpose: promote valid P1 legacy records into canonical reference_documents,
-- knowledge_documents and linked citations WITHOUT approval or chat publication.
-- Trust alignment: every promoted record remains in_review, requires human review,
-- source verification is pending, citation verification is linked, and chat is disabled.
-- Requires: KB08 staging completed and Sovereign Trust Foundation v1/v1A applied.
-- Idempotent: safe to re-run after a completed run.

begin;

-- Hard guards: do not continue unless the required trust and staging layers exist.
do $$
begin
  if to_regclass('assistant.legacy_import_register') is null then
    raise exception 'KB08 staging table assistant.legacy_import_register does not exist. Run stage 02 first.';
  end if;
  if to_regclass('assistant.knowledge_review_tasks') is null then
    raise exception 'Trust workflow table assistant.knowledge_review_tasks does not exist. Apply Trust Foundation v1 first.';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema='assistant' and table_name='reference_documents' and column_name='verification_status'
  ) then
    raise exception 'Trust columns are missing from assistant.reference_documents. Apply Trust Foundation v1 first.';
  end if;
end $$;

-- Normalize the two KB08 staging batches into a temporary candidate set.
create temp table kb08_review_raw on commit drop as
select
  lir.id as legacy_import_id,
  lir.legacy_batch,
  lir.legacy_table_name,
  lir.legacy_source_file,
  lir.legacy_record_key,
  lir.legacy_dedupe_key,
  lir.payload_json,
  coalesce(
    nullif(lir.payload_json #>> '{row,title}', ''),
    nullif(lir.payload_json #>> '{row,question}', ''),
    nullif(lir.payload_json #>> '{title}', ''),
    nullif(lir.legacy_record_key, '')
  ) as title,
  coalesce(
    nullif(lir.payload_json #>> '{row,content_text}', ''),
    nullif(lir.payload_json #>> '{row,content}', ''),
    nullif(lir.payload_json #>> '{row,description}', ''),
    nullif(lir.payload_json #>> '{row,summary}', ''),
    nullif(lir.payload_json #>> '{content_text}', ''),
    nullif(lir.payload_json #>> '{content}', ''),
    nullif(lir.payload_json #>> '{summary}', '')
  ) as content_text,
  coalesce(
    nullif(lir.payload_json #>> '{row,summary}', ''),
    nullif(lir.payload_json #>> '{row,description}', ''),
    nullif(left(lir.payload_json #>> '{row,content}', 4000), ''),
    nullif(left(lir.payload_json #>> '{row,content_text}', 4000), '')
  ) as summary,
  coalesce(
    nullif(lir.payload_json #>> '{row,source_url}', ''),
    nullif(lir.payload_json #>> '{row,url}', ''),
    nullif(lir.payload_json #>> '{source_url}', ''),
    nullif(lir.payload_json #>> '{row,source}', '')
  ) as source_url,
  coalesce(nullif(lir.payload_json #>> '{row,author}', ''), nullif(lir.payload_json #>> '{author}', '')) as author,
  coalesce(nullif(lir.payload_json #>> '{row,document_type}', ''), nullif(lir.payload_json #>> '{row,type}', ''), nullif(lir.payload_json #>> '{document_type}', ''), 'legacy_reference') as document_type,
  coalesce(nullif(lir.payload_json #>> '{row,language}', ''), nullif(lir.payload_json #>> '{language}', ''), 'ar') as language,
  coalesce(nullif(lir.payload_json #>> '{row,authority_level}', ''), nullif(lir.payload_json #>> '{authority_level}', ''), 'unverified') as raw_authority_level,
  coalesce(nullif(lir.payload_json #>> '{row,domain_scope}', ''), nullif(lir.payload_json #>> '{domain_scope}', ''), nullif(lir.payload_json #>> '{row,category}', ''), nullif(lir.payload_json #>> '{category}', ''), 'other') as raw_domain_scope,
  coalesce(nullif(lir.payload_json #>> '{row,category}', ''), nullif(lir.payload_json #>> '{category}', ''), 'reference') as raw_category,
  coalesce(
    nullif(lir.payload_json #>> '{row,registry_key}', ''),
    nullif(lir.payload_json #>> '{row,metadata_json,legacy_registry_key}', ''),
    nullif(lir.payload_json #>> '{row,metadata_json,registry_key}', ''),
    lir.legacy_dedupe_key
  ) as legacy_registry_key,
  lir.payload_json #> '{row,tags}' as raw_tags
from assistant.legacy_import_register lir
where lir.legacy_batch in ('knowledge_batch_08', 'knowledge_batch_08_observed_rows')
  and lir.migration_priority = 'P1'
  and lir.legacy_table_name in ('knowledge_documents', 'legacy_json_content', 'land_references')
  and lir.migration_status in ('staged', 'needs_mapping');

create temp table kb08_review_candidates on commit drop as
select
  r.*,
  case
    when lower(r.raw_authority_level) in ('official','semi_official','reference','unverified') then lower(r.raw_authority_level)
    else 'unverified'
  end as authority_level,
  case
    when lower(r.raw_domain_scope) in ('waqf_law','law','legal','قانوني') then 'waqf_law'
    when lower(r.raw_domain_scope) in ('fiqh','jurisprudence','فقهي') then 'fiqh'
    when lower(r.raw_domain_scope) in ('administrative','إداري') then 'administrative'
    when lower(r.raw_domain_scope) in ('historical','تاريخي') then 'historical'
    when lower(r.raw_domain_scope) in ('public_info','public') then 'public_info'
    when lower(r.raw_domain_scope) in ('internal_procedure','internal') then 'internal_procedure'
    else 'other'
  end as domain_scope,
  case
    when lower(r.raw_category) in ('law','legal','قانوني') then 'law'
    when lower(r.raw_category) in ('jurisprudence','fiqh','فقهي') then 'jurisprudence'
    when lower(r.raw_category) in ('historical','تاريخي') then 'historical'
    when lower(r.raw_category) in ('administrative','إداري') then 'administrative'
    else 'reference'
  end as category,
  case when nullif(r.source_url,'') is not null then 'external_fetch' else 'seeded' end as source_type,
  case when lower(coalesce(r.title,'')) ~ '(minimal[[:space:]]+test|test[[:space:]]+document|اختبار|تجريبي|demo|sample)' then 'test' else 'legacy' end as content_status,
  case when lower(coalesce(r.raw_domain_scope,'')) in ('internal_procedure','internal') then 'internal' else 'public' end as visibility_scope,
  md5(coalesce(r.content_text,'') || '|' || coalesce(r.legacy_registry_key, r.legacy_dedupe_key)) as record_content_hash,
  jsonb_build_object(
    'batch','knowledge_batch_08',
    'trust_alignment','v62_review_only',
    'legacy_import_id',r.legacy_import_id,
    'legacy_batch',r.legacy_batch,
    'legacy_source_file',r.legacy_source_file,
    'legacy_table_name',r.legacy_table_name,
    'legacy_dedupe_key',r.legacy_dedupe_key,
    'legacy_registry_key',r.legacy_registry_key,
    'legacy_record_key',r.legacy_record_key,
    'source_url',r.source_url,
    'author',r.author,
    'original_payload',r.payload_json
  ) as promotion_metadata
from kb08_review_raw r
where nullif(trim(coalesce(r.title,'')), '') is not null
  and nullif(trim(coalesce(r.content_text,'')), '') is not null;

-- Keep incomplete rows, but mark them for mapping rather than silently discarding them.
update assistant.legacy_import_register lir
set migration_status = 'needs_mapping',
    notes = concat_ws(' | ', nullif(lir.notes,''), 'KB08 v62: title/content missing; retained in staging for mapping.')
where lir.id in (
  select legacy_import_id from kb08_review_raw
  where nullif(trim(coalesce(title,'')), '') is null
     or nullif(trim(coalesce(content_text,'')), '') is null
);

-- One unverified source registry for this recovered review corpus. Individual canonical source
-- verification remains a review task per reference document.
insert into assistant.knowledge_sources (
  name, type, base_url, description, authority_level, is_active,
  verification_status, review_required, metadata_json
)
select
  'Recovered legacy corpus — KB08 review queue',
  'seeded',
  null,
  'Legacy P1 corpus promoted into review only. Not verified, not approved, and not chat-visible.',
  'unverified',
  true,
  'pending',
  true,
  jsonb_build_object(
    'batch','knowledge_batch_08',
    'import_batch_key','kb08_v62_review_only_promotion_2026_06_19',
    'trust_alignment','review_only',
    'no_public_chat_release',true
  )
where not exists (
  select 1 from assistant.knowledge_sources ks
  where ks.metadata_json->>'import_batch_key' = 'kb08_v62_review_only_promotion_2026_06_19'
);

create temp table kb08_review_source on commit drop as
select id as source_id
from assistant.knowledge_sources
where metadata_json->>'import_batch_key' = 'kb08_v62_review_only_promotion_2026_06_19'
limit 1;

-- Canonical references remain in_review and pending source verification.
insert into assistant.reference_documents (
  source_id, title, document_type, language, status, authority_level, domain_scope, source_type,
  summary, content_text, content_hash, metadata_json,
  approval_version, review_notes, review_decision, reviewed_at,
  verification_status, visibility_scope, content_status
)
select
  s.source_id,
  c.title,
  c.document_type,
  c.language,
  'in_review',
  c.authority_level,
  c.domain_scope,
  c.source_type,
  nullif(left(coalesce(c.summary,''),4000),''),
  c.content_text,
  c.record_content_hash,
  c.promotion_metadata,
  0,
  'KB08 v62 review-only promotion. Human source verification and approval required before publication.',
  null,
  null,
  'pending',
  c.visibility_scope,
  c.content_status
from kb08_review_candidates c
cross join kb08_review_source s
where not exists (
  select 1 from assistant.reference_documents rd
  where rd.metadata_json->>'legacy_import_id' = c.legacy_import_id::text
     or rd.metadata_json->>'legacy_dedupe_key' = c.legacy_dedupe_key
     or (rd.content_hash = c.record_content_hash and coalesce(rd.title,'') = c.title)
);

create temp table kb08_reference_map on commit drop as
select distinct on (c.legacy_import_id)
  c.legacy_import_id,
  rd.id as reference_document_id,
  rd.authority_level,
  rd.content_status,
  rd.visibility_scope
from kb08_review_candidates c
join assistant.reference_documents rd
  on rd.metadata_json->>'legacy_import_id' = c.legacy_import_id::text
  or rd.metadata_json->>'legacy_dedupe_key' = c.legacy_dedupe_key
  or (rd.content_hash = c.record_content_hash and rd.title = c.title)
order by c.legacy_import_id, rd.created_at desc;

-- Derived knowledge is also review-only. It is never approved or chat eligible in this step.
insert into assistant.knowledge_documents (
  reference_document_id, source_id, title, category, status, authority_level, domain_scope, source_type,
  summary, content, tags, is_chat_eligible, chat_priority, grounding_weight,
  approval_version, review_notes, review_decision, reviewed_at, metadata_json,
  content_status, visibility_scope, requires_human_review
)
select
  rm.reference_document_id,
  s.source_id,
  c.title,
  c.category,
  'in_review',
  c.authority_level,
  c.domain_scope,
  c.source_type,
  nullif(left(coalesce(c.summary,''),4000),''),
  c.content_text,
  case
    when jsonb_typeof(c.raw_tags) = 'array' then c.raw_tags
    when jsonb_typeof(c.raw_tags) = 'string' then jsonb_build_array(trim(both '"' from c.raw_tags::text))
    else '[]'::jsonb
  end,
  false,
  45,
  1.000,
  0,
  'KB08 v62 review-only knowledge promotion. Requires verified source, verified citation, scope check and human release.',
  null,
  null,
  c.promotion_metadata || jsonb_build_object('derived_from_reference_document_id',rm.reference_document_id),
  c.content_status,
  c.visibility_scope,
  true
from kb08_review_candidates c
join kb08_reference_map rm on rm.legacy_import_id = c.legacy_import_id
cross join kb08_review_source s
where not exists (
  select 1 from assistant.knowledge_documents kd
  where kd.metadata_json->>'legacy_import_id' = c.legacy_import_id::text
     or kd.metadata_json->>'legacy_dedupe_key' = c.legacy_dedupe_key
     or (kd.reference_document_id = rm.reference_document_id and kd.content = c.content_text)
);

create temp table kb08_knowledge_map on commit drop as
select distinct on (c.legacy_import_id)
  c.legacy_import_id,
  kd.id as knowledge_document_id,
  kd.reference_document_id,
  kd.authority_level,
  kd.content_status,
  kd.visibility_scope
from kb08_review_candidates c
join assistant.knowledge_documents kd
  on kd.metadata_json->>'legacy_import_id' = c.legacy_import_id::text
  or kd.metadata_json->>'legacy_dedupe_key' = c.legacy_dedupe_key
  or (kd.content = c.content_text and kd.title = c.title)
order by c.legacy_import_id, kd.created_at desc;

-- A linked citation is created for review; it is explicitly not verified.
insert into assistant.knowledge_citations (
  knowledge_document_id, reference_document_id, citation_type, locator, excerpt,
  metadata_json, verification_status
)
select
  km.knowledge_document_id,
  km.reference_document_id,
  'legacy_reference_promotion_review',
  'KB08 recovered legacy record; verify canonical locator/source before publication.',
  null,
  jsonb_build_object(
    'batch','knowledge_batch_08',
    'trust_alignment','v62_review_only',
    'legacy_import_id',km.legacy_import_id,
    'citation_policy','linked_not_verified'
  ),
  'linked'
from kb08_knowledge_map km
where km.reference_document_id is not null
  and not exists (
    select 1 from assistant.knowledge_citations kc
    where kc.metadata_json->>'legacy_import_id' = km.legacy_import_id::text
      and kc.citation_type = 'legacy_reference_promotion_review'
  );

-- Create human-review tasks. Idempotent keys allow a safe rerun.
insert into assistant.knowledge_review_tasks (
  target_type, target_id, workflow_stage, priority, status, dedupe_key, notes, metadata_json
)
select
  'reference_document', rm.reference_document_id, 'source_verification',
  case when rm.authority_level in ('official','semi_official') then 'high' else 'normal' end,
  'open',
  'kb08v62:source:' || rm.reference_document_id::text,
  'Verify issuer, canonical URL/file, authority tier, date and scope. Do not approve or publish before documentary verification.',
  jsonb_build_object('batch','KB08','trust_alignment','v62_review_only','legacy_import_id',rm.legacy_import_id)
from kb08_reference_map rm
on conflict (dedupe_key) do nothing;

insert into assistant.knowledge_review_tasks (
  target_type, target_id, workflow_stage, priority, status, dedupe_key, notes, metadata_json
)
select
  'knowledge_document', km.knowledge_document_id, 'citation_verification',
  case when km.authority_level in ('official','semi_official') then 'high' else 'normal' end,
  'open',
  'kb08v62:citation:' || km.knowledge_document_id::text,
  'Verify citation locator/excerpt against the retained reference. Linked does not mean verified.',
  jsonb_build_object('batch','KB08','trust_alignment','v62_review_only','legacy_import_id',km.legacy_import_id)
from kb08_knowledge_map km
on conflict (dedupe_key) do nothing;

insert into assistant.knowledge_review_tasks (
  target_type, target_id, workflow_stage, priority, status, dedupe_key, notes, metadata_json
)
select
  'knowledge_document', km.knowledge_document_id, 'content_classification', 'high', 'open',
  'kb08v62:classification:' || km.knowledge_document_id::text,
  'Legacy fixture/test-like record: confirm quarantine, retention, merge or archive decision.',
  jsonb_build_object('batch','KB08','content_status',km.content_status,'legacy_import_id',km.legacy_import_id)
from kb08_knowledge_map km
where km.content_status in ('test','duplicate','quarantined')
on conflict (dedupe_key) do nothing;

-- Mark only mapped candidates as promoted. Incomplete records remain needs_mapping.
update assistant.legacy_import_register lir
set migration_status = 'promoted',
    notes = concat_ws(' | ', nullif(lir.notes,''), 'KB08 v62 promoted into review-only reference/knowledge/citation workflow; not approved and not chat-visible.')
where lir.id in (select legacy_import_id from kb08_knowledge_map);

select
  (select count(*) from kb08_review_raw) as staged_p1_rows_considered,
  (select count(*) from kb08_review_candidates) as valid_review_candidates,
  (select count(*) from kb08_review_raw) - (select count(*) from kb08_review_candidates) as needs_mapping_rows,
  (select count(*) from kb08_reference_map) as reference_documents_mapped,
  (select count(*) from kb08_knowledge_map) as knowledge_documents_mapped,
  (select count(*) from assistant.knowledge_citations kc where kc.metadata_json->>'trust_alignment'='v62_review_only') as linked_review_citations_total,
  (select count(*) from assistant.legacy_import_register lir where lir.id in (select legacy_import_id from kb08_knowledge_map) and lir.migration_status='promoted') as register_rows_marked_promoted,
  0 as approved_on_promotion,
  0 as chat_visible_on_promotion;

commit;
