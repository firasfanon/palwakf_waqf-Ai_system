-- LIVE_READ_ONLY_PREFLIGHT ONLY. No writes. No web fetch.
-- V1.1.1 correction: routine identity uses the exact PostgreSQL signature and preflight fails closed.
begin transaction read only;

select current_database() as database_name, current_user as execution_role, current_setting('transaction_read_only') as transaction_read_only, now() as checked_at;

with required_objects(required_object, object_kind) as (
 values
  ('assistant.assert_knowledge_reviewer_scope_v1(uuid,text)', 'function'),
  ('assistant.knowledge_activation_runs', 'relation'),
  ('assistant.knowledge_activation_items', 'relation'),
  ('assistant.knowledge_documents', 'relation'),
  ('assistant.reference_documents', 'relation'),
  ('assistant.knowledge_sources', 'relation'),
  ('assistant.legacy_import_register', 'relation'),
  ('assistant.reference_files', 'relation'),
  ('assistant.knowledge_review_tasks', 'relation')
)
select
 required_object,
 case
  when object_kind = 'function' then to_regprocedure(required_object) is not null
  else to_regclass(required_object) is not null
 end as present
from required_objects
order by required_object;

do $$
begin
 if to_regprocedure('assistant.assert_knowledge_reviewer_scope_v1(uuid,text)') is null then
  raise exception 'required routine missing: assistant.assert_knowledge_reviewer_scope_v1(uuid,text)';
 end if;
 if to_regclass('assistant.knowledge_activation_runs') is null
    or to_regclass('assistant.knowledge_activation_items') is null
    or to_regclass('assistant.knowledge_documents') is null
    or to_regclass('assistant.reference_documents') is null
    or to_regclass('assistant.knowledge_sources') is null
    or to_regclass('assistant.legacy_import_register') is null
    or to_regclass('assistant.reference_files') is null
    or to_regclass('assistant.knowledge_review_tasks') is null then
  raise exception 'one or more required assistant relations are missing';
 end if;
