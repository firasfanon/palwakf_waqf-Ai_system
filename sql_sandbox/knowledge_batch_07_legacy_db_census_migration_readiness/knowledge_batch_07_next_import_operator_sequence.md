# Knowledge Batch 07 — Operator Import Sequence

1. Run `knowledge_batch_07_read_only_supabase_presence_check.sql`.
2. Confirm whether assistant staging/legacy tables exist.
3. Apply `knowledge_batch_07_legacy_import_register_schema_proposal.sql` only if approved.
4. Import CSV/JSON payloads into `assistant.legacy_import_register` first.
5. Promote records in this order:
   - knowledge_sources
   - reference_documents / knowledge_documents / citations deltas
   - fetched_content / fetch_logs
   - FAQs / suggested_questions
   - page_settings / home_sections / content_templates
   - files / document_files
   - conversations/messages/bookmarks/feedback only after privacy review
6. Only after import + page UAT, continue to UX behavior polish, then Knowledge 06C evidence.
