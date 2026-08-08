-- LIVE OPERATOR APPLY ONLY AFTER SEPARATE LIVE AUTHORIZATION.
-- V1.1 reconstructs deterministic legacy lineage and candidate evidence only.
-- It never updates canonical sources, references, knowledge documents, citations, approval state, or chat eligibility.
begin;

do $$
begin
 if to_regprocedure('assistant.assert_knowledge_reviewer_scope_v1(uuid,text)') is null then raise exception 'missing assistant.assert_knowledge_reviewer_scope_v1'; end if;
 if to_regclass('assistant.knowledge_activation_runs') is null then raise exception 'missing assistant.knowledge_activation_runs'; end if;
 if to_regclass('assistant.knowledge_activation_items') is null then raise exception 'missing assistant.knowledge_activation_items'; end if;
 if to_regclass('assistant.legacy_import_register') is null then raise exception 'missing assistant.legacy_import_register'; end if;
 if to_regclass('assistant.reference_files') is null then raise exception 'missing assistant.reference_files'; end if;
end $$;

create table if not exists assistant.knowledge_provenance_reconstruction_runs_v1_1 (
 id uuid primary key default gen_random_uuid(),
 requested_by uuid not null,
 activation_run_id uuid not null references assistant.knowledge_activation_runs(id) on delete restrict,
 status text not null default 'completed' check(status in('running','completed','failed')),
 run_note text null,
 summary_json jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 completed_at timestamptz null
);

create table if not exists assistant.knowledge_provenance_reconstruction_items_v1_1 (
 id uuid primary key default gen_random_uuid(),
 provenance_run_id uuid not null references assistant.knowledge_provenance_reconstruction_runs_v1_1(id) on delete cascade,
 activation_run_id uuid not null references assistant.knowledge_activation_runs(id) on delete restrict,
 knowledge_document_id uuid not null references assistant.knowledge_documents(id) on delete restrict,
 reference_document_id uuid null references assistant.reference_documents(id) on delete set null,
 source_container_id uuid null references assistant.knowledge_sources(id) on delete set null,
 source_container_name text null,
 title_snapshot text not null,
 reference_title_snapshot text null,
 binding_method text not null check(binding_method in('exact_legacy_key','exact_content_fingerprint','exact_title_and_url','exact_title_unique_valid_url_candidate','exact_title_without_url_candidate','no_deterministic_candidate')),
 provenance_state text not null check(provenance_state in('deterministic_lineage_with_unique_url','deterministic_lineage_multiple_evidence','title_unique_valid_url_candidate','title_only_review','manual_containment_required','test_artifact_excluded')),
 candidate_group_key text not null,
 candidate_url text null,
 candidate_url_status text not null check(candidate_url_status in('valid_http_candidate','test_artifact_excluded','non_url_evidence','absent')),
 candidate_host_category text not null check(candidate_host_category in('government_host_candidate','institutional_or_academic_candidate','repository_or_publisher_candidate','external_source_candidate','test_artifact','not_classified')),
 evidence_metadata_json jsonb not null default '{}'::jsonb,
 legacy_import_count integer not null default 0,
 valid_url_count integer not null default 0,
 excluded_test_url_count integer not null default 0,
 reference_file_count integer not null default 0,
 linked_source_verification_task_count integer not null default 0,
 active_citation_task_count integer not null default 0,
 active_citation_duplicate_count integer not null default 0,
 created_at timestamptz not null default now(),
 constraint assistant_knowledge_provenance_reconstruction_items_v11_uk unique(provenance_run_id,knowledge_document_id)
);

create table if not exists assistant.knowledge_provenance_resolution_decisions_v1_1 (
 id uuid primary key default gen_random_uuid(),
 provenance_item_id uuid not null references assistant.knowledge_provenance_reconstruction_items_v1_1(id) on delete cascade,
 reviewer_auth_user_id uuid not null,
 decision_code text not null check(decision_code in('official_source_candidate_confirmed','institutional_source_candidate_confirmed','metadata_insufficient','not_authoritative','needs_external_research','duplicate_or_contained')),
 evidence_reference text not null check(length(trim(evidence_reference))>=5),
 candidate_url text null,
 issuer_name text null,
 notes text null,
 created_at timestamptz not null default now()
);

