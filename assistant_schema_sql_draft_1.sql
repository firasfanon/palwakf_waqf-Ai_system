
-- Assistant Schema SQL Draft 1
-- PalWakf / Supabase PostgreSQL
-- Phase 1 only
-- Purpose:
--   Create the first sovereign assistant schema inside the unified database.
-- Scope:
--   Reference + derived knowledge + governance + operational chat data
-- Out of scope:
--   embeddings, vector index, knowledge_chunks, bookmarks, favorites, tool outputs

begin;

create schema if not exists assistant;

-- =========================================================
-- 1) Helper functions
-- =========================================================

create or replace function assistant.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================================
-- 2) System settings
-- =========================================================

create table if not exists assistant.system_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value_json jsonb not null default '{}'::jsonb,
  description text null,
  updated_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_assistant_system_settings_updated_at on assistant.system_settings;
create trigger trg_assistant_system_settings_updated_at
before update on assistant.system_settings
for each row execute function assistant.set_updated_at();

comment on table assistant.system_settings is
'Assistant runtime/system settings, including hybrid LLM provider config.';

-- =========================================================
-- 3) Knowledge sources
-- =========================================================

create table if not exists assistant.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  base_url text null,
  description text null,
  authority_level text null,
  is_active boolean not null default true,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_knowledge_sources_type_chk check (
    type in ('manual', 'seeded', 'external_fetch', 'internal_reference', 'other')
  ),
  constraint assistant_knowledge_sources_authority_chk check (
    authority_level is null or authority_level in ('official', 'semi_official', 'reference', 'unverified')
  )
);

drop trigger if exists trg_assistant_knowledge_sources_updated_at on assistant.knowledge_sources;
create trigger trg_assistant_knowledge_sources_updated_at
before update on assistant.knowledge_sources
for each row execute function assistant.set_updated_at();

create index if not exists idx_assistant_knowledge_sources_active
  on assistant.knowledge_sources (is_active);

comment on table assistant.knowledge_sources is
'Registry of assistant knowledge/reference sources.';

-- =========================================================
-- 4) Reference documents
-- =========================================================

create table if not exists assistant.reference_documents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  title text not null,
  document_type text null,
  language text null,
  status text not null default 'draft',
  authority_level text not null default 'unverified',
  domain_scope text not null default 'other',
  source_type text not null default 'manual',
  summary text null,
  content_text text null,
  content_hash text null,
  metadata_json jsonb not null default '{}'::jsonb,
  effective_from timestamptz null,
  effective_to timestamptz null,
  approval_version integer not null default 1,
  review_notes text null,
  review_decision text null,
  reviewed_by uuid null,
  reviewed_at timestamptz null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_reference_documents_status_chk check (
    status in ('draft', 'in_review', 'approved', 'rejected', 'archived')
  ),
  constraint assistant_reference_documents_authority_chk check (
    authority_level in ('official', 'semi_official', 'reference', 'unverified')
  ),
  constraint assistant_reference_documents_domain_chk check (
    domain_scope in ('waqf_law', 'fiqh', 'administrative', 'historical', 'public_info', 'internal_procedure', 'other')
  ),
  constraint assistant_reference_documents_source_type_chk check (
    source_type in ('manual', 'pdf_upload', 'external_fetch', 'system_generated', 'seeded')
  ),
  constraint assistant_reference_documents_review_decision_chk check (
    review_decision is null or review_decision in ('approve', 'reject', 'archive', 'send_back')
  )
);

drop trigger if exists trg_assistant_reference_documents_updated_at on assistant.reference_documents;
create trigger trg_assistant_reference_documents_updated_at
before update on assistant.reference_documents
for each row execute function assistant.set_updated_at();

create index if not exists idx_assistant_reference_documents_status
  on assistant.reference_documents (status);

create index if not exists idx_assistant_reference_documents_authority
  on assistant.reference_documents (authority_level);

create index if not exists idx_assistant_reference_documents_domain
  on assistant.reference_documents (domain_scope);

comment on table assistant.reference_documents is
'Canonical retained reference/source documents from which assistant knowledge may be derived.';

-- =========================================================
-- 5) Reference files
-- =========================================================

