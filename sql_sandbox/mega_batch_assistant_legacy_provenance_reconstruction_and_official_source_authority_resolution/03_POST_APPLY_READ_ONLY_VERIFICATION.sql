-- LIVE READ ONLY. Run after 02.
begin transaction read only;

select * from assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1();

with latest as (select id from assistant.knowledge_provenance_reconstruction_runs where status='completed' order by created_at desc limit 1)
select provenance_state,count(*) as items,count(distinct candidate_group_key) as candidate_groups
from assistant.knowledge_provenance_reconstruction_items
where provenance_run_id=(select id from latest)
group by provenance_state order by provenance_state;

select * from assistant.rpc_list_legacy_provenance_groups_v1(null,30);

select decision_code,count(*) as decisions
from assistant.knowledge_provenance_resolution_decisions
group by decision_code order by decision_code;

select target_id,active_task_count,task_ids,dedupe_keys
from assistant.rpc_list_duplicate_citation_review_task_groups_v1(100);

with f as (
  select lower(pg_get_functiondef('assistant.rpc_refresh_legacy_provenance_reconstruction_v1(uuid,uuid,text)'::regprocedure)) as body
)
select
  position('update assistant.knowledge_sources' in body)=0 as no_automatic_source_update,
  position('update assistant.reference_documents' in body)=0 as no_automatic_reference_update,
  position('update assistant.knowledge_documents' in body)=0 as no_automatic_document_update,
  position('update assistant.knowledge_citations' in body)=0 as no_automatic_citation_update,
  position('is_chat_eligible' in body)=0 as no_automatic_chat_eligibility
from f;

select count(*) as strict_chat_candidates from assistant.v_chat_retrieval_candidates_v1;
rollback;
