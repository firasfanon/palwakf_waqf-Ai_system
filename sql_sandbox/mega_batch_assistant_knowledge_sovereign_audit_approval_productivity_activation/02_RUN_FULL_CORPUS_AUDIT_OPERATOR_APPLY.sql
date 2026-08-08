-- Run with psql variables only, after 01 succeeds.
-- Example:
-- psql "$env:PWF_DATABASE_URL" -v reviewer_auth_user_id="96f6cdc2-67f9-4352-b9f8-775ef509fed8" -v run_note="full-corpus-first-run" -f 02_RUN_FULL_CORPUS_AUDIT_OPERATOR_APPLY.sql
select assistant.rpc_refresh_knowledge_activation_audit_v1(
  :'reviewer_auth_user_id'::uuid,
  nullif(:'run_note','')
) as activation_audit_result;
