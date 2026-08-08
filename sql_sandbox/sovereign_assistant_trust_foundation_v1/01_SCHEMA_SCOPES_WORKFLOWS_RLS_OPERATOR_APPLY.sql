-- Sovereign Assistant Trust Foundation v1
-- OPERATOR APPLY: schema extension, scope assignments, human-review workflow, audit tables and safe RLS.
-- This script does NOT approve sources, citations or documents.

begin;

create table if not exists assistant.knowledge_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  scope_code text not null,
  access_level text not null default 'read',
  assigned_by uuid null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz null,
  is_active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  constraint assistant_knowledge_scope_assignments_access_chk check (access_level in ('read','review','publish','admin')),
  constraint assistant_knowledge_scope_assignments_unique unique (auth_user_id, scope_code)
);

create table if not exists assistant.knowledge_review_tasks (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  workflow_stage text not null,
  priority text not null default 'normal',
  status text not null default 'open',
  assigned_to uuid null,
  assigned_by uuid null,
  due_at timestamptz null,
  completed_at timestamptz null,
  completed_by uuid null,
  dedupe_key text not null unique,
  notes text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_knowledge_review_tasks_target_chk check (target_type in ('knowledge_source','reference_document','knowledge_document','knowledge_citation','faq','suggested_question')),
  constraint assistant_knowledge_review_tasks_stage_chk check (workflow_stage in ('source_verification','citation_verification','content_classification','human_approval','scope_assignment','publication_review')),
  constraint assistant_knowledge_review_tasks_priority_chk check (priority in ('low','normal','high','critical')),
  constraint assistant_knowledge_review_tasks_status_chk check (status in ('open','assigned','in_progress','blocked','completed','cancelled'))
);

create table if not exists assistant.knowledge_access_events (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid null,
  knowledge_document_id uuid null references assistant.knowledge_documents(id) on delete set null,
  action text not null,
  result text not null,
  scope_code text null,
  reason_code text null,
  request_id text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint assistant_knowledge_access_events_action_chk check (action in ('chat_retrieval','library_open','source_open','review','publish')),
  constraint assistant_knowledge_access_events_result_chk check (result in ('allowed','denied','filtered','error'))
);

alter table assistant.knowledge_sources
  add column if not exists verification_status text not null default 'pending',
  add column if not exists official_registry_key text null,
  add column if not exists review_required boolean not null default true;

alter table assistant.reference_documents
  add column if not exists verification_status text not null default 'pending',
  add column if not exists visibility_scope text not null default 'public',
  add column if not exists content_status text not null default 'production';

alter table assistant.knowledge_documents
  add column if not exists content_status text not null default 'production',
  add column if not exists visibility_scope text not null default 'public',
  add column if not exists requires_human_review boolean not null default true;

alter table assistant.knowledge_citations
  add column if not exists verification_status text not null default 'linked',
  add column if not exists verified_by uuid null,
  add column if not exists verified_at timestamptz null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'assistant_knowledge_sources_verification_chk') then
    alter table assistant.knowledge_sources add constraint assistant_knowledge_sources_verification_chk check (verification_status in ('pending','verified','rejected','expired'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assistant_reference_documents_verification_chk') then
    alter table assistant.reference_documents add constraint assistant_reference_documents_verification_chk check (verification_status in ('pending','verified','rejected','expired'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assistant_reference_documents_visibility_scope_chk') then
    alter table assistant.reference_documents add constraint assistant_reference_documents_visibility_scope_chk check (visibility_scope in ('public','internal','restricted'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assistant_reference_documents_content_status_chk') then
    alter table assistant.reference_documents add constraint assistant_reference_documents_content_status_chk check (content_status in ('production','review','legacy','test','duplicate','quarantined'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assistant_knowledge_documents_visibility_scope_chk') then
    alter table assistant.knowledge_documents add constraint assistant_knowledge_documents_visibility_scope_chk check (visibility_scope in ('public','internal','restricted'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assistant_knowledge_documents_content_status_v1_chk') then
    alter table assistant.knowledge_documents add constraint assistant_knowledge_documents_content_status_v1_chk check (content_status in ('production','review','legacy','test','duplicate','quarantined'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'assistant_knowledge_citations_verification_chk') then
    alter table assistant.knowledge_citations add constraint assistant_knowledge_citations_verification_chk check (verification_status in ('linked','verified','rejected'));
  end if;
end $$;

create index if not exists idx_assistant_knowledge_scope_assignments_active
  on assistant.knowledge_scope_assignments (auth_user_id, scope_code) where is_active = true;
create index if not exists idx_assistant_knowledge_review_tasks_open
  on assistant.knowledge_review_tasks (workflow_stage, priority, created_at) where status in ('open','assigned','in_progress','blocked');
create index if not exists idx_assistant_knowledge_access_events_document
  on assistant.knowledge_access_events (knowledge_document_id, created_at desc);
create index if not exists idx_assistant_knowledge_documents_trust
  on assistant.knowledge_documents (status, is_chat_eligible, content_status, visibility_scope);
create index if not exists idx_assistant_knowledge_citations_verification
  on assistant.knowledge_citations (knowledge_document_id, verification_status);

-- No direct client access is granted by this batch. Service-role/server access continues to work.
alter table assistant.knowledge_scope_assignments enable row level security;
alter table assistant.knowledge_review_tasks enable row level security;
alter table assistant.knowledge_access_events enable row level security;

commit;
