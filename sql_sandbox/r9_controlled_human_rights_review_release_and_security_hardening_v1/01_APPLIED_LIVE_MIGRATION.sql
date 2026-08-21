-- PalWakf Assistant R9 Controlled Live Remediation V1
-- Authorized 2026-08-21.
-- Scope: P0 document write exposure, 42-table non-DML privilege minimization,
-- legacy provenance RPC execute hardening, rights governance, human rights review,
-- and fail-closed official release rights/takedown gate.

-- Guard: all 42 evidence-target tables must exist before privilege mutation.
do $$
declare
  v_missing text;
begin
  with target(name) as (
    values
      ('ai_tool_run_events'),
      ('ai_tool_run_links'),
      ('ai_tool_runs'),
      ('assistant_conversations'),
      ('assistant_messages'),
      ('chatbot_conversations'),
      ('chatbot_intents'),
      ('chatbot_messages'),
      ('chatbot_retention_policies'),
      ('classification_ratings'),
      ('conversations'),
      ('document_analyzer_verifications'),
      ('document_assistant_knowledge_candidates'),
      ('document_audit_events'),
      ('document_candidate_links'),
      ('document_file_type_uat_evidence'),
      ('document_files'),
      ('document_jobs'),
      ('document_operational_actions'),
      ('document_pages'),
      ('document_reviews'),
      ('document_structured_fields'),
      ('document_transcriptions'),
      ('document_uncertain_segments'),
      ('fetch_logs'),
      ('fetched_content'),
      ('knowledge_access_events'),
      ('knowledge_citations'),
      ('knowledge_documents'),
      ('knowledge_provenance_reconstruction_items_v1_1'),
      ('knowledge_provenance_reconstruction_runs_v1_1'),
      ('knowledge_provenance_resolution_decisions_v1_1'),
      ('knowledge_review_task_reconciliation_events'),
      ('knowledge_scope_assignments'),
      ('knowledge_sources'),
      ('legacy_import_register'),
      ('legacy_operational_records'),
      ('messages'),
      ('reference_documents'),
      ('reference_files'),
      ('review_events'),
      ('system_settings')
  ),
  missing as (
    select name
    from target
    where to_regclass('assistant.' || quote_ident(name)) is null
  )
  select string_agg(name, ', ' order by name) into v_missing from missing;

  if v_missing is not null then
    raise exception 'R9 target table precondition failed; missing: %', v_missing;
  end if;
end
$$;

-- P0: client DML and administrative privileges must not remain on the four
-- document evidence/operations tables.
revoke insert, update, delete, truncate, references, trigger, maintain
on table
  assistant.document_analyzer_verifications,
  assistant.document_assistant_knowledge_candidates,
  assistant.document_file_type_uat_evidence,
  assistant.document_operational_actions
from anon, authenticated;

-- General 42-table minimization: preserve current CRUD contract outside P0,
-- remove privileges inappropriate for ordinary client row access.
do $$
declare
  r record;
begin
  for r in
    select name from (values
      ('ai_tool_run_events'),
      ('ai_tool_run_links'),
      ('ai_tool_runs'),
      ('assistant_conversations'),
      ('assistant_messages'),
      ('chatbot_conversations'),
      ('chatbot_intents'),
      ('chatbot_messages'),
      ('chatbot_retention_policies'),
      ('classification_ratings'),
      ('conversations'),
      ('document_analyzer_verifications'),
      ('document_assistant_knowledge_candidates'),
      ('document_audit_events'),
      ('document_candidate_links'),
      ('document_file_type_uat_evidence'),
      ('document_files'),
      ('document_jobs'),
      ('document_operational_actions'),
      ('document_pages'),
      ('document_reviews'),
      ('document_structured_fields'),
      ('document_transcriptions'),
      ('document_uncertain_segments'),
      ('fetch_logs'),
      ('fetched_content'),
      ('knowledge_access_events'),
      ('knowledge_citations'),
      ('knowledge_documents'),
      ('knowledge_provenance_reconstruction_items_v1_1'),
      ('knowledge_provenance_reconstruction_runs_v1_1'),
      ('knowledge_provenance_resolution_decisions_v1_1'),
      ('knowledge_review_task_reconciliation_events'),
      ('knowledge_scope_assignments'),
      ('knowledge_sources'),
      ('legacy_import_register'),
      ('legacy_operational_records'),
      ('messages'),
      ('reference_documents'),
      ('reference_files'),
      ('review_events'),
      ('system_settings')
    ) as t(name)
  loop
    execute format(
      'revoke maintain, truncate, references, trigger on table assistant.%I from anon, authenticated',
      r.name
    );
  end loop;
