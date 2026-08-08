-- Knowledge Batch 07 — Read-only Supabase presence check
-- Purpose: check whether old assistant tables/domains already exist in Supabase.
-- Safe: read-only.
select * from (values
  ('assistant.knowledge_sources', to_regclass('assistant.knowledge_sources') is not null),
  ('assistant.reference_documents', to_regclass('assistant.reference_documents') is not null),
  ('assistant.reference_files', to_regclass('assistant.reference_files') is not null),
  ('assistant.knowledge_documents', to_regclass('assistant.knowledge_documents') is not null),
  ('assistant.knowledge_citations', to_regclass('assistant.knowledge_citations') is not null),
  ('assistant.fetched_content', to_regclass('assistant.fetched_content') is not null),
  ('assistant.fetch_logs', to_regclass('assistant.fetch_logs') is not null),
  ('assistant.faqs', to_regclass('assistant.faqs') is not null),
  ('assistant.suggested_questions', to_regclass('assistant.suggested_questions') is not null),
  ('assistant.page_settings', to_regclass('assistant.page_settings') is not null),
  ('assistant.home_sections', to_regclass('assistant.home_sections') is not null),
  ('assistant.home_section_items', to_regclass('assistant.home_section_items') is not null),
  ('assistant.content_templates', to_regclass('assistant.content_templates') is not null),
  ('assistant.files', to_regclass('assistant.files') is not null),
  ('assistant.document_files', to_regclass('assistant.document_files') is not null),
  ('assistant.bookmarks', to_regclass('assistant.bookmarks') is not null),
  ('assistant.favorite_conversations', to_regclass('assistant.favorite_conversations') is not null),
  ('assistant.cached_responses', to_regclass('assistant.cached_responses') is not null),
  ('assistant.search_logs', to_regclass('assistant.search_logs') is not null),
  ('assistant.legacy_import_register', to_regclass('assistant.legacy_import_register') is not null)
) as t(object_name, present)
order by object_name;