end $$;
with latest_activation as (
 select id,created_at,summary_json from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1
), source_required as (
 select distinct knowledge_document_id,reference_document_id from assistant.knowledge_activation_items
 where activation_run_id=(select id from latest_activation) and lifecycle_bucket='source_verification_required'
), current_docs as (
 select sr.knowledge_document_id,sr.reference_document_id,to_jsonb(kd) kd_json,to_jsonb(rd) rd_json
 from source_required sr join assistant.knowledge_documents kd on kd.id=sr.knowledge_document_id left join assistant.reference_documents rd on rd.id=sr.reference_document_id
), current_normalized as (
 select *,
  nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'title',''),nullif(kd_json#>>'{metadata_json,title}',''),nullif(rd_json->>'title',''),nullif(rd_json#>>'{metadata_json,title}',''))),'\s+',' ','g')),'') normalized_title,
  nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'legacy_dedupe_key',''),nullif(kd_json#>>'{metadata_json,legacy_dedupe_key}',''),nullif(rd_json->>'legacy_dedupe_key',''),nullif(rd_json#>>'{metadata_json,legacy_dedupe_key}',''))),'\s+',' ','g')),'') legacy_dedupe_key,
  nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'legacy_record_key',''),nullif(kd_json#>>'{metadata_json,legacy_record_key}',''),nullif(rd_json->>'legacy_record_key',''),nullif(rd_json#>>'{metadata_json,legacy_record_key}',''))),'\s+',' ','g')),'') legacy_record_key,
  nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'source_url',''),nullif(kd_json->>'url',''),nullif(kd_json#>>'{metadata_json,source_url}',''),nullif(kd_json#>>'{metadata_json,source}',''),nullif(rd_json->>'source_url',''),nullif(rd_json->>'url',''),nullif(rd_json#>>'{metadata_json,source_url}',''),nullif(rd_json#>>'{metadata_json,source}',''))),'/+$','')),'') normalized_url,
  case when char_length(trim(coalesce(nullif(kd_json->>'content',''),nullif(kd_json->>'content_text',''),nullif(kd_json#>>'{metadata_json,content_text}',''))))>=120 then md5(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'content',''),nullif(kd_json->>'content_text',''),nullif(kd_json#>>'{metadata_json,content_text}',''))),'\s+',' ','g'))) end content_fingerprint
 from current_docs
), legacy_rows as (
 select id import_id,legacy_batch,legacy_source_file,legacy_record_key,legacy_dedupe_key,payload_json->'row' row_json
 from assistant.legacy_import_register where jsonb_typeof(payload_json->'row')='object'
), legacy_normalized as (
 select *,
  nullif(lower(regexp_replace(trim(coalesce(nullif(row_json->>'title',''),nullif(row_json#>>'{metadata_json,title}',''),nullif(row_json->>'name',''))),'\s+',' ','g')),'') normalized_title,
  nullif(lower(regexp_replace(trim(coalesce(nullif(row_json->>'url',''),nullif(row_json->>'source_url',''),nullif(row_json->>'sourceUrl',''),nullif(row_json#>>'{metadata_json,source}',''),nullif(row_json->>'source',''))),'/+$','')),'') normalized_url,
  case when char_length(trim(coalesce(nullif(row_json->>'content_text',''),nullif(row_json->>'content',''))))>=120 then md5(lower(regexp_replace(trim(coalesce(nullif(row_json->>'content_text',''),nullif(row_json->>'content',''))),'\s+',' ','g'))) end content_fingerprint
 from legacy_rows
), title_summary as (
 select cd.knowledge_document_id,count(distinct ln.import_id) candidate_rows,count(distinct ln.normalized_url) filter(where ln.normalized_url ~ '^https?://' and ln.normalized_url !~ '^https?://example\.com') candidate_urls
 from current_normalized cd join legacy_normalized ln on cd.normalized_title is not null and cd.normalized_title=ln.normalized_title group by cd.knowledge_document_id
), classed as (
 select cd.knowledge_document_id,
 case
  when exists(select 1 from legacy_normalized ln where (cd.legacy_dedupe_key is not null and lower(ln.legacy_dedupe_key)=cd.legacy_dedupe_key) or (cd.legacy_record_key is not null and lower(coalesce(ln.legacy_record_key,''))=cd.legacy_record_key)) then 'exact_legacy_key'
  when exists(select 1 from legacy_normalized ln where cd.content_fingerprint is not null and cd.content_fingerprint=ln.content_fingerprint) then 'exact_content_fingerprint'
  when exists(select 1 from legacy_normalized ln where cd.normalized_title is not null and cd.normalized_url ~ '^https?://' and cd.normalized_title=ln.normalized_title and cd.normalized_url=ln.normalized_url) then 'exact_title_and_url'
  when coalesce(ts.candidate_urls,0)=1 then 'exact_title_unique_valid_url_candidate'
  when coalesce(ts.candidate_rows,0)>0 then 'exact_title_without_url_candidate'
  else 'no_deterministic_candidate' end as binding_method
 from current_normalized cd left join title_summary ts on ts.knowledge_document_id=cd.knowledge_document_id
)
select binding_method,count(*) as documents
from classed group by binding_method order by documents desc,binding_method;

with latest_activation as (select id from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1), source_required as (
 select distinct reference_document_id from assistant.knowledge_activation_items where activation_run_id=(select id from latest_activation) and lifecycle_bucket='source_verification_required'
)
select count(*) total_reference_files,count(*) filter(where rf.reference_document_id in(select reference_document_id from source_required)) linked_to_source_verification,
 count(*) filter(where char_length(coalesce(rf.extracted_text,''))>0) files_with_extracted_text,
 count(*) filter(where coalesce(rf.extracted_text,'')~*'https?://') files_with_embedded_url
from assistant.reference_files rf;

select
 count(*) filter(where payload_json::text ~* 'https?://example\.com') as legacy_test_url_records,
 count(*) filter(where payload_json::text ~* 'https?://') as legacy_records_with_http_hint,
 count(*) as total_legacy_records
from assistant.legacy_import_register;

select count(*) as active_duplicate_citation_groups
from (select target_type,target_id from assistant.knowledge_review_tasks where workflow_stage='citation_verification' and status in('open','assigned','in_progress','blocked') group by target_type,target_id having count(*)>1) d;

rollback;
