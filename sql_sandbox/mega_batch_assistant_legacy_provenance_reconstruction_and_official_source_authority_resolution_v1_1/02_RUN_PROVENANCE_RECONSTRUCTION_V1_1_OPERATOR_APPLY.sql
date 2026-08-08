-- OPERATOR APPLY. Requires psql variable reviewer_auth_user_id; do not paste UUID in chat.
\if :{?reviewer_auth_user_id}
\else
 \echo 'Missing required psql variable reviewer_auth_user_id'
 \quit
\endif
select assistant.rpc_refresh_legacy_provenance_reconstruction_v1_1(
  :'reviewer_auth_user_id'::uuid,
  null,
  'operator-triggered-v1-1-nested-evidence-deterministic-crosswalk'
) as result;
