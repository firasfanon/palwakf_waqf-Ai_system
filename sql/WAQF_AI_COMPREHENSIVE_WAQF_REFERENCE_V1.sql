-- WAQF_AI_COMPREHENSIVE_WAQF_REFERENCE_V1
-- Additive reference-grade domain model over the accepted governed ingestion/RAG baseline.
-- SOURCE FILE ONLY in this execution stage: DO NOT APPLY TO SHARED SUPABASE WITHOUT SEPARATE AUTHORITY.
-- No automatic canonical promotion, chat release, legal-status conclusion, or public display.

create table if not exists assistant.source_collections (
  collection_id text primary key,
  name text not null,
  authority_class text not null check (authority_class in (
    'official_primary','official_derivative','judicial_primary','archival_primary',
    'scholarly_authoritative','reference_secondary','discovery_only','unverified'
  )),
  authority_verified boolean not null default false,
  preserve_original boolean not null default true,
  acquisition_policy jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','paused','archived')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant.source_collection_members (
  collection_id text not null references assistant.source_collections(collection_id) on delete cascade,
  source_id uuid not null references assistant.knowledge_sources(id) on delete cascade,
  source_role text not null default 'member' check (source_role in ('seed','member','mirror','discovery')),
  status text not null default 'pending' check (status in ('pending','approved','rejected','archived')),
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  primary key(collection_id, source_id)
);