end
$$;

-- Harden document helper search_path and fail closed for authenticated writes.
create or replace function assistant.document_can_read_v1()
returns boolean
language sql
stable
security definer
set search_path = auth, assistant, pg_catalog
as $$
  select auth.role() in ('authenticated', 'service_role');
$$;

create or replace function assistant.document_can_write_v1()
returns boolean
language sql
stable
security definer
set search_path = auth, assistant, pg_catalog
as $$
  select auth.role() = 'service_role';
$$;

-- Legacy provenance RPCs are server/service runtime contracts.
revoke all on function assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1_1() from public, anon, authenticated;
grant execute on function assistant.rpc_get_legacy_provenance_reconstruction_snapshot_v1_1() to service_role;
revoke all on function assistant.rpc_list_duplicate_citation_review_task_groups_v1_1(integer) from public, anon, authenticated;
grant execute on function assistant.rpc_list_duplicate_citation_review_task_groups_v1_1(integer) to service_role;
revoke all on function assistant.rpc_list_legacy_provenance_groups_v1_1(uuid, integer) from public, anon, authenticated;
grant execute on function assistant.rpc_list_legacy_provenance_groups_v1_1(uuid, integer) to service_role;
revoke all on function assistant.rpc_list_legacy_provenance_reconstruction_items_v1_1(uuid, text, integer) from public, anon, authenticated;
grant execute on function assistant.rpc_list_legacy_provenance_reconstruction_items_v1_1(uuid, text, integer) to service_role;
revoke all on function assistant.rpc_reconcile_duplicate_citation_review_task_v1_1(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function assistant.rpc_reconcile_duplicate_citation_review_task_v1_1(uuid, uuid, uuid, text) to service_role;
revoke all on function assistant.rpc_record_legacy_provenance_resolution_v1_1(uuid, uuid, text, text, text, text, text) from public, anon, authenticated;
grant execute on function assistant.rpc_record_legacy_provenance_resolution_v1_1(uuid, uuid, text, text, text, text, text) to service_role;
revoke all on function assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(uuid, uuid, text) from public, anon, authenticated;
grant execute on function assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Rights / provenance governance: reuse canonical Mega Batch C model.
-- ---------------------------------------------------------------------------

create table if not exists assistant.source_url_history (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references assistant.knowledge_sources(id) on delete restrict,
  url text not null,
  url_role text not null default 'current',
  url_status text not null default 'active',
  is_current boolean not null default false,
  change_reason text null,
  observed_at timestamptz null,
  changed_by uuid null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint assistant_source_url_history_role_chk check (url_role in ('original','current','alternate','redirect','archived')),
  constraint assistant_source_url_history_status_chk check (url_status in ('active','redirected','unavailable','archived','under_review')),
  constraint assistant_source_url_history_http_chk check (url ~* '^https?://')
);

create unique index if not exists uq_assistant_source_url_history_current
  on assistant.source_url_history(source_id) where is_current = true;
create index if not exists idx_assistant_source_url_history_source_created
  on assistant.source_url_history(source_id, created_at desc);

create table if not exists assistant.source_rights_profiles (
  source_id uuid primary key references assistant.knowledge_sources(id) on delete restrict,
  rights_status text not null default 'review_required',
  license_type text null,
  license_url text null,
  publisher_name text null,
  rights_holder_name text null,
  attribution_text text null,
  permission_reference text null,
  terms_url text null,
  allowed_use_scope text null,
  full_text_retention_allowed boolean null,
  rag_eligibility text not null default 'review_only',
  public_display_eligibility text not null default 'metadata_only',
  review_status text not null default 'pending',
  reviewed_by uuid null,
  reviewed_at timestamptz null,
  notes text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_source_rights_status_chk check (rights_status in ('unknown','review_required','licensed','permission_recorded','public_domain','official_publication','restricted','prohibited','removed')),
  constraint assistant_source_rights_rag_chk check (rag_eligibility in ('review_only','internal_only','eligible_after_review','blocked')),
  constraint assistant_source_rights_display_chk check (public_display_eligibility in ('metadata_only','excerpt_only','full_text_permitted','blocked')),
  constraint assistant_source_rights_review_chk check (review_status in ('pending','verified','rejected','expired')),
  constraint assistant_source_rights_license_http_chk check (license_url is null or license_url ~* '^https?://'),
  constraint assistant_source_rights_terms_http_chk check (terms_url is null or terms_url ~* '^https?://')
);

create index if not exists idx_assistant_source_rights_review
  on assistant.source_rights_profiles(rights_status, review_status, updated_at desc);

create table if not exists assistant.source_permissions (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references assistant.knowledge_sources(id) on delete restrict,
  rights_holder_name text null,
  permission_reference text not null,
  permission_scope text null,
  granted_at timestamptz null,
  expires_at timestamptz null,
  evidence_reference text null,
  status text not null default 'recorded',
  recorded_by uuid null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_source_permissions_status_chk check (status in ('recorded','verified','expired','revoked','rejected'))
);
create index if not exists idx_assistant_source_permissions_source
  on assistant.source_permissions(source_id, status, updated_at desc);

create table if not exists assistant.source_takedown_requests (
  id uuid primary key default gen_random_uuid(),
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  requester_name text null,
  requester_contact text null,
  request_reference text null,
  request_reason text not null,
  status text not null default 'open',
  received_at timestamptz not null default now(),
  resolved_at timestamptz null,
  resolved_by uuid null,
  resolution_notes text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_source_takedown_status_chk check (status in ('open','under_review','accepted','rejected','completed'))
);
create index if not exists idx_assistant_source_takedown_status
  on assistant.source_takedown_requests(status, received_at desc);

create table if not exists assistant.source_provenance_events (
  id uuid primary key default gen_random_uuid(),
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  actor_auth_user_id uuid null,
  event_type text not null,
  reason text null,
  before_json jsonb not null default '{}'::jsonb,
  after_json jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint assistant_source_provenance_events_type_chk check (
    event_type in (
      'source_created','source_updated','source_archived','url_history_recorded',
      'rights_profile_updated','permission_recorded','takedown_received','takedown_resolved'
    )
  )
);
create index if not exists idx_assistant_source_provenance_events_source
  on assistant.source_provenance_events(source_id, created_at desc);

alter table assistant.source_url_history enable row level security;
alter table assistant.source_rights_profiles enable row level security;
alter table assistant.source_permissions enable row level security;
alter table assistant.source_takedown_requests enable row level security;
alter table assistant.source_provenance_events enable row level security;

create or replace function assistant.assert_source_provenance_manage_v1(
  p_actor_auth_user_id uuid,
  p_actor_is_super_admin boolean default false
)
returns void
language plpgsql
security definer
set search_path = assistant, pg_catalog
as $$
begin
  if p_actor_auth_user_id is null then
    raise exception 'actor auth user id is required';
  end if;

  if coalesce(p_actor_is_super_admin, false) then
    return;
  end if;

  if not exists (
    select 1
    from assistant.knowledge_scope_assignments ksa
    where ksa.auth_user_id = p_actor_auth_user_id
      and ksa.is_active = true
      and (ksa.expires_at is null or ksa.expires_at >= now())
      and lower(ksa.scope_code) in ('assistant.all','assistant.admin','assistant.source.manage')
      and lower(ksa.access_level) in ('admin','publish')
  ) then
    raise exception 'assistant.source.manage scope with admin/publish access is required';
  end if;
end;
$$;

create or replace function assistant.rpc_source_provenance_upsert_source_v1(
  p_actor_auth_user_id uuid,
  p_actor_is_super_admin boolean,
  p_source_id uuid,
  p_name text,
  p_base_url text,
  p_description text,
  p_authority_level text,
  p_is_active boolean,
  p_change_reason text,
  p_rights_json jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = assistant, pg_catalog
as $$
declare
  v_source assistant.knowledge_sources%rowtype;
  v_source_id uuid;
  v_old_url text;
  v_action text;
  v_rights jsonb := coalesce(p_rights_json, '{}'::jsonb);
  v_before jsonb;
  v_after jsonb;
begin
  perform assistant.assert_source_provenance_manage_v1(p_actor_auth_user_id, p_actor_is_super_admin);

  if nullif(trim(p_name), '') is null then
    raise exception 'source name is required';
  end if;
  if nullif(trim(p_base_url), '') is null or trim(p_base_url) !~* '^https?://' then
    raise exception 'a valid http/https source URL is required';
  end if;
  if coalesce(p_authority_level, 'unverified') not in ('official','semi_official','reference','unverified') then
    raise exception 'invalid authority level';
  end if;

  if p_source_id is null then
    insert into assistant.knowledge_sources (
      name, type, base_url, description, authority_level, is_active,
      verification_status, review_required, metadata_json
    ) values (
      trim(p_name), 'external_fetch', trim(p_base_url), nullif(trim(p_description), ''),
      coalesce(p_authority_level, 'unverified'), coalesce(p_is_active, true),
      'pending', true,
      jsonb_build_object(
        'source_provenance_contract','assistant_source_provenance_rights_v1',
        'rights_review_required', true,
        'no_automatic_fetch', true,
        'no_automatic_chat_release', true
      )
    ) returning * into v_source;
    v_source_id := v_source.id;
    v_old_url := null;
    v_action := 'source_created';
    v_before := '{}'::jsonb;
  else
    select * into v_source
    from assistant.knowledge_sources
    where id = p_source_id
    for update;

    if not found then
      raise exception 'source not found';
    end if;

    v_source_id := v_source.id;
    v_old_url := v_source.base_url;
    v_action := 'source_updated';
    v_before := jsonb_build_object(
      'name', v_source.name,
      'base_url', v_source.base_url,
      'description', v_source.description,
      'authority_level', v_source.authority_level,
      'is_active', v_source.is_active
    );

    if nullif(trim(coalesce(p_change_reason, '')), '') is null then
      raise exception 'change reason is required when modifying an existing source';
    end if;

    update assistant.knowledge_sources
    set name = trim(p_name),
        base_url = trim(p_base_url),
        description = nullif(trim(p_description), ''),
        authority_level = coalesce(p_authority_level, authority_level),
        is_active = coalesce(p_is_active, is_active),
        metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
          'source_provenance_contract','assistant_source_provenance_rights_v1',
          'last_source_provenance_update_at', now(),
          'rights_review_required', true,
          'no_automatic_fetch', true,
          'no_automatic_chat_release', true
        ),
        updated_at = now()
    where id = v_source_id
    returning * into v_source;
  end if;

  if v_old_url is not null and v_old_url <> trim(p_base_url) then
    insert into assistant.source_url_history (
      source_id, url, url_role, url_status, is_current, change_reason, changed_by, metadata_json
    )
    select v_source_id, v_old_url, 'original', 'archived', false,
           nullif(trim(p_change_reason), ''), p_actor_auth_user_id,
           jsonb_build_object('recorded_by','rpc_source_provenance_upsert_source_v1')
    where not exists (
      select 1 from assistant.source_url_history h
      where h.source_id=v_source_id and h.url=v_old_url
    );

    update assistant.source_url_history
      set is_current = false,
          url_status = case when url_status = 'active' then 'redirected' else url_status end
      where source_id = v_source_id and is_current = true;
  end if;

  insert into assistant.source_url_history (
    source_id, url, url_role, url_status, is_current, change_reason, changed_by, metadata_json
  )
  select v_source_id, trim(p_base_url), 'current', 'active', true,
         nullif(trim(p_change_reason), ''), p_actor_auth_user_id,
         jsonb_build_object('recorded_by','rpc_source_provenance_upsert_source_v1')
  where not exists (
    select 1
    from assistant.source_url_history h
    where h.source_id=v_source_id and h.url=trim(p_base_url) and h.is_current=true
  );

  update assistant.source_url_history
    set is_current = false
    where source_id = v_source_id
      and url <> trim(p_base_url)
      and is_current = true;

  insert into assistant.source_rights_profiles (
    source_id, rights_status, license_type, license_url, publisher_name, rights_holder_name,
    attribution_text, permission_reference, terms_url, allowed_use_scope,
    full_text_retention_allowed, rag_eligibility, public_display_eligibility,
    review_status, reviewed_by, reviewed_at, notes, metadata_json, updated_at
  ) values (
    v_source_id,
    coalesce(v_rights->>'rights_status', 'review_required'),
    nullif(v_rights->>'license_type', ''),
    nullif(v_rights->>'license_url', ''),
    nullif(v_rights->>'publisher_name', ''),
    nullif(v_rights->>'rights_holder_name', ''),
    nullif(v_rights->>'attribution_text', ''),
    nullif(v_rights->>'permission_reference', ''),
    nullif(v_rights->>'terms_url', ''),
    nullif(v_rights->>'allowed_use_scope', ''),
    case when v_rights ? 'full_text_retention_allowed'
      then (v_rights->>'full_text_retention_allowed')::boolean else null end,
    coalesce(v_rights->>'rag_eligibility', 'review_only'),
    coalesce(v_rights->>'public_display_eligibility', 'metadata_only'),
    'pending',
    null,
    null,
    nullif(v_rights->>'notes', ''),
    jsonb_build_object(
      'managed_by','assistant_source_provenance_rights_v1',
      'review_reset_reason','rights_profile_upsert'
    ),
    now()
  )
  on conflict (source_id) do update set
    rights_status = excluded.rights_status,
    license_type = excluded.license_type,
    license_url = excluded.license_url,
    publisher_name = excluded.publisher_name,
    rights_holder_name = excluded.rights_holder_name,
    attribution_text = excluded.attribution_text,
    permission_reference = excluded.permission_reference,
    terms_url = excluded.terms_url,
    allowed_use_scope = excluded.allowed_use_scope,
    full_text_retention_allowed = excluded.full_text_retention_allowed,
    rag_eligibility = excluded.rag_eligibility,
    public_display_eligibility = excluded.public_display_eligibility,
    review_status = 'pending',
    reviewed_by = null,
    reviewed_at = null,
    notes = excluded.notes,
    metadata_json = coalesce(assistant.source_rights_profiles.metadata_json, '{}'::jsonb)
      || jsonb_build_object(
        'managed_by','assistant_source_provenance_rights_v1',
        'review_reset_reason','rights_profile_upsert',
        'review_reset_at',now()
      ),
    updated_at = now();

  v_after := jsonb_build_object(
    'name', v_source.name,
    'base_url', v_source.base_url,
    'description', v_source.description,
    'authority_level', v_source.authority_level,
    'is_active', v_source.is_active,
    'rights_status', coalesce(v_rights->>'rights_status', 'review_required'),
    'rag_eligibility', coalesce(v_rights->>'rag_eligibility', 'review_only'),
    'public_display_eligibility', coalesce(v_rights->>'public_display_eligibility', 'metadata_only'),
    'rights_review_status', 'pending'
  );

  insert into assistant.source_provenance_events (
    source_id, actor_auth_user_id, event_type, reason, before_json, after_json, metadata_json
  ) values (
    v_source_id, p_actor_auth_user_id, v_action, nullif(trim(p_change_reason), ''),
    v_before, v_after,
    jsonb_build_object(
      'contract','assistant_source_provenance_rights_v1',
      'actor_is_super_admin',coalesce(p_actor_is_super_admin,false)
    )
  );

  insert into assistant.source_provenance_events (
    source_id, actor_auth_user_id, event_type, reason, before_json, after_json, metadata_json
  ) values (
    v_source_id, p_actor_auth_user_id, 'rights_profile_updated',
    nullif(trim(p_change_reason), ''), '{}'::jsonb, v_rights,
    jsonb_build_object(
      'contract','assistant_source_provenance_rights_v1',
      'review_status','pending',
      'review_reset',true
    )
  );

  return jsonb_build_object(
    'source_id', v_source_id,
    'action', v_action,
    'base_url', v_source.base_url,
    'rights_review_status', 'pending',
    'no_automatic_fetch', true,
    'no_automatic_chat_release', true
  );
end;
$$;

create or replace function assistant.rpc_source_provenance_archive_source_v1(
  p_actor_auth_user_id uuid,
  p_actor_is_super_admin boolean,
  p_source_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = assistant, pg_catalog
as $$
declare
  v_source assistant.knowledge_sources%rowtype;
begin
  perform assistant.assert_source_provenance_manage_v1(
    p_actor_auth_user_id, p_actor_is_super_admin
  );

  if nullif(trim(p_reason), '') is null then
    raise exception 'archive reason is required';
  end if;

  select * into v_source
  from assistant.knowledge_sources
  where id=p_source_id
  for update;

  if not found then
    raise exception 'source not found';
  end if;

  update assistant.knowledge_sources
  set is_active=false,
      metadata_json=coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'source_provenance_archived_at', now(),
        'source_provenance_archive_reason', trim(p_reason),
        'no_automatic_fetch', true,
        'no_automatic_chat_release', true
      ),
      updated_at=now()
  where id=p_source_id;

  update assistant.source_url_history
  set is_current=false,
      url_status=case when url_status='active' then 'archived' else url_status end
  where source_id=p_source_id and is_current=true;

  insert into assistant.source_provenance_events (
    source_id, actor_auth_user_id, event_type, reason, before_json, after_json, metadata_json
  ) values (
    p_source_id, p_actor_auth_user_id, 'source_archived', trim(p_reason),
    jsonb_build_object('is_active',v_source.is_active,'base_url',v_source.base_url),
    jsonb_build_object('is_active',false,'base_url',v_source.base_url),
    jsonb_build_object(
      'contract','assistant_source_provenance_rights_v1',
      'actor_is_super_admin',coalesce(p_actor_is_super_admin,false)
    )
  );

  return jsonb_build_object('source_id',p_source_id,'archived',true,'no_delete',true);
end;
$$;

-- Dedicated human rights-review action. This is deliberately separate from
-- rights data entry; profile changes always reset review_status to pending.
create or replace function assistant.rpc_source_rights_review_v1(
  p_actor_auth_user_id uuid,
  p_actor_is_super_admin boolean,
  p_source_id uuid,
  p_decision text,
  p_review_notes text
)
returns jsonb
language plpgsql
security invoker
set search_path = assistant, pg_catalog
as $$
declare
  v_rights assistant.source_rights_profiles%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_has_evidence boolean;
begin
  perform assistant.assert_source_provenance_manage_v1(
    p_actor_auth_user_id, p_actor_is_super_admin
  );

  if p_decision not in ('verified','rejected') then
    raise exception 'rights review decision must be verified or rejected';
  end if;

  if nullif(trim(coalesce(p_review_notes,'')), '') is null
     or length(trim(p_review_notes)) < 8 then
    raise exception 'rights review notes are required';
  end if;

  select * into v_rights
  from assistant.source_rights_profiles
  where source_id = p_source_id
  for update;

  if not found then
    raise exception 'source rights profile not found';
  end if;

  v_before := to_jsonb(v_rights);

  if p_decision = 'verified' then
    if v_rights.rights_status not in (
      'licensed','permission_recorded','public_domain','official_publication'
    ) then
      raise exception 'rights status is not eligible for verification';
    end if;

    if v_rights.rag_eligibility <> 'eligible_after_review' then
      raise exception 'rag eligibility must be eligible_after_review';
    end if;

    if v_rights.public_display_eligibility not in (
      'excerpt_only','full_text_permitted'
    ) then
      raise exception 'public display eligibility is not sufficient';
    end if;

    select (
      (
        v_rights.rights_status = 'official_publication'
        and exists (
          select 1
          from assistant.knowledge_sources ks
          where ks.id = p_source_id
            and ks.authority_level = 'official'
            and ks.verification_status = 'verified'
            and ks.is_active = true
        )
      )
      or nullif(trim(coalesce(v_rights.license_url,'')), '') is not null
      or nullif(trim(coalesce(v_rights.terms_url,'')), '') is not null
      or nullif(trim(coalesce(v_rights.permission_reference,'')), '') is not null
      or exists (
        select 1
        from assistant.source_permissions sp
        where sp.source_id = p_source_id
          and sp.status = 'verified'
          and nullif(trim(coalesce(sp.evidence_reference,'')), '') is not null
          and (sp.expires_at is null or sp.expires_at >= now())
      )
    ) into v_has_evidence;

    if not coalesce(v_has_evidence, false) then
      raise exception 'documentary rights evidence is required';
    end if;
  end if;

  update assistant.source_rights_profiles
  set review_status = p_decision,
      reviewed_by = p_actor_auth_user_id,
      reviewed_at = now(),
      notes = concat_ws(E'\n', nullif(notes,''), trim(p_review_notes)),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'rights_review_decision', p_decision,
        'rights_reviewed_by', p_actor_auth_user_id,
        'rights_reviewed_at', now(),
        'human_review_required', true
      ),
      updated_at = now()
  where source_id = p_source_id
  returning * into v_rights;

  v_after := to_jsonb(v_rights);

  insert into assistant.source_provenance_events (
    source_id, actor_auth_user_id, event_type, reason, before_json, after_json, metadata_json
  ) values (
    p_source_id,
    p_actor_auth_user_id,
    'rights_profile_updated',
    trim(p_review_notes),
    v_before,
    v_after,
    jsonb_build_object(
      'contract','assistant_source_provenance_rights_v1',
      'operation','human_rights_review',
      'decision',p_decision
    )
  );

  return jsonb_build_object(
    'source_id',p_source_id,
    'review_status',p_decision,
    'reviewed_by',p_actor_auth_user_id,
    'rights_status',v_rights.rights_status,
    'rag_eligibility',v_rights.rag_eligibility,
    'public_display_eligibility',v_rights.public_display_eligibility,
    'no_automatic_chat_release',true
  );
