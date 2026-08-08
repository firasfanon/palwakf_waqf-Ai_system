-- Smart Tools 3 — Initial reviewer scope bootstrap v1
-- READ ONLY verification. No DDL/DML.

with target_scope as (
  select
    ksa.id,
    ksa.auth_user_id,
    ksa.scope_code,
    ksa.access_level,
    ksa.is_active,
    ksa.expires_at,
    ksa.assigned_by,
    ksa.assigned_at,
    ksa.metadata_json
  from assistant.knowledge_scope_assignments ksa
  where ksa.auth_user_id = '96f6cdc2-67f9-4352-b9f8-775ef509fed8'::uuid
    and ksa.scope_code = 'assistant.review'
), registry as (
  select count(*)::integer as total_assignment_rows
  from assistant.knowledge_scope_assignments
)
select
  r.total_assignment_rows,
  t.auth_user_id,
  t.scope_code,
  t.access_level,
  t.is_active,
  t.expires_at,
  t.assigned_by,
  t.assigned_at,
  t.metadata_json ->> 'grant_type' as grant_type,
  t.metadata_json -> 'not_granted' as not_granted,
  case
    when r.total_assignment_rows = 1
      and t.auth_user_id = '96f6cdc2-67f9-4352-b9f8-775ef509fed8'::uuid
      and t.scope_code = 'assistant.review'
      and t.access_level = 'review'
      and t.is_active = true
      and t.expires_at is null
    then 'BOOTSTRAP_VERIFIED_REVIEW_ONLY'
    else 'BOOTSTRAP_NOT_VERIFIED_STOP'
  end as bootstrap_verification_gate
from registry r
left join target_scope t on true;
