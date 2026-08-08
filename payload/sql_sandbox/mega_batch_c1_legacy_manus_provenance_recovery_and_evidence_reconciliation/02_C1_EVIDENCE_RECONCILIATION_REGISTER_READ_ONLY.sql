-- Mega Batch C1 — material-level legacy provenance evidence register
-- STRICT READ ONLY. Review/export this result before any mapping proposal. No INSERT/UPDATE/DELETE is permitted.
begin transaction read only;

with recursive payload_walk as (
  select
    lir.id,
    lir.legacy_batch,
    lir.legacy_source_file,
    lir.legacy_table_name,
    lir.legacy_record_key,
    lir.target_table,
    lir.migration_status,
    lir.payload_json as value,
    array[]::text[] as key_path,
    0 as depth
  from assistant.legacy_import_register lir
  where lir.payload_json is not null

  union all

  select
    walk.id,
    walk.legacy_batch,
    walk.legacy_source_file,
    walk.legacy_table_name,
    walk.legacy_record_key,
    walk.target_table,
    walk.migration_status,
    child.value,
    walk.key_path || child.key,
    walk.depth + 1
  from payload_walk walk
  cross join lateral (
    select object_child.key, object_child.value
    from jsonb_each(case when jsonb_typeof(walk.value) = 'object' then walk.value else '{}'::jsonb end) object_child
    union all
    select array_child.ordinality::text as key, array_child.value
    from jsonb_array_elements(case when jsonb_typeof(walk.value) = 'array' then walk.value else '[]'::jsonb end)
      with ordinality array_child(value, ordinality)
  ) child
  where walk.depth < 8
), scalar_fields as (
  select
    id, legacy_batch, legacy_source_file, legacy_table_name, legacy_record_key, target_table, migration_status,
    key_path,
    regexp_replace(lower(coalesce(key_path[array_length(key_path, 1)], '')), '[^a-z0-9]+', '', 'g') as field_key,
    value #>> '{}' as scalar_value
  from payload_walk
  where jsonb_typeof(value) in ('string', 'number', 'boolean')
), raw_evidence as (
  select
    id,
    max(scalar_value) filter (where field_key in ('title','documenttitle','name','question','subject')) as legacy_title,
    max(scalar_value) filter (where field_key in ('source','sourcename','reference','origin','publicationtitle')) as raw_source_value,
    max(scalar_value) filter (where field_key in ('sourceurl','canonicalurl','originurl','originalurl','referenceurl','websiteurl')) as raw_source_url_value,
    max(scalar_value) filter (where field_key in ('url','link','website')) as raw_url_value,
    max(scalar_value) filter (where field_key in ('pdfurl','pdf','documenturl','fileurl')) as raw_pdf_url_value,
    max(scalar_value) filter (where field_key in ('author','authorname','creator','writer')) as raw_author_value,
    max(scalar_value) filter (where field_key in ('publisher','publishername','issuer','organization','organisation')) as raw_publisher_value,
    max(scalar_value) filter (where field_key in ('sourceid','fetchsourceid')) as legacy_fetch_source_id,
    array_agg(distinct key_path::text order by key_path::text) filter (where field_key in ('source','sourcename','sourceurl','url','pdfurl','author','publisher','publishername','issuer','id','uuid')) as evidence_paths
  from scalar_fields
  group by id
), legacy_rows as (
  select
    lir.id as legacy_import_id,
    lir.legacy_batch,
    lir.legacy_source_file,
    lir.legacy_table_name,
    lir.legacy_record_key,
    lir.target_table,
    lir.migration_status,
    evidence.*
  from assistant.legacy_import_register lir
  left join raw_evidence evidence on evidence.id = lir.id
), current_materials as (
  select id::text as current_id, title, 'reference_document'::text as current_material_type from assistant.reference_documents
  union all
  select id::text as current_id, title, 'knowledge_document'::text as current_material_type from assistant.knowledge_documents
), matched as (
  select
    legacy_rows.*,
    direct.current_id as direct_current_id,
    direct.current_material_type as direct_current_material_type,
    title_match.current_id as title_current_id,
    title_match.current_material_type as title_current_material_type,
    count(title_match.current_id) over (partition by legacy_rows.legacy_import_id) as title_match_count
  from legacy_rows
  left join current_materials direct on direct.current_id = legacy_rows.legacy_record_key
  left join current_materials title_match
    on lower(regexp_replace(coalesce(title_match.title, ''), '\s+', ' ', 'g')) = lower(regexp_replace(coalesce(legacy_rows.legacy_title, ''), '\s+', ' ', 'g'))
    and coalesce(legacy_rows.legacy_title, '') <> ''
)
select distinct on (legacy_import_id)
  legacy_import_id,
  legacy_batch,
  legacy_source_file,
  legacy_table_name,
  legacy_record_key,
  target_table,
  migration_status,
  legacy_title,
  raw_source_value,
  raw_source_url_value,
  raw_url_value,
  raw_pdf_url_value,
  raw_author_value,
  raw_publisher_value,
  legacy_fetch_source_id,
  evidence_paths,
  case
    when direct_current_id is not null then 'direct_legacy_identifier'
    when title_match_count = 1 then 'normalized_title_exact_candidate'
    when title_match_count > 1 then 'normalized_title_ambiguous'
    else 'no_safe_current_match'
  end as mapping_method,
  case
    when direct_current_id is not null then 'high'
    when title_match_count = 1 then 'medium'
    when title_match_count > 1 then 'ambiguous'
    else 'none'
  end as mapping_confidence,
  coalesce(direct_current_id, title_current_id) as candidate_current_material_id,
  coalesce(direct_current_material_type, title_current_material_type) as candidate_current_material_type,
  true as review_required,
  'READ_ONLY_C1_NO_SOURCE_OR_RIGHTS_WRITE' as governance_state
from matched
where raw_source_value is not null
   or raw_source_url_value is not null
   or raw_url_value is not null
   or raw_pdf_url_value is not null
   or raw_author_value is not null
   or raw_publisher_value is not null
order by legacy_import_id, candidate_current_material_id nulls last;

rollback;