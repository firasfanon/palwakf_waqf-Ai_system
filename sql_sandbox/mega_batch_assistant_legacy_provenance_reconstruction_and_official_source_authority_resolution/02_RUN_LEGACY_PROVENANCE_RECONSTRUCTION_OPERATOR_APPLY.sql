-- Run after 01 succeeds.
-- Required psql variables: reviewer_auth_user_id (UUID), run_note (text).
select assistant.rpc_refresh_legacy_provenance_reconstruction_v1(
  :'reviewer_auth_user_id'::uuid,
  null,
  nullif(:'run_note','')
) as legacy_provenance_reconstruction_result;
