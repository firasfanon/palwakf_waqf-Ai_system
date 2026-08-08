-- Mega Batch C2 — clustered operational disposition evidence.
-- STRICT READ ONLY. No source, rights, document, citation, Chat/RAG, or lifecycle writes.
begin transaction read only;

with recursive payload_walk as (
  select
    lir.id,
    lir.legacy_source_file,
    lir.legacy_table_name,
    lir.legacy_record_key,
    lir.payload_json as value,
    array[]::text[] as key_path,
    0 as depth
  from assistant.legacy_import_register lir
  where lir.payload_json is not null

  union all

  select
    walk.id,
    walk.legacy_source_file,
    walk.legacy_table_name,
    walk.legacy_record_key,
    child.value,
    walk.key_path || child.key,
    walk.depth + 1
  from payload_walk walk
  cross join lateral (
    select object_child.key, object_child.value
    from jsonb_each(case when jsonb_typeof(walk.value) = 'object' then walk.value else '{}'::jsonb end) object_child
    union all
    select array_child.ordinality::text, array_child.value
    from jsonb_array_elements(case when jsonb_typeof(walk.value) = 'array' then walk.value else '[]'::jsonb end)
      with ordinality array_child(value, ordinality)
  ) child
  where walk.depth < 8
), scalar_fields as (
  select
    id,
    legacy_source_file,
    legacy_table_name,
    legacy_record_key,
    regexp_replace(lower(coalesce(key_path[array_length(key_path, 1)], '')), '[^a-z0-9]+', '', 'g') as field_key,
    value #>> '{}' as scalar_value
  from payload_walk
  where jsonb_typeof(value) in ('string', 'number', 'boolean')
), raw as (
  select
    id,
    max(legacy_source_file) as legacy_source_file,
    max(legacy_table_name) as legacy_table_name,
    max(legacy_record_key) as legacy_record_key,
    max(scalar_value) filter (where field_key in ('title','documenttitle','name','question','subject')) as title,
    max(scalar_value) filter (where field_key in ('source','sourcename','reference','origin','publicationtitle')) as raw_source,
    max(scalar_value) filter (where field_key in ('sourceurl','canonicalurl','originurl','originalurl','referenceurl','websiteurl')) as raw_source_url,
    max(scalar_value) filter (where field_key in ('url','link','website')) as raw_url,
    max(scalar_value) filter (where field_key in ('pdfurl','pdf','documenturl','fileurl')) as raw_pdf_url,
    max(scalar_value) filter (where field_key in ('author','authorname','creator','writer')) as author,
    max(scalar_value) filter (where field_key in ('publisher','publishername','issuer','organization','organisation')) as publisher
  from scalar_fields
  group by id
), normalized as (
  select
    raw.*,
    coalesce(nullif(trim(title), ''), nullif(trim(legacy_record_key), '')) as audit_title,
    coalesce(nullif(trim(raw_source_url), ''), nullif(trim(raw_url), ''), nullif(trim(raw_pdf_url), ''),
      case when raw_source ~* '^https?://' then nullif(trim(raw_source), '') end) as candidate_url,
    lower(regexp_replace(coalesce(title, legacy_record_key, ''), '[^[:alnum:]]+', ' ', 'g')) as title_key,
    lower(regexp_replace(coalesce(author, ''), '[^[:alnum:]]+', ' ', 'g')) as author_key
  from raw
), clustered as (
  select
    case
      when candidate_url ~* '^https?://' then 'url:' || lower(regexp_replace(candidate_url, '[#].*$', ''))
      when nullif(title_key, '') is not null and nullif(author_key, '') is not null then 'title_author:' || title_key || '|' || author_key
      when nullif(title_key, '') is not null then 'title:' || title_key
      when nullif(trim(raw_source), '') is not null then 'source:' || lower(trim(raw_source))
      else 'legacy:' || id::text
    end as cluster_key,
    *
  from normalized
), aggregation as (
  select
    cluster_key,
    max(audit_title) as title,
    count(*) as raw_rows,
    array_agg(distinct legacy_table_name order by legacy_table_name) as legacy_tables,
    array_agg(distinct legacy_source_file order by legacy_source_file) as legacy_files,
    array_agg(distinct author order by author) filter (where nullif(trim(author), '') is not null) as authors,
    array_agg(distinct publisher order by publisher) filter (where nullif(trim(publisher), '') is not null) as publishers,
    array_agg(distinct candidate_url order by candidate_url) filter (where candidate_url ~* '^https?://') as urls,
    array_agg(distinct raw_source order by raw_source) filter (where nullif(trim(raw_source), '') is not null) as raw_sources,
    bool_or(candidate_url ~* '^https?://(www\.)?example\.com|^https?://(localhost|127\.0\.0\.1|0\.0\.0\.0)') as has_test_url,
    bool_and(coalesce(lower(trim(raw_source)) in ('legacy_source_file','old_db_select_row','old_db_success_insert_query','null','undefined'), false))
      filter (where nullif(trim(raw_source), '') is not null) as source_is_technical_only,
    count(distinct regexp_replace(lower(coalesce(candidate_url, '')), '^https?://([^/]+).*$','\1')) filter (where candidate_url ~* '^https?://') as distinct_url_hosts,
    bool_or(candidate_url ~* '^https?://[^/]*(\.gov\.ps|\.gov/|\.gov$)') as has_official_candidate_url,
    bool_or(candidate_url ~* '^https?://[^/]*(springer\.com|jstor\.org|brill\.com|tandfonline\.com|archive\.org|books\.google\.com|\.edu/|\.edu$|palestine-studies\.org|palquest\.org|badil\.org|birzeit\.edu|najah\.edu|palarchive\.org|shamela\.ws)') as has_academic_candidate_url
  from clustered
  group by cluster_key
)
select
  cluster_key,
  title,
  raw_rows,
  legacy_tables,
  legacy_files,
  authors,
  publishers,
  urls,
  raw_sources,
  case
    when has_test_url then 'TEST_OR_INVALID_URL_QUARANTINE'
    when coalesce(source_is_technical_only, false) and coalesce(cardinality(authors), 0) = 0 and coalesce(cardinality(publishers), 0) = 0 and coalesce(cardinality(urls), 0) = 0 then 'TECHNICAL_MARKER_EXCLUDE'
    when distinct_url_hosts > 1 then 'AMBIGUOUS_NO_LINK'
    when has_official_candidate_url then 'OFFICIAL_SOURCE_CANDIDATE'
    when has_academic_candidate_url then 'ACADEMIC_SOURCE_CANDIDATE'
    when coalesce(cardinality(urls), 0) > 0 then 'SAFE_URL_CANDIDATE'
    when coalesce(cardinality(authors), 0) > 0 then 'AUTHOR_ONLY_RETAIN'
    when title is not null or coalesce(cardinality(publishers), 0) > 0 or coalesce(cardinality(raw_sources), 0) > 0 then 'TITLE_ONLY_RETAIN'
    else 'MISSING_RAW_PROVENANCE'
  end as c2_disposition,
  'READ_ONLY_C2_NO_SOURCE_LINK_WRITE_NO_RIGHTS_ASSIGNMENT_NO_CHAT_RELEASE' as governance_state
from aggregation
order by raw_rows desc, title nulls last;

rollback;