end;
$$;

-- Rights tables/RPCs remain server/service only.
revoke all on assistant.source_url_history from public, anon, authenticated;
revoke all on assistant.source_rights_profiles from public, anon, authenticated;
revoke all on assistant.source_permissions from public, anon, authenticated;
revoke all on assistant.source_takedown_requests from public, anon, authenticated;
revoke all on assistant.source_provenance_events from public, anon, authenticated;

grant select, insert, update, delete on assistant.source_url_history to service_role;
grant select, insert, update, delete on assistant.source_rights_profiles to service_role;
grant select, insert, update, delete on assistant.source_permissions to service_role;
grant select, insert, update, delete on assistant.source_takedown_requests to service_role;
grant select, insert, update, delete on assistant.source_provenance_events to service_role;

revoke all on function assistant.assert_source_provenance_manage_v1(uuid, boolean)
  from public, anon, authenticated;
revoke all on function assistant.rpc_source_provenance_upsert_source_v1(
  uuid, boolean, uuid, text, text, text, text, boolean, text, jsonb
) from public, anon, authenticated;
revoke all on function assistant.rpc_source_provenance_archive_source_v1(
  uuid, boolean, uuid, text
) from public, anon, authenticated;
revoke all on function assistant.rpc_source_rights_review_v1(
  uuid, boolean, uuid, text, text
) from public, anon, authenticated;