create table if not exists assistant.knowledge_review_task_reconciliation_events (
 id uuid primary key default gen_random_uuid(),
 reviewer_auth_user_id uuid not null,
 keep_task_id uuid not null references assistant.knowledge_review_tasks(id) on delete restrict,
 cancelled_task_id uuid not null references assistant.knowledge_review_tasks(id) on delete restrict,
 rationale text not null check(length(trim(rationale))>=8),
 created_at timestamptz not null default now(),
 constraint assistant_knowledge_review_task_reconciliation_events_distinct_chk check(keep_task_id<>cancelled_task_id),
 constraint assistant_knowledge_review_task_reconciliation_events_cancelled_uk unique(cancelled_task_id)
);

create index if not exists idx_assistant_provenance_v11_runs_created on assistant.knowledge_provenance_reconstruction_runs_v1_1(created_at desc);
create index if not exists idx_assistant_provenance_v11_items_run_state on assistant.knowledge_provenance_reconstruction_items_v1_1(provenance_run_id,provenance_state);
create index if not exists idx_assistant_provenance_v11_items_group on assistant.knowledge_provenance_reconstruction_items_v1_1(provenance_run_id,candidate_group_key);
create index if not exists idx_assistant_provenance_v11_decisions_item on assistant.knowledge_provenance_resolution_decisions_v1_1(provenance_item_id,created_at desc);

alter table assistant.knowledge_provenance_reconstruction_runs_v1_1 enable row level security;
alter table assistant.knowledge_provenance_reconstruction_items_v1_1 enable row level security;
alter table assistant.knowledge_provenance_resolution_decisions_v1_1 enable row level security;
alter table assistant.knowledge_review_task_reconciliation_events enable row level security;

create or replace function assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(
 p_reviewer_auth_user_id uuid,
 p_activation_run_id uuid default null,
 p_run_note text default null
) returns jsonb
language plpgsql security invoker set search_path=assistant,public
as $$
declare
 v_activation_run_id uuid;
 v_provenance_run_id uuid;
 v_summary jsonb;
