-- Sovereign Assistant Trust Foundation v1
-- READ ONLY verification. Run after 01, 02 and 03.

select
  (select count(*) from assistant.knowledge_scope_assignments where is_active) as active_scope_assignments,
  (select count(*) from assistant.knowledge_review_tasks where status in ('open','assigned','in_progress','blocked')) as open_review_tasks,
  (select count(*) from assistant.knowledge_access_events) as access_events;

select
  content_status,
  visibility_scope,
  status,
  is_chat_eligible,
  count(*) as documents
from assistant.knowledge_documents
group by content_status, visibility_scope, status, is_chat_eligible
order by content_status, visibility_scope, status, is_chat_eligible;

select verification_status, count(*) as citations
from assistant.knowledge_citations
group by verification_status
order by verification_status;

select verification_status, authority_level, count(*) as references
from assistant.reference_documents
group by verification_status, authority_level
order by verification_status, authority_level;

select
  (select count(*) from assistant.knowledge_documents where content_status in ('test','duplicate','quarantined') and is_chat_eligible) as unsafe_test_or_quarantine_visible,
  (select count(*) from assistant.knowledge_documents where visibility_scope in ('internal','restricted') and is_chat_eligible) as non_public_chat_eligible_records,
  (select count(*) from assistant.v_chat_retrieval_candidates_v1) as public_chat_candidates,
  (select count(*) from assistant.v_chat_retrieval_candidates_v1 where has_verified_citation) as verified_public_chat_candidates;

select workflow_stage, priority, status, count(*) as tasks
from assistant.knowledge_review_tasks
group by workflow_stage, priority, status
order by workflow_stage, priority, status;

-- Expected hard safety result:
-- unsafe_test_or_quarantine_visible = 0
-- Full production acceptance is NOT granted until human source/citation review tasks are completed and browser/UAT evidence exists.
