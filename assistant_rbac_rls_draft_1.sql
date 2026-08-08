
-- Assistant RBAC / RLS Draft 1
-- PalWakf / Supabase PostgreSQL
-- Depends on:
--   - assistant schema draft 1 tables
--   - public.admin_users as sovereign identity source
-- Design goals:
--   - Use public.admin_users as the only assistant identity source
--   - Provide conservative internal-access policies
--   - Separate "active assistant user" from "assistant manager"
--   - Keep public/anonymous access out of draft 1
-- Notes:
--   - service role bypasses RLS as usual
--   - detailed app-level transition rules remain in backend logic
--   - this draft is intentionally conservative

begin;

create schema if not exists assistant;

-- =========================================================
-- 1) Helper column resolver
-- =========================================================

create or replace function assistant._find_admin_users_column(candidates text[])
returns text
language sql
stable
as $$
  with wanted as (
    select candidate, ordinality
    from unnest(candidates) with ordinality as t(candidate, ordinality)
  )
  select c.column_name
  from information_schema.columns c
  join wanted w on w.candidate = c.column_name
  where c.table_schema = 'public'
    and c.table_name = 'admin_users'
  order by w.ordinality
  limit 1
$$;

comment on function assistant._find_admin_users_column(text[]) is
'Find first existing column in public.admin_users from a candidate list.';

-- =========================================================
-- 2) Identity and role helper functions
-- =========================================================

create or replace function assistant.is_authenticated_admin_user()
returns boolean
language plpgsql
stable
security definer
set search_path = public, assistant, auth
as $$
declare
  ident_col text;
  active_col text;
  active_sql text := '';
  q text;
  result boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  ident_col := assistant._find_admin_users_column(array['auth_user_id', 'user_id', 'open_id']);
  active_col := assistant._find_admin_users_column(array['is_active', 'active', 'enabled']);

  if ident_col is null then
    return false;
  end if;

  if active_col is not null then
    active_sql := format(
      ' and (u.%1$I is null or lower(u.%1$I::text) in (''1'',''true'',''t'',''yes'',''y'',''on'',''active'',''enabled''))',
      active_col
    );
  end if;

  q := format(
    'select exists (
       select 1
       from public.admin_users u
       where u.%1$I::text = auth.uid()::text
       %2$s
     )',
    ident_col,
    active_sql
  );

  execute q into result;
  return coalesce(result, false);
end;
$$;

comment on function assistant.is_authenticated_admin_user() is
'True when current auth.uid() maps to an active row in public.admin_users.';