begin
 perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id,'review');
 select coalesce(p_activation_run_id,(select id from assistant.knowledge_activation_runs where status='completed' order by created_at desc limit 1)) into v_activation_run_id;
 if v_activation_run_id is null then raise exception 'completed activation run is required'; end if;
 if not exists(select 1 from assistant.knowledge_activation_runs where id=v_activation_run_id and status='completed') then raise exception 'activation run is not completed'; end if;

 insert into assistant.knowledge_provenance_reconstruction_runs_v1_1(requested_by,activation_run_id,status,run_note)
 values(p_reviewer_auth_user_id,v_activation_run_id,'running',nullif(trim(coalesce(p_run_note,'')),'')) returning id into v_provenance_run_id;

 with base as (
  select ai.knowledge_document_id,ai.reference_document_id,ai.source_id,kd.title,rd.title reference_title,ks.name source_container_name,to_jsonb(kd) kd_json,to_jsonb(rd) rd_json
  from assistant.knowledge_activation_items ai
  join assistant.knowledge_documents kd on kd.id=ai.knowledge_document_id
  left join assistant.reference_documents rd on rd.id=ai.reference_document_id
  left join assistant.knowledge_sources ks on ks.id=ai.source_id
  where ai.activation_run_id=v_activation_run_id and ai.lifecycle_bucket='source_verification_required'
 ), current_normalized as (
  select *,
   nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'title',''),nullif(kd_json#>>'{metadata_json,title}',''),nullif(rd_json->>'title',''),nullif(rd_json#>>'{metadata_json,title}',''))),'\s+',' ','g')),'') normalized_title,
   nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'legacy_dedupe_key',''),nullif(kd_json#>>'{metadata_json,legacy_dedupe_key}',''),nullif(rd_json->>'legacy_dedupe_key',''),nullif(rd_json#>>'{metadata_json,legacy_dedupe_key}',''))),'\s+',' ','g')),'') legacy_dedupe_key,
   nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'legacy_record_key',''),nullif(kd_json#>>'{metadata_json,legacy_record_key}',''),nullif(rd_json->>'legacy_record_key',''),nullif(rd_json#>>'{metadata_json,legacy_record_key}',''))),'\s+',' ','g')),'') legacy_record_key,
   nullif(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'source_url',''),nullif(kd_json->>'url',''),nullif(kd_json#>>'{metadata_json,source_url}',''),nullif(kd_json#>>'{metadata_json,source}',''),nullif(rd_json->>'source_url',''),nullif(rd_json->>'url',''),nullif(rd_json#>>'{metadata_json,source_url}',''),nullif(rd_json#>>'{metadata_json,source}',''))),'/+$','')),'') normalized_url,
   case when char_length(trim(coalesce(nullif(kd_json->>'content',''),nullif(kd_json->>'content_text',''),nullif(kd_json#>>'{metadata_json,content_text}',''))))>=120 then md5(lower(regexp_replace(trim(coalesce(nullif(kd_json->>'content',''),nullif(kd_json->>'content_text',''),nullif(kd_json#>>'{metadata_json,content_text}',''))),'\s+',' ','g'))) end content_fingerprint
  from base
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
  select cd.knowledge_document_id,count(distinct ln.import_id) candidate_rows,count(distinct ln.normalized_url) filter(where ln.normalized_url ~ '^https?://' and ln.normalized_url !~ '^https?://example\.com') candidate_valid_urls
  from current_normalized cd join legacy_normalized ln on cd.normalized_title is not null and cd.normalized_title=ln.normalized_title
  group by cd.knowledge_document_id
 ), classed as (
  select cd.*,
   case
    when exists(select 1 from legacy_normalized ln where (cd.legacy_dedupe_key is not null and lower(ln.legacy_dedupe_key)=cd.legacy_dedupe_key) or (cd.legacy_record_key is not null and lower(coalesce(ln.legacy_record_key,''))=cd.legacy_record_key)) then 'exact_legacy_key'
    when exists(select 1 from legacy_normalized ln where cd.content_fingerprint is not null and cd.content_fingerprint=ln.content_fingerprint) then 'exact_content_fingerprint'
    when exists(select 1 from legacy_normalized ln where cd.normalized_title is not null and cd.normalized_url ~ '^https?://' and cd.normalized_title=ln.normalized_title and cd.normalized_url=ln.normalized_url) then 'exact_title_and_url'
    when coalesce(ts.candidate_valid_urls,0)=1 then 'exact_title_unique_valid_url_candidate'
    when coalesce(ts.candidate_rows,0)>0 then 'exact_title_without_url_candidate'
    else 'no_deterministic_candidate'
   end binding_method
  from current_normalized cd left join title_summary ts on ts.knowledge_document_id=cd.knowledge_document_id
 ), candidate_links as (
  select c.knowledge_document_id,c.binding_method,ln.*
  from classed c join legacy_normalized ln on (
   (c.binding_method='exact_legacy_key' and ((c.legacy_dedupe_key is not null and lower(ln.legacy_dedupe_key)=c.legacy_dedupe_key) or (c.legacy_record_key is not null and lower(coalesce(ln.legacy_record_key,''))=c.legacy_record_key)))
   or (c.binding_method='exact_content_fingerprint' and c.content_fingerprint is not null and c.content_fingerprint=ln.content_fingerprint)
   or (c.binding_method='exact_title_and_url' and c.normalized_title=ln.normalized_title and c.normalized_url=ln.normalized_url)
   or (c.binding_method='exact_title_unique_valid_url_candidate' and c.normalized_title=ln.normalized_title and ln.normalized_url ~ '^https?://' and ln.normalized_url !~ '^https?://example\.com')
   or (c.binding_method='exact_title_without_url_candidate' and c.normalized_title=ln.normalized_title)
  )
 ), file_urls as (
  select rf.reference_document_id,rf.id reference_file_id,rf.original_filename,rf.storage_path,rf.metadata_json,
   coalesce((select jsonb_agg(distinct regexp_replace(m.url_parts[1],'[),.;]+$','')) from regexp_matches(coalesce(rf.extracted_text,''),'(https?://[^[:space:]"<>]+)','g') as m(url_parts)),'[]'::jsonb) urls,
   char_length(coalesce(rf.extracted_text,'')) extracted_text_length
  from assistant.reference_files rf
 ), file_evidence as (
  select reference_document_id,
   jsonb_agg(jsonb_build_object('reference_file_id',reference_file_id,'original_filename',original_filename,'storage_path',storage_path,'source_file_relative_path',metadata_json->>'source_file_relative_path','extracted_text_length',extracted_text_length,'urls',urls)) files,
   coalesce(jsonb_agg(distinct u.url) filter(where u.url ~ '^https?://' and u.url !~ '^https?://example\.com'),'[]'::jsonb) valid_urls,
   coalesce(jsonb_agg(distinct u.url) filter(where u.url ~ '^https?://example\.com'),'[]'::jsonb) test_urls,
   count(*) file_count
  from file_urls f left join lateral jsonb_array_elements_text(f.urls) u(url) on true
  group by reference_document_id
 ), aggregated as (
  select c.*,
   coalesce((select jsonb_agg(distinct cl.import_id) from candidate_links cl where cl.knowledge_document_id=c.knowledge_document_id),'[]'::jsonb) import_ids,
   coalesce((select jsonb_agg(distinct cl.legacy_source_file) from candidate_links cl where cl.knowledge_document_id=c.knowledge_document_id),'[]'::jsonb) legacy_source_files,
   coalesce((select jsonb_agg(distinct cl.normalized_url) filter(where cl.normalized_url ~ '^https?://' and cl.normalized_url !~ '^https?://example\.com') from candidate_links cl where cl.knowledge_document_id=c.knowledge_document_id),'[]'::jsonb) legacy_valid_urls,
   coalesce((select jsonb_agg(distinct cl.normalized_url) filter(where cl.normalized_url ~ '^https?://example\.com') from candidate_links cl where cl.knowledge_document_id=c.knowledge_document_id),'[]'::jsonb) legacy_test_urls,
   coalesce(fe.files,'[]'::jsonb) reference_files_json,coalesce(fe.valid_urls,'[]'::jsonb) file_valid_urls,coalesce(fe.test_urls,'[]'::jsonb) file_test_urls,coalesce(fe.file_count,0) reference_file_count
  from classed c left join file_evidence fe on fe.reference_document_id=c.reference_document_id
 ), resolved as (
  select a.*,
   (select count(distinct url) from jsonb_array_elements_text(a.legacy_valid_urls || a.file_valid_urls) x(url)) as valid_url_count,
   (select count(distinct url) from jsonb_array_elements_text(a.legacy_test_urls || a.file_test_urls) x(url)) as test_url_count,
   (select min(url) from jsonb_array_elements_text(a.legacy_valid_urls || a.file_valid_urls) x(url)) as single_candidate_url
  from aggregated a
 ), prepared as (
  select r.*,
   case when r.valid_url_count=1 then r.single_candidate_url else null end candidate_url,
   case
    when r.valid_url_count=1 then 'valid_http_candidate'
    when r.valid_url_count=0 and r.test_url_count>0 then 'test_artifact_excluded'
    when r.binding_method in('exact_title_without_url_candidate','no_deterministic_candidate') then 'non_url_evidence'
    else 'absent' end candidate_url_status,
   case
    when r.valid_url_count=0 and r.test_url_count>0 then 'test_artifact_excluded'
    when r.binding_method='exact_title_unique_valid_url_candidate' then 'title_unique_valid_url_candidate'
    when r.binding_method='exact_title_without_url_candidate' then 'title_only_review'
    when r.binding_method='no_deterministic_candidate' then 'manual_containment_required'
    when r.valid_url_count=1 then 'deterministic_lineage_with_unique_url'
    else 'deterministic_lineage_multiple_evidence' end provenance_state
  from resolved r
 ), final_rows as (
  select p.*,
   case
    when p.candidate_url is null and p.test_url_count>0 then 'test_artifact'
    when p.candidate_url ~ '^https?://[^/]+\.gov\.ps' then 'government_host_candidate'
    when p.candidate_url ~ '^https?://(muqtafi|lawcenter|fada)\.birzeit\.edu|^https?://(dspace\.alquds\.edu|repository\.aaup\.edu|maqam\.najah\.edu)' then 'institutional_or_academic_candidate'
    when p.candidate_url ~ '^https?://(archive\.org|brill\.com|link\.springer\.com|www\.jstor\.org|www\.tandfonline\.com|books\.google\.com)' then 'repository_or_publisher_candidate'
    when p.candidate_url is not null then 'external_source_candidate'
    else 'not_classified' end candidate_host_category,
   md5(concat_ws('|',p.binding_method,coalesce(p.candidate_url,''),p.legacy_source_files::text,p.reference_files_json::text,coalesce(p.title,''))) candidate_group_key
  from prepared p
 ), task_counts as (
  select f.*,
   (select count(*) from assistant.knowledge_review_tasks t where t.workflow_stage='source_verification' and t.target_type='reference_document' and t.target_id=f.reference_document_id and t.status in('open','assigned','in_progress','blocked')) linked_source_verification_task_count,
   (select count(*) from assistant.knowledge_review_tasks t where t.workflow_stage='citation_verification' and t.target_type='knowledge_document' and t.target_id=f.knowledge_document_id and t.status in('open','assigned','in_progress','blocked')) active_citation_task_count
  from final_rows f
 )
 insert into assistant.knowledge_provenance_reconstruction_items_v1_1(
  provenance_run_id,activation_run_id,knowledge_document_id,reference_document_id,source_container_id,source_container_name,title_snapshot,reference_title_snapshot,binding_method,provenance_state,candidate_group_key,candidate_url,candidate_url_status,candidate_host_category,evidence_metadata_json,legacy_import_count,valid_url_count,excluded_test_url_count,reference_file_count,linked_source_verification_task_count,active_citation_task_count,active_citation_duplicate_count
 )
 select v_provenance_run_id,v_activation_run_id,tc.knowledge_document_id,tc.reference_document_id,tc.source_id,tc.source_container_name,coalesce(tc.title,'[untitled]'),tc.reference_title,tc.binding_method,tc.provenance_state,tc.candidate_group_key,tc.candidate_url,tc.candidate_url_status,tc.candidate_host_category,
  jsonb_build_object('legacy_import_ids',tc.import_ids,'legacy_source_files',tc.legacy_source_files,'legacy_valid_urls',tc.legacy_valid_urls,'excluded_test_urls',tc.legacy_test_urls || tc.file_test_urls,'reference_files',tc.reference_files_json,'binding_method',tc.binding_method,'candidate_url_status',tc.candidate_url_status,'host_category_is_hint_only',true),
  jsonb_array_length(tc.import_ids),tc.valid_url_count,tc.test_url_count,tc.reference_file_count,tc.linked_source_verification_task_count,tc.active_citation_task_count,greatest(tc.active_citation_task_count-1,0)
 from task_counts tc;

 select jsonb_build_object(
  'total_items',(select count(*) from assistant.knowledge_provenance_reconstruction_items_v1_1 where provenance_run_id=v_provenance_run_id),
  'deterministic_lineage_items',(select count(*) from assistant.knowledge_provenance_reconstruction_items_v1_1 where provenance_run_id=v_provenance_run_id and binding_method in('exact_legacy_key','exact_content_fingerprint','exact_title_and_url')),
  'review_required_items',(select count(*) from assistant.knowledge_provenance_reconstruction_items_v1_1 where provenance_run_id=v_provenance_run_id and provenance_state in('title_unique_valid_url_candidate','title_only_review','manual_containment_required')),
  'test_artifact_items',(select count(*) from assistant.knowledge_provenance_reconstruction_items_v1_1 where provenance_run_id=v_provenance_run_id and provenance_state='test_artifact_excluded'),
  'binding_methods',(select coalesce(jsonb_object_agg(binding_method,item_count),'{}'::jsonb) from (select binding_method,count(*) item_count from assistant.knowledge_provenance_reconstruction_items_v1_1 where provenance_run_id=v_provenance_run_id group by binding_method) q),
  'canonical_source_mutation','not_performed',
  'chat_eligibility_mutation','not_performed'
 ) into v_summary;

 update assistant.knowledge_provenance_reconstruction_runs_v1_1 set status='completed',summary_json=v_summary,completed_at=now() where id=v_provenance_run_id;
 insert into assistant.knowledge_access_events(auth_user_id,action,result,scope_code,reason_code,metadata_json)
 values(p_reviewer_auth_user_id,'review','allowed','assistant.review','legacy_provenance_v1_1_reconstructed',jsonb_build_object('provenance_run_id',v_provenance_run_id,'activation_run_id',v_activation_run_id,'summary',v_summary));
 return jsonb_build_object('provenance_run_id',v_provenance_run_id,'activation_run_id',v_activation_run_id,'summary',v_summary,'canonical_source_mutation','not_performed','next_gate','controlled_source_verification_and_human_authority_review');
exception when others then
 update assistant.knowledge_provenance_reconstruction_runs_v1_1 set status='failed',completed_at=now(),summary_json=jsonb_build_object('error',sqlerrm) where id=v_provenance_run_id;
 raise;
end;
$$;

create or replace function assistant.rpc_record_legacy_provenance_resolution_v1_1(
 p_reviewer_auth_user_id uuid,p_item_id uuid,p_decision_code text,p_evidence_reference text,p_candidate_url text default null,p_issuer_name text default null,p_notes text default null
) returns jsonb language plpgsql security invoker set search_path=assistant,public as $$
declare v_item assistant.knowledge_provenance_reconstruction_items_v1_1%rowtype; v_decision_id uuid;
begin
 perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id,'review');
 select * into v_item from assistant.knowledge_provenance_reconstruction_items_v1_1 where id=p_item_id;
 if not found then raise exception 'provenance item V1.1 not found'; end if;
 if p_decision_code not in('official_source_candidate_confirmed','institutional_source_candidate_confirmed','metadata_insufficient','not_authoritative','needs_external_research','duplicate_or_contained') then raise exception 'unsupported provenance decision'; end if;
 if nullif(trim(coalesce(p_evidence_reference,'')),'') is null or length(trim(p_evidence_reference))<5 then raise exception 'evidence reference is required'; end if;
 if p_decision_code='official_source_candidate_confirmed' and (nullif(trim(coalesce(p_candidate_url,'')),'') is null or trim(p_candidate_url)!~'^https://') then raise exception 'official source candidate requires an https URL'; end if;
 if p_decision_code in('official_source_candidate_confirmed','institutional_source_candidate_confirmed') and nullif(trim(coalesce(p_issuer_name,'')),'') is null then raise exception 'source candidate confirmation requires issuer name'; end if;
 insert into assistant.knowledge_provenance_resolution_decisions_v1_1(provenance_item_id,reviewer_auth_user_id,decision_code,evidence_reference,candidate_url,issuer_name,notes)
 values(p_item_id,p_reviewer_auth_user_id,p_decision_code,trim(p_evidence_reference),nullif(trim(coalesce(p_candidate_url,'')),''),nullif(trim(coalesce(p_issuer_name,'')),''),nullif(trim(coalesce(p_notes,'')),'')) returning id into v_decision_id;
 insert into assistant.knowledge_access_events(auth_user_id,action,result,scope_code,reason_code,metadata_json)
 values(p_reviewer_auth_user_id,'review','allowed','assistant.review','legacy_provenance_v1_1_decision_recorded',jsonb_build_object('decision_id',v_decision_id,'item_id',p_item_id,'decision_code',p_decision_code,'canonical_source_mutation','not_performed'));
 return jsonb_build_object('decision_id',v_decision_id,'item_id',p_item_id,'decision_code',p_decision_code,'canonical_source_mutation','not_performed','authority_classification','human_decision_recorded_not_promoted');
end;
$$;

create or replace function assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1_1()
returns jsonb language sql stable security invoker set search_path=assistant,public as $$
with latest as (select id,activation_run_id,summary_json,created_at,completed_at from assistant.knowledge_provenance_reconstruction_runs_v1_1 where status='completed' order by created_at desc limit 1),
duplicates as (select count(*) duplicate_groups from(select target_type,target_id from assistant.knowledge_review_tasks where workflow_stage='citation_verification' and status in('open','assigned','in_progress','blocked') group by target_type,target_id having count(*)>1)d)
select coalesce((select jsonb_build_object('latestRunId',id,'activationRunId',activation_run_id,'createdAt',created_at,'completedAt',completed_at,'summary',summary_json || jsonb_build_object('duplicate_citation_task_groups',(select duplicate_groups from duplicates))) from latest),jsonb_build_object('latestRunId',null,'summary',jsonb_build_object('total_items',0,'deterministic_lineage_items',0,'review_required_items',0,'test_artifact_items',0,'duplicate_citation_task_groups',(select duplicate_groups from duplicates))));
$$;

create or replace function assistant.rpc_list_legacy_provenance_reconstruction_items_v1_1(p_run_id uuid default null,p_state text default null,p_limit integer default 100)
returns table(id uuid,knowledge_document_id uuid,reference_document_id uuid,source_container_name text,title text,reference_title text,binding_method text,provenance_state text,candidate_group_key text,candidate_url text,candidate_url_status text,candidate_host_category text,evidence_metadata_json jsonb,legacy_import_count integer,valid_url_count integer,excluded_test_url_count integer,reference_file_count integer,source_task_count integer,citation_task_count integer,citation_duplicate_count integer,latest_decision_code text,latest_decision_at timestamptz)
language sql stable security invoker set search_path=assistant,public as $$
with latest as(select id from assistant.knowledge_provenance_reconstruction_runs_v1_1 where status='completed' order by created_at desc limit 1),dec as(select distinct on(provenance_item_id) provenance_item_id,decision_code,created_at from assistant.knowledge_provenance_resolution_decisions_v1_1 order by provenance_item_id,created_at desc)
select i.id,i.knowledge_document_id,i.reference_document_id,i.source_container_name,i.title_snapshot,i.reference_title_snapshot,i.binding_method,i.provenance_state,i.candidate_group_key,i.candidate_url,i.candidate_url_status,i.candidate_host_category,i.evidence_metadata_json,i.legacy_import_count,i.valid_url_count,i.excluded_test_url_count,i.reference_file_count,i.linked_source_verification_task_count,i.active_citation_task_count,i.active_citation_duplicate_count,d.decision_code,d.created_at
from assistant.knowledge_provenance_reconstruction_items_v1_1 i left join dec d on d.provenance_item_id=i.id
where i.provenance_run_id=coalesce(p_run_id,(select id from latest)) and (p_state is null or i.provenance_state=p_state)
order by case i.provenance_state when 'manual_containment_required' then 1 when 'test_artifact_excluded' then 2 when 'title_only_review' then 3 else 4 end,i.title_snapshot
limit greatest(1,least(coalesce(p_limit,100),500));
$$;

create or replace function assistant.rpc_list_legacy_provenance_groups_v1_1(p_run_id uuid default null,p_limit integer default 100)
returns table(candidate_group_key text,binding_method text,provenance_state text,candidate_url text,candidate_host_category text,affected_documents bigint,affected_reference_documents bigint,valid_url_items bigint,test_artifact_items bigint,decision_count bigint)
language sql stable security invoker set search_path=assistant,public as $$
with latest as(select id from assistant.knowledge_provenance_reconstruction_runs_v1_1 where status='completed' order by created_at desc limit 1),dec as(select provenance_item_id,count(*) decision_count from assistant.knowledge_provenance_resolution_decisions_v1_1 group by provenance_item_id)
select i.candidate_group_key,i.binding_method,i.provenance_state,max(i.candidate_url),max(i.candidate_host_category),count(*),count(distinct i.reference_document_id),count(*)filter(where i.candidate_url_status='valid_http_candidate'),count(*)filter(where i.provenance_state='test_artifact_excluded'),coalesce(sum(dec.decision_count),0)
from assistant.knowledge_provenance_reconstruction_items_v1_1 i left join dec on dec.provenance_item_id=i.id
where i.provenance_run_id=coalesce(p_run_id,(select id from latest))
group by i.candidate_group_key,i.binding_method,i.provenance_state
order by count(*) desc,i.binding_method,i.provenance_state
limit greatest(1,least(coalesce(p_limit,100),500));
$$;

create or replace function assistant.rpc_list_duplicate_citation_review_task_groups_v1_1(p_limit integer default 100)
returns table(target_type text,target_id uuid,workflow_stage text,active_task_count bigint,task_ids jsonb,dedupe_keys jsonb)
language sql stable security invoker set search_path=assistant,public as $$
select target_type,target_id,workflow_stage,count(*),jsonb_agg(id order by created_at),jsonb_agg(dedupe_key order by created_at)
from assistant.knowledge_review_tasks
where workflow_stage='citation_verification' and status in('open','assigned','in_progress','blocked')
group by target_type,target_id,workflow_stage having count(*)>1
order by count(*) desc,target_id
limit greatest(1,least(coalesce(p_limit,100),500));
$$;

create or replace function assistant.rpc_reconcile_duplicate_citation_review_task_v1_1(p_reviewer_auth_user_id uuid,p_keep_task_id uuid,p_cancel_task_id uuid,p_rationale text)
returns jsonb language plpgsql security invoker set search_path=assistant,public as $$
declare v_keep assistant.knowledge_review_tasks%rowtype; v_cancel assistant.knowledge_review_tasks%rowtype; v_event_id uuid;
begin
 perform assistant.assert_knowledge_reviewer_scope_v1(p_reviewer_auth_user_id,'review');
 if p_keep_task_id=p_cancel_task_id then raise exception 'keep and cancel task must differ'; end if;
 if nullif(trim(coalesce(p_rationale,'')),'') is null or length(trim(p_rationale))<8 then raise exception 'reconciliation rationale is required'; end if;
 select * into v_keep from assistant.knowledge_review_tasks where id=p_keep_task_id for update;
 if not found then raise exception 'keep task not found'; end if;
 select * into v_cancel from assistant.knowledge_review_tasks where id=p_cancel_task_id for update;
 if not found then raise exception 'cancel task not found'; end if;
 if v_keep.workflow_stage<>'citation_verification' or v_cancel.workflow_stage<>'citation_verification' then raise exception 'only citation verification tasks allowed'; end if;
 if v_keep.target_type<>v_cancel.target_type or v_keep.target_id<>v_cancel.target_id then raise exception 'tasks do not represent same target'; end if;
 if v_keep.status not in('open','assigned','in_progress','blocked') or v_cancel.status not in('open','assigned','in_progress','blocked') then raise exception 'both tasks must be active'; end if;
 update assistant.knowledge_review_tasks set status='cancelled',completed_at=now(),completed_by=p_reviewer_auth_user_id,updated_at=now(),notes=concat_ws(E'\n',nullif(notes,''),'Duplicate citation task reconciled V1.1. Kept task: '||p_keep_task_id::text||'. Rationale: '||trim(p_rationale)) where id=p_cancel_task_id;
 insert into assistant.knowledge_review_task_reconciliation_events(reviewer_auth_user_id,keep_task_id,cancelled_task_id,rationale) values(p_reviewer_auth_user_id,p_keep_task_id,p_cancel_task_id,trim(p_rationale)) returning id into v_event_id;
 insert into assistant.knowledge_access_events(auth_user_id,action,result,scope_code,reason_code,metadata_json) values(p_reviewer_auth_user_id,'review','allowed','assistant.review','duplicate_citation_task_reconciled_v1_1',jsonb_build_object('event_id',v_event_id,'keep_task_id',p_keep_task_id,'cancel_task_id',p_cancel_task_id));
 return jsonb_build_object('event_id',v_event_id,'keep_task_id',p_keep_task_id,'cancelled_task_id',p_cancel_task_id,'status','cancelled_duplicate_only');
end;
$$;

commit;
