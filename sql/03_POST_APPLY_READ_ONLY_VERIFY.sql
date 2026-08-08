\pset pager off
\set ON_ERROR_STOP on
begin transaction read only;
select 'ASSISTANT_DEFAULT_PRIVILEGES_LOCAL_HARDENING_VERIFY_START' marker,current_setting('transaction_read_only') transaction_read_only;
do $v$
declare v_direct int; v_t int; v_s int; v_f int; v_global bool; v_tbl int; v_rtn int; v_k int; v_a int; v_c int;
begin
 with d as(select x.defaclobjtype,x.defaclacl from pg_default_acl x join pg_namespace n on n.oid=x.defaclnamespace join pg_roles r on r.oid=x.defaclrole where n.nspname='assistant' and r.rolname='postgres'),e as(select d.defaclobjtype,a.grantee,a.privilege_type from d cross join lateral aclexplode(d.defaclacl)a)
 select count(*) filter(where grantee in(select oid from pg_roles where rolname in('anon','authenticated'))),count(*) filter(where defaclobjtype='r' and grantee='service_role'::regrole),count(*) filter(where defaclobjtype='S' and grantee='service_role'::regrole),count(*) filter(where defaclobjtype='f' and grantee='service_role'::regrole) into v_direct,v_t,v_s,v_f from e;
 if v_direct<>0 then raise exception 'DIRECT_CLIENT_DEFAULT_GRANTS_REMAIN:%',v_direct; end if;
 if v_t<>9 or v_s<>3 or v_f<>1 then raise exception 'SERVICE_ROLE_DEFAULT_DRIFT:%/%/%',v_t,v_s,v_f; end if;
 with g as(select coalesce(d.defaclacl,acldefault('f',r.oid)) acl from pg_roles r left join pg_default_acl d on d.defaclrole=r.oid and d.defaclnamespace=0 and d.defaclobjtype='f' where r.rolname='postgres')
 select exists(select 1 from g cross join lateral aclexplode(g.acl)a where a.grantee=0 and a.privilege_type='EXECUTE') into v_global;
 if not v_global then raise exception 'UNEXPECTED_GLOBAL_FUNCTION_DEFAULT_CHANGE'; end if;
 select count(*) into v_tbl from information_schema.role_table_grants where table_schema='assistant' and grantee in('PUBLIC','anon','authenticated','service_role','postgres');
 select count(*) into v_rtn from information_schema.routine_privileges where specific_schema='assistant' and grantee in('PUBLIC','anon','authenticated','service_role','postgres');
 if v_tbl<>184 then raise exception 'EXISTING_TABLE_GRANT_ROWS_CHANGED:%',v_tbl; end if;
 if v_rtn<>108 then raise exception 'EXISTING_ROUTINE_PRIVILEGE_ROWS_CHANGED:%',v_rtn; end if;
 select count(*) into v_k from assistant.knowledge_documents; select count(*) into v_a from assistant.knowledge_activation_runs; select count(*) into v_c from assistant.v_chat_retrieval_candidates_v1;
 if v_k<>614 or v_a<>1 or v_c<>0 then raise exception 'KNOWLEDGE_STATE_DRIFT:%/%/%',v_k,v_a,v_c; end if;
end$v$;
select 'ASSISTANT_DEFAULT_PRIVILEGES_LOCAL_HARDENING_VERIFY_COMPLETE' marker,
 'DIRECT_CLIENT_SCHEMA_DEFAULT_GRANTS=0' direct_client_defaults,'SERVICE_ROLE_SCHEMA_DEFAULTS=PRESERVED' service_role_defaults,
 'GLOBAL_PUBLIC_FUNCTION_EXECUTE=REMAINS_EFFECTIVE_SEPARATE_HOLD' global_function_hold,
 'EXISTING_TABLE_GRANT_ROWS=184' existing_table_grants,'EXISTING_ROUTINE_PRIVILEGE_ROWS=108' existing_routine_grants,
 'KNOWLEDGE_DOCUMENTS=614' knowledge_documents,'ACTIVATION_RUNS=1' activation_runs,'STRICT_CHAT_CANDIDATES=0' strict_chat_candidates,
 'NO_ADDITIONAL_WRITE' database_write,'NO_KNOWLEDGE_MUTATION' knowledge_mutation,'NO_CHAT_RELEASE' chat_release,'NO_PRODUCTION' production;
rollback;