create table if not exists assistant.reference_artifacts (
  artifact_id text primary key,
  collection_id text references assistant.source_collections(collection_id) on delete set null,
  source_id uuid references assistant.knowledge_sources(id) on delete set null,
  canonical_url text not null,
  artifact_kind text not null default 'document'
    check (artifact_kind in ('document','web_capture','scan','image','audio','video','other')),
  status text not null default 'preserved' check (status in ('preserved','quarantined','archived')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(collection_id, canonical_url)
);

create table if not exists assistant.reference_artifact_versions (
  version_id text primary key,
  artifact_id text not null references assistant.reference_artifacts(artifact_id) on delete cascade,
  reference_document_id uuid references assistant.reference_documents(id) on delete set null,
  source_url text not null,
  retrieved_at timestamptz not null,
  content_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  storage_provider text not null,
  storage_key text not null,
  previous_version_id text references assistant.reference_artifact_versions(version_id) on delete set null,
  relationship text not null check (relationship in ('initial','identical_retrieval','new_version')),
  immutable boolean not null default true check (immutable = true),
  fixity_status text not null default 'pending'
    check (fixity_status in ('pending','verified','failed','restore_verified')),
  rights_snapshot jsonb not null default '{}'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(artifact_id, sha256),
  unique(storage_provider, storage_key)
);

create table if not exists assistant.preservation_events (
  id uuid primary key default gen_random_uuid(),
  artifact_id text not null references assistant.reference_artifacts(artifact_id) on delete cascade,
  version_id text not null references assistant.reference_artifact_versions(version_id) on delete cascade,
  event_type text not null check (event_type in (
    'retrieved','hashed','preserved','fixity_verified','version_detected',
    'restore_verified','ocr_generated','transcription_generated','normalized','structured'
  )),
  event_at timestamptz not null,
  actor_type text not null default 'system' check (actor_type in ('system','human','external_service')),
  actor_ref text,
  detail_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.legal_instruments (
  legal_id text primary key,
  knowledge_entity_id uuid references assistant.knowledge_entities(id) on delete set null,
  title text not null,
  instrument_type text not null check (instrument_type in (
    'law','regulation','decree','order','decision','instruction','circular','code','other'
  )),
  jurisdiction_code text not null,
  instrument_number text,
  instrument_year integer,
  enactment_date date,
  publication_date date,
  identity_status text not null default 'pending'
    check (identity_status in ('pending','verified','rejected','archived')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant.legal_instrument_versions (
  id uuid primary key default gen_random_uuid(),
  legal_id text not null references assistant.legal_instruments(legal_id) on delete cascade,
  reference_document_id uuid references assistant.reference_documents(id) on delete set null,
  artifact_version_id text not null references assistant.reference_artifact_versions(version_id) on delete restrict,
  language text,
  version_label text,
  is_consolidated boolean not null default false,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(legal_id, artifact_version_id)
);

create table if not exists assistant.legal_instrument_territory_status (
  id uuid primary key default gen_random_uuid(),
  legal_id text not null references assistant.legal_instruments(legal_id) on delete cascade,
  territory text not null check (territory in (
    'WEST_BANK','GAZA','JERUSALEM','HISTORIC_PALESTINE','OTTOMAN_PALESTINE','UNKNOWN'
  )),
  regime text not null check (regime in (
    'OTTOMAN','BRITISH_MANDATE','JORDANIAN_WEST_BANK','EGYPTIAN_GAZA',
    'ISRAELI_OCCUPATION','PALESTINIAN','MIXED','UNKNOWN'
  )),
  legal_status text not null check (legal_status in (
    'IN_FORCE','PARTIALLY_IN_FORCE','AMENDED','REPEALED','SUPERSEDED',
    'HISTORICAL','DISPUTED','UNRESOLVED'
  )),
  valid_from date,
  valid_to date,
  evidence_refs jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  reviewed_by uuid,
  last_verified_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.legal_instrument_relations (
  id uuid primary key default gen_random_uuid(),
  source_legal_id text not null references assistant.legal_instruments(legal_id) on delete cascade,
  target_legal_id text not null references assistant.legal_instruments(legal_id) on delete cascade,
  relation_type text not null check (relation_type in (
    'AMENDS','AMENDED_BY','REPEALS','REPEALED_BY','IMPLEMENTS','IMPLEMENTED_BY',
    'REFERENCES','SUPERSEDES','SUPERSEDED_BY'
  )),
  evidence_version_id text references assistant.reference_artifact_versions(version_id) on delete set null,
  verified boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(source_legal_id, target_legal_id, relation_type)
);

create table if not exists assistant.legal_status_evidence (
  id uuid primary key default gen_random_uuid(),
  legal_id text not null references assistant.legal_instruments(legal_id) on delete cascade,
  territory text not null,
  asserted_status text not null,
  authority_class text not null,
  evidence_ref text not null,
  valid_from date,
  valid_to date,
  verified boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.waqf_deeds (
  deed_id text primary key,
  reference_document_id uuid references assistant.reference_documents(id) on delete set null,
  artifact_version_id text not null references assistant.reference_artifact_versions(version_id) on delete restrict,
  title text not null,
  original_date_text text,
  normalized_deed_date date,
  court_or_authority text,
  waqf_type text not null default 'UNRESOLVED' check (waqf_type in (
    'CHARITABLE','FAMILY','MIXED','SAHIH','IRSADI_ALLOCATION','MOSQUE','CEMETERY','INSTITUTION','UNRESOLVED'
  )),
  registration_status text not null default 'UNRESOLVED'
    check (registration_status in ('REGISTERED','UNREGISTERED','PARTIAL','UNRESOLVED')),
  settlement_status text not null default 'UNRESOLVED'
    check (settlement_status in ('SETTLED','UNSETTLED','PARTIAL','UNRESOLVED')),
  transcription_reference_id text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','rejected')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant.waqf_conditions (
  condition_id text primary key,
  deed_id text not null references assistant.waqf_deeds(deed_id) on delete cascade,
  condition_type text not null check (condition_type in (
    'BENEFICIARY','SUCCESSION','NAZIR','LEASE','ISTIBDAL','MAINTENANCE','PURPOSE','REMAINDER','OTHER'
  )),
  condition_text text not null,
  locator text not null,
  artifact_version_id text not null references assistant.reference_artifact_versions(version_id) on delete restrict,
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  verified boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.waqf_assets (
  asset_id text primary key,
  canonical_name text not null,
  asset_kind text not null check (asset_kind in ('IMMOVABLE','MOVABLE','FINANCIAL_RIGHT','OTHER')),
  waqf_type text not null default 'UNRESOLVED',
  land_class text not null default 'UNRESOLVED'
    check (land_class in ('MULK','MIRI','WAQF','METRUK','MEVAT','MUSHA','UNRESOLVED')),
  historical_place_names jsonb not null default '[]'::jsonb,
  current_parcel_refs jsonb not null default '[]'::jsonb,
  evidence_version_ids jsonb not null default '[]'::jsonb,
  verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','disputed','rejected')),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant.waqf_deed_assets (
  deed_id text not null references assistant.waqf_deeds(deed_id) on delete cascade,
  asset_id text not null references assistant.waqf_assets(asset_id) on delete cascade,
  relation_type text not null default 'endowed_asset'
    check (relation_type in ('endowed_asset','referenced_asset','replacement_asset','other')),
  evidence_version_id text references assistant.reference_artifact_versions(version_id) on delete set null,
  created_at timestamptz not null default now(),
  primary key(deed_id, asset_id, relation_type)
);

create table if not exists assistant.waqf_asset_rights (
  right_id text primary key,
  asset_id text not null references assistant.waqf_assets(asset_id) on delete cascade,
  right_type text not null check (right_type in (
    'RAQABA','USUFRUCT','LEASE','HUKR','IJARATAYN','EASEMENT','WATER','BUILDING','PLANTING','MORTGAGE','OTHER'
  )),
  holder_entity_id uuid references assistant.knowledge_entities(id) on delete set null,
  valid_from date,
  valid_to date,
  evidence_version_ids jsonb not null default '[]'::jsonb,
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  verified boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.waqf_title_chain_events (
  event_id text primary key,
  asset_id text not null references assistant.waqf_assets(asset_id) on delete cascade,
  event_type text not null check (event_type in (
    'WAQF_DEED','SHARIA_RECORD','TAPU_RECORD','SURVEY','SETTLEMENT_CLAIM','SETTLEMENT_RIGHTS',
    'TITLE_REGISTRATION','TRANSACTION','JUDGMENT','EXPROPRIATION','OTHER'
  )),
  occurred_at date,
  sequence_hint integer,
  fact_summary text not null,
  evidence_version_ids jsonb not null default '[]'::jsonb,
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  verified boolean not null default false,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.waqf_beneficiaries (
  beneficiary_id text primary key,
  deed_id text not null references assistant.waqf_deeds(deed_id) on delete cascade,
  person_or_branch_entity_id uuid references assistant.knowledge_entities(id) on delete set null,
  parent_beneficiary_id text references assistant.waqf_beneficiaries(beneficiary_id) on delete set null,
  generation integer,
  share_expression text,
  eligibility_condition_id text references assistant.waqf_conditions(condition_id) on delete set null,
  excluded boolean not null default false,
  extinction_status text not null default 'UNRESOLVED'
    check (extinction_status in ('ACTIVE','EXTINCT','UNRESOLVED')),
  evidence_version_ids jsonb not null default '[]'::jsonb,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.jurisdiction_rules (
  rule_id text primary key,
  issue text not null,
  territory text not null,
  regime text not null,
  valid_from date,
  valid_to date,
  authority_class text not null,
  competent_authority text not null,
  procedural_law_legal_id text references assistant.legal_instruments(legal_id) on delete set null,
  evidence_refs jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists assistant.evidence_conflicts (
  id uuid primary key default gen_random_uuid(),
  fact_key text not null,
  asset_id text references assistant.waqf_assets(asset_id) on delete set null,
  deed_id text references assistant.waqf_deeds(deed_id) on delete set null,
  legal_id text references assistant.legal_instruments(legal_id) on delete set null,
  assertion_refs jsonb not null default '[]'::jsonb,
  conflicting_values jsonb not null default '[]'::jsonb,
  status text not null default 'unresolved'
    check (status in ('unresolved','under_review','resolved','accepted_difference')),
  resolution_evidence jsonb not null default '{}'::jsonb,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists assistant.reference_admission_decisions (
  id uuid primary key default gen_random_uuid(),
  artifact_version_id text not null references assistant.reference_artifact_versions(version_id) on delete cascade,
  trust_level text not null check (trust_level in (
    'R0_PRESERVED','R1_AUTHENTICATED_SOURCE','R2_VERIFIED_IDENTITY','R3_STATUS_VERIFIED','R4_CANONICAL_REFERENCE'
  )),
  review_mode text not null check (review_mode in ('AUTO_PRESERVE','BATCH_REVIEW','ITEM_REVIEW','BLOCKED')),
  risk_score integer not null check (risk_score >= 0 and risk_score <= 100),
  preserved boolean not null default true,
  structured_index_candidate boolean not null default false,
  rag_candidate boolean not null default false,
  canonical_reference boolean not null default false,
  chat_eligible boolean not null default false,
  public_display_eligible boolean not null default false,
  reasons jsonb not null default '[]'::jsonb,
  decided_by uuid,
  decision_status text not null default 'candidate'
    check (decision_status in ('candidate','reviewed','rejected','superseded')),
  created_at timestamptz not null default now()
);

create index if not exists idx_reference_artifact_versions_artifact
  on assistant.reference_artifact_versions(artifact_id, retrieved_at desc);
create index if not exists idx_preservation_events_version
  on assistant.preservation_events(version_id, event_at);
create index if not exists idx_legal_territory_status_lookup
  on assistant.legal_instrument_territory_status(legal_id, territory, valid_from, valid_to);
create index if not exists idx_waqf_title_chain_asset
  on assistant.waqf_title_chain_events(asset_id, occurred_at, sequence_hint);
create index if not exists idx_evidence_conflicts_status
  on assistant.evidence_conflicts(status, updated_at desc);
create index if not exists idx_reference_admission_decisions_version
  on assistant.reference_admission_decisions(artifact_version_id, created_at desc);

alter table assistant.source_collections enable row level security;
alter table assistant.source_collection_members enable row level security;
alter table assistant.reference_artifacts enable row level security;
alter table assistant.reference_artifact_versions enable row level security;
alter table assistant.preservation_events enable row level security;
alter table assistant.legal_instruments enable row level security;
alter table assistant.legal_instrument_versions enable row level security;
alter table assistant.legal_instrument_territory_status enable row level security;
alter table assistant.legal_instrument_relations enable row level security;
alter table assistant.legal_status_evidence enable row level security;
alter table assistant.waqf_deeds enable row level security;
alter table assistant.waqf_conditions enable row level security;
alter table assistant.waqf_assets enable row level security;
alter table assistant.waqf_deed_assets enable row level security;
alter table assistant.waqf_asset_rights enable row level security;
alter table assistant.waqf_title_chain_events enable row level security;
alter table assistant.waqf_beneficiaries enable row level security;
alter table assistant.jurisdiction_rules enable row level security;
alter table assistant.evidence_conflicts enable row level security;
alter table assistant.reference_admission_decisions enable row level security;

revoke all on assistant.source_collections from public, anon, authenticated;
revoke all on assistant.source_collection_members from public, anon, authenticated;
revoke all on assistant.reference_artifacts from public, anon, authenticated;
revoke all on assistant.reference_artifact_versions from public, anon, authenticated;
revoke all on assistant.preservation_events from public, anon, authenticated;
revoke all on assistant.legal_instruments from public, anon, authenticated;
revoke all on assistant.legal_instrument_versions from public, anon, authenticated;
revoke all on assistant.legal_instrument_territory_status from public, anon, authenticated;
revoke all on assistant.legal_instrument_relations from public, anon, authenticated;
revoke all on assistant.legal_status_evidence from public, anon, authenticated;
revoke all on assistant.waqf_deeds from public, anon, authenticated;
revoke all on assistant.waqf_conditions from public, anon, authenticated;
revoke all on assistant.waqf_assets from public, anon, authenticated;
revoke all on assistant.waqf_deed_assets from public, anon, authenticated;
revoke all on assistant.waqf_asset_rights from public, anon, authenticated;
revoke all on assistant.waqf_title_chain_events from public, anon, authenticated;
revoke all on assistant.waqf_beneficiaries from public, anon, authenticated;
revoke all on assistant.jurisdiction_rules from public, anon, authenticated;
revoke all on assistant.evidence_conflicts from public, anon, authenticated;
revoke all on assistant.reference_admission_decisions from public, anon, authenticated;

grant select, insert, update, delete on assistant.source_collections to service_role;
grant select, insert, update, delete on assistant.source_collection_members to service_role;
grant select, insert, update, delete on assistant.reference_artifacts to service_role;
grant select, insert, update, delete on assistant.reference_artifact_versions to service_role;
grant select, insert, update, delete on assistant.preservation_events to service_role;
grant select, insert, update, delete on assistant.legal_instruments to service_role;
grant select, insert, update, delete on assistant.legal_instrument_versions to service_role;
grant select, insert, update, delete on assistant.legal_instrument_territory_status to service_role;
grant select, insert, update, delete on assistant.legal_instrument_relations to service_role;
grant select, insert, update, delete on assistant.legal_status_evidence to service_role;
grant select, insert, update, delete on assistant.waqf_deeds to service_role;
grant select, insert, update, delete on assistant.waqf_conditions to service_role;
grant select, insert, update, delete on assistant.waqf_assets to service_role;
grant select, insert, update, delete on assistant.waqf_deed_assets to service_role;
grant select, insert, update, delete on assistant.waqf_asset_rights to service_role;
grant select, insert, update, delete on assistant.waqf_title_chain_events to service_role;
grant select, insert, update, delete on assistant.waqf_beneficiaries to service_role;
grant select, insert, update, delete on assistant.jurisdiction_rules to service_role;
grant select, insert, update, delete on assistant.evidence_conflicts to service_role;
grant select, insert, update, delete on assistant.reference_admission_decisions to service_role;

-- Intentionally no anon/authenticated policies and no public runtime RPCs in MEGA_A.
-- Runtime query surfaces are introduced only after MEGA_B retrieval/citation acceptance.

-- MEGA_A closure additions: reviewer-right separation, resumability, later-deed lineage,
-- parcel crosswalk evidence, and governance-event reconstruction.
alter table assistant.source_rights_profiles
  add column if not exists preservation_allowed boolean not null default false,
  add column if not exists quote_allowed boolean not null default false,
  add column if not exists download_allowed boolean not null default false;

create table if not exists assistant.waqf_deed_relations (
  id uuid primary key default gen_random_uuid(),
  source_deed_id text not null references assistant.waqf_deeds(deed_id) on delete cascade,
  target_deed_id text not null references assistant.waqf_deeds(deed_id) on delete cascade,
  relation_type text not null check (relation_type in (
    'TAWLIYA','HUKR','ISTIBDAL','LEASE','AMENDMENT','ACCOUNTING','CONFIRMATION','OTHER'
  )),
  effective_date date,
  evidence_artifact_version_id text not null
    references assistant.reference_artifact_versions(version_id) on delete restrict,
  verified boolean not null default false,
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (source_deed_id <> target_deed_id),
  unique(source_deed_id, target_deed_id, relation_type, evidence_artifact_version_id)
);
create table if not exists assistant.parcel_crosswalk_candidates (
  id uuid primary key default gen_random_uuid(),
  asset_id text not null references assistant.waqf_assets(asset_id) on delete cascade,
  parcel_ref text not null,
  candidate_name text,
  confidence numeric(5,4) not null default 0 check (confidence >= 0 and confidence <= 1),
  evidence_json jsonb not null default '[]'::jsonb,
  unresolved boolean not null default true,
  ownership_inference_allowed boolean not null default false
    check (ownership_inference_allowed = false),
  status text not null default 'candidate'
    check (status in ('candidate','verified_crosswalk','rejected','superseded')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(asset_id, parcel_ref)
);

create table if not exists assistant.collection_crawl_checkpoints (
  run_id text primary key,
  collection_id text not null references assistant.source_collections(collection_id) on delete cascade,
  queue_json jsonb not null default '[]'::jsonb,
  seen_json jsonb not null default '[]'::jsonb,
  completed_urls_json jsonb not null default '[]'::jsonb,
  skipped_json jsonb not null default '[]'::jsonb,
  status text not null default 'running'
    check (status in ('running','paused','completed','failed')),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create table if not exists assistant.reference_governance_events (
  id uuid primary key default gen_random_uuid(),
  artifact_version_id text not null
    references assistant.reference_artifact_versions(version_id) on delete cascade,
  event_type text not null check (event_type in (
    'PRESERVATION_COMPLETED','ADMISSION_EVALUATED','REVIEW_REQUIRED',
    'CANONICAL_PROMOTION','CHAT_RELEASE','REJECTION','SUPERSESSION'
  )),
  actor_type text not null check (actor_type in ('system','human')),
  actor_ref text,
  reason text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  event_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (actor_type <> 'human' or nullif(btrim(actor_ref),'') is not null)
);

create index if not exists idx_waqf_deed_relations_source
  on assistant.waqf_deed_relations(source_deed_id, effective_date);
create index if not exists idx_parcel_crosswalk_asset
  on assistant.parcel_crosswalk_candidates(asset_id, status, confidence desc);
create index if not exists idx_reference_governance_events_version
  on assistant.reference_governance_events(artifact_version_id, event_at);
alter table assistant.waqf_deed_relations enable row level security;
alter table assistant.parcel_crosswalk_candidates enable row level security;
alter table assistant.collection_crawl_checkpoints enable row level security;
alter table assistant.reference_governance_events enable row level security;

revoke all on assistant.waqf_deed_relations from public, anon, authenticated;
revoke all on assistant.parcel_crosswalk_candidates from public, anon, authenticated;
revoke all on assistant.collection_crawl_checkpoints from public, anon, authenticated;
revoke all on assistant.reference_governance_events from public, anon, authenticated;

grant select, insert, update, delete on assistant.waqf_deed_relations to service_role;
grant select, insert, update, delete on assistant.parcel_crosswalk_candidates to service_role;
grant select, insert, update, delete on assistant.collection_crawl_checkpoints to service_role;
grant select, insert, update, delete on assistant.reference_governance_events to service_role;
