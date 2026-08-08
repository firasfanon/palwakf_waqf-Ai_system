-- Smart Tools 3 — Initial reviewer scope bootstrap v1
-- OPERATOR APPLY, STAGING ONLY.
-- Purpose: establish the first minimal human-review authority because
-- assistant.knowledge_scope_assignments is currently empty.
-- Scope granted: assistant.review / review ONLY.
-- Explicitly does NOT grant assistant.publish, assistant.admin or assistant.all.
-- This script creates no knowledge content, edits no sources/citations/documents,
-- and never changes chat eligibility.

begin;

do $$
declare
  v_bootstrap_auth_user_id uuid := '96f6cdc2-67f9-4352-b9f8-775ef509fed8';
  v_expected_email text := 'firasfanon@gmail.com';
  v_actual_email text;
  v_existing_assignment_count integer;
  v_assignment_id uuid;
begin
  -- Fail closed if a scope registry was populated between evidence capture and apply.
  select count(*) into v_existing_assignment_count
  from assistant.knowledge_scope_assignments;

  if v_existing_assignment_count <> 0 then
    raise exception
      'initial reviewer bootstrap denied: knowledge_scope_assignments has % existing row(s); use the normal scope-administration workflow instead',
      v_existing_assignment_count;
  end if;

  select lower(email) into v_actual_email
  from auth.users
  where id = v_bootstrap_auth_user_id;

  if v_actual_email is null then
    raise exception 'bootstrap target auth user % was not found', v_bootstrap_auth_user_id;
  end if;

  if v_actual_email <> lower(v_expected_email) then
    raise exception
      'bootstrap target identity mismatch: expected %, found %',
      lower(v_expected_email), v_actual_email;
  end if;

  insert into assistant.knowledge_scope_assignments (
    auth_user_id,
    scope_code,
    access_level,
    assigned_by,
    assigned_at,
    expires_at,
    is_active,
    metadata_json
  ) values (
    v_bootstrap_auth_user_id,
    'assistant.review',
    'review',
    v_bootstrap_auth_user_id,
    now(),
    null,
    true,
    jsonb_build_object(
      'grant_type', 'initial_reviewer_scope_bootstrap',
      'batch', 'SMART_TOOLS_3_INITIAL_REVIEWER_SCOPE_BOOTSTRAP_V1',
      'purpose', 'KB58_to_KB08_duplicate_task_consolidation_and_human_review_operations',
      'authority_boundary', 'review_only',
      'not_granted', jsonb_build_array('assistant.publish', 'assistant.admin', 'assistant.all'),
      'applied_via', 'authorized_supabase_sql_editor_operator',
      'applied_database_role', current_user,
      'applied_at', now()
    )
  ) returning id into v_assignment_id;

  if v_assignment_id is null then
    raise exception 'initial reviewer bootstrap failed to create the assignment';
  end if;
end;
$$;

commit;

select
  ksa.id as assignment_id,
  ksa.auth_user_id,
  ksa.scope_code,
  ksa.access_level,
  ksa.is_active,
  ksa.expires_at,
  ksa.assigned_by,
  ksa.assigned_at,
  case
    when ksa.scope_code = 'assistant.review'
      and ksa.access_level = 'review'
      and ksa.is_active = true
      and ksa.expires_at is null
    then 'INITIAL_REVIEWER_SCOPE_BOOTSTRAP_APPLIED'
    else 'INITIAL_REVIEWER_SCOPE_BOOTSTRAP_UNEXPECTED_STATE'
  end as bootstrap_gate
from assistant.knowledge_scope_assignments ksa
where ksa.auth_user_id = '96f6cdc2-67f9-4352-b9f8-775ef509fed8'::uuid
  and ksa.scope_code = 'assistant.review';
