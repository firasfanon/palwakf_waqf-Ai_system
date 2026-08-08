-- Sovereign Assistant Trust Foundation v1
-- OPERATOR APPLY: deterministic backfill only.
-- IMPORTANT: this script does not mark legacy sources/citations as human-verified.
-- It quarantines obvious test fixtures from chat retrieval and opens human-review tasks.

begin;

with classified as (
  select
    kd.id,
    case
      when kd.title ~* '(^|[[:space:]])(minimal[[:space:]]+test|test[[:space:]]+document|اختبار|تجريبي|demo|sample)([[:space:]]|$)' then 'test'
      when coalesce(kd.metadata_json->>'content_status','') in ('test','duplicate','quarantined','review','legacy','production') then kd.metadata_json->>'content_status'
      else 'production'
    end as next_content_status,
    case
      when coalesce(kd.metadata_json->>'visibility_scope','') in ('public','internal','restricted') then kd.metadata_json->>'visibility_scope'
      when kd.domain_scope = 'internal_procedure' then 'internal'
      else 'public'
    end as next_visibility_scope,
    case
      when exists (select 1 from assistant.knowledge_citations kc where kc.knowledge_document_id = kd.id) then 'linked'
      else 'missing'
    end as next_citation_status
  from assistant.knowledge_documents kd
)
update assistant.knowledge_documents kd
set
  content_status = classified.next_content_status,
  visibility_scope = classified.next_visibility_scope,
  requires_human_review = true,
  is_chat_eligible = case when classified.next_content_status in ('test','duplicate','quarantined') then false else kd.is_chat_eligible end,
  metadata_json = coalesce(kd.metadata_json, '{}'::jsonb) || jsonb_build_object(
    'trust_foundation_version','v1',
    'content_status', classified.next_content_status,
    'visibility_scope', classified.next_visibility_scope,
    'citation_verification_status', classified.next_citation_status,
    'human_review_required', true,
    'automatic_classification_note','KB58 deterministic migration classification; no human verification asserted.'
  )
from classified
where kd.id = classified.id;

update assistant.reference_documents rd
set
  content_status = case
    when rd.title ~* '(^|[[:space:]])(minimal[[:space:]]+test|test[[:space:]]+document|اختبار|تجريبي|demo|sample)([[:space:]]|$)' then 'test'
    else coalesce(nullif(rd.content_status,''),'production')
  end,
  visibility_scope = case
    when rd.domain_scope = 'internal_procedure' then 'internal'
    else coalesce(nullif(rd.visibility_scope,''),'public')
  end,
  verification_status = case
    when rd.verification_status in ('verified','rejected','expired') then rd.verification_status
    else 'pending'
  end,
  metadata_json = coalesce(rd.metadata_json, '{}'::jsonb) || jsonb_build_object(
    'trust_foundation_version','v1',
    'source_verification_status', case when rd.verification_status in ('verified','rejected','expired') then rd.verification_status else 'pending' end,
    'automatic_classification_note','KB58 does not automatically verify a legacy reference.'
  );

update assistant.knowledge_citations kc
set
  verification_status = case when kc.verification_status in ('verified','rejected') then kc.verification_status else 'linked' end,
  metadata_json = coalesce(kc.metadata_json, '{}'::jsonb) || jsonb_build_object(
    'trust_foundation_version','v1',
    'citation_verification_status', case when kc.verification_status in ('verified','rejected') then kc.verification_status else 'linked' end,
    'automatic_classification_note','Citation link migrated; human verification still required unless an explicit verified state already existed.'
  );

insert into assistant.knowledge_review_tasks (
  target_type, target_id, workflow_stage, priority, status, dedupe_key, notes, metadata_json
)
select
  'knowledge_document', kd.id, 'citation_verification',
  case when kd.authority_level in ('official','semi_official') then 'high' else 'normal' end,
  'open',
  'kb58:citation:' || kd.id::text,
  'Verify citation locator/excerpt against the canonical retained reference before marking verified.',
  jsonb_build_object('batch','KB58','citation_count',count(kc.id),'authority_level',kd.authority_level)
from assistant.knowledge_documents kd
left join assistant.knowledge_citations kc on kc.knowledge_document_id = kd.id
group by kd.id, kd.authority_level
having bool_or(coalesce(kc.verification_status,'missing') <> 'verified') or count(kc.id) = 0
on conflict (dedupe_key) do nothing;

insert into assistant.knowledge_review_tasks (
  target_type, target_id, workflow_stage, priority, status, dedupe_key, notes, metadata_json
)
select
  'knowledge_document', kd.id, 'content_classification', 'high', 'open',
  'kb58:quarantine:' || kd.id::text,
  'Legacy test/fixture content is quarantined from chat retrieval. Confirm retention, rename, merge, or archive decision.',
  jsonb_build_object('batch','KB58','content_status',kd.content_status)
from assistant.knowledge_documents kd
where kd.content_status in ('test','duplicate','quarantined')
on conflict (dedupe_key) do nothing;

insert into assistant.knowledge_review_tasks (
  target_type, target_id, workflow_stage, priority, status, dedupe_key, notes, metadata_json
)
select
  'reference_document', rd.id, 'source_verification',
  case when rd.authority_level = 'official' then 'high' else 'normal' end,
  'open',
  'kb58:source:' || rd.id::text,
  'Confirm issuer, canonical URL/file, effective date, and authority tier. Do not mark verified without documentary evidence.',
  jsonb_build_object('batch','KB58','authority_level',rd.authority_level,'verification_status',rd.verification_status)
from assistant.reference_documents rd
where rd.status = 'approved' and rd.verification_status <> 'verified'
on conflict (dedupe_key) do nothing;

commit;