create or replace function assistant.can_manage_assistant()
returns boolean
language plpgsql
stable
security definer
set search_path = public, assistant, auth
as $$
declare
  ident_col text;
  active_col text;
  role_col text;
  platform_role_col text;
  super_col text;
  perm_col text;
  active_sql text := '';
  predicates text[] := array[]::text[];
  q text;
  result boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  ident_col := assistant._find_admin_users_column(array['auth_user_id', 'user_id', 'open_id']);
  active_col := assistant._find_admin_users_column(array['is_active', 'active', 'enabled']);
  role_col := assistant._find_admin_users_column(array['role']);
  platform_role_col := assistant._find_admin_users_column(array['platform_role']);
  super_col := assistant._find_admin_users_column(array['is_superuser', 'superuser']);
  perm_col := assistant._find_admin_users_column(array['permission_keys', 'permissions_json', 'permissions', 'permissions_text']);

  if ident_col is null then
    return false;
  end if;

  if active_col is not null then
    active_sql := format(
      ' and (u.%1$I is null or lower(u.%1$I::text) in (''1'',''true'',''t'',''yes'',''y'',''on'',''active'',''enabled''))',
      active_col
    );
  end if;

  if super_col is not null then
    predicates := predicates || format(
      'lower(coalesce(u.%1$I::text, '''')) in (''1'',''true'',''t'',''yes'',''y'',''on'')',
      super_col
    );
  end if;

  if role_col is not null then
    predicates := predicates || format(
      'lower(coalesce(u.%1$I::text, '''')) in (''admin'',''superuser'',''super_user'',''owner'')',
      role_col
    );
  end if;

  if platform_role_col is not null then
    predicates := predicates || format(
      'lower(coalesce(u.%1$I::text, '''')) in (''platformadmin'',''platform_admin'',''superuser'',''super_user'')',
      platform_role_col
    );
  end if;

  if perm_col is not null then
    predicates := predicates || format(
      '(u.%1$I::text ilike ''%%manageUsers%%''
        or u.%1$I::text ilike ''%%manage_users%%''
        or u.%1$I::text ilike ''%%manageKnowledge%%''
        or u.%1$I::text ilike ''%%manage_knowledge%%''
        or u.%1$I::text ilike ''%%manageAssistant%%''
        or u.%1$I::text ilike ''%%manage_assistant%%'')',
      perm_col
    );
  end if;

  if array_length(predicates, 1) is null then
    return false;
  end if;

  q := format(
    'select exists (
       select 1
       from public.admin_users u
       where u.%1$I::text = auth.uid()::text
       %2$s
       and (%3$s)
     )',
    ident_col,
    active_sql,
    array_to_string(predicates, ' or ')
  );

  execute q into result;
  return coalesce(result, false);
end;
$$;

comment on function assistant.can_manage_assistant() is
'True for conservative assistant managers: superuser/platform admin/admin/manageUsers-like permission.';

create or replace function assistant.can_read_assistant()
returns boolean
language sql
stable
security definer
set search_path = public, assistant, auth
as $$
  select assistant.is_authenticated_admin_user()
$$;

comment on function assistant.can_read_assistant() is
'Draft 1 internal read access for assistant-owned tables.';

-- =========================================================
-- 3) Convenience ownership helpers
-- =========================================================

create or replace function assistant.is_conversation_owner(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, assistant, auth
as $$
  select auth.uid() is not null and p_user_id is not null and p_user_id = auth.uid()
$$;

comment on function assistant.is_conversation_owner(uuid) is
'True when the current auth user owns the conversation row.';

create or replace function assistant.can_access_message_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, assistant, auth
as $$
  select exists (
    select 1
    from assistant.conversations c
    where c.id = p_conversation_id
      and (
        assistant.can_manage_assistant()
        or assistant.is_conversation_owner(c.user_id)
      )
  )
$$;

comment on function assistant.can_access_message_conversation(uuid) is
'True when current user owns the parent conversation or can manage assistant data.';

-- =========================================================
-- 4) Ensure RLS is enabled
-- =========================================================

alter table assistant.system_settings enable row level security;
alter table assistant.knowledge_sources enable row level security;
alter table assistant.reference_documents enable row level security;
alter table assistant.reference_files enable row level security;
alter table assistant.knowledge_documents enable row level security;
alter table assistant.knowledge_citations enable row level security;
alter table assistant.fetched_content enable row level security;
alter table assistant.fetch_logs enable row level security;
alter table assistant.classification_ratings enable row level security;
alter table assistant.review_events enable row level security;
alter table assistant.conversations enable row level security;
alter table assistant.messages enable row level security;

-- =========================================================
-- 5) Drop old policies if rerun
-- =========================================================

drop policy if exists assistant_system_settings_select on assistant.system_settings;
drop policy if exists assistant_system_settings_insert on assistant.system_settings;
drop policy if exists assistant_system_settings_update on assistant.system_settings;
drop policy if exists assistant_system_settings_delete on assistant.system_settings;

drop policy if exists assistant_knowledge_sources_select on assistant.knowledge_sources;
drop policy if exists assistant_knowledge_sources_insert on assistant.knowledge_sources;
drop policy if exists assistant_knowledge_sources_update on assistant.knowledge_sources;
drop policy if exists assistant_knowledge_sources_delete on assistant.knowledge_sources;

drop policy if exists assistant_reference_documents_select on assistant.reference_documents;
drop policy if exists assistant_reference_documents_insert on assistant.reference_documents;
drop policy if exists assistant_reference_documents_update on assistant.reference_documents;
drop policy if exists assistant_reference_documents_delete on assistant.reference_documents;

drop policy if exists assistant_reference_files_select on assistant.reference_files;
drop policy if exists assistant_reference_files_insert on assistant.reference_files;
drop policy if exists assistant_reference_files_update on assistant.reference_files;
drop policy if exists assistant_reference_files_delete on assistant.reference_files;

drop policy if exists assistant_knowledge_documents_select on assistant.knowledge_documents;
drop policy if exists assistant_knowledge_documents_insert on assistant.knowledge_documents;
drop policy if exists assistant_knowledge_documents_update on assistant.knowledge_documents;
drop policy if exists assistant_knowledge_documents_delete on assistant.knowledge_documents;

drop policy if exists assistant_knowledge_citations_select on assistant.knowledge_citations;
drop policy if exists assistant_knowledge_citations_insert on assistant.knowledge_citations;
drop policy if exists assistant_knowledge_citations_update on assistant.knowledge_citations;
drop policy if exists assistant_knowledge_citations_delete on assistant.knowledge_citations;

drop policy if exists assistant_fetched_content_select on assistant.fetched_content;
drop policy if exists assistant_fetched_content_insert on assistant.fetched_content;
drop policy if exists assistant_fetched_content_update on assistant.fetched_content;
drop policy if exists assistant_fetched_content_delete on assistant.fetched_content;

drop policy if exists assistant_fetch_logs_select on assistant.fetch_logs;
drop policy if exists assistant_fetch_logs_insert on assistant.fetch_logs;
drop policy if exists assistant_fetch_logs_update on assistant.fetch_logs;
drop policy if exists assistant_fetch_logs_delete on assistant.fetch_logs;

drop policy if exists assistant_classification_ratings_select on assistant.classification_ratings;
drop policy if exists assistant_classification_ratings_insert on assistant.classification_ratings;
drop policy if exists assistant_classification_ratings_update on assistant.classification_ratings;
drop policy if exists assistant_classification_ratings_delete on assistant.classification_ratings;

drop policy if exists assistant_review_events_select on assistant.review_events;
drop policy if exists assistant_review_events_insert on assistant.review_events;
drop policy if exists assistant_review_events_update on assistant.review_events;
drop policy if exists assistant_review_events_delete on assistant.review_events;

drop policy if exists assistant_conversations_select on assistant.conversations;
drop policy if exists assistant_conversations_insert on assistant.conversations;
drop policy if exists assistant_conversations_update on assistant.conversations;
drop policy if exists assistant_conversations_delete on assistant.conversations;

drop policy if exists assistant_messages_select on assistant.messages;
drop policy if exists assistant_messages_insert on assistant.messages;
drop policy if exists assistant_messages_delete on assistant.messages;

-- =========================================================
-- 6) Policies: system settings
-- =========================================================

create policy assistant_system_settings_select
on assistant.system_settings
for select
using (assistant.can_manage_assistant());

create policy assistant_system_settings_insert
on assistant.system_settings
for insert
with check (assistant.can_manage_assistant());

create policy assistant_system_settings_update
on assistant.system_settings
for update
using (assistant.can_manage_assistant())
with check (assistant.can_manage_assistant());

create policy assistant_system_settings_delete
on assistant.system_settings
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 7) Policies: knowledge sources
-- =========================================================

create policy assistant_knowledge_sources_select
on assistant.knowledge_sources
for select
using (assistant.can_read_assistant());

create policy assistant_knowledge_sources_insert
on assistant.knowledge_sources
for insert
with check (assistant.can_manage_assistant());

create policy assistant_knowledge_sources_update
on assistant.knowledge_sources
for update
using (assistant.can_manage_assistant())
with check (assistant.can_manage_assistant());

create policy assistant_knowledge_sources_delete
on assistant.knowledge_sources
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 8) Policies: reference documents
-- =========================================================

create policy assistant_reference_documents_select
on assistant.reference_documents
for select
using (assistant.can_read_assistant());

create policy assistant_reference_documents_insert
on assistant.reference_documents
for insert
with check (
  assistant.can_read_assistant()
  and (
    created_by is null
    or created_by = auth.uid()
    or assistant.can_manage_assistant()
  )
);

create policy assistant_reference_documents_update
on assistant.reference_documents
for update
using (
  assistant.can_manage_assistant()
  or created_by = auth.uid()
)
with check (
  assistant.can_manage_assistant()
  or created_by = auth.uid()
);

create policy assistant_reference_documents_delete
on assistant.reference_documents
for delete
using (
  assistant.can_manage_assistant()
  or created_by = auth.uid()
);

-- =========================================================
-- 9) Policies: reference files
-- =========================================================

create policy assistant_reference_files_select
on assistant.reference_files
for select
using (assistant.can_read_assistant());

create policy assistant_reference_files_insert
on assistant.reference_files
for insert
with check (assistant.can_read_assistant());

create policy assistant_reference_files_update
on assistant.reference_files
for update
using (assistant.can_manage_assistant())
with check (assistant.can_manage_assistant());

create policy assistant_reference_files_delete
on assistant.reference_files
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 10) Policies: knowledge documents
-- =========================================================

create policy assistant_knowledge_documents_select
on assistant.knowledge_documents
for select
using (assistant.can_read_assistant());

create policy assistant_knowledge_documents_insert
on assistant.knowledge_documents
for insert
with check (
  assistant.can_read_assistant()
  and (
    created_by is null
    or created_by = auth.uid()
    or assistant.can_manage_assistant()
  )
);

create policy assistant_knowledge_documents_update
on assistant.knowledge_documents
for update
using (
  assistant.can_manage_assistant()
  or created_by = auth.uid()
)
with check (
  assistant.can_manage_assistant()
  or created_by = auth.uid()
);

create policy assistant_knowledge_documents_delete
on assistant.knowledge_documents
for delete
using (
  assistant.can_manage_assistant()
  or created_by = auth.uid()
);

-- =========================================================
-- 11) Policies: knowledge citations
-- =========================================================

create policy assistant_knowledge_citations_select
on assistant.knowledge_citations
for select
using (assistant.can_read_assistant());

create policy assistant_knowledge_citations_insert
on assistant.knowledge_citations
for insert
with check (assistant.can_read_assistant());

create policy assistant_knowledge_citations_update
on assistant.knowledge_citations
for update
using (assistant.can_manage_assistant())
with check (assistant.can_manage_assistant());

create policy assistant_knowledge_citations_delete
on assistant.knowledge_citations
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 12) Policies: fetched content
-- =========================================================

create policy assistant_fetched_content_select
on assistant.fetched_content
for select
using (assistant.can_read_assistant());

create policy assistant_fetched_content_insert
on assistant.fetched_content
for insert
with check (assistant.can_read_assistant());

create policy assistant_fetched_content_update
on assistant.fetched_content
for update
using (assistant.can_read_assistant())
with check (assistant.can_read_assistant());

create policy assistant_fetched_content_delete
on assistant.fetched_content
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 13) Policies: fetch logs
-- =========================================================

create policy assistant_fetch_logs_select
on assistant.fetch_logs
for select
using (assistant.can_read_assistant());

create policy assistant_fetch_logs_insert
on assistant.fetch_logs
for insert
with check (assistant.can_manage_assistant());

create policy assistant_fetch_logs_update
on assistant.fetch_logs
for update
using (assistant.can_manage_assistant())
with check (assistant.can_manage_assistant());

create policy assistant_fetch_logs_delete
on assistant.fetch_logs
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 14) Policies: classification ratings
-- =========================================================

create policy assistant_classification_ratings_select
on assistant.classification_ratings
for select
using (assistant.can_read_assistant());

create policy assistant_classification_ratings_insert
on assistant.classification_ratings
for insert
with check (
  assistant.can_read_assistant()
  and (
    created_by is null
    or created_by = auth.uid()
    or assistant.can_manage_assistant()
  )
);

create policy assistant_classification_ratings_update
on assistant.classification_ratings
for update
using (assistant.can_manage_assistant())
with check (assistant.can_manage_assistant());

create policy assistant_classification_ratings_delete
on assistant.classification_ratings
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 15) Policies: review events
-- =========================================================

create policy assistant_review_events_select
on assistant.review_events
for select
using (assistant.can_read_assistant());

create policy assistant_review_events_insert
on assistant.review_events
for insert
with check (
  assistant.can_read_assistant()
  and (
    performed_by is null
    or performed_by = auth.uid()
    or assistant.can_manage_assistant()
  )
);

create policy assistant_review_events_update
on assistant.review_events
for update
using (assistant.can_manage_assistant())
with check (assistant.can_manage_assistant());

create policy assistant_review_events_delete
on assistant.review_events
for delete
using (assistant.can_manage_assistant());

-- =========================================================
-- 16) Policies: conversations
-- =========================================================

create policy assistant_conversations_select
on assistant.conversations
for select
using (
  assistant.can_manage_assistant()
  or assistant.is_conversation_owner(user_id)
);

create policy assistant_conversations_insert
on assistant.conversations
for insert
with check (
  assistant.can_manage_assistant()
  or user_id is null
  or user_id = auth.uid()
);

create policy assistant_conversations_update
on assistant.conversations
for update
using (
  assistant.can_manage_assistant()
  or assistant.is_conversation_owner(user_id)
)
with check (
  assistant.can_manage_assistant()
  or assistant.is_conversation_owner(user_id)
);

create policy assistant_conversations_delete
on assistant.conversations
for delete
using (
  assistant.can_manage_assistant()
  or assistant.is_conversation_owner(user_id)
);

-- =========================================================
-- 17) Policies: messages
-- =========================================================

create policy assistant_messages_select
on assistant.messages
for select
using (
  assistant.can_manage_assistant()
  or assistant.can_access_message_conversation(conversation_id)
);

create policy assistant_messages_insert
on assistant.messages
for insert
with check (
  assistant.can_manage_assistant()
  or assistant.can_access_message_conversation(conversation_id)
);

create policy assistant_messages_delete
on assistant.messages
for delete
using (
  assistant.can_manage_assistant()
  or assistant.can_access_message_conversation(conversation_id)
);

commit;