create table if not exists assistant.reference_files (
  id uuid primary key default gen_random_uuid(),
  reference_document_id uuid not null references assistant.reference_documents(id) on delete cascade,
  storage_path text not null,
  original_filename text null,
  mime_type text null,
  file_size_bytes bigint null,
  file_hash text null,
  is_primary boolean not null default true,
  ocr_text text null,
  extracted_text text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assistant_reference_files_document
  on assistant.reference_files (reference_document_id);

comment on table assistant.reference_files is
'Retained file attachments for reference documents. Binary file goes to storage; metadata lives here.';

-- =========================================================
-- 6) Knowledge documents
-- =========================================================

create table if not exists assistant.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  reference_document_id uuid null references assistant.reference_documents(id) on delete set null,
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  title text not null,
  category text null,
  status text not null default 'draft',
  authority_level text not null default 'unverified',
  domain_scope text not null default 'other',
  source_type text not null default 'manual',
  summary text null,
  content text not null,
  tags jsonb not null default '[]'::jsonb,
  is_chat_eligible boolean not null default false,
  chat_priority integer not null default 50,
  grounding_weight numeric(8,3) not null default 1.000,
  approval_version integer not null default 1,
  review_notes text null,
  review_decision text null,
  reviewed_by uuid null,
  reviewed_at timestamptz null,
  effective_from timestamptz null,
  effective_to timestamptz null,
  supersedes_document_id uuid null references assistant.knowledge_documents(id) on delete set null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_knowledge_documents_status_chk check (
    status in ('draft', 'in_review', 'approved', 'rejected', 'archived')
  ),
  constraint assistant_knowledge_documents_authority_chk check (
    authority_level in ('official', 'semi_official', 'reference', 'unverified')
  ),
  constraint assistant_knowledge_documents_domain_chk check (
    domain_scope in ('waqf_law', 'fiqh', 'administrative', 'historical', 'public_info', 'internal_procedure', 'other')
  ),
  constraint assistant_knowledge_documents_source_type_chk check (
    source_type in ('manual', 'pdf_upload', 'external_fetch', 'system_generated', 'seeded')
  ),
  constraint assistant_knowledge_documents_review_decision_chk check (
    review_decision is null or review_decision in ('approve', 'reject', 'archive', 'send_back')
  ),
  constraint assistant_knowledge_documents_chat_priority_chk check (
    chat_priority between 0 and 1000
  )
);

drop trigger if exists trg_assistant_knowledge_documents_updated_at on assistant.knowledge_documents;
create trigger trg_assistant_knowledge_documents_updated_at
before update on assistant.knowledge_documents
for each row execute function assistant.set_updated_at();

create index if not exists idx_assistant_knowledge_documents_status
  on assistant.knowledge_documents (status);

create index if not exists idx_assistant_knowledge_documents_chat_eligible
  on assistant.knowledge_documents (is_chat_eligible);

create index if not exists idx_assistant_knowledge_documents_source
  on assistant.knowledge_documents (source_id);

create index if not exists idx_assistant_knowledge_documents_reference
  on assistant.knowledge_documents (reference_document_id);

create index if not exists idx_assistant_knowledge_documents_category
  on assistant.knowledge_documents (category);

comment on table assistant.knowledge_documents is
'Governed derived knowledge records. Chat should read only from approved and chat-eligible rows.';

-- =========================================================
-- 7) Knowledge citations
-- =========================================================

create table if not exists assistant.knowledge_citations (
  id uuid primary key default gen_random_uuid(),
  knowledge_document_id uuid not null references assistant.knowledge_documents(id) on delete cascade,
  reference_document_id uuid not null references assistant.reference_documents(id) on delete cascade,
  reference_file_id uuid null references assistant.reference_files(id) on delete set null,
  citation_type text null,
  locator text null,
  excerpt text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assistant_knowledge_citations_doc
  on assistant.knowledge_citations (knowledge_document_id);

create index if not exists idx_assistant_knowledge_citations_reference
  on assistant.knowledge_citations (reference_document_id);

comment on table assistant.knowledge_citations is
'Grounding/citation links between knowledge records and original references.';

-- =========================================================
-- 8) Fetched content
-- =========================================================

create table if not exists assistant.fetched_content (
  id uuid primary key default gen_random_uuid(),
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  title text null,
  content text null,
  source_url text null,
  category text null,
  relevance_score numeric(8,3) null,
  status text not null default 'draft',
  metadata_json jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint assistant_fetched_content_status_chk check (
    status in ('draft', 'in_review', 'approved', 'rejected', 'archived')
  )
);