grant execute on function assistant.assert_source_provenance_manage_v1(uuid, boolean)
  to service_role;
grant execute on function assistant.rpc_source_provenance_upsert_source_v1(
  uuid, boolean, uuid, text, text, text, text, boolean, text, jsonb
) to service_role;
grant execute on function assistant.rpc_source_provenance_archive_source_v1(
  uuid, boolean, uuid, text
) to service_role;
grant execute on function assistant.rpc_source_rights_review_v1(
  uuid, boolean, uuid, text, text
) to service_role;

-- ---------------------------------------------------------------------------
-- Fail-closed official release gate: official source + citation + rights.
-- ---------------------------------------------------------------------------
create or replace function assistant.rpc_release_official_knowledge_document_v1(
  p_knowledge_document_id uuid,
  p_reviewer_auth_user_id uuid,
  p_release_notes text
)
returns jsonb
language plpgsql
security invoker
set search_path = assistant, pg_catalog
as $$
declare
  v_reference_id uuid;
  v_knowledge_source_id uuid;
  v_reference_source_id uuid;
begin
  perform assistant.assert_knowledge_reviewer_scope_v1(
    p_reviewer_auth_user_id, 'publish'
  );

  if nullif(trim(p_release_notes), '') is null then
    raise exception 'release notes are required';
  end if;

  select kd.reference_document_id, kd.source_id
  into v_reference_id, v_knowledge_source_id
  from assistant.knowledge_documents kd
  where kd.id = p_knowledge_document_id
  for update;

  if v_reference_id is null then
    raise exception 'knowledge document or canonical reference not found';
  end if;

  select rd.source_id
  into v_reference_source_id
  from assistant.reference_documents rd
  where rd.id = v_reference_id;

  if v_reference_source_id is null then
    raise exception 'canonical reference source is required';
  end if;

  if v_knowledge_source_id is not null
     and v_knowledge_source_id <> v_reference_source_id then
    raise exception 'knowledge document source conflicts with canonical reference source';
  end if;

  if not exists (
    select 1
    from assistant.reference_documents rd
    join assistant.knowledge_sources ks on ks.id = rd.source_id
    where rd.id = v_reference_id
      and rd.verification_status = 'verified'
      and rd.authority_level = 'official'
      and rd.content_status not in ('test','duplicate','quarantined')
      and ks.authority_level = 'official'
      and ks.verification_status = 'verified'
      and ks.is_active = true
  ) then
    raise exception 'official active human-verified source requirement is not met';
  end if;

  if not exists (
    select 1
    from assistant.knowledge_citations kc
    where kc.knowledge_document_id = p_knowledge_document_id
      and kc.verification_status = 'verified'
  ) then
    raise exception 'at least one human-verified citation is required';
  end if;

  if exists (
    select 1
    from assistant.knowledge_documents kd
    where kd.id = p_knowledge_document_id
      and kd.content_status in ('test','duplicate','quarantined')
  ) then
    raise exception 'blocked content cannot be released';
  end if;

  if not exists (
    select 1
    from assistant.source_rights_profiles srp
    where srp.source_id = v_reference_source_id
      and srp.review_status = 'verified'
      and srp.rights_status in (
        'licensed','permission_recorded','public_domain','official_publication'
      )
      and srp.rag_eligibility = 'eligible_after_review'
      and srp.public_display_eligibility in ('excerpt_only','full_text_permitted')
      and (
        (
          srp.rights_status = 'official_publication'
          and exists (
            select 1
            from assistant.knowledge_sources ks
            where ks.id = srp.source_id
              and ks.authority_level = 'official'
              and ks.verification_status = 'verified'
              and ks.is_active = true
          )
        )
        or nullif(trim(coalesce(srp.license_url,'')), '') is not null
        or nullif(trim(coalesce(srp.terms_url,'')), '') is not null
        or nullif(trim(coalesce(srp.permission_reference,'')), '') is not null
        or exists (
          select 1
          from assistant.source_permissions sp
          where sp.source_id = srp.source_id
            and sp.status = 'verified'
            and nullif(trim(coalesce(sp.evidence_reference,'')), '') is not null
            and (sp.expires_at is null or sp.expires_at >= now())
        )
      )
  ) then
    raise exception 'verified source rights requirement is not met';
  end if;

  if exists (
    select 1
    from assistant.source_takedown_requests str
    where str.source_id = v_reference_source_id
      and str.status in ('open','under_review','accepted')
  ) then
    raise exception 'source takedown hold blocks release';
  end if;

  update assistant.reference_documents
  set status = 'approved',
      content_status = 'production',
      authority_level = 'official',
      review_decision = 'approve',
      reviewed_by = p_reviewer_auth_user_id,
      reviewed_at = now(),
      approval_version = coalesce(approval_version, 0) + 1,
      review_notes = concat_ws(
        E'\n', nullif(review_notes, ''),
        'Official release with verified rights: ' || trim(p_release_notes)
      )
  where id = v_reference_id;

  update assistant.knowledge_documents
  set status = 'approved',
      content_status = 'production',
      authority_level = 'official',
      is_chat_eligible = true,
      requires_human_review = false,
      review_decision = 'approve',
      reviewed_by = p_reviewer_auth_user_id,
      reviewed_at = now(),
      approval_version = coalesce(approval_version, 0) + 1,
      review_notes = concat_ws(
        E'\n', nullif(review_notes, ''),
        'Official release with verified rights: ' || trim(p_release_notes)
      ),
      metadata_json = coalesce(metadata_json, '{}'::jsonb) || jsonb_build_object(
        'strict_public_retrieval_gate',
          'released_after_official_source_verified_citation_and_verified_rights',
        'rights_gate_version','r9_v1',
        'chat_released_at',now(),
        'chat_released_by',p_reviewer_auth_user_id,
        'official_only_release_policy',true
      )
  where id = p_knowledge_document_id;

  insert into assistant.knowledge_review_tasks (
    target_type, target_id, workflow_stage, priority, status,
    completed_at, completed_by, dedupe_key, notes, metadata_json
  ) values (
    'knowledge_document',
    p_knowledge_document_id,
    'human_approval',
    'high',
    'completed',
    now(),
    p_reviewer_auth_user_id,
    'human_release:' || p_knowledge_document_id::text,
    trim(p_release_notes),
    jsonb_build_object(
      'release_policy','official_verified_citation_verified_rights',
      'rights_gate_version','r9_v1',
      'released_at',now(),
      'released_by',p_reviewer_auth_user_id,
      'source_id',v_reference_source_id
    )
  )
  on conflict (dedupe_key) do update
  set status='completed',
      completed_at=excluded.completed_at,
      completed_by=excluded.completed_by,
      notes=excluded.notes,
      metadata_json=excluded.metadata_json,
      updated_at=now();

  insert into assistant.knowledge_access_events (
    auth_user_id, knowledge_document_id, action, result,
    scope_code, reason_code, metadata_json
  ) values (
    p_reviewer_auth_user_id,
    p_knowledge_document_id,
    'publish',
    'allowed',
    'assistant.publish',
    'official_source_verified_citation_verified_rights',
    jsonb_build_object(
      'release_notes',trim(p_release_notes),
      'reference_document_id',v_reference_id,
      'source_id',v_reference_source_id,
      'rights_gate_version','r9_v1'
    )
  );

  return jsonb_build_object(
    'knowledge_document_id',p_knowledge_document_id,
    'reference_document_id',v_reference_id,
    'source_id',v_reference_source_id,
    'status','approved',
    'is_chat_eligible',true,
    'rights_gate','verified',
    'rights_gate_version','r9_v1',
    'release_policy','official_verified_citation_verified_rights'
  );
end;
$$;

-- Preserve existing server-only execute boundary for official release.
revoke all on function assistant.rpc_release_official_knowledge_document_v1(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function assistant.rpc_release_official_knowledge_document_v1(uuid, uuid, text)
  to service_role;