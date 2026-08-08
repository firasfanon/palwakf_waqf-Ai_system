-- LIVE READ ONLY verification after V1.1 ledger apply and run.
begin transaction read only;

select assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1_1() as snapshot;

with latest as(select id from assistant.knowledge_provenance_reconstruction_runs_v1_1 where status='completed' order by created_at desc limit 1)
select binding_method,provenance_state,candidate_url_status,candidate_host_category,count(*) items
from assistant.knowledge_provenance_reconstruction_items_v1_1
where provenance_run_id=(select id from latest)
group by binding_method,provenance_state,candidate_url_status,candidate_host_category
order by items desc,binding_method,provenance_state;

with latest as(select id from assistant.knowledge_provenance_reconstruction_runs_v1_1 where status='completed' order by created_at desc limit 1)
select count(*) total_items,
 count(*) filter(where binding_method in('exact_legacy_key','exact_content_fingerprint','exact_title_and_url')) deterministic_lineage_items,
 count(*) filter(where provenance_state='test_artifact_excluded') test_artifact_items,
 count(*) filter(where candidate_url is not null) single_url_candidates,
 count(*) filter(where candidate_url_status='test_artifact_excluded') excluded_test_url_items
from assistant.knowledge_provenance_reconstruction_items_v1_1 where provenance_run_id=(select id from latest);

select count(*) as decisions_recorded,decision_code from assistant.knowledge_provenance_resolution_decisions_v1_1 group by decision_code order by decisions_recorded desc,decision_code;

select count(*) as strict_chat_candidates
from assistant.knowledge_documents kd join assistant.reference_documents rd on rd.id=kd.reference_document_id
where coalesce(kd.is_chat_eligible,false)=true and coalesce(kd.review_decision,'') in('approved','released') and coalesce(rd.verification_status,'')='verified';

select
 position('update assistant.knowledge_sources' in lower(pg_get_functiondef('assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(uuid,uuid,text)'::regprocedure)))=0 as no_canonical_source_update,
 position('update assistant.reference_documents' in lower(pg_get_functiondef('assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(uuid,uuid,text)'::regprocedure)))=0 as no_reference_update,
 position('update assistant.knowledge_documents' in lower(pg_get_functiondef('assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(uuid,uuid,text)'::regprocedure)))=0 as no_knowledge_document_update,
 position('is_chat_eligible' in lower(pg_get_functiondef('assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(uuid,uuid,text)'::regprocedure)))=0 as no_chat_eligibility_mutation;

rollback;
