-- Mega Batch C1 — nested legacy provenance field census
-- STRICT READ ONLY. It outputs only metadata fields, never legacy body/content text.
begin transaction read only;

with recursive payload_walk as (
  select
    lir.id,
    lir.legacy_batch,
    lir.legacy_source_file,
    lir.legacy_table_name,
    lir.legacy_record_key,
    lir.migration_status,
    array[]::text[] as key_path,
    lir.payload_json as value,
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
    walk.migration_status,
    walk.key_path || child.key,
    child.value,
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
), candidate_fields as (
  select
    id,
    legacy_batch,
    legacy_source_file,
    legacy_table_name,
    legacy_record_key,
    migration_status,
    key_path,
    regexp_replace(lower(coalesce(key_path[array_length(key_path, 1)], '')), '[^a-z0-9]+', '', 'g') as normalized_key,
    value #>> '{}' as scalar_value
  from payload_walk
  where jsonb_typeof(value) in ('string', 'number', 'boolean')
)
select
  normalized_key as legacy_field_key,
  count(*) as occurrence_count,
  count(distinct id) as legacy_record_count,
  array_agg(distinct legacy_table_name order by legacy_table_name) as observed_legacy_tables,
  (array_agg(distinct key_path::text order by key_path::text) filter (where key_path is not null))[1:20] as example_paths
from candidate_fields
where normalized_key in (
  'source','sourcename','sourceurl','url','pdfurl','pdf','documenturl','fileurl',
  'author','authorname','creator','writer','publisher','publishername','issuer',
  'organization','organisation','originalurl','originurl','canonicalurl','referenceurl','websiteurl',
  'sourceid','fetchsourceid','knowledgedocumentid','referencedocumentid','id','uuid',
  'title','documenttitle','question','subject'
)
group by normalized_key
order by occurrence_count desc, legacy_field_key;

rollback;