create index if not exists idx_assistant_fetched_content_source
  on assistant.fetched_content (source_id);

create index if not exists idx_assistant_fetched_content_status
  on assistant.fetched_content (status);

comment on table assistant.fetched_content is
'Raw imported/fetched content that has not yet become approved knowledge.';

-- =========================================================
-- 9) Fetch logs
-- =========================================================

create table if not exists assistant.fetch_logs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid null references assistant.knowledge_sources(id) on delete set null,
  status text not null,
  items_count integer not null default 0,
  error_message text null,
  details_json jsonb not null default '{}'::jsonb,
  started_at timestamptz null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  constraint assistant_fetch_logs_status_chk check (
    status in ('queued', 'running', 'success', 'failed', 'partial')
  )
);

create index if not exists idx_assistant_fetch_logs_source
  on assistant.fetch_logs (source_id);

create index if not exists idx_assistant_fetch_logs_status
  on assistant.fetch_logs (status);

comment on table assistant.fetch_logs is
'Operational fetch/import logs.';

-- =========================================================
-- 10) Classification ratings
-- =========================================================

create table if not exists assistant.classification_ratings (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  rating integer not null,
  notes text null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  constraint assistant_classification_ratings_rating_chk check (
    rating between 1 and 5
  ),
  constraint assistant_classification_ratings_target_type_chk check (
    target_type in ('fetched_content', 'knowledge_document', 'reference_document', 'tool_output')
  )
);

create index if not exists idx_assistant_classification_ratings_target
  on assistant.classification_ratings (target_type, target_id);

comment on table assistant.classification_ratings is
'Human scoring for classification/review quality and future evaluation loops.';

-- =========================================================
-- 11) Review events
-- =========================================================

create table if not exists assistant.review_events (
  id uuid primary key default gen_random_uuid(),
  target_type text not null,
  target_id uuid not null,
  event_type text not null,
  decision text null,
  notes text null,
  performed_by uuid null,
  performed_at timestamptz not null default now(),
  metadata_json jsonb not null default '{}'::jsonb,
  constraint assistant_review_events_target_type_chk check (
    target_type in ('reference_document', 'knowledge_document', 'fetched_content', 'tool_output')
  ),
  constraint assistant_review_events_event_type_chk check (
    event_type in ('submit_for_review', 'approve', 'reject', 'archive', 'send_back', 'update_governance', 'manual_override')
  ),
  constraint assistant_review_events_decision_chk check (
    decision is null or decision in ('approve', 'reject', 'archive', 'send_back')
  )
);

create index if not exists idx_assistant_review_events_target
  on assistant.review_events (target_type, target_id);

create index if not exists idx_assistant_review_events_performed_at
  on assistant.review_events (performed_at desc);

comment on table assistant.review_events is
'Governance/audit history for assistant review and approval lifecycle.';

-- =========================================================
-- 12) Conversations
-- =========================================================

create table if not exists assistant.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  title text null,
  context_json jsonb not null default '{}'::jsonb,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_assistant_conversations_updated_at on assistant.conversations;
create trigger trg_assistant_conversations_updated_at
before update on assistant.conversations
for each row execute function assistant.set_updated_at();

create index if not exists idx_assistant_conversations_user
  on assistant.conversations (user_id);

create index if not exists idx_assistant_conversations_archived
  on assistant.conversations (is_archived);

comment on table assistant.conversations is
'Assistant chat conversation headers.';

-- =========================================================
-- 13) Messages
-- =========================================================

create table if not exists assistant.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant.conversations(id) on delete cascade,
  role text not null,
  content text not null,
  model_name text null,
  grounding_json jsonb not null default '{}'::jsonb,
  message_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint assistant_messages_role_chk check (
    role in ('system', 'user', 'assistant', 'tool')
  )
);

create index if not exists idx_assistant_messages_conversation
  on assistant.messages (conversation_id, created_at);

comment on table assistant.messages is
'Assistant chat messages with optional grounding/provider metadata.';

-- =========================================================
-- 14) RLS activation (policies deferred)
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

comment on schema assistant is
'PalWakf assistant schema: reference documents, governed knowledge, review/governance events, and chat operational data.';

commit;
